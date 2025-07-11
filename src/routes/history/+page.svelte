<script lang="ts">
	import { getTrackerHistory } from '$lib/api/tracker-history';
	import BottomDock from '$lib/component/BottomDock.svelte';
	import TrackerScore from '$lib/component/intake/TrackerScore.svelte';
	import { getDateAsStr, parseStringAsDate } from '$lib/date.js';
	import type { CalorieTarget, CalorieTracker, TrackerHistory, WeightTracker } from '$lib/model.js';
	import NumberFlow from '@number-flow/svelte';
	import { info } from '@tauri-apps/plugin-log';
	import { addDays, subDays } from 'date-fns';
	import { getFoodCategoryLongvalue } from '$lib/api/category';

	let { data } = $props();

	// default history is 1 week
	let trackerHistory: TrackerHistory = $state(data.trackerHistory);
	let calorieTarget: CalorieTarget = data.calorieTarget;

	let dates = $derived(Object.keys(trackerHistory?.caloriesHistory));

	let selectedDateStr: string = $derived(dates[dates.length - 1]);

	let caloriesHistory: Array<CalorieTracker> = $derived.by(() => [
		...trackerHistory.caloriesHistory[selectedDateStr]
	]);

	let weightHistory: Array<WeightTracker> = $derived([
		...trackerHistory.weightHistory[selectedDateStr]
	]);

	const selectHistory = (dateStr: string) => {
		info(`selectHistory dateStr={${dateStr}}`);

		selectedDateStr = dateStr;
	};

	const scrollLeft = () => {
		const firstDate = parseStringAsDate(dates[0]);

		updateRange(subDays(firstDate, 7), firstDate);

		selectedDateStr = dates[dates.length - 1];
	};

	const scrollRight = () => {
		let lastDate = parseStringAsDate(dates[dates.length - 1]);

		if (lastDate) lastDate = addDays(lastDate, 1);

		updateRange(lastDate, addDays(lastDate, 7));
	};

	const updateRange = async (dateFrom: Date, dateTo: Date) => {
		trackerHistory = await getTrackerHistory(dateFrom, dateTo);
	};

	const getActiveClass = (dateStr: string) =>
		dateStr === selectedDateStr ? 'bg-primary text-primary-content' : '';

	const getRightDisabled = () => selectedDateStr === getDateAsStr(new Date());
</script>

<div class="flex flex-col gap-4 p-4">
	<h1 class="sr-only">History</h1>

	{#if selectedDateStr}
		{@const selectedDate = parseStringAsDate(selectedDateStr)}
		<div class="flex items-center mx-auto p-4">
			<span class="text-xl font-bold">
				{getDateAsStr(selectedDate, 'MMMM yyyy')}
			</span>
		</div>
	{/if}
	<div
		class="border-b-base-300 flex flex-row border-b border-dashed pb-3 overflow-x-scroll justify-between"
	>
		<button class="btn" onclick={scrollLeft}> left </button>

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

		<button class="btn" onclick={scrollRight} disabled={getRightDisabled()}> right </button>
	</div>

	<div class="flex flex-col">
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
				>
					<div class="flex flex-col">
						<span class="text-lg">
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
		</div>

		<span>Weight</span>
		<span>
			{weightHistory}
		</span>
	</div>

	<BottomDock activeRoute="/history" />
</div>
