<script lang="ts">
	import CalorieDistribution from '$lib/components/CalorieDistribution.svelte';
	import { getContext } from 'svelte';
	import { DataViews, enumKeys } from '$lib/enum';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import { listCaloriesFiltered } from '$lib/api/tracker';
	import NoFood from '$lib/assets/icons/food-off.svg?component';
	import { getFoodCategoryLongvalue, skimCategories } from '$lib/api/category';
	import type { CalorieTarget, CalorieTracker, FoodCategory } from '$lib/model';
	import type { Writable } from 'svelte/store';

	const foodCategories: Writable<Array<FoodCategory>> = getContext('foodCategories');
	const calorieTarget: Writable<CalorieTarget> = getContext('calorieTarget');

	let filter = $state(DataViews.Month);

	const calculateAverage = (calorieTracker: Array<CalorieTracker>, category: string) => {
		const filtered = calorieTracker.filter((entry) => entry.category === category);
		const total = filtered.map((entry) => entry.amount).reduce((part, a) => part + a, 0);

		return Math.round(total / filtered.length);
	};

	const findMinimum = (calorieTracker: Array<CalorieTracker>, category: string) => {
		return Math.min(
			...calorieTracker.filter((entry) => entry.category === category).map((entry) => entry.amount)
		);
	};

	const findMaximum = (calorieTracker: Array<CalorieTracker>, category: string) => {
		return Math.max(
			...calorieTracker.filter((entry) => entry.category === category).map((entry) => entry.amount)
		);
	};
</script>

<section>
	<div class="container mx-auto p-8 space-y-10">
		<h1 class="h1">Calorie Distribution</h1>
		<div class="flex flex-col gap-4">
			<RadioGroup>
				{#each enumKeys(DataViews) as dataView}
					<RadioItem bind:group={filter} name="justify" value={DataViews[dataView]}>
						{dataView}
					</RadioItem>
				{/each}
			</RadioGroup>

			{#await listCaloriesFiltered(filter) then filteredData}
				{#if filteredData.length > 0}
					{@const categories = skimCategories(filteredData)}

					<div class="flex flex-col lg:flex-row gap-4">
						<div class="lg:w-3/5 flex flex-col">
							<h2 class="h2">Last {filter.toLowerCase()}:</h2>
							<div class="table-container">
								<table class="table table-hover table-compact table-auto w-full align-middle">
									<thead>
										<tr>
											<th>Type</th>
											<th>Avg.</th>
											<th>Min.</th>
											<th>Max.</th>
										</tr>
									</thead>
									<tbody>
										{#each categories as category}
											<tr>
												<td>
													{getFoodCategoryLongvalue($foodCategories, category)}
												</td>
												<td>
													kcal {calculateAverage(filteredData, category)}
												</td>
												<td>
													kcal {findMinimum(filteredData, category)}
												</td>
												<td>
													kcal {findMaximum(filteredData, category)}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
						<div class="lg:w-2/5 flex justify-center">
							<CalorieDistribution
								displayClass="flex"
								calorieTracker={filteredData}
								displayHeader={false}
								displayHistory={false}
								foodCategories={$foodCategories}
								calorieTarget={$calorieTarget}
							/>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center text-center gap-4">
						<NoFood width={100} height={100} />
						<p>Insufficient data to render your history.</p>
					</div>
				{/if}
			{/await}
		</div>
	</div>
</section>
