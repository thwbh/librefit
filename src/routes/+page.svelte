<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		addCalories,
		addWeight,
		deleteCalories,
		updateCalories,
		updateWeight
	} from '$lib/api/tracker.js';
	import BottomDock from '$lib/component/BottomDock.svelte';
	import TrackerScore from '$lib/component/intake/TrackerScore.svelte';
	import TrackerStack from '$lib/component/intake/TrackerStack.svelte';
	import WeightScore from '$lib/component/weight/WeightScore.svelte';
	import type {
		CalorieTarget,
		CalorieTracker,
		Dashboard,
		WeightTarget,
		WeightTracker
	} from '$lib/model';
	import { info } from '@tauri-apps/plugin-log';

	let { data } = $props();

	const dashboard: Dashboard = data.dashboardData;

	let calorieTrackerEntries: Array<CalorieTracker> = $state(dashboard.caloriesTodayList);
	let lastWeightTracker = $state(dashboard.weightMonthList[0]);

	const weightTarget: WeightTarget = dashboard.weightTarget;
	const calorieTarget: CalorieTarget = dashboard.calorieTarget;

	const weightTracker: WeightTracker = $state(dashboard.weightTodayList[0]);

	let caloriesToday: Array<number> = $derived(
		calorieTrackerEntries.map((tracker) => tracker.amount)
	);

	info(`user profile=${JSON.stringify(data.userProfile)}`);

	if (!data.userProfile) {
		info(`redirecting to splash screen`);

		goto('/splash');
	}
</script>

<div class="flex flex-col gap-4">
	<div class="bg-base-200 flex flex-col items-center">
		<TrackerScore {calorieTarget} entries={caloriesToday} />

		<TrackerStack
			bind:entries={calorieTrackerEntries}
			categories={dashboard.foodCategories}
			onadd={addCalories}
			onedit={updateCalories}
			ondelete={deleteCalories}
		/>
	</div>

	<div class="bg-base-200 flex flex-col items-center w-full">
		<WeightScore
			{weightTracker}
			{lastWeightTracker}
			{weightTarget}
			onadd={addWeight}
			onedit={updateWeight}
		/>
	</div>
	<BottomDock activeRoute="/" />
</div>
