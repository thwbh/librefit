<script lang="ts">
	import BottomDock from '$lib/component/BottomDock.svelte';
	import CalorieWeeklyView from '$lib/component/CalorieWeeklyView.svelte';
	import TrackerScore from '$lib/component/intake/TrackerScore.svelte';
	import TrackerStack from '$lib/component/intake/TrackerStack.svelte';
	import WeightScore from '$lib/component/weight/WeightScore.svelte';
	import type { CalorieTarget, CalorieTracker, WeightTarget, WeightTracker } from '$lib/model';
	import '../style.css';

	let calorieTarget: CalorieTarget = {
		id: 0,
		added: '2025-01-01',
		startDate: '2025-01-01',
		endDate: '2025-12-31',
		targetCalories: 1750,
		maximumCalories: 1990
	};

	let entries: Array<number> = [];
	let entries2 = [300, 500, 600];
	let entries3 = [1000, 800];
	let entries4 = [1000, 1000];

	let calorieTrackerEntries: Array<CalorieTracker> = $state([
		{
			id: 1,
			category: 'b',
			amount: 300,
			added: '2025-01-01',
			description: 'Oatmeal with banana'
		},
		{
			id: 2,
			category: 'l',
			amount: 600,
			added: '2025-01-01',
			description: 'Spaghetti Carbonara'
		},
		{
			id: 3,
			category: 'd',
			amount: 400,
			added: '2025-01-01',
			description: 'Tapas'
		}
	]);

	let calorieTrackerWeek: Array<number> = [1800, 1750, 1634, 2000, 2400, 1700];

	let weightTracker: WeightTracker = {
		id: 1,
		added: '2025-04-01',
		amount: 87
	};

	let weightTarget: WeightTarget = {
		id: 1,
		added: '2025-01-01',
		startDate: '2025-01-01',
		endDate: '2025-12-31',
		targetWeight: 77,
		initialWeight: 89
	};
</script>

<div class="flex flex-col gap-4">
	<div class="bg-base-200 flex flex-col items-center">
		<TrackerScore {calorieTarget} entries={entries2} />

		<TrackerStack bind:entries={calorieTrackerEntries} />
	</div>

	<div class="bg-base-200 flex flex-col items-center w-full">
		<WeightScore {weightTracker} {weightTarget} />
	</div>
	<BottomDock />
</div>
