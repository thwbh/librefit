<script lang="ts">
	import { Accordion, AccordionItem, getToastStore, Paginator } from '@skeletonlabs/skeleton';
	import { validateAmount } from '$lib/validation';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import { getContext } from 'svelte';
	import { convertDateStrToDisplayDateStr, getDateAsStr, parseStringAsDate } from '$lib/date';
	import FilterComponent from '$lib/components/FilterComponent.svelte';
	import {
		addCalories,
		deleteCalories,
		listCaloriesForDate,
		listCalorieTrackerDatesRange,
		updateCalories
	} from '$lib/api/tracker';
	import FoodOff from '$lib/assets/icons/food-off.svg?component';
	import { getFoodCategoryLongvalue } from '$lib/api/category';
	import CalorieDistribution from '$lib/components/CalorieDistribution.svelte';
	import type { Writable } from 'svelte/store';
	import type {
		CalorieTarget,
		CalorieTracker,
		FoodCategory,
		NewCalorieTracker
	} from '$lib/model.js';
	import CalorieTrackerComponent from '$lib/components/tracker/CalorieTrackerComponent.svelte';

	let today = new Date();
	let todayStr = getDateAsStr(today);

	const toastStore = getToastStore();
	const foodCategories: Writable<FoodCategory[]> = getContext('foodCategories');
	const calorieTarget: Writable<CalorieTarget> = getContext('calorieTarget');

	let { data } = $props();

	let datesToEntries = $state({});

	let availableDates = $state([]);

	let paginationSettings = $state({
		page: 0,
		limit: 7,
		size: data.availableDates.length,
		amounts: [1, 7, 14, 31]
	});

	$effect(() => {
		datesToEntries[todayStr] = data.entryToday;
		availableDates = data.availableDates;
	});

	const handleRequest = async (
		amount: number,
		promise: Promise<Array<CalorieTracker>>,
		callback: (response: Array<CalorieTracker>) => void
	) => {
		const amountMessage = validateAmount(amount);

		if (!amountMessage) {
			await promise.then(callback).catch((e) => showToastError(toastStore, e));
		} else {
			showToastWarning(toastStore, amountMessage);
		}
	};

	const onAddCalories = async (calories: NewCalorieTracker) => {
		await handleRequest(
			calories.amount,
			addCalories(calories),
			(response: Array<CalorieTracker>) => {
				datesToEntries[calories.added] = response;

				showToastSuccess(
					toastStore,
					`Successfully added ${getFoodCategoryLongvalue($foodCategories, calories.category)}.`
				);
			}
		);
	};

	const onUpdateCalories = async (calories: CalorieTracker) => {
		await handleRequest(
			calories.amount,
			updateCalories(calories),
			(response: Array<CalorieTracker>) => {
				datesToEntries[calories.added] = response;

				showToastSuccess(
					toastStore,
					`Successfully updated ${getFoodCategoryLongvalue($foodCategories, calories.category)}.`
				);
			}
		);
	};

	const onDeleteCalories = async (calories: CalorieTracker) => {
		await handleRequest(
			calories.amount,
			deleteCalories(calories),
			(response: Array<CalorieTracker>) => {
				datesToEntries[calories.added] = response;

				showToastSuccess(toastStore, `Deletion successful.`);
			}
		);
	};

	const loadEntries = async (date: Date) => {
		const added = getDateAsStr(date);

		if (!datesToEntries[added]) {
			await listCaloriesForDate(date)
				.then((response) => {
					datesToEntries[added] = response;
				})
				.catch((e) => {
					showToastError(toastStore, e);
				});
		}
	};

	const onFilterChanged = async (fromDate: Date, toDate: Date) => {
		if (fromDate && toDate) {
			await listCalorieTrackerDatesRange(fromDate, toDate)
				.then((response) => {
					availableDates = response;
					paginationSettings.size = availableDates.length;
				})
				.catch((e) => {
					showToastError(toastStore, e);
				});
		}
	};
</script>

<svelte:head>
	<title>LibreFit - Calorie Tracker</title>
</svelte:head>

<section>
	<div class="container 2xl:w-2/5 xl:w-3/5 lg:w-4/5 mx-auto p-8 space-y-10 justify-between">
		<h1 class="h1">Tracker History</h1>

		{#if availableDates.length > 0}
			{@const paginatedSource = availableDates.slice(
				paginationSettings.page * paginationSettings.limit,
				paginationSettings.page * paginationSettings.limit + paginationSettings.limit
			)}
			<FilterComponent {onFilterChanged} />

			{#each paginatedSource as dateStr}
				<Accordion class="card rounded-xl">
					<AccordionItem id={dateStr} on:toggle={() => loadEntries(parseStringAsDate(dateStr))}>
						{#snippet summary()}
							{convertDateStrToDisplayDateStr(dateStr)}
						{/snippet}
						{#snippet content()}
							<div class="flex md:flex-row flex-col gap-4 p-4">
								{#if datesToEntries[dateStr]}
									<CalorieTrackerComponent
										calorieTracker={datesToEntries[dateStr]}
										categories={$foodCategories}
										calorieTarget={$calorieTarget}
										{onAddCalories}
										{onUpdateCalories}
										{onDeleteCalories}
									/>

									<CalorieDistribution
										calorieTracker={datesToEntries[dateStr]}
										displayHistory={false}
										displayHeader={false}
										foodCategories={$foodCategories}
										calorieTarget={$calorieTarget}
									/>
								{:else}
									{#await datesToEntries[dateStr]}
										<p>... loading</p>
									{:then entries}
										{#if entries}
											<CalorieTrackerComponent
												calorieTracker={entries}
												categories={$foodCategories}
												calorieTarget={$calorieTarget}
												{onAddCalories}
												{onUpdateCalories}
												{onDeleteCalories}
											/>
										{/if}
									{:catch error}
										<p>{error}</p>
									{/await}
								{/if}
							</div>
						{/snippet}
					</AccordionItem>
				</Accordion>
			{/each}

			<Paginator
				bind:settings={paginationSettings}
				showFirstLastButtons={false}
				showPreviousNextButtons={true}
			/>
		{:else}
			<div class="flex flex-col items-center text-center gap-4">
				<FoodOff width={100} height={100} />
				<p>
					Insufficient data to render your history. Start tracking now on the <a href="/dashboard"
						>Dashboard</a
					>!
				</p>
				<p>
					Are you trying to add tracking data for the past? Don't worry, the <a href="/import"
						>CSV Import</a
					>
					is the right tool for that.
				</p>
			</div>
		{/if}
	</div>
</section>
