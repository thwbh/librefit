<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, AlertType, AlertVariant, ModalDialog, ValidatedInput } from '@thwbh/veilchen';
	import { Plus, Trash, ArrowUp, ArrowDown, ArrowsClockwise } from 'phosphor-svelte';
	import ExercisePicker from './ExercisePicker.svelte';
	import {
		createWorkoutTemplate,
		updateWorkoutTemplate,
		createCommandHooks,
		type ExerciseDetail,
		type TemplateDetail,
		type TemplateInput
	} from '$lib/api';
	import { reportError } from '$lib/api/report-error';

	// Build / edit a workout template (WO-037). Name + description + an ordered list of
	// exercises, each with optional target reps (a range like "8-12"), target weight,
	// and notes. Exercises are added and swapped through a bottom-sheet picker (WO-039,
	// `_conv-modals`); order is the list order (move up/down). Predefined templates never
	// reach here — the list clones them into an editable copy first (WO-038).
	interface Props {
		mode: 'create' | 'edit';
		detail?: TemplateDetail | null;
		onsaved: (detail: TemplateDetail) => void;
		onclose: () => void;
	}

	let { mode, detail = null, onsaved, onclose }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

	// The nested picker is its own <dialog>; ModalDialog doesn't self-open, so it must
	// be shown via showModal() once it mounts (like the builder above), otherwise it
	// stays display:none and "Add exercise" appears to do nothing.
	let pickerDialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (pickerDialog && !pickerDialog.open) pickerDialog.showModal();
	});

	interface DraftExercise {
		exerciseId: number;
		name: string;
		targetReps: string;
		targetWeight: string;
		notes: string;
	}

	// Pre-fill once from the prop (the modal is remounted per template).
	let name = $state(untrack(() => detail?.template.name ?? ''));
	let description = $state(untrack(() => detail?.template.description ?? ''));
	let exercises = $state<DraftExercise[]>(
		untrack(() =>
			(detail?.exercises ?? []).map((e) => ({
				exerciseId: e.exerciseId,
				name: e.name,
				targetReps: e.targetReps ?? '',
				targetWeight: e.targetWeightKg != null ? String(e.targetWeightKg) : '',
				notes: e.notes ?? ''
			}))
		)
	);

	// The bottom-sheet picker target: appending, or swapping the row at `index`.
	let picking = $state<{ index: number } | 'add' | null>(null);
	let error = $state<string | null>(null);
	let busy = $state(false);

	const heading = $derived(mode === 'create' ? 'New Template' : 'Edit Template');

	function onPicked(ex: ExerciseDetail) {
		const row: DraftExercise = {
			exerciseId: ex.id,
			name: ex.name,
			targetReps: '',
			targetWeight: '',
			notes: ''
		};
		if (picking === 'add') {
			exercises = [...exercises, row];
		} else if (picking && typeof picking === 'object') {
			// Swap in place, preserving the entry's targets/notes and position (WO-039).
			const i = picking.index;
			exercises = exercises.map((e, idx) =>
				idx === i ? { ...e, exerciseId: ex.id, name: ex.name } : e
			);
		}
		picking = null;
	}

	function remove(i: number) {
		exercises = exercises.filter((_, idx) => idx !== i);
	}

	function move(i: number, delta: number) {
		const j = i + delta;
		if (j < 0 || j >= exercises.length) return;
		const next = [...exercises];
		[next[i], next[j]] = [next[j], next[i]];
		exercises = next;
	}

	function buildInput(): TemplateInput {
		return {
			name: name.trim(),
			description: description.trim() || undefined,
			exercises: exercises.map((e) => {
				// The weight field binds as a string; parse defensively (it can also
				// arrive as a number/null depending on the input) and drop non-numbers.
				const weight = parseFloat(String(e.targetWeight ?? '').trim());
				return {
					exerciseId: e.exerciseId,
					targetReps: e.targetReps.trim() || undefined,
					targetWeightKg: Number.isFinite(weight) ? weight : undefined,
					notes: e.notes.trim() || undefined
				};
			})
		};
	}

	const okHooks = (successMessage: string) =>
		createCommandHooks({ successMessage, showInvokeErrors: false, showValidationErrors: false });

	async function save() {
		if (busy) return;
		if (!name.trim()) return (error = 'A name is required.');
		if (exercises.length === 0) return (error = 'Add at least one exercise.');
		error = null;
		busy = true;
		try {
			const input = buildInput();
			const result =
				mode === 'create'
					? await createWorkoutTemplate({ input }, okHooks('Template created'))
					: await updateWorkoutTemplate(
							{ id: detail!.template.id, input },
							okHooks('Template updated')
						);
			onsaved(result);
			onclose();
		} catch (e) {
			error = reportError(e);
		} finally {
			busy = false;
		}
	}
