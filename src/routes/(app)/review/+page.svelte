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
	import {
		type WeightTarget,
		type WeightTracker,
		type IntakeTarget,
		type BodyData,
		CalculationSexSchema
	} from '$lib/api/gen';
	import NumberFlow from '@number-flow/svelte';
	import { Breadcrumbs, TextSize, type BreadcrumbItem } from '@thwbh/veilchen';
	import { setWizardContext } from '$lib/context/wizard';
	import { getUserContext } from '$lib/context/user.svelte';
	import Finish from '$lib/component/wizard/Finish.svelte';

	let { data } = $props();

	const weightTarget: WeightTarget | undefined = $state(data.weightTarget);
	const lastWeightTracker: WeightTracker | undefined = $state(data.lastWeightTracker);
	const intakeTarget: IntakeTarget | undefined = $state(data.intakeTarget);
	const bodyData: BodyData = data.bodyData;

	// Get user from context
	const { user } = getUserContext();

	// Set up wizard context for Finish component
	if (weightTarget && intakeTarget && user) {
		setWizardContext({
			userData: user,
			weightTarget: {
				added: weightTarget.added,
				startDate: weightTarget.startDate,
				endDate: weightTarget.endDate,
				initialWeight: weightTarget.initialWeight,
				targetWeight: weightTarget.targetWeight
			},
			intakeTarget: {
				added: intakeTarget.added,
				startDate: intakeTarget.startDate,
				endDate: intakeTarget.endDate,
				targetCalories: intakeTarget.targetCalories,
				maximumCalories: intakeTarget.maximumCalories
			},
			wizardInput: {
				age: bodyData.age,
				sex: CalculationSexSchema.safeParse(bodyData.sex).data!,
				weight: weightTarget.initialWeight,
				height: bodyData.height,
				activityLevel: 1,
				weeklyDifference: 0,
				calculationGoal: weightTarget.targetWeight > weightTarget.initialWeight ? 'GAIN' : 'LOSS'
			},
			chosenRate: intakeTarget.maximumCalories - intakeTarget.targetCalories
		});
	}

	// Calculate progress metrics
	const startDate = $derived(weightTarget ? parseStringAsDate(weightTarget.startDate) : null);
	const endDate = $derived(weightTarget ? parseStringAsDate(weightTarget.endDate) : null);
	const today = $derived(new Date());

	const totalDays = $derived(startDate && endDate ? differenceInDays(endDate, startDate) : 0);
	const daysElapsed = $derived(
		startDate ? Math.min(differenceInDays(today, startDate), totalDays) : 0
	);
	const progressPercent = $derived(totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0);

	// Weight progress
	const currentWeight = $derived(lastWeightTracker?.amount ?? weightTarget?.initialWeight ?? 0);
	const initialWeight = $derived(weightTarget?.initialWeight ?? 0);
	const targetWeight = $derived(weightTarget?.targetWeight ?? 0);

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

		<!-- Plan Details using Finish component -->
		{#if weightTarget && intakeTarget && user}
			<Finish />
		{/if}
	{/if}
</div>
