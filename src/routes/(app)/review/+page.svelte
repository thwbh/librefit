<script lang="ts">
	import { House, Strategy } from 'phosphor-svelte';
	import {
		type WeightTarget,
		type WeightTracker,
		type IntakeTarget,
		type BodyData
	} from '$lib/api/gen';
	import { Breadcrumbs, TextSize, type BreadcrumbItem } from '@thwbh/veilchen';
	import { getUserContext } from '$lib/context/user.svelte';
	import JourneyTimeline from '$lib/component/journey/JourneyTimeline.svelte';
	import UserProfileCard from '$lib/component/journey/UserProfileCard.svelte';
	import CaloriePlanCard from '$lib/component/journey/CaloriePlanCard.svelte';
	import EncouragementMessage from '$lib/component/journey/EncouragementMessage.svelte';
	import { fly } from 'svelte/transition';

	let { data } = $props();

	const weightTarget: WeightTarget | undefined = $state(data.weightTarget);
	const lastWeightTracker: WeightTracker | undefined = $state(data.lastWeightTracker);
	const intakeTarget: IntakeTarget | undefined = $state(data.intakeTarget);
	const bodyData: BodyData = data.bodyData;

	// Get user from context
	const { user } = getUserContext();
	// Current weight from last tracker or initial weight
	const currentWeight = $derived(lastWeightTracker?.amount ?? weightTarget?.initialWeight ?? 0);

	// Animation control
	let mounted = $state(false);
	$effect(() => {
		mounted = true;
	});

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
	{:else if mounted}
		<div in:fly={{ y: 20, duration: 400, delay: 0 }}>
			<UserProfileCard
				userName={user!.name}
				userAvatar={user!.avatar}
				activityLevel={bodyData.activityLevel}
			/>
		</div>

		<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
			<JourneyTimeline
				startDate={weightTarget.startDate}
				endDate={weightTarget.endDate}
				initialWeight={weightTarget.initialWeight}
				targetWeight={weightTarget.targetWeight}
				{currentWeight}
			/>
		</div>

		<div in:fly={{ y: 20, duration: 400, delay: 200 }}>
			<CaloriePlanCard
				dailyRate={Math.abs(intakeTarget.maximumCalories - intakeTarget.targetCalories)}
				recommendation={weightTarget.targetWeight > weightTarget.initialWeight ? 'GAIN' : 'LOSE'}
				targetCalories={intakeTarget.targetCalories}
				maximumCalories={intakeTarget.maximumCalories}
			/>
		</div>

		<div in:fly={{ y: 20, duration: 400, delay: 300 }}>
			<EncouragementMessage />
		</div>
	{/if}
</div>
