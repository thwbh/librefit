<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import WorkoutModule from './WorkoutModule.svelte';
	import CollapsibleCard from './CollapsibleCard.svelte';

	// Owns the dashboard's cross-feature composition and its Idle↔Active states
	// (the `dashboard` capability). Idle: calorie card, weight card, then the
	// Start Workout module (DH-001). Active: the workout module is promoted to the
	// top and the calorie/weight cards collapse to micro-progress rows (DH-002/003).
	// The feature cards themselves are passed in as snippets so this stays
	// presentational and free of feature/api types.
	interface Props {
		active: boolean;
		resting?: boolean;
		currentExercise?: string | null;
		activeWorkTimeMs?: number;
		totalVolume?: number;
		setsCompleted?: number;
		restRemainingMs?: number;
		calorieValue: number;
		weightValue: number;
		calorieCard: Snippet;
		weightCard: Snippet;
		onStart: () => void;
		onOpen: () => void;
	}

	let {
		active,
		resting = false,
		currentExercise = null,
		activeWorkTimeMs = 0,
		totalVolume = 0,
		setsCompleted = 0,
		restRemainingMs = 0,
		calorieValue,
		weightValue,
		calorieCard,
		weightCard,
		onStart,
		onOpen
	}: Props = $props();
</script>

<div class="dashboard-layout flex w-full flex-col gap-3" data-state={active ? 'active' : 'idle'}>
	{#if active}
		<div transition:fade>
			<WorkoutModule
				{active}
				{resting}
				{currentExercise}
				{activeWorkTimeMs}
				{totalVolume}
				{setsCompleted}
				{restRemainingMs}
				onstart={onStart}
				onopen={onOpen}
			/>
		</div>
	{/if}

	<CollapsibleCard label="Calories" value={calorieValue} collapsed={active}>
		{@render calorieCard()}
	</CollapsibleCard>

	<CollapsibleCard label="Weight" value={weightValue} collapsed={active}>
		{@render weightCard()}
	</CollapsibleCard>

	{#if !active}
		<div transition:fade>
			<WorkoutModule {active} onstart={onStart} onopen={onOpen} />
		</div>
	{/if}
</div>
