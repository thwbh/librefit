<script lang="ts">
	import IntakeScore from '$lib/component/intake/IntakeScore.svelte';
	import IntakeStack from '$lib/component/intake/IntakeStack.svelte';
	import WeightScore from '$lib/component/weight/WeightScore.svelte';
	import {
		createIntake,
		createWeightTrackerEntry,
		deleteIntake,
		updateIntake,
		updateWeightTrackerEntry,
		type Dashboard,
		type Intake,
		type IntakeTarget,
		type WeightTarget,
		type WeightTracker
	} from '$lib/api';
	import { getUserContext } from '$lib/context';
	import { debug } from '@tauri-apps/plugin-log';
	import { useRefresh } from '@thwbh/veilchen';
	import { invalidate } from '$app/navigation';

	let { data } = $props();

	const dashboard: Dashboard = data.dashboardData;
	const userContext = getUserContext();

	let intake: Array<Intake> = $state(dashboard.intakeTodayList);
	let lastWeightTracker = $state(dashboard.weightMonthList[0]);

	const weightTarget: WeightTarget = dashboard.weightTarget;
	const intakeTarget: IntakeTarget = dashboard.intakeTarget;

	const weightTracker: WeightTracker = $state(dashboard.weightTodayList[0]);

	let intakeToday: Array<number> = $derived(intake.map((tracker) => tracker.amount));

	debug(`dashboardData=${JSON.stringify(dashboard)}`);
	debug(`user profile=${JSON.stringify(userContext.user)}`);

	useRefresh(() => invalidate('data:dashboardData'));
</script>

<div class="flex flex-col gap-6 overflow-x-hidden p-2">
	<h1 class="sr-only">Dashboard</h1>
	<div class="p-2 pt-4">
		{#if data.dashboardData.currentDay > 0}
			<span class="text-xl font-bold text-center"> Day {data.dashboardData.currentDay} </span>
		{:else}
			<span class="text-xl font-fold text-center"></span>
		{/if}
	</div>

	<div class="flex flex-col items-center gap-2 w-full">
		<IntakeScore {intakeTarget} entries={intakeToday} />

		<IntakeStack
			bind:entries={intake}
			onadd={(params) => createIntake(params)}
			onedit={(params) => updateIntake(params)}
			ondelete={(params) => deleteIntake(params)}
			class="w-full"
		/>
	</div>

	<div class="flex flex-col items-center w-full">
		<WeightScore
			{weightTracker}
			{lastWeightTracker}
			{weightTarget}
			onadd={(entry) => createWeightTrackerEntry({ newEntry: entry })}
			onedit={(id, entry) => updateWeightTrackerEntry({ trackerId: id, updatedEntry: entry })}
		/>
	</div>
</div>
