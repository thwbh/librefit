<script lang="ts">
	import { onMount } from 'svelte';
	import { ModalDialog, SwipeableListItem } from '@thwbh/veilchen';
	import { Pencil, Trash, Plus } from 'phosphor-svelte';
	import { workoutStore, type WorkoutStore } from '$lib/workout/workout-state.svelte';
	import type { ExerciseDetail, LiftingSetMetrics } from '$lib/api';
	import SetMask from './SetMask.svelte';
	import ExercisePicker from './ExercisePicker.svelte';
	import RestTimer from './RestTimer.svelte';
	import SlideToConfirm from './SlideToConfirm.svelte';

	// Fullscreen workout overlay (`_conv-modals`, via veilchen's ModalDialog).
	// Header pinned top, scrolling content, footer (Pause + slide-to-end/discard)
	// pinned bottom. The active set-entry stays at the top of the content with the
	// rest timer just below it; completed exercises pile up underneath so the
	// entry control never moves. A single "Start Set" flow (pick an exercise →
	// enter reps/weight → Log) is the only way to add work, so there's never more
	// than one open entry form. A set is logged against a library exerciseId; the
	// backend appends the exercise on its first set.
	interface Props {
		store?: WorkoutStore;
		open?: boolean;
		onminimize?: () => void;
	}

	let { store = workoutStore, open = true, onminimize }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	let editingSetId = $state<number | null>(null);

	// Single-entry flow: 'none' → tap Start Set → 'log' (with a default exercise)
	// or 'pick' (choose one) → log sets → Done.
	let entryStep = $state<'none' | 'pick' | 'log'>('none');
	let entryExercise = $state<{ id: number; name: string } | null>(null);

	const session = $derived(store.session);

	// The session row backing the entry exercise (for prefill from its last set).
	const entrySessionEx = $derived.by(() => {
		const ex = entryExercise;
		if (!session || !ex) return undefined;
		return session.exercises.find((e) => e.exerciseId === ex.id);
	});
	const entryPrefill = $derived(entrySessionEx ? store.prefill(entrySessionEx) : null);

	// Pinned-header context: the exercise being worked on + the set number in
	// progress (the set about to be logged), so the active set stays visible even
	// as completed work scrolls below. The stats card stays pinned in the header.
	const headerName = $derived(
		entryStep === 'log' && entryExercise
			? entryExercise.name
			: (store.currentExercise?.name ?? null)
	);
	const headerSet = $derived(
		entryStep === 'log' && entryExercise
			? (entrySessionEx?.sets.length ?? 0) + 1
			: (store.currentExercise?.sets.length ?? 0)
	);

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

	function startSet() {
		// Default to the exercise being worked on for fast consecutive sets;
		// otherwise prompt a pick.
		const current = store.currentExercise;
		if (current) {
			entryExercise = { id: current.exerciseId, name: current.name };
			entryStep = 'log';
		} else {
			entryStep = 'pick';
		}
	}

	function pick(exercise: ExerciseDetail) {
		entryExercise = { id: exercise.id, name: exercise.name };
		entryStep = 'log';
	}

	function finishEntry() {
		entryStep = 'none';
		entryExercise = null;
	}

	// Cancelling the picker returns to the set in progress when we got here via
	// "Change"; only a picker opened with no exercise yet abandons the entry.
	function cancelPick() {
		if (entryExercise) entryStep = 'log';
		else finishEntry();
	}

	async function logEntry(metrics: LiftingSetMetrics) {
		if (!entryExercise) return;
		await store.logSet(entryExercise.id, metrics);
		// Stay in 'log' so the next set of the same exercise is one tap away;
		// the form re-keys below to prefill from the set just logged.
	}

	async function saveEdit(setId: number, metrics: LiftingSetMetrics) {
		await store.editSet(setId, metrics);
		editingSetId = null;
	}
</script>

