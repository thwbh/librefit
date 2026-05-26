## 1. Add backend validator for nickname

- [ ] 1.1 In `src-tauri/src/service/user.rs`, add `Validate` to the `LibreUser` derives, then add `#[validate(length(min = 2, max = 40))]` to the `name` field.
- [ ] 1.2 In `update_user`, replace the imperative `trim().is_empty()` and `len() > 50` checks with a `user.validate()` call following the pattern used by other commands. (Construct the candidate `LibreUser` for validation first, or validate `user_name` directly via a tiny wrapper — match whatever style the codebase already uses.)
- [ ] 1.3 Run `cargo check` from `src-tauri/` to trigger `tauri-typegen` regeneration. If Zod schemas didn't update, fall back to `cargo tauri build`; if that doesn't work, run `cargo tauri-typegen generate` from the project root.
- [ ] 1.4 Confirm the regenerated `src/lib/api/gen/...` types reflect the constraint on `LibreUser.name` (the generated Zod schema for `LibreUser` should include `.min(2).max(40)` or equivalent).

## 2. Update Rust tests for the new validator

- [ ] 2.1 Update `nickname_below_backend_lower_bound_rejected` (test_user_cmd.rs, cites `[PF-012]`) to use a name of length 1 (was empty) and assert the validator-produced error format. Keep the `scenario!("[PF-012]")` line.
- [ ] 2.2 Update `nickname_above_backend_upper_bound_rejected` (cites `[PF-013]`) to use a name of length 41 (was 51) and assert the validator-produced error format. Keep the `scenario!("[PF-013]")` line.
- [ ] 2.3 `cargo nextest run` from `src-tauri/` — green.

## 3. Refactor wizard state into a draft + parsed result

- [ ] 3.1 In `src/lib/component/wizard/Setup.svelte`, introduce `let wizardInputDraft = $state<Record<string, unknown>>({ ... })`. On first-time runs, populate with `age`, `height`, `weight`, `activityLevel`, `weeklyDifference`, `calculationGoal` defaults; deliberately do NOT set `sex`. On re-run (when `bodyDataProp` is provided), seed the draft from the prop including its `sex`.
- [ ] 3.2 Introduce `let userDataDraft = $state<Record<string, unknown>>({ ... })` similarly for `userData`. On first-time runs, do NOT set `name` (so the user is prompted to enter one); on re-run, seed from `userDataProp`.
- [ ] 3.3 Add `const step1Parse = $derived(WizardInputSchema.safeParse(wizardInputDraft))` and `const userParse = $derived(LibreUserSchema.safeParse(userDataDraft))`.
- [ ] 3.4 Add `const step1Valid = $derived(step1Parse.success && userParse.success)`.
- [ ] 3.5 At Step 3+ call sites (currently `Setup.svelte:171, 227, 267`), replace `wizardInput.sex` etc. with `step1Parse.success ? step1Parse.data : (throw new Error('unreachable'))`. The simpler form: at the top of each Step 3+ branch, narrow once and use the typed result.

## 4. Wire short-circuit gating + error surfacing

- [ ] 4.1 In `Setup.svelte`'s `onnext` for Step 1, return early (or throw / `return false` depending on what Stepper interprets as "stay") when `!step1Valid`. Add a one-line comment noting that veilchen lacks a per-step validity hook; this is the fallback path.
- [ ] 4.2 Render `step1Parse.error.issues[0].message` (or the userParse equivalent, whichever is failing) under the offending field. Identify the field via `issue.path[0]`. If the field renders inside `Body.svelte`, pass the message in via prop. Reuse `ValidatedInput`'s existing error affordance where possible; for `ButtonGroup` (sex), render a small `<p class="text-error">` directly under it.
- [ ] 4.3 In `src/lib/component/wizard/body/Body.svelte`, change the `ButtonGroup` for Sex to not pre-highlight either option when the bound value is `undefined`. Confirm by reading the component or testing in isolation.

## 5. Tests

- [ ] 5.1 New colocated file `src/lib/component/wizard/Setup.svelte.test.ts` (uses runes for `$state`-bound props). Mock the Tauri commands (`updateUser`, `updateBodyData`, `wizardCreateTargets`, `wizardCalculateTdee`, `wizardCalculateForTargetWeight`) at the top with `vi.mock` so the test never reaches the Tauri boundary.
- [ ] 5.2 `it('[OB-006] sex unset → Next click does not advance; pick Male → Next click advances', ...)` — mount Setup with no props, find the Stepper's Next button, click it, assert still on Step 1 (e.g. Body fields still rendered, ActivityLevel not yet rendered); click the Male `ButtonGroup` option (and ensure a valid nickname), click Next, assert ActivityLevel renders.
- [ ] 5.3 `it('[OB-018] nickname shorter than 2 chars → Next click does not advance', ...)` — pick sex, set nickname to one char (or empty), click Next, assert still on Step 1.
- [ ] 5.4 `it('[OB-019] nickname within bounds + other fields valid → Next click advances', ...)` — sex picked, nickname at 2 chars, click Next, assert ActivityLevel rendered; reset, nickname at 40 chars, same.

## 6. Verify

- [ ] 6.1 `npm run test` — green (377 + new tests).
- [ ] 6.2 `npm run test:traceability` — covered count goes from 104 to 107 pre-archive (OB-006 newly cited; OB-018/019 cited against the change delta until merge).
- [ ] 6.3 `cargo nextest run` from `src-tauri/` — green.
- [ ] 6.4 `openspec validate gate-wizard-step1-on-field-validity --strict` — passes.
- [ ] 6.5 Smoke-check with `cargo tauri dev`: open the wizard fresh, confirm no sex preselected; click Next, confirm wizard stays on Step 1 and an error message appears for the missing sex; pick a sex, click Next, confirm advance. Re-run wizard with existing profile; confirm saved sex preselected and Next advances immediately. **Actively probe**: clear the nickname, click Next, confirm blocked + error message; try invalid values for age/height/weight if reachable via the RangeInput sliders.
- [ ] 6.6 If smoke check surfaces a _third_ gated field beyond sex and nickname, extend the spec delta (add an OB-020 scenario) + add a matching test + extend the validator if backend-side, rather than carrying the gap into a follow-up.

## 7. Archive

- [ ] 7.1 `openspec archive gate-wizard-step1-on-field-validity` once the change merges to `main`.
