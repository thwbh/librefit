<script lang="ts">
	import IntakeScore from '$lib/component/intake/IntakeScore.svelte';
	import IntakeStack from '$lib/component/intake/IntakeStack.svelte';
	import WeightScore from '$lib/component/weight/WeightScore.svelte';
	import {
		createIntake,
		createWeightTrackerEntry,
		deleteIntake,
		updateIntake,
		updateWeightTrackerEntry,
		type Dashboard,
		type Intake,
		type IntakeTarget,
		type NewIntake,
		type NewWeightTracker,
		type WeightTarget,
		type WeightTracker
	} from '$lib/api';
	import { getUserContext } from '$lib/context';
	import { debug } from '@tauri-apps/plugin-log';
	import { ModalDialog, NumberStepper, useRefresh } from '@thwbh/veilchen';
	import { invalidate } from '$app/navigation';
	import { Hamburger, Plus, Scales, Trash, X } from 'phosphor-svelte';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';
	import { convertDateStrToDisplayDateStr, display_date_format, getDateAsStr } from '$lib/date';
	import IntakeMask from '$lib/component/intake/IntakeMask.svelte';

	let { data } = $props();

	const dashboard: Dashboard = data.dashboardData;
	const userContext = getUserContext();

	let index: number = $state(0);
	let intake: Array<Intake> = $state(dashboard.intakeTodayList);
	let lastWeightTracker = $state(dashboard.weightMonthList[0]);

	const weightTarget: WeightTarget = dashboard.weightTarget;
	const intakeTarget: IntakeTarget = dashboard.intakeTarget;

	const weightTracker: WeightTracker = $state(dashboard.weightTodayList[0]);

	let intakeToday: Array<number> = $derived(intake.map((tracker) => tracker.amount));

	const getBlankEntry = (): NewIntake => {
		return {
			category: 'l',
			added: getDateAsStr(new Date()),
			amount: 0,
			description: ''
		};
	};

	const modal = useEntryModal<Intake, NewIntake>({
		onCreate: (entry) => createIntake({ newEntry: entry }),
		onUpdate: (id, entry) => updateIntake({ trackerId: id, updatedEntry: entry }),
		onDelete: (id) => deleteIntake({ trackerId: id }),
		getBlankEntry,
		onCreateSuccess: (newEntry) => {
			intake = [...intake, newEntry];
			index = intake.length - 1;
		},
		onUpdateSuccess: (updatedEntry) => {
			intake[index] = updatedEntry;
		},
		onDeleteSuccess: () => {
			if (intake.length === 1) {
				intake = [];
			} else {
				const deletedIndex = index;
				intake = intake.toSpliced(deletedIndex, 1);
				if (index === intake.length && index > 0) {
					index--;
				} else {
					index = 0;
				}
			}
		}
	});

	const modalWeight = useEntryModal<WeightTracker, NewWeightTracker>({
		onCreate: (entry) => createWeightTrackerEntry({ newEntry: entry }),
		onUpdate: (id, entry) => updateWeightTrackerEntry({ trackerId: id, updatedEntry: entry }),
		onDelete: (_) => {
			throw new Error('Delete not supported for weight entries');
		},
		getBlankEntry: () => ({
			added: getDateAsStr(new Date()),
			amount: lastWeightTracker ? lastWeightTracker.amount : 0
		}),
		onCreateSuccess: (newEntry) => {
			lastWeightTracker = newEntry;
		},
		onUpdateSuccess: (entry) => {
			lastWeightTracker = entry;
		}
	});

	debug(`dashboardData=${JSON.stringify(dashboard)}`);
	debug(`user profile=${JSON.stringify(userContext.user)}`);

	useRefresh(() => invalidate('data:dashboardData'));
</script>

