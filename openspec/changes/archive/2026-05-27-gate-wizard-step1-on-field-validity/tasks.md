## 1. Add backend validator for nickname

- [x] 1.1 Added `Validate` to derives + `#[validate(length(min=2, max=40, message=...))]` on `name`; also formalized the pre-existing `len() > 500` check on `avatar` as `#[validate(length(max=500))]`.
- [x] 1.2 Replaced the imperative checks in `update_user` with `candidate.validate()` (constructed a `LibreUser` candidate from the inputs and validated it — same pattern as `create_intake`).
- [x] 1.3 `cargo check` from `src-tauri/` triggered the regen.
- [x] 1.4 Confirmed `LibreUserSchema.name` in `src/lib/api/gen/types.ts:120` now has `.min(2, ...).max(40, ...)`.

## 2. Update Rust tests for the new validator

- [x] 2.1 Updated `nickname_below_backend_lower_bound_rejected` to use a 1-char name and assert `Validation failed` + `name` in the error.
- [x] 2.2 Updated `nickname_above_backend_upper_bound_rejected` to use a 41-char name with the same assertion style. Also retrofitted `test_update_user_validation_avatar_too_long` to the new error format.
- [x] 2.3 `cargo nextest run` — 231 / 231 passing.

## 3. Refactor wizard state into a draft + parsed result

