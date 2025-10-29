<script lang="ts">
	import {
		createCalorieTrackerEntry,
		deleteCalorieTrackerEntry,
		getTrackerHistory,
		updateCalorieTrackerEntry
	} from '$lib/api/gen';
	import TrackerScore from '$lib/component/intake/TrackerScore.svelte';
	import { convertDateStrToDisplayDateStr, getDateAsStr, parseStringAsDate } from '$lib/date.js';
	import type {
		CalorieTarget,
		CalorieTracker,
		NewCalorieTracker,
		TrackerHistory,
		WeightTracker
	} from '$lib/api/gen';
	import NumberFlow from '@number-flow/svelte';
	import { info } from '@tauri-apps/plugin-log';
	import { addDays, compareAsc, subDays } from 'date-fns';
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import { CaretLeft, CaretRight, Pencil, Trash } from 'phosphor-svelte';
	import { ModalDialog, SwipeableListItem } from '@thwbh/veilchen';
	import CalorieTrackerMask from '$lib/component/intake/CalorieTrackerMask.svelte';
	import CalorieTrackerDisplay from '$lib/component/intake/CalorieTrackerDisplay.svelte';
	import { longpress } from '$lib/gesture/long-press';
	import { vibrate } from '@tauri-apps/plugin-haptics';
	import { getCategoriesContext } from '$lib/context';
	import { useEntryModal } from '$lib/composition/useEntryModal.svelte';

	let { data } = $props();

	const foodCategories = getCategoriesContext();

	info(JSON.stringify(data));

	// default history is 1 week
	let trackerHistory: TrackerHistory = $state(data.trackerHistory);
	let calorieTarget: CalorieTarget = data.calorieTarget;
	let lastDateStr = data.trackerHistory.dateLastStr;

	let dates = $derived(Object.keys(trackerHistory?.caloriesHistory));

	// ensure history can't be scrolled into the future
	let showRightCaret: boolean = $derived(
		compareAsc(parseStringAsDate(lastDateStr), parseStringAsDate(dates[dates.length - 1])) === 1
	);

	let selectedDateStr: string = $derived(dates[dates.length - 1]);

	let caloriesHistory: Array<CalorieTracker> = $derived.by(() => {
		if (!trackerHistory || !trackerHistory.caloriesHistory[selectedDateStr]) return [];

		return [...trackerHistory?.caloriesHistory[selectedDateStr]];
	});

	let weightHistory: Array<WeightTracker> = $derived.by(() => {
		if (!trackerHistory || !trackerHistory.weightHistory[selectedDateStr]) return [];

		return [...trackerHistory?.weightHistory[selectedDateStr]];
	});

	// Modal composition for CRUD operations
	const modal = useEntryModal<CalorieTracker, NewCalorieTracker>({
		onCreate: async (entry) => await createCalorieTrackerEntry({ newEntry: entry }),
		onUpdate: async (id, entry) =>
			await updateCalorieTrackerEntry({ trackerId: id, updatedEntry: entry }),
		onDelete: async (id) => {
			await deleteCalorieTrackerEntry({ trackerId: id });
		},
		getBlankEntry: () => ({
			added: selectedDateStr,
			amount: 0,
			category: 't',
			description: ''
		}),
		onCreateSuccess: (newEntry) => {
			caloriesHistory = [...caloriesHistory, newEntry];
			trackerHistory.caloriesHistory[selectedDateStr] = caloriesHistory;
		},
		onUpdateSuccess: (updatedEntry) => {
			const idx = caloriesHistory.findIndex((e) => e.id === updatedEntry.id);
			if (idx !== -1) {
				caloriesHistory[idx] = updatedEntry;
				caloriesHistory = [...caloriesHistory];
				trackerHistory.caloriesHistory[selectedDateStr] = caloriesHistory;
			}
		},
		onDeleteSuccess: (id) => {
			caloriesHistory = caloriesHistory.filter((e) => e.id !== id);
			trackerHistory.caloriesHistory[selectedDateStr] = caloriesHistory;
		}
	});

	const selectHistory = (dateStr: string) => {
		info(`selectHistory dateStr={${dateStr}}`);

		selectedDateStr = dateStr;
	};

	const scrollLeft = () => {
		const firstDate = parseStringAsDate(dates[0]);

		updateRange(subDays(firstDate, 7), subDays(firstDate, 1));

		selectedDateStr = dates[dates.length - 1];
	};

	const scrollRight = () => {
		let lastDate = parseStringAsDate(dates[dates.length - 1]);

		if (lastDate) lastDate = addDays(lastDate, 1);

		updateRange(lastDate, addDays(lastDate, 6));
	};

	const updateRange = async (dateFrom: Date, dateTo: Date) => {
		trackerHistory = await getTrackerHistory({
			dateFromStr: getDateAsStr(dateFrom),
			dateToStr: getDateAsStr(dateTo)
		});
	};

	const getActiveClass = (dateStr: string) =>
		dateStr === selectedDateStr ? 'bg-primary text-primary-content' : '';

	const edit = async (calories: CalorieTracker) => {
		await vibrate(2);
		modal.openEdit(calories);
	};

	const remove = async (calories: CalorieTracker) => {
		await vibrate(2);
		modal.openDelete(calories);
	};
