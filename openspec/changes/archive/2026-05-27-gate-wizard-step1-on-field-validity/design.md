## Context

LibreFit's validation architecture is "Rust validators own the bounds; `tauri-typegen` generates Zod schemas from the Rust struct annotations; the frontend `safeParse`s its draft state against those Zod schemas." When that pipeline is intact, the frontend has no hand-rolled length checks anywhere — bounds change in one place and propagate. The wizard's Step 1 violates the pipeline in two ways: (a) `LibreUser::name` has no `#[validate(...)]` annotation, so the generated `LibreUserSchema` is unconstrained on `name` (hand-rolled `minlength={2} maxlength={40}` props on `ValidatedInput` cover for it); (b) the wizard maintains `wizardInput: WizardInput` as a fully-typed state object with a hardcoded sex default, bypassing `safeParse` until much later.

`@thwbh/veilchen`'s `Stepper` does not expose a per-step validity hook today (confirmed). The advance mechanism is `onnext`, an async callback per step.

## Goals / Non-Goals

**Goals:**

- Backend `LibreUser::name` carries a `validator`-crate annotation that becomes the single source of truth for nickname bounds.
- Frontend Step 1 validity is `WizardInputSchema.safeParse(...).success && LibreUserSchema.safeParse(...).success`. No hand-rolled length checks anywhere in the wizard code.
- The wizard does not advance from Step 1 when validity is false. A click on Next while invalid is a no-op (because veilchen lacks a `disabled` hook today; this is acceptable per the revised spec wording).
- First-time users see no sex preselection; wizard re-run preloads saved sex.
- Test coverage: OB-006, OB-018, OB-019.
- Fixes the empirical downstream-calculation-crash bug.

**Non-Goals:**

- Adding a per-step validity hook to veilchen (out of scope; library is on backlog).
- Adding a `disabled` attribute / visual disabled state on the Next button. The contract is "does not advance" — visual disabled is a future enhancement when veilchen exposes the hook.
- Profile edit modal nickname validation ([PF-008..PF-011]). Those scenarios become reachable once the validator lands but are tested in a separate `gate-profile-edit-modal-on-validity` change.
- Changing `CalculationSex` enum or the `WizardInput` Rust struct.

## Decisions

**Decision 1: Don't add an `UNSET` variant to `CalculationSex`. The enum stays `MALE | FEMALE`.**

The transport contract should never carry a value that can't be persisted. "Unset" is a UI-state concept that lives in the draft object only.

**Decision 2: Validity derives from running the generated Zod schemas, not hand-rolled checks.**

```ts
const step1Parse = $derived(WizardInputSchema.safeParse(wizardInputDraft));
const userParse = $derived(LibreUserSchema.safeParse(userDataDraft));
const step1Valid = $derived(step1Parse.success && userParse.success);
```

Sex's "must be set" check falls out of `WizardInputSchema.safeParse` automatically (the schema requires `sex` because the Rust struct does). Nickname's "2..40 chars" check falls out of `LibreUserSchema.safeParse` once the validator annotation lands. Bounds duplicated nowhere in the frontend.

Alternative considered: per-field event handlers with hand-rolled length numbers. Rejected — exactly the fragmentation `_conv-validation [VAL-011]` is meant to prevent.

**Decision 3: `wizardInputDraft` is a loose `Record<string, unknown>` `$state`; `WizardInput` is only produced via successful `safeParse`.**

```ts
let wizardInputDraft = $state<Record<string, unknown>>({
	age: 30,
	height: 180,
	weight: 85,
	activityLevel: 1,
	weeklyDifference: 1,
	calculationGoal: 'LOSS'
	// sex: deliberately absent on first-time runs
});

// Later, at Step 3+ call sites:
if (!step1Parse.success) throw new Error('unreachable'); // gated upstream
await wizardCalculateTdee({ input: step1Parse.data }); // properly-typed WizardInput
```