- [x] 3.1 Kept `wizardInput: WizardInput` (Body's bindings stay typed; design.md's `Record<string, unknown>` would have rippled into Body's prop signature). First-time fallback initializes `sex: undefined as unknown as WizardInput['sex']`; re-run flow seeds from `bodyDataProp.sex` via `safeParse`. Inline comment explains the runtime-vs-type compromise.
- [x] 3.2 First-time `userData` fallback now starts with `name: ''` (empty string fails the validator's `min(2)` until the user types). Re-run flow uses `userDataProp` as before.
- [x] 3.3 Added `step1Parse = $derived(WizardInputSchema.safeParse(wizardInput))` and `userParse = $derived(LibreUserSchema.safeParse(userData))`.
- [x] 3.4 Added `step1Valid = $derived(step1Parse.success && userParse.success)` plus a `step1FirstError` derived that picks the first failing issue + its field path.
- [x] 3.5 Narrowed all Step 3+ / `$effect` / `performSetup` call sites to `const input1 = step1Parse.data` after a `throw 'unreachable'` guard, replacing `wizardInput.{age,sex,height,weight,activityLevel}` references with `input1.{...}`.

## 4. Wire short-circuit gating + error surfacing

- [x] 4.1 `onnext` for Step 1 throws when `!step1Valid` with the first Zod error message; throw keeps the Stepper on the current step. Inline comment notes the veilchen-no-hook reason.
- [x] 4.2 Setup passes `step1FirstError` to Body; Body renders `<p class="text-error">` under the matching field (`name` under the nickname input, `sex` under the sex ButtonGroup) when the field's path matches.
- [x] 4.3 Verified `ButtonGroup` source (`node_modules/@thwbh/veilchen/dist/components/control/ButtonGroup.svelte`): preselection is gated on `value === entry.key`. When `value === undefined`, the comparison is always false → neither button gets `btn-neutral`, so no preselection. No code change needed.

## 5. Tests

- [x] 5.1 Created `src/lib/component/wizard/Setup.svelte.test.ts` with mocks for all Tauri commands, `@tauri-apps/plugin-log`, `$lib/avatar`, and `$app/navigation`.
- [x] 5.2 `[OB-006]` test passes.
- [x] 5.3 `[OB-018]` test passes.
- [x] 5.4 `[OB-019]` test passes.

> Note: positive assertions look for the Step 2 marker text ("Mostly Sedentary" from `activityLevels[0].label`) rather than the absence of the Step 1 Male button. Svelte's `fly` transition keeps Step 1 mounted during the out-animation in jsdom (our `Element.animate` polyfill doesn't fire `onfinish`), so absence-of-Body assertions are unreliable; presence-of-ActivityLevel is reliable.

> Discovery during implementation: `@thwbh/veilchen`'s Stepper increments `currentStep` BEFORE calling `onnext`, so the gating-by-rollback pattern (`if (currentStep === 2 && !step1Valid) { currentStep = 1; return; }`) was the only path. This is documented in Setup.svelte via an inline comment.

## 6. Verify

- [x] 6.1 `npm run test` — 380 / 380 passing (was 377; +3 for the new Setup tests).
- [x] 6.2 `npm run test:traceability` — 106 / 163 pre-archive (was 104; +2 for OB-006 newly cited and `_conv-test-traceability` ID surface). OB-018/019 pre-cited against the delta and will credit at archive.
- [x] 6.3 `cargo nextest run` — 231 / 231.
- [x] 6.4 `openspec validate gate-wizard-step1-on-field-validity --strict` — passes.
- [x] 6.5 Smoke check surfaced a UX issue: errors rendered on initial page load (before any user interaction) and only the first failing field's error was shown. Confirmed against user screenshot.
- [x] 6.6 Extended the change in flight per the scope rule:
  - Spec delta: added `[OB-020]` scenario asserting errors are deferred until attempted advance and then surfaced one-per-invalid-field, clearing as fields are fixed.
  - Setup.svelte: added `hasAttemptedAdvance` `$state` flag (set true on first rollback); replaced single-issue `step1FirstError` with `step1Errors: Record<string, string>` (empty until `hasAttemptedAdvance === true`).
  - Body.svelte: prop renamed `step1FirstError` → `errors: Record<string, string>`; `errorFor(field)` looks up `errors[field]`.
  - New test case `[OB-020]` asserts: no `.text-error` nodes on initial render; 2 nodes after Next click with both fields invalid; 1 after fixing nickname; 0 after fixing sex.

## 7. Re-verify after OB-020 extension

- [x] 7.1 `npm run test` — 381 / 381 passing (was 380; +1 for the OB-020 test).
- [x] 7.2 `openspec validate gate-wizard-step1-on-field-validity --strict` — passes.
- [x] 7.3 Re-smoke-check confirmed: initial render is error-free; clicking Next with both fields invalid surfaces both curated messages; messages clear per-field as the user fixes them.

## 8. Curate the sex-enum error message

Smoke screenshot showed the default Zod message _"Invalid option: expected one of \"MALE\"|\"FEMALE\""_ under Sex — too technical for users.

- [x] 8.1 Tried mirroring a Rust-side `#[validate(custom(..., message = "..."))]` annotation on `WizardInput.sex`. **Result: tauri-typegen 0.4.0 doesn't propagate it.** Inspected `tauri-typegen-0.4.0/src/analysis/validator_parser.rs` — only `length` and `range` constraints are parsed; `custom` is dropped. The regenerated `WizardInputSchema.sex` was still bare `CalculationSexSchema`. Reverted the Rust change.
- [x] 8.2 Applied a UI-side curated message via Zod 4's per-parse `error` hook in `Setup.svelte`: `WizardInputSchema.safeParse(wizardInput, { error: wizardErrorMap })` where `wizardErrorMap` returns `"Please choose Male or Female before continuing."` when `issue.path[0] === 'sex'` and falls through otherwise. Other field messages still come from Rust (via `length`/`range` annotations) → no message duplication, only the enum gap is patched at the UI.
- [x] 8.3 Test extended: `[OB-020]` now also asserts the friendly sex message and the Rust-owned nickname message render in the error nodes.
- [x] 8.4 Side fix: removed the broken `@tauri-apps/plugin-store` import in `src/lib/store.ts` (plugin was never installed; `showHint` was already a no-op stub). Unblocks `svelte-check`.

## 9. Archive

- [x] 9.1 `openspec archive gate-wizard-step1-on-field-validity`.