</script>

<div class="flex flex-col gap-4">
	<h1 class="sr-only">History</h1>

	<div class="flex flex-col pt-4">
		{#if selectedDateStr}
			{@const selectedDate = parseStringAsDate(selectedDateStr)}
			<div class="flex items-center mx-auto pt-4 pb-2">
				<span class="text-xl font-bold">
					{getDateAsStr(selectedDate, 'MMMM yyyy')}
				</span>
			</div>
		{/if}
		<div
			class="border-b-base-300 grid grid-cols-9 gap-2 border-b border-dashed- pb-3 overflow-x-scroll p-4"
		>
			<button class="btn-ghost w-fit place-self-center" onclick={scrollLeft}>
				<span><CaretLeft size="1em" /></span>
			</button>

			{#each dates as dateStr}
				{@const dayNumber = getDateAsStr(parseStringAsDate(dateStr), 'dd')}
				{@const dayName = getDateAsStr(parseStringAsDate(dateStr), 'EE')}
				<button
					onclick={() => selectHistory(dateStr)}
					class="btn-ghost rounded-field flex flex-col items-center px-2 py-1 {getActiveClass(
						dateStr
					)}"
				>
					<span class="text-sm font-semibold">
						{dayNumber}
					</span>
					<span class="text-[10px] font-semibold opacity-50">{dayName}</span>
				</button>
			{/each}

			{#if showRightCaret}
				<button class="btn-ghost w-fit place-self-center" onclick={scrollRight}>
					<CaretRight size="1em" />
				</button>
			{:else}
				<div></div>
			{/if}
		</div>
	</div>

	<div class="flex flex-col overflow-y-scroll">
		<div class="stats">
			<div class="stat">
				<div class="stat-title">Average calories</div>
				<div class="stat-value"><NumberFlow value={trackerHistory.caloriesAverage} /></div>
			</div>
		</div>

		<TrackerScore {calorieTarget} entries={caloriesHistory.map((c) => c.amount)} isHistory={true} />

		<div class="divide-base-300 divide-y p-6">
			{#each caloriesHistory as calories}
				<SwipeableListItem onleft={() => edit(calories)} onright={() => remove(calories)}>
					{#snippet leftAction()}
						<span><Pencil size="2em" color={'var(--color-primary)'} /></span>
					{/snippet}

					{#snippet rightAction()}
						<span><Trash size="2em" color={'var(--color-error)'} /> </span>
					{/snippet}

					<div
						class="border-t-base-content/5 flex items-center justify-between gap-2 border-t border-dashed py-2"
						use:longpress
						onlongpress={() => edit(calories)}
					>
						<div class="flex flex-col">
							<span class="text-lg font-semibold">
								{calories.description}
							</span>
							<span class="stat-desc">
								{calories.amount} kcal
							</span>
						</div>
						<span class="badge badge-xs badge-info"
							>{getFoodCategoryLongvalue(foodCategories, calories.category)}</span
						>
					</div></SwipeableListItem
				>
			{/each}

			<button class="btn btn-neutral w-full mt-4" onclick={modal.openCreate}> Add Intake </button>
		</div>
		<div class="stats">
			<div class="stat">
				<div class="stat-title">Weight</div>

				{#if weightHistory.length > 0}
					<div class="stat-value">{weightHistory[0].amount} <span class="text-sm">kg</span></div>
				{:else}
					<div class="stat-value">No weight tracked.</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<ModalDialog bind:dialog={modal.createDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span>Add Intake</span>
		<span class="text-xs opacity-60">
			Date: {convertDateStrToDisplayDateStr(selectedDateStr)}
		</span>
	{/snippet}

	{#snippet content()}
		{#if modal.currentEntry}
			<CalorieTrackerMask bind:entry={modal.currentEntry} isEditing={true} />
		{/if}
	{/snippet}
</ModalDialog>

<ModalDialog bind:dialog={modal.editDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		{#if modal.currentEntry}
			<span>Edit Intake</span>
			<span>
				<span class="text-xs opacity-60">
					Added: {convertDateStrToDisplayDateStr((modal.currentEntry as CalorieTracker).added)}
				</span>
				<span>
					<button class="btn btn-xs btn-error">
						<Trash size="1rem" onclick={modal.requestDelete} />
					</button>
				</span>
			</span>
		{/if}
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

<ModalDialog bind:dialog={modal.deleteDialog.value} onconfirm={modal.save} oncancel={modal.cancel}>
	{#snippet title()}
		<span>Delete Intake</span>
		<span class="text-sm font-normal opacity-70">
			Do you really want to delete this entry?
		</span>
	{/snippet}

	{#snippet content()}
		{#if modal.currentEntry}
			<CalorieTrackerDisplay entry={modal.currentEntry as CalorieTracker} />
		{/if}
	{/snippet}

	{#snippet footer()}
		<button class="btn btn-error" onclick={modal.deleteEntry}>Delete</button>
		<button class="btn" onclick={modal.cancel}>Cancel</button>
	{/snippet}
</ModalDialog>
