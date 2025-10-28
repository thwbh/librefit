<script lang="ts">
	import BottomDock from '$lib/component/BottomDock.svelte';
	import TrackerScore from '$lib/component/intake/TrackerScore.svelte';
	import TrackerStack from '$lib/component/intake/TrackerStack.svelte';
	import WeightScore from '$lib/component/weight/WeightScore.svelte';
	import {
		createCalorieTrackerEntry,
		createWeightTrackerEntry,
		deleteCalorieTrackerEntry,
		updateCalorieTrackerEntry,
		updateWeightTrackerEntry,
		type CalorieTarget,
		type CalorieTracker,
		type Dashboard,
		type WeightTarget,
		type WeightTracker
	} from '$lib/api/gen';
	import { getUserContext } from '$lib/context';
	import { info } from '@tauri-apps/plugin-log';

	let { data } = $props();

	const dashboard: Dashboard = data.dashboardData;
	const userContext = getUserContext();

	let calorieTrackerEntries: Array<CalorieTracker> = $state(dashboard.caloriesTodayList);
	let lastWeightTracker = $state(dashboard.weightMonthList[0]);

	const weightTarget: WeightTarget = dashboard.weightTarget;
	const calorieTarget: CalorieTarget = dashboard.calorieTarget;

	const weightTracker: WeightTracker = $state(dashboard.weightTodayList[0]);

	let caloriesToday: Array<number> = $derived(
		calorieTrackerEntries.map((tracker) => tracker.amount)
	);

	info(`dashboardData=${JSON.stringify(dashboard)}`);
	info(`user profile=${JSON.stringify(userContext.user)}`);
</script>

<div class="flex flex-col gap-6 overflow-x-hidden p-2">
	<h1 class="sr-only">Dashboard</h1>
	<span class="text-xl font-bold text-center"> Day {data.dashboardData.currentDay} </span>

	<div class="flex flex-col items-center gap-2">
		<TrackerScore {calorieTarget} entries={caloriesToday} />

		<TrackerStack
			bind:entries={calorieTrackerEntries}
			onadd={createCalorieTrackerEntry}
			onedit={updateCalorieTrackerEntry}
			ondelete={deleteCalorieTrackerEntry}
		/>
	</div>

	<div class="flex flex-col items-center w-full pb-12">
		<WeightScore
			{weightTracker}
			{lastWeightTracker}
			{weightTarget}
			onadd={createWeightTrackerEntry}
			onedit={updateWeightTrackerEntry}
		/>
	</div>
	<BottomDock activeRoute="/" />
</div>
