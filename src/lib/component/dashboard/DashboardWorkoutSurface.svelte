<script lang="ts">
	import WorkoutSummaryCard from '$lib/component/workout/WorkoutSummaryCard.svelte';
	import type { WorkoutDetail } from '$lib/api';

	// The dashboard's idle workout surface: today's completed workouts as cards
	// (DH-013), with loading (DH-017) and error+retry (DH-018) states. Presentational
	// — fetching/refresh is owned by the page. On error any already-loaded cards stay
	// visible below the banner (DH-018).
	interface Props {
		workouts: WorkoutDetail[];
		loading: boolean;
		error: string | null;
		ontap: (workout: WorkoutDetail) => void;
		onedit?: (workout: WorkoutDetail) => void;
		ondelete?: (workout: WorkoutDetail) => void;
		onretry: () => void;
	}

	let { workouts, loading, error, ontap, onedit, ondelete, onretry }: Props = $props();
</script>

{#if error}
	<div class="alert alert-error alert-soft mb-2" role="alert">
		<span>Couldn't load today's workouts.</span>
		<button class="btn btn-sm" onclick={onretry}>Retry</button>
	</div>
{/if}

{#if loading && workouts.length === 0}
	<div class="flex justify-center p-4">
		<span class="loading loading-spinner" aria-label="Loading workouts"></span>
	</div>
{:else}
	<div class="flex flex-col gap-2">
		{#each workouts as workout (workout.session.id)}
			<WorkoutSummaryCard detail={workout} {ontap} {onedit} {ondelete} />
		{/each}
	</div>
{/if}
