<script lang="ts">
	import { getTrackerHistory } from '$lib/api/tracker-history';
	import BottomDock from '$lib/component/BottomDock.svelte';
	import TrackerScore from '$lib/component/intake/TrackerScore.svelte';
	import { convertDateStrToDisplayDateStr, getDateAsStr, parseStringAsDate } from '$lib/date.js';
	import type {
		CalorieTarget,
		CalorieTracker,
		NewCalorieTracker,
		TrackerHistory,
		WeightTracker
	} from '$lib/model.js';
	import NumberFlow from '@number-flow/svelte';
	import { info } from '@tauri-apps/plugin-log';
	import { addDays, compareAsc, subDays } from 'date-fns';
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import { CaretLeftSolid, CaretRightSolid, TrashBinSolid } from 'flowbite-svelte-icons';
	import { ModalDialog } from '@thwbh/veilchen';
	import CalorieTrackerMask from '$lib/component/intake/CalorieTrackerMask.svelte';
	import { longpress } from '$lib/gesture/long-press';
	import { addCalories, deleteCalories, updateCalories } from '$lib/api/tracker.js';
	import { vibrate } from '@tauri-apps/plugin-haptics';

	let { data } = $props();

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

	// entry for modal dialog
	let focusedCalories: NewCalorieTracker | CalorieTracker = $state();
	let enableDelete = $state(false);
	let isEditing = $state(false);
	let editDialog: HTMLDialogElement = $state();

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
		trackerHistory = await getTrackerHistory(dateFrom, dateTo);

		focusedCalories = undefined;
	};

	const getActiveClass = (dateStr: string) =>
		dateStr === selectedDateStr ? 'bg-primary text-primary-content' : '';

	const create = () => {
		focusedCalories = {
			added: selectedDateStr,
			amount: undefined,
			category: 't',
			description: ''
		};

		editDialog?.showModal();
	};

	const edit = async (calories: CalorieTracker) => {
		await vibrate(2);

		console.log('longpress');
		focusedCalories = calories;
		editDialog?.showModal();
	};

	const save = async () => {
		if ('id' in focusedCalories) await updateCalories(focusedCalories as CalorieTracker);
		else await addCalories(focusedCalories as NewCalorieTracker);

		editDialog?.close();

		focusedCalories = undefined;
	};

	const cancel = () => {
		editDialog?.close();

		focusedCalories = undefined;
	};

	const deleteEntry = async () => {
		await deleteCalories(focusedCalories as CalorieTracker);

		editDialog?.close();

		focusedCalories = undefined;
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
		<!-- <div -->
		<!-- 	class="border-b-base-300 flex flex-row border-b border-dashed pb-3 overflow-x-scroll justify-between p-4" -->
		<!-- > -->
		<div
			class="border-b-base-300 grid grid-cols-9 gap-2 border-b border-dashed- pb-3 overflow-x-scroll p-4"
		>
			<button class="btn-ghost w-fit place-self-center" onclick={scrollLeft}>
				<span><CaretLeftSolid height="1em" /></span>
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
					<CaretRightSolid height="1em" />
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

		<div class="flex flex-col text-xs p-6">
			{#each caloriesHistory as calories}
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
						>{getFoodCategoryLongvalue(data.foodCategories, calories.category)}</span
					>
				</div>
			{/each}

			<button class="btn btn-neutral w-full mt-4" onclick={create}> Add Intake </button>
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

	<BottomDock activeRoute="/history" />
</div>

<ModalDialog bind:dialog={editDialog} onconfirm={save} oncancel={cancel}>
	{#snippet title()}
		{#if focusedCalories}
			<span>Edit Intake</span>
			<span>
				<span class="text-xs opacity-60">
					Added: {convertDateStrToDisplayDateStr(focusedCalories.added)}
				</span>
				<span>
					<button class="btn btn-xs btn-error">
						<TrashBinSolid width="1rem" onclick={() => (enableDelete = true)} />
					</button>
				</span>
			</span>
		{/if}
	{/snippet}

	{#snippet content()}
		{#if focusedCalories !== undefined}
			<CalorieTrackerMask entry={focusedCalories} categories={data.foodCategories} {isEditing} />
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
