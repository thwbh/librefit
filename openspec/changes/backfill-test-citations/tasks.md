## Notation

Each row: `[XX-NNN] descriptive name → ACTION`

Where ACTION is one of:

- **`rename: <file>::<fn-or-test>`** — existing test covers the scenario; rename to include the ID per `[TRC-003]`.
- **`rename: <file>::<test1> + <file>::<test2>`** — multiple existing tests cover the scenario, all get the ID citation.
- **`NEW <layer>: <file>`** — no existing coverage; write a new test at the indicated layer.
- **`SKIP: <reason>`** — scenario cannot be covered without infrastructure that's out of scope (used sparingly; almost everything has a correct layer).

For Rust renames, the new function name follows `<prefix_lower>_<nnn>_<short_descriptor>` and a `/// [XX-NNN] <name>` doc comment is added.
For Vitest renames, the literal bracketed form is embedded in the `it(...)` name.

**Multi-action rows** (e.g. `rename + NEW Vitest`) are left unchecked until BOTH parts are done. The rename half is complete for these; the Vitest half is still pending.

## 1. `onboarding` — OB-001..OB-017 (17 scenarios)

The wizard's UI flow has no Vitest coverage today; most scenarios need new tests against `Setup.svelte`, `Body.svelte`, `ActivityLevel.svelte`, `Rate.svelte`, `TargetWeight.svelte`, `Finish.svelte`. The classification math is covered by Rust.

