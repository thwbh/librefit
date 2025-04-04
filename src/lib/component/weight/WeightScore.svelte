<script lang="ts">
  import type { CalorieTarget, WeightTarget, WeightTracker } from '$lib/model';
  import { ExclamationCircleSolid, ShieldCheckSolid, ShieldSolid } from 'flowbite-svelte-icons';
  import { PlusOutline } from "flowbite-svelte-icons";

	interface Props {
    weightTracker: WeightTracker,
    weightTarget: WeightTarget
	}

	let { weightTracker, weightTarget }: Props = $props();
</script>

<div class="stat">
  <div class="stat-figure">
    <button class="btn btn-primary btn-xl">
      <PlusOutline height="1.5rem" width="1.5rem" />
    </button>
  </div> 

  <div class="stat-title">Current Weight</div>
  <div class="stat-value">{weightTracker.amount}<span class="text-sm">kg</span></div> 
  <div class="stat-desc flex items-center gap-1">

<!--
  <ShieldCheckSolid width="20" height="20" class={'stat-desc'} />
  Nothing tracked yet.
  <ShieldCheckSolid width="20" height="20" class={'text-success'} />
  Last update: Today.
-->
    <ShieldSolid width="20" height="20" class={'text-warning'} />
    Last update: 2 days ago.
<!--
    <ExclamationCircleSolid width="20" height="20" class={'text-error'} /> 
  Warning! Last update was more than 2 days ago! -->
  </div>
</div>

<div class="progress-container w-full">
  <span class="flex flex-row justify-between items-center">
    <p class="text-sm opacity-60">
      27 days left.
    </p>
    <button class="btn btn-sm">
      Review plan
    </button>
  </span>
  <progress class="progress w-full" value="63" max="100"></progress>
</div>

<style>
  .stat-value {
    font-size: 2rem;
  }

  .progress-container {
    padding-inline: calc(0.25rem * 6);
    padding-block: calc(0.25rem * 4);
  }
</style>