This is "parse, don't validate" — `WizardInput` stays non-optional everywhere it appears, and the call sites get a typed value with no `!` assertions. The cost is that `Body.svelte`'s bindings into the draft are looser (TS sees `unknown` for individual fields); we annotate the binding targets explicitly in Body to keep types narrow there.

Alternative considered: keep `wizardInput: WizardInput` and make `sex` locally `CalculationSex | undefined`. Rejected by the user's review — that defies the purpose of Zod validation and leaks an optional shape into the rest of the wizard.

Alternative considered: skip the draft entirely; rebuild `WizardInput` only on Next click. Rejected — Body's bindings need a live state to reflect user input as it happens.

**Decision 4: Source of truth for nickname bounds is the Rust validator on `LibreUser::name`. Bounds: 2..40.**

```rust
#[derive(Queryable, Selectable, Insertable, AsChangeset, Serialize, Deserialize, Debug, Validate)]
#[diesel(table_name = libre_user)]
pub struct LibreUser {
    pub id: i32,
    pub avatar: String,
    #[validate(length(min = 2, max = 40))]
    pub name: String,
}
```

`update_user` replaces its imperative `trim().is_empty()` and `> 50` checks with `user.validate()` (mirroring how other commands consume the validator). `cargo check` re-runs `tauri-typegen` which regenerates `LibreUserSchema` with the constraint. Frontend Zod schemas reflect the bounds automatically.

Why 2..40: matches `Body.svelte`'s `ValidatedInput` props and the `profile` spec's `[PF-008..PF-011]` scenarios. The previous imperative `> 50` was looser; tightening to 40 is the small backwards-incompatible change worth taking with this fix (users with 41-50-char names would fail on next profile-save, but that's the same fix path the validator is supposed to enforce).

**Decision 5: Gating mechanism is short-circuit `onnext` because veilchen has no per-step validity hook today.**

When the user clicks Next on Step 1 and `step1Valid === false`, `onnext` returns immediately without invoking the next-step callback (Stepper interprets the return as "stay on this step"). The spec scenarios are worded to assert advance-blocked, not button-disabled, so this satisfies them.

When veilchen ships a per-step hook (it's on their backlog), a follow-up change can switch the wiring to use it and additionally set the button to `disabled`. That follow-up changes mechanism; the spec contract is unchanged.

**Decision 6: Surface the first Zod error message under the offending field for UX.**

A "stuck Next that does nothing" is bad UX. When `step1Parse.success === false`, render the first `step1Parse.error.issues[0]` message under (or near) the matching field. `ValidatedInput` already does this for its own field-level state; the new error renders the _server contract_ error in the same affordance. Same for `userParse`.

## Risks / Trade-offs

- **Risk:** The bounds change from `≤ 50` to `2..40` is a tightening. Users with stored names >40 chars will fail on next save → **Mitigation:** the validator runs only on `update`, not on `get`; existing data isn't touched. The "next save fails" case is the validator doing its job; if it becomes a real user-reported issue, the change is to widen the bound in `LibreUser::name`, regen, and ship — one place to change.
- **Risk:** The "stuck Next button" UX is bad even with the error message → **Mitigation:** addressed by Decision 6. Future visual-disabled work depends on veilchen.
- **Risk:** Loose `Record<string, unknown>` state weakens type-safety in `Body.svelte`'s bindings → **Mitigation:** annotate each binding target at the use site; the draft's _shape_ is still constrained by Zod at parse time, which is what matters.
- **Risk:** The actual user-bug we're trying to fix might be in a field we don't gate → **Mitigation:** task 5.5 actively probes every field in a `cargo tauri dev` smoke session; 5.6 commits to extending the spec/test/code in the same change if a third escape route surfaces (no follow-up bypass).
- **Risk:** Existing Rust tests `nickname_below_backend_lower_bound_rejected` / `nickname_above_backend_upper_bound_rejected` assert the imperative error messages (e.g. "Username cannot be empty"); they'll need their assertions updated to the validator's error format → **Mitigation:** included in the task list.
