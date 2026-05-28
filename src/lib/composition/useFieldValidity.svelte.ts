/**
 * Field-level UX validity tracking for a single user-editable input.
 *
 * Sits one layer below `useEntryModal` (which is per-entity lifecycle): this
 * tracks the *displayed* validity of one input element in response to live
 * keystrokes, so the consuming modal can render `_conv-validation` [VAL-012]
 * (visible message) and gate [VAL-013] (disabled submit) reactively.
 *
 * Why not put this in `useEntryModal`?
 *   - useEntryModal runs in the route file; the input lives in the extracted
 *     modal component. Putting per-field validators in the route re-couples
 *     the layers this refactor just split.
 *   - Modals can have N fields. Composing N `useFieldValidity` instances is
 *     more natural than baking N validators into useEntryModal's config.
 *
 * The `validate` callback returns the error message string on failure — per
 * `_conv-validation` [VAL-014], call into the generated Zod schemas from
 * `$lib/api/gen/types` so the frontend message is byte-identical to whatever
 * the backend would emit for the same input.
 *
 * Usage:
 *
 *   const validity = useFieldValidity({
 *     source: () => entry?.amount,
 *     validate: (raw) => {
 *       const r = NewWeightTrackerSchema.shape.amount.safeParse(raw);
 *       return r.success
 *         ? { ok: true }
 *         : { ok: false, message: r.error.issues[0].message };
 *     }
 *   });
 *
 *   <fieldset oninput={validity.handleInput}>
 *     <input type="number" ... />
 *   </fieldset>
 *   {#if validity.showError}
 *     <AlertBox type={AlertType.Error}>{validity.errorMessage}</AlertBox>
 *   {/if}
 *   <button onclick={() => { if (validity.attempt()) save(); }}>Save</button>
 */

export type ValidationResult = { ok: true } | { ok: false; message: string };

export interface UseFieldValidityOptions {
	/**
	 * Validator called with whatever `source` returned (or the raw input string
	 * when triggered by `handleInput`). Return `{ ok: true }` when the value
	 * satisfies the rule, or `{ ok: false, message }` to surface an invalid
	 * state. The `message` becomes `errorMessage` and drives the inline alert.
	 *
	 * Per [VAL-014], implementations SHOULD source the message from a generated
	 * Zod schema's `safeParse(...).error.issues[0].message` rather than
	 * hand-rolling a string.
	 */
	validate: (value: unknown) => ValidationResult;
	/**
	 * Restrict to inputs matching this selector. Defaults to `'input'`. Useful
	 * when the wrapping element (e.g. a `<fieldset>`) contains other inputs
	 * that shouldn't drive this field's validity — pass e.g. `'input[type="number"]'`.
	 */
	matches?: string;
	/**
	 * Optional reactive getter for the bound value. The composable revalidates
	 * whenever the returned value changes (via `$effect`). This catches paths
	 * that mutate the bound state *without* firing an `input` event — e.g.
	 * NumberStepper's +/- buttons or programmatic mutations. Return undefined /
	 * null for "not present"; the composable treats both as the empty string
	 * for predicate purposes.
	 */
	source?: () => unknown;
}

export interface FieldValidity {
	/** Reactive: true while the displayed value satisfies `validate` (initial: true). */
	readonly displayValid: boolean;
	/**
	 * Reactive: the message from the most recent invalid result, or undefined
	 * when valid. Templates wire this through an AlertBox (see [VAL-014]).
	 */
	readonly errorMessage: string | undefined;
	/**
	 * Reactive: true once the user has attempted submit at least once via
	 * `attempt()`. Use this to gate error-message visibility per [VAL-012] — we
	 * don't pre-emptively scream at the user when a modal opens with a stale
	 * or empty value; the user has to engage with the form first.
	 */
	readonly hasAttempted: boolean;
	/**
	 * Reactive: `hasAttempted && !displayValid`. This is what UI templates
	 * should check to decide whether to render the validation message. Match
	 * the wizard's `[OB-020]` deferred-error pattern.
	 */
	readonly showError: boolean;
	/**
	 * Mark a submit attempt and return whether the current value is valid.
	 * Callers should call this from the Save / Confirm handler:
	 *
	 *   if (validity.attempt()) { onsave(); }
	 *
	 * The first attempt while invalid flips `hasAttempted` to true (which makes
	 * `showError` go live). Subsequent attempts return the live validity.
	 */
	attempt: () => boolean;
	/** Attach to the wrapping form/fieldset's `oninput`. */
	handleInput: (e: Event) => void;
	/**
	 * Manually re-evaluate validity against an arbitrary raw value. Useful when
	 * the value changes via a non-input path (e.g. a programmatic reset).
	 */
	revalidate: (value: unknown) => void;
	/**
	 * Clear the `hasAttempted` flag so the deferred-error gate ([VAL-012])
	 * resets to its "modal just opened" state. Modals call this on reopen so
	 * a sticky attempt from the previous session doesn't surface an immediate
	 * alert when the user pulls up a fresh blank entry. The live
	 * `displayValid` / `errorMessage` values stay in sync with the current
	 * `source` — they don't need an explicit reset.
	 */
	reset: () => void;
}

export function useFieldValidity(options: UseFieldValidityOptions): FieldValidity {
	const matches = options.matches ?? 'input';
	let displayValid = $state(true);
	let errorMessage = $state<string | undefined>(undefined);
	let hasAttempted = $state(false);

	function apply(value: unknown) {
		const result = options.validate(value);
		if (result.ok) {
			displayValid = true;
			errorMessage = undefined;
		} else {
			displayValid = false;
			errorMessage = result.message;
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLElement | null;
		if (!target || !target.matches?.(matches)) return;
		const value = (target as HTMLInputElement).value ?? '';
		apply(value);
	}

	function revalidate(value: unknown) {
		apply(value);
	}

	function attempt(): boolean {
		hasAttempted = true;
		return displayValid;
	}

	function reset() {
		hasAttempted = false;
	}

	if (options.source) {
		$effect(() => {
			const value = options.source!();
			// Treat a null/undefined source as "nothing to validate" rather
			// than as an invalid value. Modal consumers null their bound
			// entry on close (useEntryModal does this after save/cancel) —
			// surfacing an invalid-state alert during that transition flashes
			// the AlertBox for one frame before the dialog actually closes.
			if (value == null) {
				displayValid = true;
				errorMessage = undefined;
				return;
			}
			apply(value);
		});
	}

	return {
		get displayValid() {
			return displayValid;
		},
		get errorMessage() {
			return errorMessage;
		},
		get hasAttempted() {
			return hasAttempted;
		},
		get showError() {
			return hasAttempted && !displayValid;
		},
		attempt,
		handleInput,
		revalidate,
		reset
	};
}
