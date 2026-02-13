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
	import { Avatar, ModalDialog, NumberStepper, useRefresh } from '@thwbh/veilchen';
	import { goto, invalidate } from '$app/navigation';
	import { Plus, Trash } from 'phosphor-svelte';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';
	import {
		convertDateStrToDisplayDateStr,
		display_date_format,
		getDateAsStr,
		getDisplayDateAsStr,
		parseStringAsDate
	} from '$lib/date';
	import IntakeMask from '$lib/component/intake/IntakeMask.svelte';
	import { getAvatarFromUser } from '$lib/avatar';
	import { differenceInDays } from 'date-fns';

	let { data } = $props();

	const dashboard: Dashboard = data.dashboardData;
	const userContext = getUserContext();

	let index: number = $state(0);
	let intake: Array<Intake> = $state(dashboard.intakeTodayList);
	let lastWeightTracker: WeightTracker = $state(dashboard.weightMonthList[0]);

	const weightTarget: WeightTarget = dashboard.weightTarget;
	const intakeTarget: IntakeTarget = dashboard.intakeTarget;

	// Progress bar calculations (moved from WeightScore)
	const dayDiff = differenceInDays(parseStringAsDate(weightTarget.endDate), new Date());
	const totalDays = differenceInDays(
		parseStringAsDate(weightTarget.endDate),
		parseStringAsDate(weightTarget.startDate)
	);

	const progress = totalDays === 0 ? 0 : Math.round(((totalDays - dayDiff) / totalDays) * 100);

	// Avatar
	const avatarSrc = $derived(
		userContext.user ? getAvatarFromUser(userContext.user.name, userContext.user.avatar) : ''
	);

	// Display date
	const displayDate = getDisplayDateAsStr(new Date());

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

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">Dashboard</h1>

	<!-- Header -->
	<div class="bg-primary text-primary-content px-6 pt-8 pb-14">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1">
				{#if data.dashboardData.currentDay > 0}
					<span class="text-3xl font-bold">Day {data.dashboardData.currentDay}</span>
				{/if}
				<span class="text-sm opacity-70">{displayDate}</span>
			</div>

			{#if avatarSrc}
				<Avatar size="lg" src={avatarSrc} />
			{/if}
		</div>

		<!-- Progress bar -->
		<div class="mt-6">
			<div class="flex justify-between items-center mb-2">
				<span class="text-xs opacity-70">{dayDiff} days left</span>
				<button
					class="btn btn-xs btn-outline border-primary-content/30 text-primary-content hover:bg-primary-content hover:text-primary"
					onclick={() => goto('/review')}
				>
					Review plan
				</button>
			</div>
			<div class="journey-bar-track">
				<div class="journey-bar-fill" style="width: calc({progress}% + 0.5rem)"></div>
			</div>
		</div>
	</div>

	<!-- Content area -->
	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 flex flex-col gap-6 p-4 pt-6">
		<div class="flex flex-col items-center gap-2 w-full">
			<IntakeScore {intakeTarget} entries={intakeToday} />
			<IntakeStack bind:index bind:entries={intake} onEdit={modal.openEdit} class="w-full" />
		</div>

		<div class="flex flex-col items-center w-full">
			<WeightScore
				weightTracker={lastWeightTracker}
				{weightTarget}
				onupdate={modalWeight.openCreate}
			/>
		</div>
	</div>
</div>
<button
	class="fixed bottom-4 right-4 z-[999] btn btn-xl btn-circle btn-primary"
	onclick={modal.openCreate}
>
	<Plus size="1.5em" />
</button>
<!-- Intake creation modal -->
<ModalDialog bind:dialog={modal.createDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2">Add Intake</span>
		{#if modal.currentEntry}
			<span class="text-xs opacity-70">
				{convertDateStrToDisplayDateStr((modal.currentEntry as NewIntake).added)}
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
		<span class="modal-header border-l-4 border-accent pl-2">Edit Intake</span>
		<span class="flex items-center gap-2">
			{#if modal.currentEntry}
				<span class="text-xs opacity-70">
					{convertDateStrToDisplayDateStr((modal.currentEntry as Intake).added)}
				</span>
			{/if}
			<button class="btn btn-xs btn-error">
				<Trash size="1rem" onclick={modal.requestDelete} />
			</button>
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
		<span class="modal-header border-l-4 border-accent pl-2"> Set Weight </span>
		<span class="text-xs opacity-70">
			{getDateAsStr(new Date(), display_date_format)}
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

<style>
	.journey-bar-track {
		height: 0.25rem;
		border-radius: 9999px;
		background-color: oklch(0.85 0.02 280);
		overflow: visible;
		position: relative;
	}

	.journey-bar-fill {
		height: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background-color: var(--color-accent);
		position: relative;
		min-width: 1rem;
		transition: width 0.6s ease;
		clip-path: polygon(0% 0%, calc(100% - 0.5rem) 0%, 100% 50%, calc(100% - 0.5rem) 100%, 0% 100%);
	}
</style>
