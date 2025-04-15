<script lang="ts">
	import type { CalorieTracker, NewCalorieTracker } from '$lib/model';
	import { type SwipeCustomEvent } from 'svelte-gestures';
	import IntakeCard from './IntakeCard.svelte';
	import CalorieTrackerMask from './CalorieTrackerMask.svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import { AlertBox, AlertType, Stack } from '@thwbh/veilchen';
	import { convertDateStrToDisplayDateStr, getDateAsStr } from '$lib/date';

	interface Props {
		entries: Array<CalorieTracker>;
	}

	let { entries = $bindable() }: Props = $props();

	let blankEntry: NewCalorieTracker = $state({
		category: 'l',
		added: getDateAsStr(new Date()),
		amount: 0,
		description: ''
	});

	let focusedEntry: CalorieTracker | undefined = $state(undefined);

	let index = $state(0);
	let dialog: HTMLDialogElement | undefined = $state();
	let createDialog: HTMLDialogElement | undefined = $state();

	let isEditing = $state(false);
	let isNew = $state(false);

	const startEditing = () => {
		isEditing = true;

		dialog?.showModal();
	};

	const create = (e: Event) => {
		isNew = true;

		console.log('create!');
		createDialog?.showModal();
	};

	const save = (e: Event) => {
		console.log('save!');

		console.log(blankEntry);

		if (isNew) {
			entries.push({
				id: entries.length + 1,
				category: blankEntry.category,
				added: blankEntry.added,
				amount: blankEntry.amount,
				description: blankEntry.description
			});

			console.log(entries);
		}

		if (isEditing) dialog?.close();
		if (isNew) createDialog?.close();
	};

	const cancel = (e: Event) => {
		console.log('cancel!');

		if (isEditing) dialog?.close();
		if (isNew) createDialog?.close();
	};

	const handler = (event: SwipeCustomEvent) => {
		let direction = 0;

		if (event.detail.direction === 'left') direction = 1;
		else if (event.detail.direction === 'right') direction = -1;

		index = (index + direction + entries.length) % entries.length;
		focusedEntry = entries[index];
	};
</script>

<div class="flex flex-col items-center gap-2 p-4">
	{#if entries && entries.length > 0}
		<Stack
			size={entries.length}
			swipeable={true}
			swipeParams={{ timeframe: 300, minSwipeDistance: 60 }}
		>
			{#snippet card(index: number)}
				<IntakeCard entry={entries[index]} onlongpress={startEditing} />
			{/snippet}
		</Stack>
	{:else}
		<AlertBox type={AlertType.Warning} alertClass="border-neutral border-dashed">
			<strong>Nothing tracked today.</strong>
			<span> Use the button below to add today's first entry. Stay strong! </span>
		</AlertBox>
	{/if}
	<button class="btn btn-neutral w-full" onclick={create}> Add Intake </button>
</div>

<dialog bind:this={dialog} id="intake-modal" class="modal modal-bottom sm:modal-middle">
	<div class="modal-box">
		<span class="dialog-header"> Edit Intake </span>

		{#if focusedEntry !== undefined}
			<CalorieTrackerMask bind:entry={focusedEntry} {isEditing} />
		{/if}
		<div class="flex flex-col gap-2">
			<button class="btn btn-primary" onclick={save}>Save</button>
			<button class="btn" onclick={cancel}>Cancel</button>
		</div>
	</div>
</dialog>

<dialog bind:this={createDialog} id="intake-modal" class="modal modal-bottom sm:modal-middle">
	<div class="modal-box">
		<div class="dialog-header border-base-300 pb-2 mb-2">
			<span>Add Intake</span>
			<span class="text-xs opacity-60">
				Date: {convertDateStrToDisplayDateStr(blankEntry.added)}
			</span>
		</div>
		<CalorieTrackerMask bind:entry={blankEntry} isEditing={true} />
		<div class="flex flex-col gap-2">
			<button class="btn btn-primary" onclick={save}>Save</button>
			<button class="btn" onclick={cancel}>Cancel</button>
		</div>
	</div>
</dialog>

<style>
	.dialog-header {
		@apply flex justify-between items-center grow border-b border-dashed w-full;
	}
</style>
