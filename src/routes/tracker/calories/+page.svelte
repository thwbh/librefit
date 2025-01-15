<script lang="ts">
	import { Accordion, AccordionItem, getToastStore, Paginator } from '@skeletonlabs/skeleton';
	import CalorieTracker from '$lib/components/tracker/CalorieTrackerComponent.svelte';
	import { validateAmount } from '$lib/validation';
	import { showToastError, showToastSuccess, showToastWarning } from '$lib/toast';
	import { getContext } from 'svelte';
	import { convertDateStrToDisplayDateStr, getDateAsStr } from '$lib/date';
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
	import type { Indicator } from '$lib/indicator';
	import type { CalorieTarget, FoodCategory, LibreUser } from '$lib/model.js';

	let today = new Date();
	let todayStr = getDateAsStr(today);

	const toastStore = getToastStore();
	const indicator: Writable<Indicator> = getContext('indicator');
	const user: Writable<LibreUser> = getContext('user');
	const foodCategories: Writable<FoodCategory[]> = getContext('foodCategories');
	const calorieTarget: Writable<CalorieTarget> = getContext('calorieTarget');

	export let data;

	let datesToEntries = {};

	let availableDates = [];
	let paginatedSource = [];

	$: datesToEntries;
	$: availableDates;

	let paginationSettings = {
		page: 0,
		limit: 7,
		size: data.availableDates.length,
		amounts: [1, 7, 14, 31]
	};

	$: if (data && data.entryToday) {
		datesToEntries[todayStr] = data.entryToday;
		availableDates = data.availableDates;
	}

	$: paginatedSource = availableDates.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);

	const addEntry = async (event) => {
		const amountMessage = validateAmount(event.detail.value);

		if (!amountMessage) {
			$indicator = $indicator.start(event.detail.target);

			await addCalories(event)
				.then(async (response) => {
					event.detail.callback();

					datesToEntries[event.detail.dateStr] = response;

					showToastSuccess(
						toastStore,
						`Successfully added ${getFoodCategoryLongvalue($foodCategories, event.detail.category)}.`
					);
				})
				.catch((e) => {
					showToastError(toastStore, e);
					event.detail.callback(true);
				})
				.finally(() => ($indicator = $indicator.finish()));
		} else {
			showToastWarning(toastStore, amountMessage);
			event.detail.callback();
		}
	};

	const updateEntry = async (event) => {
		const amountMessage = validateAmount(event.detail.value);

		if (!amountMessage) {
			$indicator = $indicator.start(event.detail.target);

			await updateCalories(event)
				.then(async (response) => {
					event.detail.callback();

					datesToEntries[event.detail.dateStr] = response;

					showToastSuccess(
						toastStore,
						`Successfully updated ${getFoodCategoryLongvalue($foodCategories, event.detail.category)}.`
					);
				})
				.catch((e) => {
					showToastError(toastStore, e);
					event.detail.callback(true);
				})
				.finally(() => ($indicator = $indicator.finish()));
		} else {
			showToastWarning(toastStore, amountMessage);
			event.detail.callback(true);
		}
	};

	const deleteEntry = async (event) => {
		$indicator = $indicator.start(event.detail.target);

		await deleteCalories(event)
			.then(async (response) => {
				event.detail.callback();

				datesToEntries[event.detail.dateStr] = await response;

				showToastSuccess(toastStore, `Deletion successful.`);
			})
			.catch((e) => {
				showToastError(toastStore, e);
				event.detail.callback(true);
			})
			.finally(() => ($indicator = $indicator.finish()));
	};

	/**
	 * @param added {string}
	 */
	const loadEntries = async (added) => {
		if (!datesToEntries[added]) {
			$indicator = $indicator.start();

			await listCaloriesForDate(added)
				.then((response) => {
					datesToEntries[added] = response;
				})
				.catch((e) => {
					showToastError(toastStore, e);
				})
				.finally(() => ($indicator = $indicator.finish()));
		}
	};

	const onFilterChanged = async (event) => {
		const fromDateStr = event.detail.from;
		const toDateStr = event.detail.to;

		if (fromDateStr && toDateStr) {
			$indicator = $indicator.start();

			await listCalorieTrackerDatesRange(fromDateStr, toDateStr)
				.then((response) => {
					availableDates = response;
					paginationSettings.size = availableDates.length;
				})
				.catch((e) => {
					showToastError(toastStore, e);
				})
				.finally(() => ($indicator = $indicator.finish()));
		}
	};
</script>

<svelte:head>
	<title>LibreFit - Calorie Tracker</title>
</svelte:head>

{#if $user}
	<section>
		<div class="container 2xl:w-2/5 xl:w-3/5 lg:w-4/5 mx-auto p-8 space-y-10 justify-between">
			<h1 class="h1">Tracker History</h1>

			{#if data.availableDates}
				{#if availableDates.length > 0}
					<FilterComponent on:change={onFilterChanged} />

					{#each paginatedSource as dateStr}
						<Accordion class="card rounded-xl">
							<AccordionItem id={dateStr} on:toggle={() => loadEntries(dateStr)}>
								<svelte:fragment slot="summary">
									{convertDateStrToDisplayDateStr(dateStr)}
								</svelte:fragment>
								<svelte:fragment slot="content">
									<div class="flex md:flex-row flex-col gap-4 p-4">
										{#if datesToEntries[dateStr]}
											<CalorieTracker
												calorieTracker={datesToEntries[dateStr]}
												categories={$foodCategories}
												calorieTarget={$calorieTarget}
												on:addCalories={addEntry}
												on:updateCalories={updateEntry}
												on:deleteCalories={deleteEntry}
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
													<CalorieTracker
														calorieTracker={entries}
														categories={$foodCategories}
														calorieTarget={$calorieTarget}
														on:addCalories={addEntry}
														on:updateCalories={updateEntry}
														on:deleteCalories={deleteEntry}
													/>
												{/if}
											{:catch error}
												<p>{error}</p>
											{/await}
										{/if}
									</div>
								</svelte:fragment>
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
							Insufficient data to render your history. Start tracking now on the <a
								href="/dashboard">Dashboard</a
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
			{:else}
				{data.error}
			{/if}
		</div>
	</section>
{/if}
