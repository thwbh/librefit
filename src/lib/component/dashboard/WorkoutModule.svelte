<script lang="ts">
	// The dashboard's workout surface. Idle: a Start Workout module (DH-001) that
	// begins a session on tap (WO-001). Active: promoted to the top in the
	// high-energy focus palette (DH-002) showing live derived metrics, or the
	// softer timer-centric recovery visual while resting (DH-007/008). Tapping the
	// active module reopens the overlay. Presentational — state comes from props.
	interface Props {
		active: boolean;
		resting?: boolean;
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
		class="workout-module workout-module--idle btn btn-block btn-primary btn-lg"
		onclick={onstart}
	>
		Start Workout
	</button>
{:else}
	<button
		class="workout-module workout-module--active w-full rounded-box p-4 text-left text-primary-content"
		class:workout-module--focus={!resting}
		class:workout-module--recovery={resting}
		class:bg-primary={!resting}
		class:bg-info={resting}
		data-visual={resting ? 'recovery' : 'focus'}
		onclick={onopen}
	>
		{#if resting}
			<div class="text-xs uppercase opacity-80">Resting</div>
			<div class="font-mono text-3xl tabular-nums">{fmt(restRemainingMs)}</div>
		{:else}
			<div class="text-xs uppercase opacity-80">Workout</div>
			<div class="flex gap-4">
				<span class="text-2xl font-bold tabular-nums">{fmt(activeWorkTimeMs)}</span>
				<span class="text-2xl font-bold tabular-nums">{totalVolume} kg</span>
				<span class="text-2xl font-bold tabular-nums">{setsCompleted} sets</span>
			</div>
		{/if}
	</button>
{/if}