<div class="workout-modal">
	<ModalDialog bind:dialog oncancel={onminimize}>
		{#snippet title()}
			<div class="flex w-full flex-col gap-2">
				<div class="flex items-center justify-between gap-2">
					<span class="modal-header border-l-4 border-accent pl-2 leading-tight">
						<span class="block truncate font-semibold">{headerName ?? 'Workout'}</span>
						{#if headerName && headerSet > 0}
							<span class="text-xs font-normal opacity-60">Set {headerSet}</span>
						{/if}
					</span>
					{#if onminimize}
						<button class="btn btn-xs shrink-0" onclick={onminimize}>Minimize</button>
					{/if}
				</div>
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
			</div>
		{/snippet}

		{#snippet content()}
			{#if session}
				<div class="workout-overlay flex flex-col gap-4">
					<!-- Active set entry — kept at the top so completed sets never push it down -->
					{#if entryStep === 'pick'}
						<div class="rounded-box border border-primary p-3">
							<ExercisePicker onpick={pick} />
							<button class="btn btn-ghost btn-sm mt-2" onclick={cancelPick}>Cancel</button>
						</div>
					{:else if entryStep === 'log' && entryExercise}
						<div class="rounded-box border border-primary p-3">
							<div class="mb-2 flex items-center justify-between">
								<h3 class="font-semibold">{entryExercise.name}</h3>
								<span class="flex gap-1">
									<button class="btn btn-ghost btn-xs" onclick={() => (entryStep = 'pick')}>
										Change
									</button>
									<button class="btn btn-ghost btn-xs" onclick={finishEntry}>Done</button>
								</span>
							</div>
							{#key `${entryExercise.id}:${entrySessionEx?.sets.length ?? 0}`}
								<SetMask
									reps={entryPrefill?.reps ?? 8}
									weightKg={entryPrefill?.weightKg ?? 20}
									onsubmit={logEntry}
								/>
							{/key}
						</div>
					{:else}
						<button class="btn btn-primary btn-block" onclick={startSet}>
							<Plus size="1.25rem" />
							Start Set
						</button>
					{/if}

					<!-- Rest timer: below the active set, above the completed work -->
					{#if store.restRemainingMs > 0}
						<RestTimer remainingMs={store.restRemainingMs} ondismiss={() => store.dismissRest()} />
					{/if}

					<!-- Completed exercises: read-only swipeable summaries (pushed down) -->
					{#each session.exercises as ex (ex.id)}
						<div class="rounded-box border border-base-300 p-3">
							<h3 class="font-semibold">{ex.name}</h3>
							<div class="my-2 overflow-hidden rounded-box border border-base-200">
								{#each ex.sets as set, i (set.id)}
									{#if editingSetId === set.id}
										<div class="flex flex-col gap-1 p-2 {i > 0 ? 'border-t border-base-200' : ''}">
											<SetMask
												reps={set.metrics.reps}
												weightKg={set.metrics.weightKg}
												submitLabel="Save"
												onsubmit={(m) => saveEdit(set.id, m)}
											/>
											<button class="btn btn-ghost btn-xs" onclick={() => (editingSetId = null)}>
												Cancel
											</button>
										</div>
									{:else}
										<!-- Swipe right → edit, swipe left → delete (app gesture convention). -->
										<SwipeableListItem
											onleft={() => {
												editingSetId = set.id;
											}}
											onright={() => store.deleteSet(set.id)}
										>
											{#snippet leftAction()}
												<span><Pencil size="1.5rem" color={'var(--color-primary)'} /></span>
											{/snippet}
											{#snippet rightAction()}
												<span><Trash size="1.5rem" color={'var(--color-error)'} /></span>
											{/snippet}
											<div
												class="flex items-center justify-between bg-base-100 px-3 py-2 text-sm {i >
												0
													? 'border-t border-base-200'
													: ''}"
											>
												<span class="tabular-nums"
													>{set.metrics.reps} × {set.metrics.weightKg} kg</span
												>
												<span class="text-xs opacity-50">Set {i + 1}</span>
											</div>
										</SwipeableListItem>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
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
				<SlideToConfirm
					label="Slide to discard"
					variant="danger"
					onconfirm={() => store.discard()}
				/>
			</div>
		{/snippet}
	</ModalDialog>
</div>

<style>
	/* Fullscreen modal (per design — "fullscreen modal overlay over the
	   dashboard"). Scoped so other ModalDialogs keep their default sizing.
	   The .modal-box is a flex column: header (child 1) and footer (child 3)
	   stay put while the content (child 2) fills and scrolls. */
	.workout-modal :global(.modal-box) {
		width: 100%;
		max-width: 100%;
		height: 100%;
		max-height: 100%;
		border-radius: 0;
	}
	.workout-modal :global(.modal-box > :nth-child(1)) {
		flex: 0 0 auto;
	}
	.workout-modal :global(.modal-box > :nth-child(2)) {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}
	.workout-modal :global(.modal-box > :nth-child(3)) {
		flex: 0 0 auto;
	}
</style>
