<script lang="ts">
	import Setup from '$lib/component/wizard/Setup.svelte';
	import { getUserContext } from '$lib/context';
	import { Person, Heartbeat, ChartBar, Gauge, CheckCircle } from 'phosphor-svelte';

	let { data } = $props();

	// page is only visible with user data
	const userDataCtx = getUserContext().user!;

	// pass cloned object so context data does not get updated by accident
	let userData = $state({ ...userDataCtx });

	let currentStep = $state(1);
	let recommendation = $state('');

	const totalSteps = 5;
	const progress = $derived(((currentStep - 1) / (totalSteps - 1)) * 100);

	const stepConfig = [
		{
			title: 'Body Parameters',
			subtitle: "Let's start with some basic information about you",
			icon: Person
		},
		{
			title: 'Activity Level',
			subtitle: 'How active are you during your day?',
			icon: Heartbeat
		},
		{
			title: 'Your Results',
			subtitle: "Here's what your body composition looks like",
			icon: ChartBar
		},
		{
			title: 'Choose Your Pace',
			subtitle: 'Select a rate that fits your lifestyle',
			icon: Gauge
		},
		{
			title: 'Your Plan',
			subtitle: "Here's your customized fitness journey",
			icon: CheckCircle
		}
	];

	// Step 4 title is dynamic based on recommendation
	let currentConfig = $derived.by(() => {
		const config = stepConfig[currentStep - 1];
		if (currentStep === 4 && recommendation === 'HOLD') {
			return {
				...config,
				title: 'Select Your Target Weight',
				subtitle: 'Choose a target weight within your healthy range'
			};
		}
		return config;
	});
</script>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">Setup Wizard</h1>

	<!-- Branded Header -->
	<div class="bg-primary text-primary-content px-6 pt-8 pb-14">
		<div class="flex items-start justify-between">
			<div class="flex flex-col gap-1">
				<span class="text-xs font-medium opacity-70">Step {currentStep} of {totalSteps}</span>
				<span class="text-2xl font-bold">{currentConfig.title}</span>
				<span class="text-sm opacity-70 mt-1">{currentConfig.subtitle}</span>
			</div>

			{#if currentConfig.icon}
				{@const Icon = currentConfig.icon}
				<span class="opacity-50">
					<Icon size="2.5rem" weight="duotone" />
				</span>
			{/if}
		</div>

		<!-- Progress bar -->
		<div class="mt-6">
			<div class="journey-bar-track">
				<div class="journey-bar-fill" style="width: calc({progress}% + 0.5rem)"></div>
			</div>
		</div>
	</div>

	<!-- Content card with overlap -->
	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 p-4 pt-6">
		<Setup {userData} bodyData={data.bodyData} bind:currentStep bind:recommendation />
	</div>
</div>

<style>
	.journey-bar-track {
		height: 0.25rem;
		border-radius: 9999px;
		background-color: oklch(0.85 0.02 280);
		overflow: visible;
		position: relative;
	}

	.journey-bar-fill {
		height: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background-color: var(--color-accent);
		position: relative;
		min-width: 1rem;
		transition: width 0.6s ease;
		clip-path: polygon(0% 0%, calc(100% - 0.5rem) 0%, 100% 50%, calc(100% - 0.5rem) 100%, 0% 100%);
	}
</style>
