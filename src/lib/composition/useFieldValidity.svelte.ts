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
 * Usage:
 *
 *   const validity = useFieldValidity({
 *     isValid: (raw) => raw !== '' && parseFloat(raw) >= 30,
 *   });
 *
 *   <fieldset oninput={validity.handleInput}>
 *     <input type="number" ... />
 *   </fieldset>
 *   {#if !validity.displayValid}
 *     <p class="text-error">Out of range.</p>
 *   {/if}
 *   <button disabled={!validity.displayValid} onclick={save}>Save</button>
 */

export interface UseFieldValidityOptions {
	/**
	 * Predicate called with the raw string value of the input. Return false to
	 * surface the invalid state (message visible, submit disabled). The caller
	 * decides what "valid" means — typical predicates: non-empty + within
	 * numeric range, length-bounded, format-conformant, etc.
	 */
	isValid: (rawValue: string) => boolean;
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
	source?: () => string | number | null | undefined;
}

export interface FieldValidity {
	/** Reactive: true while the displayed value satisfies `isValid` (initial: true). */
	readonly displayValid: boolean;
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
	revalidate: (rawValue: string) => void;
}

export function useFieldValidity(options: UseFieldValidityOptions): FieldValidity {
	const matches = options.matches ?? 'input';
	let displayValid = $state(true);
	let hasAttempted = $state(false);

	function handleInput(e: Event) {
		const target = e.target as HTMLElement | null;
		if (!target || !target.matches?.(matches)) return;
		const value = (target as HTMLInputElement).value ?? '';
		displayValid = options.isValid(value);
	}

	function revalidate(rawValue: string) {
		displayValid = options.isValid(rawValue);
	}

	function attempt(): boolean {
		hasAttempted = true;
		return displayValid;
	}

	if (options.source) {
		$effect(() => {
			const raw = options.source!();
			displayValid = options.isValid(raw == null ? '' : String(raw));
		});
	}

	return {
		get displayValid() {
			return displayValid;
		},
		get hasAttempted() {
			return hasAttempted;
		},
		get showError() {
			return hasAttempted && !displayValid;
		},
		attempt,
		handleInput,
		revalidate
	};
}
