<script lang="ts">
	import { onMount } from 'svelte';
	import { ModalDialog } from '@thwbh/veilchen';
	import { workoutStore, type WorkoutStore } from '$lib/workout/workout-state.svelte';
	import type { ExerciseDetail, LiftingSetMetrics, WorkoutExerciseView } from '$lib/api';
	import SetMask from './SetMask.svelte';
	import ExercisePicker from './ExercisePicker.svelte';
	import RestTimer from './RestTimer.svelte';
	import SlideToConfirm from './SlideToConfirm.svelte';

	// Fullscreen workout overlay (`_conv-modals`, via veilchen's ModalDialog):
	// pick exercises, log/edit/delete sets, watch live derived metrics, rest
	// between sets, and end/discard via a slide-to-confirm gesture. Minimize
	// (ESC / Minimize) keeps the session running underneath. A set is logged
	// against a library exerciseId; the backend appends the exercise to the
	// workout on the first set (WO-003).
	interface Props {
		store?: WorkoutStore;
		open?: boolean;
		onminimize?: () => void;
	}

	let { store = workoutStore, open = true, onminimize }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	let pending = $state<ExerciseDetail | null>(null);
	let pickerOpen = $state(false);
	let editingSetId = $state<number | null>(null);

	const session = $derived(store.session);

	// Drive the native <dialog> from `open` + session presence.
	$effect(() => {
		if (!dialog) return;
		if (open && session && !dialog.open) dialog.showModal();
		else if ((!open || !session) && dialog.open) dialog.close();
	});

	onMount(() => {
		// Recompute active work time on app resume from persisted facts (WO-008/009).
		const onResume = () => store.tick();
		document.addEventListener('visibilitychange', onResume);
		window.addEventListener('focus', onResume);
		return () => {
			document.removeEventListener('visibilitychange', onResume);
			window.removeEventListener('focus', onResume);
		};
	});

	function fmtTime(ms: number): string {
		const total = Math.floor(ms / 1000);
		const m = Math.floor(total / 60);
		const s = total % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function pick(exercise: ExerciseDetail) {
		pending = exercise;
		pickerOpen = false;
	}

	async function logPending(metrics: LiftingSetMetrics) {
		if (!pending) return;
		await store.logSet(pending.id, metrics);
		pending = null;
	}

	async function logMore(ex: WorkoutExerciseView, metrics: LiftingSetMetrics) {
		await store.logSet(ex.exerciseId, metrics);
	}

	async function saveEdit(setId: number, metrics: LiftingSetMetrics) {
		await store.editSet(setId, metrics);
		editingSetId = null;
	}
</script>

<ModalDialog bind:dialog oncancel={onminimize}>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2">Workout</span>
		{#if onminimize}
			<button class="btn btn-xs" onclick={onminimize}>Minimize</button>
		{/if}
	{/snippet}

	{#snippet content()}
		{#if session}
			<div class="workout-overlay flex flex-col gap-4">
				<div class="flex justify-around rounded-box bg-base-200 p-3 text-center">
					<div>
						<div class="text-xs opacity-70">Time</div>
						<div class="text-xl font-bold tabular-nums">{fmtTime(store.activeWorkTimeMs)}</div>
					</div>
					<div>
						<div class="text-xs opacity-70">Volume</div>
						<div class="text-xl font-bold tabular-nums">{store.totalVolume} kg</div>
					</div>
					<div>
						<div class="text-xs opacity-70">Sets</div>
						<div class="text-xl font-bold tabular-nums">{store.setsCompleted}</div>
					</div>
				</div>

				{#if store.restRemainingMs > 0}
					<RestTimer remainingMs={store.restRemainingMs} ondismiss={() => store.dismissRest()} />
				{/if}

				{#each session.exercises as ex (ex.id)}
					{@const prefill = store.prefill(ex)}
					<div class="rounded-box border border-base-300 p-3">
						<h3 class="font-semibold">{ex.name}</h3>
						<ul class="my-2 flex flex-col gap-1">
							{#each ex.sets as set (set.id)}
								<li class="flex items-center justify-between gap-2 text-sm">
									{#if editingSetId === set.id}
										<SetMask
											reps={set.metrics.reps}
											weightKg={set.metrics.weightKg}
											submitLabel="Save"
											onsubmit={(m) => saveEdit(set.id, m)}
										/>
									{:else}
										<span class="tabular-nums">{set.metrics.reps} × {set.metrics.weightKg} kg</span>
										<span class="flex gap-1">
											<button class="btn btn-ghost btn-xs" onclick={() => (editingSetId = set.id)}>
												Edit
											</button>
											<button
												class="btn btn-ghost btn-xs text-error"
												onclick={() => store.deleteSet(set.id)}
											>
												Delete
											</button>
										</span>
									{/if}
								</li>
							{/each}
						</ul>
						<SetMask
							reps={prefill?.reps ?? 8}
							weightKg={prefill?.weightKg ?? 20}
							onsubmit={(m) => logMore(ex, m)}
						/>
					</div>
				{/each}

				{#if pending}
					<div class="rounded-box border border-primary p-3">
						<h3 class="font-semibold">{pending.name}</h3>
						<SetMask onsubmit={logPending} />
					</div>
				{/if}

				{#if pickerOpen}
					<ExercisePicker onpick={pick} />
				{:else}
					<button class="btn btn-block" onclick={() => (pickerOpen = true)}>Add exercise</button>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet footer()}
		<div class="flex w-full flex-col gap-2">
			{#if store.paused}
				<button class="btn btn-primary" onclick={() => store.resume()}>Resume</button>
			{:else}
				<button class="btn btn-ghost" onclick={() => store.pause()}>Pause</button>
			{/if}
			<SlideToConfirm label="Slide to end" onconfirm={() => store.end()} />
			<SlideToConfirm label="Slide to discard" variant="danger" onconfirm={() => store.discard()} />
		</div>
	{/snippet}
</ModalDialog>