<div class="flex flex-col gap-6 overflow-x-hidden p-2">
	<h1 class="sr-only">Dashboard</h1>
	<div class="flex justify-center p-2 pt-4">
		{#if data.dashboardData.currentDay > 0}
			<span class="text-xl font-bold"> Day {data.dashboardData.currentDay} </span>
		{:else}
			<span class="text-xl font-bold"></span>
		{/if}
	</div>

	<div class="flex flex-col items-center gap-2 w-full">
		<IntakeScore {intakeTarget} entries={intakeToday} />

		<IntakeStack bind:index bind:entries={intake} onEdit={modal.openEdit} class="w-full" />
	</div>

	<div class="flex flex-col items-center w-full">
		<WeightScore
			{weightTracker}
			{lastWeightTracker}
			{weightTarget}
			onAdd={(entry) => createWeightTrackerEntry({ newEntry: entry })}
			onEdit={(id, entry) => updateWeightTrackerEntry({ trackerId: id, updatedEntry: entry })}
		/>
	</div>

	<!--
	<FAB fixed={true} icon={Plus} actions={speedDials} variant={'flower'} />
  -->
</div>
<div class="fab fab-flower">
	<!-- a focusable div with tabindex is necessary to work on all browsers. role="button" is necessary for accessibility -->
	<div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary">
		<Plus size="1.25em" />
	</div>

	<!-- Main Action button replaces the original button when FAB is open -->
	<button class="fab-main-action btn btn-circle btn-lg"><X size="1.25em" /></button>

	<!-- buttons that show up when FAB is open -->
	<button class="btn btn-lg btn-circle" onclick={modal.openCreate}
		><Hamburger size="1.25em" /></button
	>
	<button class="btn btn-lg btn-circle" onclick={modalWeight.openCreate}
		><Scales size="1.25em" /></button
	>
</div>
<!-- Intake creation modal -->
<ModalDialog bind:dialog={modal.createDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span>Add Intake</span>
		{#if modal.currentEntry}
			<span class="text-xs opacity-60">
				Date: {convertDateStrToDisplayDateStr((modal.currentEntry as NewIntake).added)}
			</span>
		{/if}
	{/snippet}

	{#snippet content()}
		{#if modal.currentEntry}
			<IntakeMask bind:entry={modal.currentEntry} isEditing={true} readonly={modal.enableDelete} />
		{/if}
	{/snippet}
</ModalDialog>

<!-- Intake update modal -->
<ModalDialog bind:dialog={modal.editDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span>Edit Intake</span>
		<span>
			{#if modal.currentEntry}
				<span class="text-xs opacity-60">
					Added: {convertDateStrToDisplayDateStr((modal.currentEntry as Intake).added)}
				</span>
			{/if}
			<span>
				<button class="btn btn-xs btn-error">
					<Trash size="1rem" onclick={modal.requestDelete} />
				</button>
			</span>
		</span>
	{/snippet}

	{#snippet content()}
		{#if modal.currentEntry}
			<IntakeMask entry={modal.currentEntry as Intake} isEditing={modal.isEditing} />
		{/if}
	{/snippet}

	{#snippet footer()}
		{#if modal.enableDelete}
			<button class="btn btn-error" onclick={modal.deleteEntry}>Delete</button>
		{:else}
			<button class="btn btn-primary" onclick={modal.save}>Save</button>
		{/if}
		<button class="btn" onclick={modal.cancel}>Cancel</button>
	{/snippet}
</ModalDialog>

<!-- Weight modal -->
<ModalDialog
	bind:dialog={modalWeight.createDialog.value}
	onconfirm={modalWeight.save}
	oncancel={modalWeight.cancel}
>
	{#snippet title()}
		<span> Set Weight </span>
		<span class="text-xs">
			Date: {getDateAsStr(new Date(), display_date_format)}
		</span>
	{/snippet}
	{#snippet content()}
		<fieldset class="fieldset rounded-box">
			{#if modalWeight.errorMessage}
				<div class="alert alert-error mb-4">
					<span>{modalWeight.errorMessage}</span>
				</div>
			{/if}
			{#if modalWeight.currentEntry}
				<NumberStepper
					bind:value={modalWeight.currentEntry.amount}
					label="Current Weight"
					unit="kg"
					min={30}
					max={330}
					incrementSteps={[0.5, 1, 2, 5]}
					decrementSteps={[0.5, 1, 2, 5]}
					initialIncrementStep={1}
					initialDecrementStep={1}
					showLeftWheel={false}
				/>
			{/if}
		</fieldset>
	{/snippet}
</ModalDialog>
