<script lang="ts">
	import type { CalorieTracker, FoodCategory, NewCalorieTracker } from '$lib/model';
	import IntakeCard from './IntakeCard.svelte';
	import CalorieTrackerMask from './CalorieTrackerMask.svelte';
	import { TrashBinSolid } from 'flowbite-svelte-icons';
	import { AlertBox, AlertType, ModalDialog, Stack } from '@thwbh/veilchen';
	import { convertDateStrToDisplayDateStr, getDateAsStr } from '$lib/date';
	import { fade, fly, type FlyParams } from 'svelte/transition';
	import { info } from '@tauri-apps/plugin-log';
	import { vibrate } from '@tauri-apps/plugin-haptics';

	interface Props {
		entries: Array<CalorieTracker>;
		categories: Array<FoodCategory>;
		onadd?: (newIntake: NewCalorieTracker) => Promise<CalorieTracker>;
		onedit?: (updatedIntake: CalorieTracker) => Promise<CalorieTracker>;
		ondelete?: (deletedIntake: CalorieTracker) => Promise<number>;
	}

	let {
		entries = $bindable([]),
		categories,
		onadd = undefined,
		onedit = undefined,
		ondelete = undefined
	}: Props = $props();

	let blankEntry: NewCalorieTracker = $state({
		category: 'l',
		added: getDateAsStr(new Date()),
		amount: 0,
		description: ''
	});

	let index = $state(0);
	let focusedEntry = $derived(entries[index] ? { ...entries[index] } : undefined);
	let editDialog: HTMLDialogElement | undefined = $state();
	let createDialog: HTMLDialogElement | undefined = $state();

	let isEditing = $state(false);
	let enableDelete = $state(false);
	let isNew = $state(false);

	const startEditing = async () => {
		await vibrate(2);

		isEditing = true;
		isNew = false;

		editDialog?.showModal();
	};

	const create = () => {
		isNew = true;

		info('create button triggered');

		createDialog?.showModal();
	};

	const save = async () => {
		info('save button triggered');

		if (isNew) {
			onadd?.(blankEntry).then((newEntry: CalorieTracker) => {
				entries.push(newEntry);
				index = entries.length - 1;
			});
		} else if (isEditing) {
			onedit?.(focusedEntry).then(
				(updatedEntry: CalorieTracker) => (entries[index] = updatedEntry)
			);
		}

		createDialog?.close();
		editDialog?.close();
	};

	const deleteEntry = () => {
		info(`button triggered. focusedEntry=${focusedEntry}`);

		ondelete?.(focusedEntry).then(() => {
			if (entries.length === 1) {
				entries = [];
			} else {
				let deletedIndex = index;

				entries = entries.toSpliced(deletedIndex, 1);

				if (index === entries.length && index > 0) {
					index--;
				} else index = 0;
			}
		});

		enableDelete = false;

		editDialog?.close();
	};

	const cancel = () => {
		info('cancel button triggered');

		createDialog?.close();
		editDialog?.close();

		enableDelete = false;
	};

	const handleSwipe = () => {
		info(`swiping to ${index}`);
	};
</script>

<div class="flex flex-col items-center gap-2 p-4 w-full">
	{#if entries.length > 0}
		<div in:fly={{ y: 500 }}>
			<Stack
				bind:index
				size={entries.length}
				swipeable={true}
				swipeParams={{ timeframe: 300, minSwipeDistance: 60 }}
				onswipe={handleSwipe}
			>
				{#snippet card(_: number, params: FlyParams)}
					{@const flyParams = entries.length > 1 ? params : { y: 500 }}
					<div transition:fly={flyParams}>
						<IntakeCard entry={focusedEntry} {categories} {flyParams} onlongpress={startEditing} />
					</div>
				{/snippet}
			</Stack>
		</div>
	{:else}
		<div in:fade>
			<AlertBox type={AlertType.Warning} alertClass="border-neutral border-dashed">
				<strong>Nothing tracked today.</strong>
				<span> Use the button below to add today's first entry. Stay strong! </span>
			</AlertBox>
		</div>
	{/if}

	<button class="btn btn-neutral w-full" onclick={create}> Add Intake </button>
</div>

<ModalDialog bind:dialog={createDialog} onconfirm={save} oncancel={cancel}>
	{#snippet title()}
		<span>Add Intake</span>
		<span class="text-xs opacity-60">
			Date: {convertDateStrToDisplayDateStr(blankEntry.added)}
		</span>
	{/snippet}

	{#snippet content()}
		<CalorieTrackerMask
			bind:entry={blankEntry}
			{categories}
			isEditing={true}
			readonly={enableDelete}
		/>
	{/snippet}
</ModalDialog>

<ModalDialog bind:dialog={editDialog} onconfirm={save} oncancel={cancel}>
	{#snippet title()}
		<span>Edit Intake</span>
		<span>
			<span class="text-xs opacity-60">
				Added: {convertDateStrToDisplayDateStr(blankEntry.added)}
			</span>
			<span>
				<button class="btn btn-xs btn-error">
					<TrashBinSolid width="1rem" onclick={() => (enableDelete = true)} />
				</button>
			</span>
		</span>
	{/snippet}

	{#snippet content()}
		{#if focusedEntry !== undefined}
			<CalorieTrackerMask entry={focusedEntry} {categories} {isEditing} />
		{/if}
	{/snippet}

	{#snippet footer()}
		{#if enableDelete}
			<button class="btn btn-error" onclick={deleteEntry}>Delete</button>
		{:else}
			<button class="btn btn-primary" onclick={save}>Save</button>
		{/if}
		<button class="btn" onclick={cancel}>Cancel</button>
	{/snippet}
</ModalDialog>
