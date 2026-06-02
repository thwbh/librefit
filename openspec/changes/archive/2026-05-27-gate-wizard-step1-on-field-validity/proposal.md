## Why

The `onboarding` spec for `Setup wizard body information (Step 1)` claims _"Biological sex SHALL have no default"_ and _"The Next button SHALL remain disabled until all required fields are valid"_. The implementation honors neither, and the cracks have produced empirical bugs (downstream calculation crashes from invalid Step 1 data slipping through). Three root causes:

1. `Setup.svelte:69` defaults the first-time `bodyData.sex` to `MALE`, so sex is silently pre-selected.
2. The Stepper from `@thwbh/veilchen` exposes no per-step validity hook today (confirmed against the library's current API), so the Next button is wired to nothing — every click advances regardless of state.
3. The `LibreUser` Rust struct in `src-tauri/src/service/user.rs` has **no `validator`-crate annotations**. `update_user` does an imperative `trim().is_empty()` + `len() > 50` check, but `tauri-typegen` only generates Zod constraints from struct annotations, so the frontend's `LibreUserSchema` is _unconstrained_ on `name`. Hand-rolled length checks in `Body.svelte` (`minlength={2} maxlength={40}`) fill the gap with bounds that don't match anything authoritative — they happen to match `profile`'s scenarios `[PF-008..PF-011]` (also currently orphan) but disagree with `update_user`'s `≤ 50`.

This is the kind of compression `_conv-validation` and `_conv-test-traceability` are supposed to prevent. Fixing it at the surface (just gating the Next button) would leave the root contradiction in place. This change fixes it at the root: backend validator owns the bounds, regen propagates to Zod, frontend consumes the Zod schemas, gating is a side-effect of `safeParse().success`.

## What Changes

- **Backend (Rust):** add `#[validate(length(min = 2, max = 40))]` to `LibreUser::name`. Replace the imperative `trim().is_empty()` and `> 50` checks in `update_user` with a `user.validate()` call (matching the pattern used by other commands). `tauri-typegen` regenerates `LibreUserSchema` with the proper constraint.
- **Spec — onboarding:** keep the SHALL behavioral, lift per-field validity into scenarios. The SHALL changes from "Next disabled" to "wizard does not advance from Step 1" — describing the contract (no advance with invalid data) rather than the mechanism (a button attribute), since the mechanism is currently bounded by what veilchen exposes.
- **Spec — scenarios:** `[OB-006]` reworded to assert advance-blocked/advance-permitted (not button-disabled). New scenarios: `[OB-018]` (nickname below minimum prevents advance), `[OB-019]` (nickname within bounds permits advance). `[OB-005]` and `[OB-007]` unchanged.
- **Frontend — validity:** introduce `wizardInputDraft` as a loose `Record<string, unknown>` `$state` in `Setup.svelte`. The wizard's Step 1 validity is a `$derived` running `WizardInputSchema.safeParse(...)` and `LibreUserSchema.safeParse(...)`; both must succeed. No hand-rolled length checks anywhere in the frontend.
- **Frontend — gating:** since veilchen has no per-step validity hook, Step 1's `onnext` short-circuits when validity is false. The wizard stays on Step 1; the first Zod error message from the failing schema is surfaced under the offending field for UX.
- **Frontend — first-time default:** the draft starts without a `sex` key (so `safeParse` fails until the user picks one). The `MALE` default is removed.
- **Frontend — re-run:** when `bodyDataProp` is provided (loader pre-fills from saved data), the draft is seeded from it. Saved sex is preloaded; the wizard is immediately advance-ready.
- **Tests:** new colocated `src/lib/component/wizard/Setup.svelte.test.ts` covers `[OB-006]`, `[OB-018]`, `[OB-019]`. Existing Rust tests `[PF-012]` and `[PF-013]` (which already exercise nickname below/above backend bounds) become true coverage once the validator lands — they currently pass against the imperative check and will continue to pass against the validator.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `onboarding`: `Setup wizard body information (Step 1)` requirement gains `[OB-018]` and `[OB-019]`, tightens `[OB-006]` to the advance-permits/advance-blocks form, and softens the SHALL from "Next disabled" to "wizard does not advance from Step 1."
- `profile`: no spec delta needed. `[PF-008]..[PF-011]` (nickname-length UI scenarios) become testable as a side effect of the validator landing; they are out of scope for this change's tests and stay parked as follow-ups (e.g. `gate-profile-edit-modal-on-validity`).

## Impact

- Code (Rust): `src-tauri/src/service/user.rs` — `LibreUser` gains `#[validate(...)]` on `name`; `update_user` replaces imperative checks with `validate()` call. `cargo check` regenerates the Zod schemas via `tauri-typegen` (with `cargo tauri build` or `cargo tauri-typegen generate` as fallbacks).
- Code (frontend): `src/lib/component/wizard/Setup.svelte` (draft refactor, validity derived, onnext short-circuit, error surfacing), `src/lib/component/wizard/body/Body.svelte` (loose-draft bindings; ButtonGroup unset-state rendering).
- Tests (frontend): new `src/lib/component/wizard/Setup.svelte.test.ts` covering OB-006, OB-018, OB-019.
- Tests (Rust): the existing `nickname_below_backend_lower_bound_rejected` and `nickname_above_backend_upper_bound_rejected` (citing PF-012/PF-013) need their imperative-check assertions updated to assert the new validator error format. Bounds change from "non-empty / ≤ 50" to "2..40", so the test inputs may shift.
- Spec: `openspec/specs/onboarding/spec.md` — `Setup wizard body information (Step 1)` requirement re-stated. The bounds (2 and 40) are not pinned in the spec — they're pinned in the Rust validator per `_conv-validation [VAL-011]`. Spec scenarios cite the rule, not the values.
- Traceability: closes OB-006 (currently orphan), pre-cites OB-018 and OB-019. Net coverage at archive: 104 → 107 / 165.
- Bug: fixes the calculation-crash from invalid Step 1 data. The active smoke test in task 5.5 probes each field to confirm no third escape route remains.
