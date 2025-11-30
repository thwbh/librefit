<script lang="ts">
	import { differenceInDays } from 'date-fns';
	import { convertDateStrToDisplayDateStr, parseStringAsDate } from '$lib/date';
	import { Calendar, TrendDown, TrendUp, Target, Lightning } from 'phosphor-svelte';
	import NumberFlow from '@number-flow/svelte';

	interface Props {
		startDate: string;
		endDate: string;
		initialWeight: number;
		targetWeight: number;
		currentWeight: number;
	}

	let { startDate, endDate, initialWeight, targetWeight, currentWeight }: Props = $props();

	// Calculate progress metrics
	const startDateParsed = $derived(parseStringAsDate(startDate));
	const endDateParsed = $derived(parseStringAsDate(endDate));
	const today = $derived(new Date());

	const totalDays = $derived(differenceInDays(endDateParsed, startDateParsed));
	const daysElapsed = $derived(Math.min(differenceInDays(today, startDateParsed), totalDays));
	const progressPercent = $derived(totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0);

	// Weight progress
	const weightChange = $derived(initialWeight - currentWeight);

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
</script>

<div class="bg-base-100 rounded-box p-6 shadow">
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
								{convertDateStrToDisplayDateStr(startDate)}
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
				<div class="timeline-end timeline-box bg-secondary text-secondary-content">
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2">
							<Lightning size="1.25rem" weight="bold" />
							<span class="text-sm font-semibold">Today</span>
						</div>
						<div class="text-2xl font-bold">
							<NumberFlow value={currentWeight} /> <span class="text-sm">kg</span>
						</div>
						<div class="flex items-center gap-2 text-xs">
							{#if weightChange === 0}
								<span class="opacity-60">No change yet</span>
							{:else if isOnTrack}
								{#if isGaining}
									<TrendUp size="1rem" weight="bold" />
									<span>+{Math.abs(weightChange).toFixed(1)} kg gained</span>
								{:else}
									<TrendDown size="1rem" weight="bold" />
									<span>{Math.abs(weightChange).toFixed(1)} kg lost</span>
								{/if}
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
								{convertDateStrToDisplayDateStr(endDate)}
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
