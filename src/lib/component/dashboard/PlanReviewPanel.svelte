<script lang="ts">
	import IntakePlanCard from '$lib/component/journey/IntakePlanCard.svelte';
	import EncouragementMessage from '$lib/component/journey/EncouragementMessage.svelte';
	import { slide, fly } from 'svelte/transition';

	interface Props {
		/** Visibility flag; parent route owns the toggle UI (which lives in the
		 * progress-bar header). The panel only reacts. */
		expanded: boolean;
		dailyRate: number;
		recommendation: 'GAIN' | 'LOSE';
		targetCalories: number;
		maximumCalories: number;
		averageIntake: number;
		daysElapsed: number;
		daysLeft: number;
		goalReached: boolean;
	}

	let {
		expanded,
		dailyRate,
		recommendation,
		targetCalories,
		maximumCalories,
		averageIntake,
		daysElapsed,
		daysLeft,
		goalReached
	}: Props = $props();
</script>

{#if expanded}
	<div transition:slide={{ duration: 300 }} class="flex flex-col gap-4 mt-4">
		<div in:fly={{ y: 20, duration: 400, delay: 150 }}>
			<IntakePlanCard
				{dailyRate}
				{recommendation}
				{targetCalories}
				{maximumCalories}
				{averageIntake}
			/>
		</div>

		<div in:fly={{ y: 20, duration: 400, delay: 250 }}>
			<EncouragementMessage
				{daysElapsed}
				{daysLeft}
				{averageIntake}
				{targetCalories}
				{goalReached}
			/>
		</div>
	</div>
{/if}
