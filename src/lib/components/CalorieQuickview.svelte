<script lang="ts">
	import TargetOff from '$lib/assets/icons/target-off.svg?component';
	import Wand from '$lib/assets/icons/wand.svg?component';

	import { paintCalorieTrackerQuickview } from '$lib/quickview-chart';
	import { goto } from '$app/navigation';
	import BarChartComponent from './chart/BarChartComponent.svelte';
	import type { CalorieTarget, CalorieTracker } from '$lib/model';

	interface Props {
		calorieTracker: Array<CalorieTracker>;
		calorieTarget: CalorieTarget;
		displayClass?: string;
		displayHeader?: boolean;
		headerText?: string;
	}

	let {
		calorieTracker,
		calorieTarget,
		displayClass = '',
		displayHeader = true,
		headerText = 'Target Quickview'
	}: Props = $props();
</script>

<div class="{displayClass} gap-4 text-center justify-between relative h-full">
	{#if displayHeader}<h2 class="h3">{headerText}</h2>{/if}

	{#if calorieTracker && calorieTarget}
		{@const quickview = paintCalorieTrackerQuickview(calorieTracker, calorieTarget)}
		<div class="flex flex-col xl:w-fit h-full justify-between gap-4">
			<BarChartComponent data={quickview.data} options={quickview.options} />
		</div>
	{:else}
		<div class="flex flex-col gap-4 m-auto">
			<TargetOff width={100} height={100} class="self-center" />
			<p>No target set up.</p>
			<button class="w-1/2" aria-label="edit calories" onclick={() => goto('/wizard')}>
				<span>
					<Wand />
				</span>
				<span> Wizard </span>
			</button>
		</div>
	{/if}
</div>
