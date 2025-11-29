<script lang="ts">
	import { differenceInDays } from 'date-fns';
	import { convertDateStrToDisplayDateStr, parseStringAsDate } from '$lib/date';
	import {
		Calendar,
		TrendDown,
		TrendUp,
		Target,
		Lightning,
		House,
		Strategy
	} from 'phosphor-svelte';
	import type { WeightTarget, WeightTracker } from '$lib/api/gen';
	import NumberFlow from '@number-flow/svelte';
	import { Breadcrumbs, TextSize, type BreadcrumbItem } from '@thwbh/veilchen';

	let { data } = $props();

	const weightTarget: WeightTarget | undefined = $state(data.weightTarget);
	const lastWeightTracker: WeightTracker | undefined = $state(data.lastWeightTracker);

	// Calculate progress metrics
	const startDate = $derived(weightTarget ? parseStringAsDate(weightTarget.startDate) : null);
	const endDate = $derived(weightTarget ? parseStringAsDate(weightTarget.endDate) : null);
	const today = $derived(new Date());

	const totalDays = $derived(startDate && endDate ? differenceInDays(endDate, startDate) : 0);
	const daysElapsed = $derived(
		startDate ? Math.min(differenceInDays(today, startDate), totalDays) : 0
	);
	const daysRemaining = $derived(totalDays - daysElapsed);
	const progressPercent = $derived(totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0);

	// Weight progress
	const currentWeight = $derived(lastWeightTracker?.amount ?? weightTarget?.initialWeight ?? 0);
	const initialWeight = $derived(weightTarget?.initialWeight ?? 0);
	const targetWeight = $derived(weightTarget?.targetWeight ?? 0);

	const weightChange = $derived(initialWeight - currentWeight);
	const totalWeightGoal = $derived(Math.abs(initialWeight - targetWeight));
	const weightProgress = $derived(
		totalWeightGoal > 0 ? Math.round((Math.abs(weightChange) / totalWeightGoal) * 100) : 0
	);

	const isGaining = $derived(targetWeight > initialWeight);
	const isOnTrack = $derived(
		isGaining ? currentWeight >= initialWeight : currentWeight <= initialWeight
	);

	// Expected weight based on linear progress
	const expectedWeight = $derived(
		initialWeight + (targetWeight - initialWeight) * (progressPercent / 100)
	);
	const isAheadOfSchedule = $derived(
		isGaining ? currentWeight >= expectedWeight : currentWeight <= expectedWeight
	);

	const weightDifference = $derived(currentWeight - expectedWeight);

	const items: BreadcrumbItem[] = [
		{
			id: '1',
			icon: House,
			iconProps: { weight: 'bold' }
		},
		{
			id: '2',
			href: '/review',
			label: 'Your Plan',
			icon: Strategy,
			iconProps: { weight: 'bold' }
		}
	];
</script>

