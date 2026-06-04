<script lang="ts">
	import { ModalDialog } from '@thwbh/veilchen';
	import type { WorkoutDetail } from '$lib/api';
	import {
		workoutActiveMinutes,
		workoutSets,
		workoutStartTime,
		workoutTitle,
		workoutVolume
	} from '$lib/workout/history';
	import { Pencil, Trash } from 'phosphor-svelte';

	// Read-only detail of a completed workout ([HI-019]): all exercises, sets, and
	// metrics, plus the summary numbers. Edit routes to the flat-CRUD editor; delete
	// removes the workout ([HI-021]). Completed workouts are edited in place, never
	// resumed (design Decision 5).
	interface Props {
		detail: WorkoutDetail;
		onedit?: (detail: WorkoutDetail) => void;
		ondelete?: (detail: WorkoutDetail) => void;
		onclose: () => void;
	}

	let { detail, onedit, ondelete, onclose }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	const heading = $derived(workoutTitle(detail));
	const startTime = $derived(workoutStartTime(detail));
	const minutes = $derived(workoutActiveMinutes(detail));
	const volume = $derived(workoutVolume(detail));
	const sets = $derived(workoutSets(detail));
</script>

<ModalDialog bind:dialog oncancel={onclose}>
	{#snippet title()}
		<span class="border-l-4 border-accent pl-2">{heading} · {startTime}</span>
	{/snippet}

	{#snippet content()}
		<div class="flex flex-col gap-6">
			<dl class="grid grid-cols-3 gap-4 text-center">
				<div>
					<dt class="text-xs opacity-70">Volume</dt>
					<dd class="text-2xl font-bold tabular-nums">{volume} kg</dd>
				</div>
				<div>
					<dt class="text-xs opacity-70">Active</dt>
					<dd class="text-2xl font-bold tabular-nums">{minutes}m</dd>
				</div>
				<div>
					<dt class="text-xs opacity-70">Sets</dt>
					<dd class="text-2xl font-bold tabular-nums">{sets}</dd>
				</div>
			</dl>

			{#if detail.exercises.length > 0}
				<ul class="overflow-hidden rounded-box border border-base-200">
					{#each detail.exercises as ex (ex.id)}
						<li class="flex flex-col gap-1 border-b border-base-200 p-3 last:border-b-0">
							<div class="flex items-center justify-between">
								<span class="font-semibold">{ex.name}</span>
								<span class="text-xs opacity-60">
									{ex.sets.length}
									{ex.sets.length === 1 ? 'set' : 'sets'}
								</span>
							</div>
							<div class="flex flex-wrap gap-1">
								{#each ex.sets as s (s.id)}
									<span class="badge badge-ghost badge-sm tabular-nums">
										{s.metrics.reps} × {s.metrics.weightKg} kg
									</span>
								{/each}
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-center text-sm opacity-60">No exercises logged.</p>
			{/if}
		</div>
	{/snippet}

	{#snippet footer()}
		<button class="btn btn-ghost" onclick={onclose}>Close</button>
		<button class="btn btn-ghost text-error" onclick={() => ondelete?.(detail)}>
			<Trash size="1.25rem" /> Delete
		</button>
		<button class="btn btn-primary" onclick={() => onedit?.(detail)}>
			<Pencil size="1.25rem" /> Edit
		</button>
	{/snippet}
</ModalDialog>
