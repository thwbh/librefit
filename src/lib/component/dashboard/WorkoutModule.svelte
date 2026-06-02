<script lang="ts">
	import { Barbell } from 'phosphor-svelte';

	// The dashboard's workout surface. Idle: a dashed "Start Workout" affordance
	// (deliberately distinct from the solid FAB) that begins a session on tap
	// (DH-001, WO-001). Active: promoted to the top in the high-energy focus
	// palette (DH-002) showing the current exercise + live derived metrics; while
	// resting it keeps those stats and adds the rest countdown (DH-007/008).
	// Tapping the active module reopens the overlay. Presentational — state comes
	// from props.
	interface Props {
		active: boolean;
		resting?: boolean;
		currentExercise?: string | null;
		activeWorkTimeMs?: number;
		totalVolume?: number;
		setsCompleted?: number;
		restRemainingMs?: number;
		onstart: () => void;
		onopen: () => void;
	}

	let {
		active,
		resting = false,
		currentExercise = null,
		activeWorkTimeMs = 0,
		totalVolume = 0,
		setsCompleted = 0,
		restRemainingMs = 0,
		onstart,
		onopen
	}: Props = $props();

	function fmt(ms: number): string {
		const total = Math.floor(ms / 1000);
		const m = Math.floor(total / 60);
		const s = total % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

{#if !active}
	<button
		class="workout-module workout-module--idle btn btn-block btn-lg btn-outline border-2 border-dashed"
		onclick={onstart}
	>
		<Barbell size="1.5rem" />
		Start Workout
	</button>
{:else}
	<button
		class="workout-module workout-module--active w-full rounded-box p-4 text-left"
		class:bg-primary={!resting}
		class:text-primary-content={!resting}
		class:bg-accent={resting}
		class:text-accent-content={resting}
		data-visual={resting ? 'recovery' : 'focus'}
		onclick={onopen}
	>
		<div class="flex items-center justify-between">
			<span class="text-xs uppercase tracking-wide opacity-80">
				{resting ? 'Resting' : 'Workout'}
			</span>
			{#if resting}
				<span class="font-mono text-lg tabular-nums">{fmt(restRemainingMs)}</span>
			{/if}
		</div>

		<div class="mt-0.5 truncate text-lg font-bold">
			{currentExercise ?? 'No exercise yet'}
		</div>

		<div class="mt-1 flex gap-4 text-sm tabular-nums opacity-90">
			<span>{fmt(activeWorkTimeMs)}</span>
			<span>{totalVolume} kg</span>
			<span>{setsCompleted} sets</span>
		</div>
	</button>
{/if}