<div class="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
	<div class="mb-4">
		<h1 class="sr-only">Your Plan</h1>
		<Breadcrumbs {items} size={TextSize.XL} class="font-semibold" />

		<p class="text-sm text-base-content opacity-60">
			Track your progress and stay motivated on your fitness journey
		</p>
	</div>

	{#if !weightTarget}
		<div class="alert alert-warning">
			<span>No active weight plan found. Complete the setup wizard to create one.</span>
		</div>
	{:else}
		<!-- Timeline -->
		<div class="card bg-base-200">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Journey Timeline</h2>

				<ul class="timeline timeline-vertical">
					<!-- Start -->
					<li>
						<div class="timeline-start timeline-box bg-base-100">
							<div class="flex flex-col gap-1">
								<div class="flex items-center gap-2">
									<Calendar size="1.25rem" class="opacity-60" />
									<span class="text-sm font-semibold">
										{convertDateStrToDisplayDateStr(weightTarget.startDate)}
									</span>
								</div>
								<div class="text-2xl font-bold">
									<NumberFlow value={initialWeight} /> <span class="text-sm">kg</span>
								</div>
								<span class="text-xs opacity-60">Starting Weight</span>
							</div>
						</div>
						<div class="timeline-middle">
							<div class="w-3 h-3 rounded-full bg-primary"></div>
						</div>
						<hr class="bg-primary" />
					</li>

					<!-- Current (Today) -->
					<li>
						<hr class="bg-primary" />
						<div class="timeline-middle">
							<div
								class="w-4 h-4 rounded-full bg-accent border-4 border-base-100 ring-2 ring-accent"
							></div>
						</div>
						<div class="timeline-end timeline-box bg-accent text-accent-content">
							<div class="flex flex-col gap-1">
								<div class="flex items-center gap-2">
									<Lightning size="1.25rem" weight="bold" />
									<span class="text-sm font-semibold">Today</span>
								</div>
								<div class="text-2xl font-bold">
									<NumberFlow value={currentWeight} /> <span class="text-sm">kg</span>
								</div>
								<div class="flex items-center gap-2 text-xs">
									{#if isOnTrack}
										{#if isGaining}
											<TrendUp size="1rem" weight="bold" />
											<span>+{Math.abs(weightChange).toFixed(1)} kg gained</span>
										{:else}
											<TrendDown size="1rem" weight="bold" />
											<span>{Math.abs(weightChange).toFixed(1)} kg lost</span>
										{/if}
									{:else}
										<span class="opacity-60">No change yet</span>
									{/if}
								</div>
							</div>
						</div>
						<hr class={isAheadOfSchedule ? 'bg-success' : 'bg-base-300'} />
					</li>

					<!-- Target -->
					<li>
						<hr class="bg-base-300" />
						<div class="timeline-start timeline-box bg-base-100">
							<div class="flex flex-col gap-1">
								<div class="flex items-center gap-2">
									<Target size="1.25rem" class="opacity-60" />
									<span class="text-sm font-semibold">
										{convertDateStrToDisplayDateStr(weightTarget.endDate)}
									</span>
								</div>
								<div class="text-2xl font-bold">
									<NumberFlow value={targetWeight} /> <span class="text-sm">kg</span>
								</div>
								<span class="text-xs opacity-60">Target Weight</span>
							</div>
						</div>
						<div class="timeline-middle">
							<div class="w-3 h-3 rounded-full bg-success"></div>
						</div>
					</li>
				</ul>
			</div>
		</div>

		<!-- Progress Stats -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="stat bg-base-200 rounded-box">
				<div class="stat-title">Time Progress</div>
				<div class="stat-value text-primary">{progressPercent}%</div>
				<div class="stat-desc">
					{daysElapsed} of {totalDays} days complete
				</div>
				<progress class="progress progress-primary w-full mt-2" value={progressPercent} max="100"
				></progress>
			</div>

			<div class="stat bg-base-200 rounded-box">
				<div class="stat-title">Weight Progress</div>
				<div class="stat-value text-accent">{weightProgress}%</div>
				<div class="stat-desc">
					{Math.abs(weightChange).toFixed(1)} / {totalWeightGoal.toFixed(1)} kg
				</div>
				<progress class="progress progress-accent w-full mt-2" value={weightProgress} max="100"
				></progress>
			</div>

			<div class="stat bg-base-200 rounded-box">
				<div class="stat-title">Days Remaining</div>
				<div class="stat-value">{daysRemaining}</div>
				<div class="stat-desc">
					{#if isAheadOfSchedule}
						<span class="text-success">Ahead of schedule!</span>
					{:else if daysRemaining > 0}
						Keep going!
					{:else}
						Plan complete
					{/if}
				</div>
			</div>
		</div>

		<!-- Plan Details Table -->
		<div class="card bg-base-200">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Plan Details</h2>

				<div class="overflow-x-auto">
					<table class="table">
						<tbody>
							<tr>
								<th class="w-1/2">Start Date</th>
								<td>{convertDateStrToDisplayDateStr(weightTarget.startDate)}</td>
							</tr>
							<tr>
								<th>Target Date</th>
								<td>{convertDateStrToDisplayDateStr(weightTarget.endDate)}</td>
							</tr>
							<tr>
								<th>Duration</th>
								<td>{totalDays} days ({Math.round(totalDays / 7)} weeks)</td>
							</tr>
							<tr class="border-t-2 border-base-300">
								<th>Starting Weight</th>
								<td>{initialWeight.toFixed(1)} kg</td>
							</tr>
							<tr>
								<th>Current Weight</th>
								<td class="font-bold">{currentWeight.toFixed(1)} kg</td>
							</tr>
							<tr>
								<th>Target Weight</th>
								<td>{targetWeight.toFixed(1)} kg</td>
							</tr>
							<tr>
								<th>Total Goal</th>
								<td>
									{#if isGaining}
										<span class="text-success">+{totalWeightGoal.toFixed(1)} kg</span>
									{:else}
										<span class="text-error">-{totalWeightGoal.toFixed(1)} kg</span>
									{/if}
								</td>
							</tr>
							<tr class="border-t-2 border-base-300">
								<th>Expected Weight (Today)</th>
								<td>{expectedWeight.toFixed(1)} kg</td>
							</tr>
							<tr>
								<th>Actual vs Expected</th>
								<td>
									{#if Math.abs(weightDifference) < 0.5}
										<span class="badge badge-success">On track!</span>
									{:else if (isGaining && weightDifference > 0) || (!isGaining && weightDifference < 0)}
										<span class="badge badge-success">
											Ahead by {Math.abs(weightDifference).toFixed(1)} kg
										</span>
									{:else}
										<span class="badge badge-warning">
											Behind by {Math.abs(weightDifference).toFixed(1)} kg
										</span>
									{/if}
								</td>
							</tr>
							<tr>
								<th>Average Weekly Progress Needed</th>
								<td>
									{#if daysRemaining > 0}
										{@const remainingWeight = Math.abs(targetWeight - currentWeight)}
										{@const weeksRemaining = daysRemaining / 7}
										{(remainingWeight / weeksRemaining).toFixed(2)} kg/week
									{:else}
										Goal complete
									{/if}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{#if daysRemaining <= 0}
					<div class="alert alert-success mt-4">
						<span>Congratulations! You've reached your target date. Time to set a new goal!</span>
					</div>
				{:else if !isOnTrack}
					<div class="alert alert-info mt-4">
						<span>Tip: Start tracking your weight to see your progress on the timeline!</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.timeline-box {
		max-width: 40vw;
	}
</style>
