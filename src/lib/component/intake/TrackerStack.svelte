<script lang="ts">
	import type {
		CalorieTracker,
		CreateCalorieTrackerEntryParams,
		DeleteCalorieTrackerEntryParams,
		NewCalorieTracker,
		UpdateCalorieTrackerEntryParams
	} from '$lib/api/gen';
	import CalorieTrackerDisplay from './CalorieTrackerDisplay.svelte';
	import CalorieTrackerMask from './CalorieTrackerMask.svelte';
	import { Trash } from 'phosphor-svelte';
	import { AlertBox, AlertType, ModalDialog, Stack, StackCard } from '@thwbh/veilchen';
	import { convertDateStrToDisplayDateStr, getDateAsStr } from '$lib/date';
	import { fade, type FlyParams } from 'svelte/transition';
	import { vibrate } from '@tauri-apps/plugin-haptics';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';

	interface Props {
		entries: Array<CalorieTracker>;
		onadd?: (params: CreateCalorieTrackerEntryParams) => Promise<CalorieTracker>;
		onedit?: (params: UpdateCalorieTrackerEntryParams) => Promise<CalorieTracker>;
		ondelete?: (params: DeleteCalorieTrackerEntryParams) => Promise<number>;
	}

	const getBlankEntry = (): NewCalorieTracker => {
		return {
			category: 'l',
			added: getDateAsStr(new Date()),
			amount: 0,
			description: ''
		};
	};

	let {
		entries = $bindable([]),
		onadd = undefined,
		onedit = undefined,
		ondelete = undefined
	}: Props = $props();

	let index = $state(0);
	let focusedEntry = $derived(entries[index]);

	// Use modal composition hook
	const modal = useEntryModal<CalorieTracker, NewCalorieTracker>({
		onCreate: async (entry) => {
			if (!onadd) throw new Error('onadd not provided');
			return await onadd({ newEntry: entry });
		},
		onUpdate: async (id, entry) => {
			if (!onedit) throw new Error('onedit not provided');
			return await onedit({ trackerId: id, updatedEntry: entry });
		},
		onDelete: async (id) => {
			if (!ondelete) throw new Error('ondelete not provided');
			await ondelete({ trackerId: id });
		},
		getBlankEntry,
		onCreateSuccess: (newEntry) => {
			entries = [...entries, newEntry];
			index = entries.length - 1;
		},
		onUpdateSuccess: (updatedEntry) => {
			entries[index] = updatedEntry;
		},
		onDeleteSuccess: () => {
			if (entries.length === 1) {
				entries = [];
			} else {
				const deletedIndex = index;
				entries = entries.toSpliced(deletedIndex, 1);
				if (index === entries.length && index > 0) {
					index--;
				} else {
					index = 0;
				}
			}
		}
	});

	const startEditing = async () => {
		await vibrate(2);
		if (focusedEntry) {
			modal.openEdit(focusedEntry);
		}
	};
</script>

{#if entries.length > 0}
	<Stack
		bind:index
		size={entries.length}
		swipeable={true}
		onswipe={(direction: string) => console.log('swiped ', direction)}
	>
		{#snippet card(cardKey: number, outFlyParams: FlyParams, inFlyParams: FlyParams)}
			<StackCard isActive={cardKey === index} {cardKey} {outFlyParams} {inFlyParams} class="w-full">
				<CalorieTrackerDisplay entry={entries[cardKey]} />
			</StackCard>
		{/snippet}
	</Stack>
{:else}
	<div in:fade>
		<AlertBox type={AlertType.Warning} class="border-neutral border-dashed">
			<strong>Nothing tracked today.</strong>
			<span> Use the button below to add today's first entry. Stay strong! </span>
		</AlertBox>
	</div>
{/if}

<button class="btn btn-neutral w-full" onclick={modal.openCreate}> Add Intake </button>

<ModalDialog bind:dialog={modal.createDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span>Add Intake</span>
		{#if modal.currentEntry}
			<span class="text-xs opacity-60">
				Date: {convertDateStrToDisplayDateStr((modal.currentEntry as NewCalorieTracker).added)}
			</span>
		{/if}
	{/snippet}

	{#snippet content()}
		{#if modal.currentEntry}
			<CalorieTrackerMask
				bind:entry={modal.currentEntry}
				isEditing={true}
				readonly={modal.enableDelete}
			/>
		{/if}
	{/snippet}
</ModalDialog>

<ModalDialog bind:dialog={modal.editDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span>Edit Intake</span>
		<span>
			{#if modal.currentEntry}
				<span class="text-xs opacity-60">
					Added: {convertDateStrToDisplayDateStr((modal.currentEntry as CalorieTracker).added)}
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
			<CalorieTrackerMask
				entry={modal.currentEntry as CalorieTracker}
				isEditing={modal.isEditing}
			/>
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
