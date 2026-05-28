<script lang="ts">
	import type { NewWeightTracker, WeightTracker } from '$lib/api';
	import { NewWeightTrackerSchema } from '$lib/api/gen/types';
	import { convertDateStrToDisplayDateStr, display_date_format, getDateAsStr } from '$lib/date';
	import { useFieldValidity } from '$lib/composition/useFieldValidity.svelte';
	import { AlertBox, AlertType, AlertVariant, ModalDialog, NumberStepper } from '@thwbh/veilchen';

	interface Props {
		dialog?: HTMLDialogElement;
		entry: NewWeightTracker | WeightTracker | null | undefined;
		errorMessage?: string;
		min?: number;
		max?: number;
		incrementSteps?: number[];
		decrementSteps?: number[];
		onsave: (event?: Event) => Promise<boolean> | boolean | void;
		oncancel: () => void;
	}

	let {
		dialog = $bindable(),
		entry = $bindable(),
		errorMessage,
		min = 30,
		max = 330,
		incrementSteps = [0.5, 1, 2, 5],
		decrementSteps = [0.5, 1, 2, 5],
		onsave,
		oncancel
	}: Props = $props();

	const dateLabel = $derived(
		entry?.added
			? convertDateStrToDisplayDateStr(entry.added)
			: getDateAsStr(new Date(), display_date_format)
	);

	// Per [VAL-012] / [VAL-013]: track the *displayed* input value's validity
	// independently from entry.amount, so the message and Save gate react to
	// what the user sees, not to whatever stale value happens to be bound
	// (e.g. NumberStepper silently skips NaN, leaving entry.amount unchanged
	// while the input visually shows empty).
	//
	// Per [VAL-014]: drive the message off the generated Zod schema so the
	// frontend hint and any later backend rejection produce the same string.
	const amountSchema = NewWeightTrackerSchema.shape.amount;
	const validity = useFieldValidity({
		matches: 'input[type="number"]',
		// Also revalidate when entry.amount changes via paths that don't fire
		// an input event (NumberStepper's +/- buttons mutate `value` directly).
		source: () => entry?.amount,
		validate: (value) => {
			const result = amountSchema.safeParse(value);
			return result.success ? { ok: true } : { ok: false, message: result.error.issues[0].message };
		}
	});

	// Save is no longer pre-emptively disabled. We let the user click it and
	// gate the actual save behind `validity.attempt()`; on the first invalid
	// attempt of a "still invalid" period we shake to draw attention and let
	// the AlertBox reveal itself (see [VAL-012] / [VAL-013] convention).

	// Shake the Save button on the first attempt of each "still invalid" period.
	// `shaken` resets when the value goes back to valid so a subsequent
	// invalid-attempt can shake again. `shakeKey` is keyed in the template via
	// `{#key shakeKey}` so the CSS animation replays on each new shake.
	let shaken = $state(false);
	let shakeKey = $state(0);

	$effect(() => {
		if (validity.displayValid) shaken = false;
	});

	// Reset deferred-validation state when the modal opens with a fresh entry.
	// See IntakeModal for the rationale — `useEntryModal` nulls the entry after
	// save/cancel and assigns a new blank one on openCreate/openEdit, and we
	// must not carry over a sticky hasAttempted into the next session.
	let lastEntryPresent = false;
	$effect(() => {
		const present = !!entry;
		if (present && !lastEntryPresent) {
			validity.reset();
			shaken = false;
		}
		lastEntryPresent = present;
	});

	function handleSaveClick(event?: Event) {
		if (validity.attempt()) {
			onsave(event);
			return;
		}
		if (!shaken) {
			shaken = true;
			shakeKey++;
		}
	}
</script>

<ModalDialog bind:dialog onconfirm={handleSaveClick} {oncancel}>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2">Set Weight</span>
		<span class="text-xs opacity-70">{dateLabel}</span>
	{/snippet}

	{#snippet content()}
		<fieldset class="fieldset rounded-box" oninput={validity.handleInput}>
			{#if entry}
				<NumberStepper
					bind:value={entry.amount}
					label="Current Weight"
					unit="kg"
					required
					{min}
					{max}
					{incrementSteps}
					{decrementSteps}
					initialIncrementStep={1}
					initialDecrementStep={1}
					showLeftWheel={false}
				/>
			{/if}
			{#if errorMessage || validity.showError}
				<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>
					{errorMessage ?? validity.errorMessage}
				</AlertBox>
			{/if}
		</fieldset>
	{/snippet}

	{#snippet footer()}
		{#key shakeKey}
			<button
				class="btn btn-primary save-button"
				class:shake={shakeKey > 0}
				onclick={handleSaveClick}
			>
				Save
			</button>
		{/key}
		<button class="btn" onclick={oncancel}>Cancel</button>
	{/snippet}
</ModalDialog>

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-6px);
		}
		40%,
		80% {
			transform: translateX(6px);
		}
	}

	.save-button.shake {
		animation: shake 0.3s ease-in-out;
	}
</style>
