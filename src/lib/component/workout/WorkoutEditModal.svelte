<script lang="ts">
	import { ModalDialog } from '@thwbh/veilchen';
	import ExercisePicker from './ExercisePicker.svelte';
	import SetMask from './SetMask.svelte';
	import {
		addWorkoutSet,
		createWorkoutForDate,
		deleteWorkoutSet,
		updateWorkoutSet,
		type ExerciseDetail,
		type LiftingSetMetrics,
		type WorkoutDetail
	} from '$lib/api';
	import { prefillFromPrevious } from '$lib/workout/metrics';
	import { parseStringAsDate } from '$lib/date';
	import { Plus, Pencil, Trash } from 'phosphor-svelte';

	// Flat-CRUD workout editor (design Decision 5): add / edit / delete exercises and
	// sets with no rest timers or live-session controls. Used for adding a workout to
	// a past date ([HI-022]) and editing a completed one in place ([HI-020]) — never
	// resumes the session. In create mode the session is created lazily on the first
	// set (via create_workout_for_date), so cancelling without logging persists nothing.
	interface Props {
		mode: 'create' | 'edit';
		/** create: the historical date (yyyy-MM-dd) the workout is logged for. */
		dateStr?: string;
		/** edit: the existing completed workout. */
		detail?: WorkoutDetail | null;
		/** Called after any persisted change so the caller can refresh. */
		onsaved?: (detail: WorkoutDetail | null) => void;
		onclose: () => void;
	}

	let { mode, dateStr, detail = null, onsaved, onclose }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	let current = $state<WorkoutDetail | null>(detail);
	let name = $state(detail?.session.name ?? '');
	let error = $state<string | null>(null);

	// One transient panel drives both "add set" and "edit set"; null = closed.
	type SetEntry = {
		exerciseId: number;
		name: string;
		reps: number;
		weightKg: number;
		editingSetId?: number;
	};
	let setEntry = $state<SetEntry | null>(null);
	let pickerOpen = $state(false);

	const heading = $derived(mode === 'create' ? 'Add Workout' : 'Edit Workout');

	/** Noon (local) on the target day → lands squarely on that calendar day in UTC. */
	function noonOf(d: string): string {
		const date = parseStringAsDate(d);
		date.setHours(12, 0, 0, 0);
		return date.toISOString();
	}

	async function run(fn: () => Promise<WorkoutDetail>) {
		try {
			error = null;
			current = await fn();
			onsaved?.(current);
		} catch (e) {
			error = String(e);
		}
	}

	async function submitSet(metrics: LiftingSetMetrics) {
		const entry = setEntry;
		if (!entry) return;
		if (entry.editingSetId != null) {
			await run(() => updateWorkoutSet({ setId: entry.editingSetId!, metrics }));
		} else {
			await run(async () => {
				// Create the session on first set so an abandoned editor persists nothing.
				if (!current) {
					current = await createWorkoutForDate({
						startedAt: noonOf(dateStr ?? ''),
						name: name.trim() || undefined
					});
				}
				return addWorkoutSet({
					sessionId: current.session.id,
					exerciseId: entry.exerciseId,
					metrics
				});
			});
		}
		setEntry = null;
	}

	async function removeSet(setId: number) {
		await run(() => deleteWorkoutSet({ setId }));
	}

	function openAddExercise(exercise: ExerciseDetail) {
		pickerOpen = false;
		setEntry = { exerciseId: exercise.id, name: exercise.name, reps: 8, weightKg: 20 };
	}

	function openAddSet(ex: WorkoutDetail['exercises'][number]) {
		const prefill = prefillFromPrevious(ex);
		setEntry = {
			exerciseId: ex.exerciseId,
			name: ex.name,
			reps: prefill?.reps ?? 8,
			weightKg: prefill?.weightKg ?? 20
		};
	}

	function openEditSet(
		ex: WorkoutDetail['exercises'][number],
		set: { id: number; metrics: LiftingSetMetrics }
	) {
		setEntry = {
			exerciseId: ex.exerciseId,
			name: ex.name,
			reps: set.metrics.reps,
			weightKg: set.metrics.weightKg,
			editingSetId: set.id
		};
	}
</script>

<ModalDialog bind:dialog oncancel={onclose}>
	{#snippet title()}
		<span class="border-l-4 border-accent pl-2">{heading}</span>
	{/snippet}

	{#snippet content()}
		<div class="flex flex-col gap-4">
			{#if mode === 'create'}
				<label class="floating-label">
					<span>Name (optional)</span>
					<input
						class="input input-bordered w-full"
						placeholder="e.g. Push Day"
						bind:value={name}
					/>
				</label>
			{/if}

			{#if error}
				<p class="text-sm text-error" role="alert">{error}</p>
			{/if}

			{#if current && current.exercises.length > 0}
				<ul class="flex flex-col gap-2">
					{#each current.exercises as ex (ex.id)}
						<li class="rounded-box border border-base-200 p-3">
							<div class="mb-2 flex items-center justify-between">
								<span class="font-semibold">{ex.name}</span>
								<button class="btn btn-ghost btn-xs" onclick={() => openAddSet(ex)}>
									<Plus size="1rem" /> Set
								</button>
							</div>
							<ul class="flex flex-col gap-1">
								{#each ex.sets as set (set.id)}
									<li class="flex items-center justify-between gap-2 text-sm">
										<span class="tabular-nums">{set.metrics.reps} × {set.metrics.weightKg} kg</span>
										<span class="flex gap-1">
											<button
												class="btn btn-ghost btn-xs"
												aria-label="Edit set"
												onclick={() => openEditSet(ex, set)}
											>
												<Pencil size="1rem" />
											</button>
											<button
												class="btn btn-ghost btn-xs text-error"
												aria-label="Delete set"
												onclick={() => removeSet(set.id)}
											>
												<Trash size="1rem" />
											</button>
										</span>
									</li>
								{/each}
							</ul>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm opacity-60">No exercises yet — add one to start logging sets.</p>
			{/if}

			{#if setEntry}
				<div class="rounded-box bg-base-200 p-3">
					<p class="mb-2 text-sm font-medium">
						{setEntry.editingSetId != null ? 'Edit set' : 'Add set'} · {setEntry.name}
					</p>
					<SetMask
						reps={setEntry.reps}
						weightKg={setEntry.weightKg}
						submitLabel={setEntry.editingSetId != null ? 'Save set' : 'Add set'}
						onsubmit={submitSet}
					/>
					<button class="btn btn-ghost btn-sm mt-2 w-full" onclick={() => (setEntry = null)}>
						Cancel
					</button>
				</div>
			{:else if pickerOpen}
				<div class="rounded-box bg-base-200 p-3">
					<ExercisePicker onpick={openAddExercise} />
					<button class="btn btn-ghost btn-sm mt-2 w-full" onclick={() => (pickerOpen = false)}>
						Cancel
					</button>
				</div>
			{:else}
				<button class="btn btn-neutral w-full" onclick={() => (pickerOpen = true)}>
					<Plus size="1.25rem" /> Add exercise
				</button>
			{/if}
		</div>
	{/snippet}

	{#snippet footer()}
		<button class="btn btn-primary" onclick={onclose}>Done</button>
	{/snippet}
</ModalDialog>