</script>

<div class="template-form-modal">
	<ModalDialog bind:dialog oncancel={onclose}>
		{#snippet title()}
			<span class="modal-header border-l-4 border-accent pl-2">{heading}</span>
		{/snippet}

		{#snippet content()}
			<div class="flex flex-col gap-3">
				<ValidatedInput
					label="Name"
					type="text"
					placeholder="e.g. Upper Body A"
					maxlength={80}
					required
					bind:value={name}
					data-testid="template-name"
				>
					A name is required (up to 80 characters).
				</ValidatedInput>

				<ValidatedInput
					label="Description (optional)"
					type="text"
					placeholder="e.g. Heavy compound focus"
					bind:value={description}
					data-testid="template-description"
				/>

				<div class="flex flex-col gap-1">
					<span class="text-sm font-medium">Exercises</span>
					{#if exercises.length === 0}
						<p class="text-xs opacity-60">No exercises yet — add one below.</p>
					{/if}
					<ul class="flex flex-col gap-2" data-testid="template-exercise-list">
						{#each exercises as ex, i (i)}
							<li
								class="rounded-box border border-base-200 p-2"
								data-testid="template-exercise-row"
							>
								<div class="flex items-center gap-2">
									<span class="flex-1 font-medium">{ex.name}</span>
									<button
										class="btn btn-ghost btn-xs"
										aria-label={`Move ${ex.name} up`}
										disabled={i === 0}
										onclick={() => move(i, -1)}><ArrowUp size="1rem" /></button
									>
									<button
										class="btn btn-ghost btn-xs"
										aria-label={`Move ${ex.name} down`}
										disabled={i === exercises.length - 1}
										onclick={() => move(i, 1)}><ArrowDown size="1rem" /></button
									>
									<button
										class="btn btn-ghost btn-xs"
										aria-label={`Swap ${ex.name}`}
										onclick={() => (picking = { index: i })}
										data-testid="swap-exercise"><ArrowsClockwise size="1rem" /></button
									>
									<button
										class="btn btn-ghost btn-xs text-error"
										aria-label={`Remove ${ex.name}`}
										onclick={() => remove(i)}><Trash size="1rem" /></button
									>
								</div>
								<div class="mt-2 flex gap-2">
									<input
										class="input input-bordered input-sm w-full"
										placeholder="Reps (e.g. 8-12)"
										aria-label={`Target reps for ${ex.name}`}
										bind:value={ex.targetReps}
									/>
									<input
										type="text"
										inputmode="decimal"
										class="input input-bordered input-sm w-24"
										placeholder="kg"
										aria-label={`Target weight for ${ex.name}`}
										bind:value={ex.targetWeight}
									/>
								</div>
							</li>
						{/each}
					</ul>
					<button
						class="btn btn-outline btn-sm mt-1 justify-start gap-2"
						onclick={() => (picking = 'add')}
						data-testid="add-template-exercise"
					>
						<Plus size="1rem" /> Add exercise
					</button>
				</div>

				{#if error}
					<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>{error}</AlertBox>
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<button class="btn btn-ghost" disabled={busy} onclick={onclose}>Cancel</button>
			<button class="btn btn-primary" disabled={busy} onclick={save} data-testid="save-template">
				{mode === 'create' ? 'Create' : 'Save'}
			</button>
		{/snippet}
	</ModalDialog>
</div>

{#if picking}
	<div class="template-picker-sheet">
		<ModalDialog
			bind:dialog={pickerDialog}
			oncancel={() => {
				picking = null;
			}}
		>
			{#snippet title()}
				<span class="modal-header border-l-4 border-accent pl-2">
					{picking === 'add' ? 'Add exercise' : 'Swap exercise'}
				</span>
			{/snippet}
			{#snippet content()}
				<ExercisePicker onpick={onPicked} allowQuickAdd={false} />
			{/snippet}
			{#snippet footer()}
				<button class="btn btn-ghost" onclick={() => (picking = null)}>Cancel</button>
			{/snippet}
		</ModalDialog>
	</div>
{/if}