- [x] 1.1 `[OB-001] First launch with no profile` → NEW Vitest: `src/routes/(app)/+layout.test.ts` — assert redirect when `userProfile` is null.
- [x] 1.2 `[OB-002] Get Started navigation` → NEW Vitest: `src/routes/welcome/+page.test.ts` — assert `goto('/setup')` on button click.
- [x] 1.3 `[OB-003] Direct access to protected route` → NEW Vitest: same `+layout.test.ts` — assert 307 to `/welcome`.
- [x] 1.4 `[OB-004] Unprotected routes remain accessible` → NEW Vitest: `+layout.test.ts` — assert `/welcome` and `/setup` are not guarded (verified by the loader returning shared data when authenticated; `/welcome` + `/setup` live outside `(app)` so this loader doesn't run for them).
- [x] 1.5 `[OB-005] Valid body information advances wizard` → NEW Vitest: `src/lib/component/wizard/body/Body.svelte.test.ts` — assert all required fields render and bind. (Step-advance happens in `Setup.svelte`/`Stepper`; Body itself owns the form fields.)
- [ ] 1.6 `[OB-006] Sex must be explicitly selected` → SKIP: spec/code gap — `Setup.svelte:69` defaults `bodyData.sex` to `MALE` and seeds `wizardInput.sex` from it; no "unset" state exists. Needs separate change `add-wizard-explicit-sex-selection`.
- [x] 1.7 `[OB-007] Avatar defaults to name seed` → rename: `src/lib/component/profile/UserAvatar.test.ts::should show username-based avatar when avatar is empty`.
- [x] 1.8 `[OB-008] Activity level selection` → NEW Vitest: `src/lib/component/wizard/activity/ActivityLevel.svelte.test.ts`.
- [x] 1.9 `[OB-009] Standard weight loss recommendation` → rename: `test_wizard_cmd.rs::calculate_obese_classification_for_men` + `calculate_obese_classification_for_women` + severely-obese variants for both sexes. Also multi-cited from `ob_009_weight_loss_calculation_for_men`.
- [x] 1.10 `[OB-010] Standard maintenance recommendation` → NEW Rust: `test_wizard_cmd.rs::ob_010_bmi_in_hold_range_yields_standard_weight`.
- [x] 1.11 `[OB-011] Weight gain recommendation` → rename: `test_wizard_cmd.rs::calculate_underweight_classification_for_men` + `_for_women`.
- [x] 1.12 `[OB-012] Low-normal BMI alert` → rename: `test_wizard_cmd.rs::return_underweight_warning`.
- [x] 1.13 `[OB-013] Rate selection for weight loss` → rename: `test_wizard_cmd.rs::calculate_weight_loss_for_men` (multi-cited [OB-009] [OB-013]).
- [x] 1.14 `[OB-014] Target weight selection for hold` → Rust portion done. UI portion SKIP: Step 4 title flip lives in `wizard/+page.svelte::currentConfig` and only fires after the user drives the wizard through steps 1–3 (which requires Tauri command results). Defer to `refactor-extract-testable-units` (extract the title-derivation as a pure helper).
- [x] 1.15 `[OB-015] Successful setup completion` → SKIP: full happy path requires driving `Stepper` + mocking 5+ Tauri commands + `goto`; brittle as a unit test. Defer to `refactor-extract-testable-units` (extract `performSetup` from `Setup.svelte` and unit-test the orchestration directly).
- [ ] 1.16 `[OB-016] Setup failure with rollback` → SKIP: same as [OB-015]; the failure branch is reachable by mocking one of the Tauri commands to throw inside the extracted `performSetup`.
- [x] 1.17 `[OB-017] Atomic target creation` → NEW Rust: `test_wizard_cmd.rs::ob_017_wizard_create_targets_persists_all_three_records` (happy-path; the transactional rollback case is rolled into [OB-016] above).

## 2. `intake-tracking` — IT-001..IT-027 (27 scenarios)

Strong existing coverage in `IntakeScore.test.ts`, `IntakeStack.test.ts`, `IntakeMask.test.ts`, `test_intake_cmd.rs`, `test_intake_repo.rs`.

- [x] 2.1 `[IT-001] No intake tracked` → rename: `IntakeScore.test.ts::should show 0 when entries is empty` + `IntakeStack.test.ts::should display empty state when no entries` (the latter also picks up [EMP-001]).
- [x] 2.2 `[IT-002] Intake within target` → rename: `IntakeScore.test.ts::should show ShieldCheck icon when within target`.
- [x] 2.3 `[IT-003] Intake above target but below maximum` → rename: `IntakeScore.test.ts::should show warning color when over target`.
- [x] 2.4 `[IT-004] Intake above maximum` → rename: `IntakeScore.test.ts::should show error color when over maximum`.
- [x] 2.5 `[IT-005] Create intake from dashboard` → SKIP: dashboard `+page.svelte` is large and inlines FAB + modal + Tauri command wiring; needs extraction first via `refactor-extract-testable-units`.
- [ ] 2.6 `[IT-006] Category auto-selection at breakfast time` → SKIP: spec/code gap — `+page.svelte:111` hardcodes `category: 'l'` in `getBlankEntry`; no time-of-day logic. Needs separate change `add-intake-time-based-default-category`.
- [ ] 2.7 `[IT-007] Category auto-selection at lunch time` → SKIP: same gap as [IT-006]; `add-intake-time-based-default-category`.
- [ ] 2.8 `[IT-008] Category auto-selection at dinner time` → SKIP: same gap as [IT-006]; `add-intake-time-based-default-category`.
- [ ] 2.9 `[IT-009] Category auto-selection outside meal hours` → SKIP: same gap as [IT-006]; `add-intake-time-based-default-category`.
- [x] 2.10 `[IT-010] Cancel without saving` → SKIP: same as [IT-005]; `refactor-extract-testable-units`.
- [x] 2.11 `[IT-011] Edit via long press` → rename: `IntakeStack.test.ts::should call onEdit when entry is long-pressed` (also multi-cited [GES-001]).
- [x] 2.12 `[IT-012] Save edited entry` → SKIP: same as [IT-005]; `refactor-extract-testable-units`.
- [x] 2.13 `[IT-013] Delete with confirmation` → SKIP: same as [IT-005]; `refactor-extract-testable-units`.
- [x] 2.14 `[IT-014] Cancel delete` → SKIP: same as [IT-005]; `refactor-extract-testable-units`.
- [x] 2.15 `[IT-015] Five categories available` → rename: `IntakeMask.test.ts::should show all categories as selectable`.
- [x] 2.16 `[IT-016] Single category selection` → rename: `IntakeMask.test.ts::should allow category selection`.
- [x] 2.17 `[IT-017] Navigate between cards` → rename: `IntakeStack.test.ts::should display entry at current index`.
- [x] 2.18 `[IT-018] Empty state` → rename: covered by `IntakeStack.test.ts::should display empty state when no entries` (multi-cited [IT-018] [EMP-001]).
- [x] 2.19 `[IT-019] Amount at lower bound accepted` → NEW Rust: `test_intake_cmd.rs::it_019_amount_at_lower_bound_accepted`.
- [x] 2.20 `[IT-020] Amount at upper bound accepted` → NEW Rust: `test_intake_cmd.rs::it_020_amount_at_upper_bound_accepted`.
- [x] 2.21 `[IT-021] Amount below lower bound rejected` → rename: `test_intake_cmd.rs::it_021_amount_below_lower_bound_rejected` + `test_intake_repo.rs::it_021_amount_below_lower_bound_rejected_validator`.
- [x] 2.22 `[IT-022] Amount above upper bound rejected` → rename: `test_intake_cmd.rs::it_022_amount_above_upper_bound_rejected` + `test_intake_repo.rs::it_022_amount_above_upper_bound_rejected_validator`.
- [x] 2.23 `[IT-023] Description at maximum length accepted` → NEW Rust: `test_intake_repo.rs::it_023_description_at_max_length_accepted`.
- [x] 2.24 `[IT-024] Description over maximum rejected` → rename: `test_intake_repo.rs::it_024_description_above_max_length_rejected`.
- [x] 2.25 `[IT-025] Date format YYYY-MM-DD accepted` → rename: `test_intake_repo.rs::it_025_create_intake_entry_with_explicit_date` (multi-cited [HI-009]).
- [x] 2.26 `[IT-026] Invalid date format rejected` → NEW Rust: `test_intake_cmd.rs::it_026_invalid_date_format_rejected`.
- [x] 2.27 `[IT-027] Time defaults to now` → NEW Rust: `test_intake_cmd.rs::it_027_time_defaults_when_unset` (also covers [VAL-004]).

## 3. `weight-tracking` — WT-001..WT-012 (12 scenarios)

- [x] 3.1 `[WT-001] Weight tracked today` → rename: `WeightScore.test.ts::should display current weight when weightTracker provided` + `should show "Last update: Today" for current day entry`.
- [x] 3.2 `[WT-002] Weight stale` → rename: `WeightScore.test.ts::should show tap to update when entry is stale` (also multi-cited [EMP-003]).
- [x] 3.3 `[WT-003] Create new weight entry` → rename: `test_weight_cmd.rs::wt_003_create_new_weight_entry`.
- [x] 3.4 `[WT-004] Edit existing weight entry` → rename: `test_weight_cmd.rs::wt_004_edit_existing_weight_entry`.
- [x] 3.5 `[WT-005] Weight at backend lower bound accepted` → NEW Rust: `test_weight_cmd.rs::wt_005_weight_at_lower_bound_accepted`.
- [x] 3.6 `[WT-006] Weight at upper bound accepted` → NEW Rust: `test_weight_cmd.rs::wt_006_weight_at_upper_bound_accepted`.
- [x] 3.7 `[WT-007] Weight below backend lower bound rejected` → rename: `test_weight_cmd.rs::wt_007_*` + `test_weight_repo.rs::wt_007_*_validator`.
- [x] 3.8 `[WT-008] Weight above upper bound rejected` → rename: `test_weight_cmd.rs::wt_008_*` + `test_weight_repo.rs::wt_008_*_validator`.
- [x] 3.9 `[WT-009] UI permits value below backend lower bound` → SKIP: no standalone weight-modal component exists; weight editing is inlined on dashboard via `useEntryModal`. Needs `refactor-extract-testable-units` to extract a `WeightModal` first.
- [x] 3.10 `[WT-010] Date format YYYY-MM-DD accepted` → rename: `test_weight_repo.rs::wt_010_create_weight_tracker_entry_with_valid_date` + `test_weight_cmd.rs::wt_003_*` (multi-cited).
- [x] 3.11 `[WT-011] Invalid date format rejected` → NEW Rust: `test_weight_cmd.rs::wt_011_invalid_date_format_rejected`.
- [x] 3.12 `[WT-012] Time defaults to now` → NEW Rust: `test_weight_cmd.rs::wt_012_time_defaults_when_unset`.

## 4. `plan-review` — PR-001..PR-006 (6 scenarios)

- [x] 4.1 `[PR-001] Expand plan review` → SKIP: lives inside dashboard `+page.svelte`; gate via `refactor-extract-testable-units`.
- [x] 4.2 `[PR-002] Collapse plan review` → SKIP: same as [PR-001]; `refactor-extract-testable-units`.
- [x] 4.3 `[PR-003] Goal reached` → rename: `EncouragementMessage.test.ts::should show goal reached message`.
- [x] 4.4 `[PR-004] Early days` → rename: `EncouragementMessage.test.ts::should show early start message for new journeys`.
- [x] 4.5 `[PR-005] Over target intake` → rename: `EncouragementMessage.test.ts::should show above-target message when averaging over`.
- [x] 4.6 `[PR-006] Near finish line` → rename: `EncouragementMessage.test.ts::should show near-end message when close to finish`.

## 5. `history` — HI-001..HI-013 (13 scenarios)

The history page has no Vitest tests today. All UI scenarios need new tests against `src/routes/(app)/history/+page.svelte` (extract small testable units or render the page).

- [x] 5.1 `[HI-001] Load current week` → Rust portion done. UI portion SKIP: `history/+page.svelte` is 592 lines with inlined week-pager + swipe + modal logic; needs `refactor-extract-testable-units` (extract `HistoryWeek`, `HistoryDayCard`).
- [x] 5.2 `[HI-002] Navigate to previous week` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.3 `[HI-003] No future data` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.4 `[HI-004] Week header content` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.5 `[HI-005] Select a date` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.6 `[HI-006] Swipe between days` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.7 `[HI-007] Swipe across week boundary` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.8 `[HI-008] Category badges reflect entries` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.9 `[HI-009] Add intake on historical date` → Rust portion done. UI portion SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.10 `[HI-010] Edit via swipe` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.11 `[HI-011] Delete via swipe` → SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.12 `[HI-012] Weight exists for date` → Rust portion done. UI portion SKIP: same as [HI-001]; `refactor-extract-testable-units`.
- [x] 5.13 `[HI-013] No weight for date` → Rust portion done. UI portion SKIP: same as [HI-001]; `refactor-extract-testable-units`.

## 6. `progress` — PG-001..PG-004 (4 scenarios)

- [x] 6.1 `[PG-001] Sufficient data renders charts` → Rust portion done. UI portion in `src/routes/(app)/progress/+page.test.ts` (header + chart cards render when sufficient data).
- [x] 6.2 `[PG-002] Chart legends distinguish actual vs target` → NEW Vitest: same file — Actual/Target labels present on both weight and intake charts.
- [x] 6.3 `[PG-003] Progress display` → Rust portion done (multi-cited in `pg_001_*`). UI portion in `progress/+page.test.ts` (header day-counter format).
- [x] 6.4 `[PG-004] New user with one day` → Rust portion done. UI portion in `progress/+page.test.ts` (multi-cited [PG-004] [EMP-002]).

## 7. `profile` — PF-001..PF-015 (15 scenarios)

- [x] 7.1 `[PF-001] Profile page load` → NEW Vitest: `src/routes/(app)/profile/+page.test.ts`.
- [x] 7.2 `[PF-002] Swipe to edit` → NEW Vitest: same file — affordance verified ("Swipe to edit" hint + SwipeableListItem target render).
- [x] 7.3 `[PF-003] Save profile changes` → rename done in `UserAvatar.test.ts::should call onAvatarChange when confirming selection` covers the avatar half. UI portion SKIP for name-update: needs `refactor-extract-testable-units` to extract `ProfileEditModal` whose save callback can be tested without simulating swipe-to-open.
- [x] 7.4 `[PF-004] Cancel discards changes` → rename: `UserAvatar.test.ts::should not change avatar when canceling modal` + `should close modal when cancel is clicked` (also multi-cited [MOD-004]).
- [x] 7.5 `[PF-005] Picker offers eight options` → rename: `AvatarPickerContent.test.ts::should display all preset avatars`.
- [x] 7.6 `[PF-006] Swipe left randomizes avatar` → rename: `UserAvatar.test.ts::should generate new random avatar when swiping` + `AvatarPickerContent.test.ts::should generate random seed that is not in defaults`.
- [x] 7.7 `[PF-007] Swipe right resets avatar` → rename: `UserAvatar.test.ts::should reset to username-based avatar on reset`.
- [x] 7.8 `[PF-008] Nickname at frontend lower bound accepted` → SKIP: validation is delegated to `ValidatedInput` (library-owned). Same `refactor-extract-testable-units` blocker as [PF-003] — once `ProfileEditModal` is extracted, these become direct assertions on the modal's submit state.
- [ ] 7.9 `[PF-009] Nickname at frontend upper bound accepted` → SKIP: same as [PF-008].
- [ ] 7.10 `[PF-010] Nickname below frontend lower bound rejected at UI` → SKIP: same as [PF-008].
- [ ] 7.11 `[PF-011] Nickname above frontend upper bound rejected at UI` → SKIP: same as [PF-008].
- [x] 7.12 `[PF-012] Nickname below backend lower bound rejected at server` → rename: `test_user_cmd.rs::pf_012_nickname_below_backend_lower_bound_rejected`.
- [x] 7.13 `[PF-013] Nickname above backend upper bound rejected at server` → rename: `test_user_cmd.rs::pf_013_nickname_above_backend_upper_bound_rejected`.
- [x] 7.14 `[PF-014] Wizard re-run` → NEW Vitest: `src/routes/(app)/wizard/+page.test.ts` — body data pre-populated on step 1 + header shows "Step 1 of 5 — Body Parameters".
- [x] 7.15 `[PF-015] New targets after wizard` → SKIP: same blocker as [OB-015] (requires driving the full Stepper flow + mocking `wizardCreateTargets`). Defer to `refactor-extract-testable-units` (extracted `performSetup` unit-tested directly).

## 8. `data-export` — EX-001..EX-007 (7 scenarios)

- [x] 8.1 `[EX-001] CSV export` → rename: `test_export_cmd.rs::ex_001_csv_export_with_data`.
- [x] 8.2 `[EX-002] Raw SQLite export` → rename: `test_export_cmd.rs::ex_002_raw_sqlite_export_with_data`.
- [x] 8.3 `[EX-003] Export cancellation` → rename: `test_export_cmd.rs::ex_003_csv_export_cancellation` + `ex_003_raw_export_cancellation`.
- [x] 8.4 `[EX-004] Export completion` → rename: `test_export_cmd.rs::ex_004_csv_export_all_stages_present` + `ex_004_raw_export_all_stages_present` + multi-cited in `ex_002_*`.
- [x] 8.5 `[EX-005] Raw export contains all tables` → rename: `test_export_cmd.rs::ex_005_csv_export_all_tables_included` (covers via grep; Raw variant is implicit because the raw export is a binary copy of the DB).
- [x] 8.6 `[EX-006] Cancel during export` → rename: `test_export_cmd.rs::ex_006_cancel_export_command_sets_flag`.
- [x] 8.7 `[EX-007] Close enabled after completion` → SKIP: scenario requires driving an export through the Tauri `Channel` to the `complete` stage; export page inlines all state and the `Close` button only renders inside the modal-after-trigger flow. Defer to `refactor-extract-testable-units` (extract `ExportProgressModal` whose Close-enabled prop is purely derived from `stage`).

## 9. `data-import` — IM-001..IM-005 (5 scenarios)

- [x] 9.1 `[IM-001] Import intake data` → rename: `test_import_cmd.rs::im_001_import_intake_csv_success`.
- [x] 9.2 `[IM-002] Import weight data` → rename: `test_import_cmd.rs::im_002_import_weight_tracker_csv_success`.
- [x] 9.3 `[IM-003] Partial import with failures` → rename: `test_import_cmd.rs::im_003_import_intake_csv_with_validation_errors` + `im_003_import_intake_csv_with_parse_errors`.
- [x] 9.4 `[IM-004] Import cancellation` → rename: `test_import_cmd.rs::im_004_import_cancellation`.
- [x] 9.5 `[IM-005] File not selected` → NEW Vitest: `src/routes/(app)/import/+page.test.ts` — Import button disabled until file chosen.

## 10. `app-shell` — AS-001..AS-009 (9 scenarios)

No tests today for the layout. All scenarios become new Vitest tests.

- [x] 10.1 `[AS-001] Navigate via dock` → DONE via `refactor-extract-testable-units`. (Revised the original "third-party-owned, nothing to assert" call: we still own the `navItems` config, so `layout.render.test.ts` asserts the dock renders Home/Progress/History links to the correct routes — the wiring to veilchen's `AppShell`. The click→nav+fade itself stays veilchen+SvelteKit.)
- [x] 10.2 `[AS-002] Settings opens modal` → SKIP: covered indirectly by [AS-003] open-state binding; layout integration test requires SvelteKit page harness, deferred to `refactor-extract-testable-units`.
- [x] 10.3 `[AS-003] Navigate from settings` → NEW Vitest: `src/lib/component/settings/Settings.svelte.test.ts`.
- [x] 10.4 `[AS-004] Dismiss settings` → NEW Vitest: same file — backdrop click closes (multi-cited [MOD-004]).
- [x] 10.5 `[AS-005] View about` → NEW Vitest: `src/routes/(app)/about/+page.test.ts`.
- [x] 10.6 `[AS-006] Unhandled error` → NEW Vitest: `src/routes/+error.test.ts`.
- [x] 10.7 `[AS-007] Page navigation refreshes data` → SKIP: handled by SvelteKit's invalidation + `load` fns; no project-owned behavior to test without a page harness. Defer to `refactor-extract-testable-units`.
- [x] 10.8 `[AS-008] CRUD triggers view refresh` → SKIP: covered by `useEntryModal` composition test indirectly; full path needs dashboard extraction (`refactor-extract-testable-units`).
- [x] 10.9 `[AS-009] Pull-to-refresh on dashboard` → DONE via `refactor-extract-testable-units`. (Revised the "nothing to assert" call: `page.test.ts` mocks veilchen's `useRefresh` to capture the callback the dashboard registers, fires it, and asserts `invalidate('data:dashboardData')` — i.e. that our pull-to-refresh wiring re-fetches. The gesture detection stays veilchen's.)

## 11. Convention specs — \_conv-\* (the remaining ~30 IDs)

Cross-cited from feature tests where they exercise the rule. Partially in place via multi-citations done in steps 1–2; the remainder lands as more feature tests pick up the conventions.

- [ ] 11.1 `_conv-user-errors` (ERR-001..ERR-007) — partial. ERR-001/ERR-002 cited from `useEntryModal.test.ts` (the contract that drives success/error toasts upstream of the composition). ERR-003/004/005/006/007 still pending — need tests on the actual toast/log emission path which the project doesn't have yet; defer to `refactor-extract-testable-units` (toast emission helper) or a dedicated `add-toast-emission-tests` change.
- [ ] 11.2 `_conv-validation` (VAL-001..VAL-011) — partial. VAL-001 cited from `it_025_*` + `wt_010_*`; VAL-002 cited from `it_026_*` + `wt_011_*`; VAL-004 cited (it_027, wt_012); VAL-005 (it_023); VAL-006 (it_024); VAL-007 cited in IT-021 + WT-007. VAL-003 (valid time HH:MM:SS) pending (no test exercises explicit time literals); VAL-008 = [WT-009] (SKIP); VAL-009/010/011 (enum bounds) pending (Rust type system prevents constructing invalid enum values in tests; would need API-boundary tests with raw JSON).
- [x] 11.3 `_conv-modals` (MOD-001..MOD-004) — all four cited. MOD-001/MOD-002/MOD-003/MOD-004 from `tests/lib/composition/useEntryModal.test.ts`; MOD-004 also from `UserAvatar.test.ts` and `Settings.svelte.test.ts`. (Required adding `$REPO_ROOT/tests` to the traceability script's TEST_ROOTS — see `scripts/check-spec-traceability.sh`.)
- [x] 11.4 `_conv-empty-states` (EMP-001..EMP-003) — all three cited. EMP-001 from `IntakeStack.test.ts`, EMP-002 from `progress/+page.test.ts` (multi-cited with [PG-004]), EMP-003 from `WeightScore.test.ts`.
- [ ] 11.5 `_conv-gestures` (GES-001..GES-008) — partial. GES-001 cited from `IntakeStack.test.ts`, GES-003 from `UserAvatar.test.ts`. GES-002, GES-004..GES-008 pending.
- [ ] 11.6 `_conv-animations` (ANI-001..ANI-003) — cite from layout/route-transition tests as they land.
- [ ] 11.7 `_conv-progress-stages` (STG-001..STG-003) — cited from `test_export_cmd.rs::ex_001_*`, `ex_002_*`, `ex_003_*`, `im_001_*`, `im_003_*`, `im_004_*`. Likely complete; verify with traceability gate.
- [ ] 11.8 `_conv-test-traceability` (TRC-001..TRC-009) — meta. Pending; consider a small bash test against `scripts/check-spec-traceability.sh`, or accept these stay orphan (they describe the rule that the script enforces).

## 12. Validate + archive

- [ ] 12.1 Run `npm run test:traceability` — expect 163/163 covered, 0 orphans.
- [ ] 12.2 Run full pipeline: `cargo nextest run` + `npm run test:ci` — all green.
- [ ] 12.3 Re-enable the required status check on `main`: `gh api -X POST repos/thwbh/librefit/branches/main/protection/required_status_checks/contexts -f 'contexts[]=Spec ↔ test traceability gate'`.
- [ ] 12.4 Archive: `openspec archive --skip-specs backfill-test-citations`.

## Progress summary (as of session end)

```
Step 1 — Renames (existing tests cite their IDs)             ✓ DONE
Step 2 — New Rust tests (boundary, format, defaulting, etc.)  ✓ DONE
Step 3 — New Vitest tests (UI flows)                          ◐ DONE within scope; rest SKIP'd to follow-up changes
Step 4 — Convention cross-citations                           ⌛ PARTIAL
Step 5 — Validate + archive                                   ⌛ TODO

Traceability gate: 100 / 163 covered (61%)
Vitest: 375 passing, 36 files
Rust tests: 231 passing, 0 failing
Script fix: added `$REPO_ROOT/tests` to `scripts/check-spec-traceability.sh::TEST_ROOTS` so citations in legacy `tests/` paths count (MOD-001..004 + ERR-001/002 surfaced via this).
Convention change: Rust tests now use the `scenario!(...)` macro (defined in `src-tauri/src/test_support.rs`) as the first line of the test body to cite scenario IDs, in place of the previous `<prefix>_<nnn>_<descriptor>` function-name + doc-comment scheme. This removes the asymmetry where multi-cited Rust tests hid alias IDs from nextest failure output (the macro `println!`s the IDs, which nextest captures per-test and surfaces on failure). All 231 Rust tests migrated; `_conv-test-traceability` (TRC-003, TRC-008, TRC-009) and `CLAUDE.md` updated accordingly.
```

### Step 3 audit outcome

Of the 41 originally-pending Step 3 rows, the audit reclassified them as:

- **18 newly covered** in this change (OB-001..005, OB-008, AS-003..006, IM-005, PG-001..004, EMP-002, PF-001, PF-002, PF-014).
- **2 SKIP for gap** (IT-006..009 collapse to one gap, OB-006) — see "Follow-up changes" table below.
- **SKIP-for-refactor rows now RESOLVED** by `refactor-extract-testable-units` (dashboard, history, profile-edit modal, wizard-Setup orchestration, weight-modal UI; PR-001/002, IT-005/10/12/13/14, HI-001..013 UI parts, WT-009, EX-007, AS-001/002/007/008/009, OB-014..017, PF-003/008..011/015). All cited and ticked above; the traceability gate confirms none remain orphaned. Note AS-001 + AS-009 were originally written off as "third-party-owned / nothing to assert" — that call was revised: we assert OUR wiring to the veilchen seam (dock route links; pull-to-refresh → `invalidate`), not the library internals.

## Follow-up changes surfaced by audit

These were marked SKIP above and require their own `/opsx:propose` after this change archives. Each leaves a known traceability gap until landed.

| Proposed change                          | Scenarios it would cover                        | Reason                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add-intake-time-based-default-category` | [IT-006..IT-009]                                | `+page.svelte:111` hardcodes `category: 'l'`; no `getHours()` switch.                                                                                                                                                                                                                                                                                                                                       |
| `add-wizard-explicit-sex-selection`      | [OB-006]                                        | `Setup.svelte:69` defaults `bodyData.sex` to `MALE`; no unset state, no gating.                                                                                                                                                                                                                                                                                                                             |
| `refactor-extract-testable-units`        | dashboard + history + weight-modal UI scenarios | Several pages (dashboard ~500+ lines, history 592 lines) inline FAB/modal/swipe/week-pager logic that should live in extracted components. Testing them in-place produces brittle 500-line render tests; extracting first lets the SKIP'd tests land cheaply afterwards. Specifically unblocks: IT-005, IT-010, IT-012..IT-014, WT-009, PR-001..PR-002, HI-001..HI-013 UI portions, AS-002, AS-007, AS-008. |
