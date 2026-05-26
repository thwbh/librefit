## Notation

Each row: `[XX-NNN] descriptive name → ACTION`

Where ACTION is one of:

- **`rename: <file>::<fn-or-test>`** — existing test covers the scenario; rename to include the ID per `[TRC-003]`.
- **`rename: <file>::<test1> + <file>::<test2>`** — multiple existing tests cover the scenario, all get the ID citation.
- **`NEW <layer>: <file>`** — no existing coverage; write a new test at the indicated layer.
- **`SKIP: <reason>`** — scenario cannot be covered without infrastructure that's out of scope (used sparingly; almost everything has a correct layer).

For Rust renames, the new function name follows `<prefix_lower>_<nnn>_<short_descriptor>` and a `/// [XX-NNN] <name>` doc comment is added.
For Vitest renames, the literal bracketed form is embedded in the `it(...)` name.

## 1. `onboarding` — OB-001..OB-017 (17 scenarios)

The wizard's UI flow has no Vitest coverage today; most scenarios need new tests against `Setup.svelte`, `Body.svelte`, `ActivityLevel.svelte`, `Rate.svelte`, `TargetWeight.svelte`, `Finish.svelte`. The classification math is covered by Rust.

- [ ] 1.1 `[OB-001] First launch with no profile` → NEW Vitest: `src/routes/(app)/+layout.test.ts` — assert redirect when `userProfile` is null.
- [ ] 1.2 `[OB-002] Get Started navigation` → NEW Vitest: `src/routes/welcome/+page.test.ts` — assert `goto('/setup')` on button click.
- [ ] 1.3 `[OB-003] Direct access to protected route` → NEW Vitest: same `+layout.test.ts` — assert 307 to `/welcome`.
- [ ] 1.4 `[OB-004] Unprotected routes remain accessible` → NEW Vitest: `+layout.test.ts` — assert `/welcome` and `/setup` are not guarded.
- [ ] 1.5 `[OB-005] Valid body information advances wizard` → NEW Vitest: `src/lib/component/wizard/Body.test.ts` — fill valid fields, click Next, assert step advance.
- [ ] 1.6 `[OB-006] Sex must be explicitly selected` → NEW Vitest: same file — Next disabled until sex chosen.
- [ ] 1.7 `[OB-007] Avatar defaults to name seed` → rename: `src/lib/component/profile/UserAvatar.test.ts::should show username-based avatar when avatar is empty` (the existing test covers this verbatim).
- [ ] 1.8 `[OB-008] Activity level selection` → NEW Vitest: `src/lib/component/wizard/ActivityLevel.test.ts`.
- [ ] 1.9 `[OB-009] Standard weight loss recommendation` → rename: `test_wizard_cmd.rs::calculate_obese_classification_for_men` + `calculate_obese_classification_for_women`.
- [ ] 1.10 `[OB-010] Standard maintenance recommendation` → NEW Rust test: `test_wizard_cmd.rs::ob_010_bmi_in_hold_range_yields_hold`. (No existing test exercises BMI 20–25 → HOLD.)
- [ ] 1.11 `[OB-011] Weight gain recommendation` → rename: `test_wizard_cmd.rs::calculate_underweight_classification_for_men` + `calculate_underweight_classification_for_women`.
- [ ] 1.12 `[OB-012] Low-normal BMI alert` → rename: `test_wizard_cmd.rs::return_underweight_warning`.
- [ ] 1.13 `[OB-013] Rate selection for weight loss` → rename: `test_wizard_cmd.rs::calculate_weight_loss_for_men`.
- [ ] 1.14 `[OB-014] Target weight selection for hold` → NEW Vitest: `src/lib/component/wizard/Setup.test.ts` — render with HOLD recommendation, assert Step 4 title and TargetWeight component.
- [ ] 1.15 `[OB-015] Successful setup completion` → NEW Vitest: `Setup.test.ts` — drive happy path, assert redirect to `/`.
- [ ] 1.16 `[OB-016] Setup failure with rollback` → NEW Vitest: `Setup.test.ts` — mock `wizard_create_targets` to throw, assert error state + retry button visible.
- [ ] 1.17 `[OB-017] Atomic target creation` → rename or NEW Rust: search `test_wizard_cmd.rs` for transaction-style tests (e.g. `calculate_target_weight_date`); if none cover atomicity, NEW Rust: `ob_017_targets_created_in_single_transaction`.

## 2. `intake-tracking` — IT-001..IT-027 (27 scenarios)

Strong existing coverage in `IntakeScore.test.ts`, `IntakeStack.test.ts`, `IntakeMask.test.ts`, `test_intake_cmd.rs`, `test_intake_repo.rs`.

- [ ] 2.1 `[IT-001] No intake tracked` → rename: `IntakeScore.test.ts::should show 0 when entries is empty` + `IntakeStack.test.ts::should display empty state when no entries`.
- [ ] 2.2 `[IT-002] Intake within target` → rename: `IntakeScore.test.ts::should show ShieldCheck icon when within target` + `should calculate percentage correctly`.
- [ ] 2.3 `[IT-003] Intake above target but below maximum` → rename: `IntakeScore.test.ts::should show warning color when over target`.
- [ ] 2.4 `[IT-004] Intake above maximum` → rename: `IntakeScore.test.ts::should show error color when over maximum` + `should show critical warning when over maximum`.
- [ ] 2.5 `[IT-005] Create intake from dashboard` → NEW Vitest: `src/routes/(app)/+page.test.ts` (dashboard) — FAB click + save flow against `+page.svelte`.
- [ ] 2.6 `[IT-006] Category auto-selection at breakfast time` → NEW Vitest: `IntakeMask.test.ts` — set system time to 08:00, assert default category 'b'.
- [ ] 2.7 `[IT-007] Category auto-selection at lunch time` → NEW Vitest: same file, 13:00 → 'l'.
- [ ] 2.8 `[IT-008] Category auto-selection at dinner time` → NEW Vitest: same file, 18:00 → 'd'.
- [ ] 2.9 `[IT-009] Category auto-selection outside meal hours` → NEW Vitest: same file, 02:00 → 's'.
- [ ] 2.10 `[IT-010] Cancel without saving` → NEW Vitest: dashboard test — cancel asserts no entry created.
- [ ] 2.11 `[IT-011] Edit via long press` → rename: `IntakeStack.test.ts::should call onEdit when entry is long-pressed`.
- [ ] 2.12 `[IT-012] Save edited entry` → NEW Vitest: dashboard test — drive edit modal save, assert update.
- [ ] 2.13 `[IT-013] Delete with confirmation` → NEW Vitest: dashboard test — confirm dialog flow.
- [ ] 2.14 `[IT-014] Cancel delete` → NEW Vitest: dashboard test — cancel dialog, assert entry remains.
- [ ] 2.15 `[IT-015] Five categories available` → rename: `IntakeMask.test.ts::should show all categories as selectable`.
- [ ] 2.16 `[IT-016] Single category selection` → rename: `IntakeMask.test.ts::should allow category selection` + `should highlight selected category`.
- [ ] 2.17 `[IT-017] Navigate between cards` → rename: `IntakeStack.test.ts::should display entry at current index` (covers the index-based navigation).
- [ ] 2.18 `[IT-018] Empty state` → rename: `IntakeStack.test.ts::should show AlertBox with warning type`.
- [ ] 2.19 `[IT-019] Amount at lower bound accepted` → NEW Rust: `test_intake_cmd.rs::it_019_amount_at_lower_bound_accepted` (amount=1).
- [ ] 2.20 `[IT-020] Amount at upper bound accepted` → NEW Rust: `test_intake_cmd.rs::it_020_amount_at_upper_bound_accepted` (amount=10000).
- [ ] 2.21 `[IT-021] Amount below lower bound rejected` → rename: `test_intake_cmd.rs::test_create_intake_validation_amount_too_low` + `test_intake_repo.rs::test_intake_validation_amount_too_low`.
- [ ] 2.22 `[IT-022] Amount above upper bound rejected` → rename: `test_intake_cmd.rs::test_create_intake_validation_amount_too_high` + `test_intake_repo.rs::test_intake_validation_amount_too_high`.
- [ ] 2.23 `[IT-023] Description at maximum length accepted` → NEW Rust: `test_intake_repo.rs::it_023_description_at_max_length_accepted` (500 chars).
- [ ] 2.24 `[IT-024] Description over maximum rejected` → rename: `test_intake_repo.rs::test_intake_validation_description_too_long`.
- [ ] 2.25 `[IT-025] Date format YYYY-MM-DD accepted` → rename: `test_intake_repo.rs::test_create_intake_entry` (implicitly covers; ID citation here suffices).
- [ ] 2.26 `[IT-026] Invalid date format rejected` → NEW Rust: `test_intake_cmd.rs::it_026_invalid_date_format_rejected`.
- [ ] 2.27 `[IT-027] Time defaults to now` → NEW Rust: `test_intake_cmd.rs::it_027_time_defaults_to_current_when_unset`.

## 3. `weight-tracking` — WT-001..WT-012 (12 scenarios)

- [ ] 3.1 `[WT-001] Weight tracked today` → rename: `WeightScore.test.ts::should display current weight when weightTracker provided` + `should show "Last update: Today" for current day entry`.
- [ ] 3.2 `[WT-002] Weight stale` → rename: `WeightScore.test.ts::should show tap to update when entry is stale` + `should show error state for entries older than 2 days`.
- [ ] 3.3 `[WT-003] Create new weight entry` → rename: `test_weight_cmd.rs::test_create_weight_tracker_entry_success`.
- [ ] 3.4 `[WT-004] Edit existing weight entry` → rename: `test_weight_cmd.rs::test_update_weight_tracker_entry_success`.
- [ ] 3.5 `[WT-005] Weight at backend lower bound accepted` → NEW Rust: `test_weight_cmd.rs::wt_005_weight_at_lower_bound_accepted` (30.0 kg).
- [ ] 3.6 `[WT-006] Weight at upper bound accepted` → NEW Rust: `test_weight_cmd.rs::wt_006_weight_at_upper_bound_accepted` (330.0 kg).
- [ ] 3.7 `[WT-007] Weight below backend lower bound rejected` → rename: `test_weight_cmd.rs::test_create_weight_tracker_entry_validation_weight_too_low` + `test_weight_repo.rs::test_weight_tracker_validation_amount_too_low`.
- [ ] 3.8 `[WT-008] Weight above upper bound rejected` → rename: `test_weight_cmd.rs::test_create_weight_tracker_entry_validation_weight_too_high` + `test_weight_repo.rs::test_weight_tracker_validation_amount_too_high`.
- [ ] 3.9 `[WT-009] UI permits value below backend lower bound` → NEW Vitest: `src/lib/component/weight/WeightMask.test.ts` (or similar) — assert stepper allows 25 kg locally but submit triggers backend error toast.
- [ ] 3.10 `[WT-010] Date format YYYY-MM-DD accepted` → rename: `test_weight_repo.rs::test_create_weight_tracker_entry`.
- [ ] 3.11 `[WT-011] Invalid date format rejected` → NEW Rust: `test_weight_cmd.rs::wt_011_invalid_date_format_rejected`.
- [ ] 3.12 `[WT-012] Time defaults to now` → NEW Rust: `test_weight_cmd.rs::wt_012_time_defaults_to_current_when_unset`.

## 4. `plan-review` — PR-001..PR-006 (6 scenarios)

- [ ] 4.1 `[PR-001] Expand plan review` → NEW Vitest: `src/routes/(app)/+page.test.ts` — accordion expand assertion.
- [ ] 4.2 `[PR-002] Collapse plan review` → NEW Vitest: same file — collapse assertion.
- [ ] 4.3 `[PR-003] Goal reached` → rename: `EncouragementMessage.test.ts::should show goal reached message`.
- [ ] 4.4 `[PR-004] Early days` → rename: `EncouragementMessage.test.ts::should show early start message for new journeys`.
- [ ] 4.5 `[PR-005] Over target intake` → rename: `EncouragementMessage.test.ts::should show above-target message when averaging over`.
- [ ] 4.6 `[PR-006] Near finish line` → rename: `EncouragementMessage.test.ts::should show near-end message when close to finish`.

## 5. `history` — HI-001..HI-013 (13 scenarios)

The history page has no Vitest tests today. All UI scenarios need new tests against `src/routes/(app)/history/+page.svelte` (extract small testable units or render the page).

- [ ] 5.1 `[HI-001] Load current week` → rename: `test_tracker_history_cmd.rs::test_get_tracker_history_success` (covers the backend); NEW Vitest: `src/routes/(app)/history/+page.test.ts` — page load asserts current week's data fetched.
- [ ] 5.2 `[HI-002] Navigate to previous week` → NEW Vitest: same file — left caret click loads prior week.
- [ ] 5.3 `[HI-003] No future data` → NEW Vitest: same file — right caret hidden when no future data.
- [ ] 5.4 `[HI-004] Week header content` → NEW Vitest: same file — month/year + avg daily calories in header.
- [ ] 5.5 `[HI-005] Select a date` → NEW Vitest: same file — pill click updates content area.
- [ ] 5.6 `[HI-006] Swipe between days` → NEW Vitest: same file — simulate swipe event, assert day change. (svelte-gestures behavior — may need to dispatch synthetic events.)
- [ ] 5.7 `[HI-007] Swipe across week boundary` → NEW Vitest: same file — swipe past last day loads next week.
- [ ] 5.8 `[HI-008] Category badges reflect entries` → NEW Vitest: extract a CategoryBadges component test if one exists; else inline.
- [ ] 5.9 `[HI-009] Add intake on historical date` → rename: `test_intake_repo.rs::test_create_intake_entry` (the `added` date is settable); NEW Vitest: same `history/+page.test.ts` — add flow.
- [ ] 5.10 `[HI-010] Edit via swipe` → NEW Vitest: same file — swipe-left dispatch.
- [ ] 5.11 `[HI-011] Delete via swipe` → NEW Vitest: same file — swipe-right dispatch + confirm dialog.
- [ ] 5.12 `[HI-012] Weight exists for date` → rename: `test_weight_repo.rs::test_find_weight_tracker_by_date` (backend); NEW Vitest: same file — UI rendering.
- [ ] 5.13 `[HI-013] No weight for date` → NEW Vitest: same file — "Tap to update" rendered when no weight entry.

## 6. `progress` — PG-001..PG-004 (4 scenarios)

- [ ] 6.1 `[PG-001] Sufficient data renders charts` → rename: `test_progress_cmd.rs::test_get_tracker_progress_success` (data shape); NEW Vitest: `src/routes/(app)/progress/+page.test.ts` — chart canvases rendered with ≥2 days.
- [ ] 6.2 `[PG-002] Chart legends distinguish actual vs target` → NEW Vitest: same file — assert legend labels present.
- [ ] 6.3 `[PG-003] Progress display` → NEW Vitest: same file — Day X of Y + weight summary visible.
- [ ] 6.4 `[PG-004] New user with one day` → rename: `test_progress_cmd.rs::test_get_tracker_progress_empty_trackers` (the data side); NEW Vitest: same file — "Not enough data yet" rendered.

## 7. `profile` — PF-001..PF-015 (15 scenarios)

- [ ] 7.1 `[PF-001] Profile page load` → NEW Vitest: `src/routes/(app)/profile/+page.test.ts`.
- [ ] 7.2 `[PF-002] Swipe to edit` → NEW Vitest: same file — swipe gesture opens edit modal.
- [ ] 7.3 `[PF-003] Save profile changes` → rename: `UserAvatar.test.ts::should call onAvatarChange when confirming selection` + NEW Vitest for name update via profile page.
- [ ] 7.4 `[PF-004] Cancel discards changes` → rename: `UserAvatar.test.ts::should not change avatar when canceling modal` + `should close modal when cancel is clicked`.
- [ ] 7.5 `[PF-005] Picker offers eight options` → rename: `AvatarPickerContent.test.ts::should display all preset avatars`.
- [ ] 7.6 `[PF-006] Swipe left randomizes avatar` → rename: `UserAvatar.test.ts::should generate new random avatar when swiping` + `AvatarPickerContent.test.ts::should generate random seed that is not in defaults`.
- [ ] 7.7 `[PF-007] Swipe right resets avatar` → rename: `UserAvatar.test.ts::should reset to username-based avatar on reset`.
- [ ] 7.8 `[PF-008] Nickname at frontend lower bound accepted` → NEW Vitest: profile name-edit test — 2 chars accepted.
- [ ] 7.9 `[PF-009] Nickname at frontend upper bound accepted` → NEW Vitest: same — 40 chars accepted.
- [ ] 7.10 `[PF-010] Nickname below frontend lower bound rejected at UI` → NEW Vitest: same — 1 char shows validation error.
- [ ] 7.11 `[PF-011] Nickname above frontend upper bound rejected at UI` → NEW Vitest: same — 41 chars rejected.
- [ ] 7.12 `[PF-012] Nickname below backend lower bound rejected at server` → rename: `test_user_cmd.rs::test_update_user_validation_empty_name`.
- [ ] 7.13 `[PF-013] Nickname above backend upper bound rejected at server` → rename: `test_user_cmd.rs::test_update_user_validation_name_too_long`.
- [ ] 7.14 `[PF-014] Wizard re-run` → NEW Vitest: `src/routes/(app)/wizard/+page.test.ts` — body data pre-populated.
- [ ] 7.15 `[PF-015] New targets after wizard` → NEW Vitest: same file — after completion, new targets created (mock the Tauri call, assert it was invoked).

## 8. `data-export` — EX-001..EX-007 (7 scenarios)

- [ ] 8.1 `[EX-001] CSV export` → rename: `test_export_cmd.rs::test_export_csv_with_data`.
- [ ] 8.2 `[EX-002] Raw SQLite export` → rename: `test_export_cmd.rs::test_export_raw_database_with_data`.
- [ ] 8.3 `[EX-003] Export cancellation` → rename: `test_export_cmd.rs::test_export_csv_cancellation` + `test_export_raw_cancellation`.
- [ ] 8.4 `[EX-004] Export completion` → rename: `test_export_cmd.rs::test_export_csv_all_stages_present` + `test_export_raw_all_stages_present` (these verify the Complete stage is reached).
- [ ] 8.5 `[EX-005] Raw export contains all tables` → rename: `test_export_cmd.rs::test_export_csv_all_tables_included` (CSV variant); NEW Rust for the Raw variant: `ex_005_raw_export_contains_all_tables`.
- [ ] 8.6 `[EX-006] Cancel during export` → rename: `test_export_cmd.rs::test_cancel_export_command` + `test_cancellation_reset_on_new_export`.
- [ ] 8.7 `[EX-007] Close enabled after completion` → NEW Vitest: `src/routes/(app)/export/+page.test.ts` — assert Close button disabled until Complete stage; enabled after.

## 9. `data-import` — IM-001..IM-005 (5 scenarios)

- [ ] 9.1 `[IM-001] Import intake data` → rename: `test_import_cmd.rs::test_import_intake_csv_success`.
- [ ] 9.2 `[IM-002] Import weight data` → rename: `test_import_cmd.rs::test_import_weight_tracker_csv_success`.
- [ ] 9.3 `[IM-003] Partial import with failures` → rename: `test_import_cmd.rs::test_import_intake_csv_with_validation_errors` + `test_import_intake_csv_with_parse_errors`.
- [ ] 9.4 `[IM-004] Import cancellation` → rename: `test_import_cmd.rs::test_import_cancellation`.
- [ ] 9.5 `[IM-005] File not selected` → NEW Vitest: `src/routes/(app)/import/+page.test.ts` — Import button disabled until file chosen.

## 10. `app-shell` — AS-001..AS-009 (9 scenarios)

No tests today for the layout. All scenarios become new Vitest tests.

- [ ] 10.1 `[AS-001] Navigate via dock` → NEW Vitest: `src/routes/(app)/+layout.test.ts`.
- [ ] 10.2 `[AS-002] Settings opens modal` → NEW Vitest: same file.
- [ ] 10.3 `[AS-003] Navigate from settings` → NEW Vitest: `src/lib/component/settings/Settings.test.ts`.
- [ ] 10.4 `[AS-004] Dismiss settings` → NEW Vitest: same file — backdrop click closes.
- [ ] 10.5 `[AS-005] View about` → NEW Vitest: `src/routes/(app)/about/+page.test.ts`.
- [ ] 10.6 `[AS-006] Unhandled error` → NEW Vitest: `src/routes/+error.test.ts`.
- [ ] 10.7 `[AS-007] Page navigation refreshes data` → NEW Vitest: a layout-level test asserting page-load handlers run on navigation.
- [ ] 10.8 `[AS-008] CRUD triggers view refresh` → NEW Vitest: dashboard test — after create, list re-renders.
- [ ] 10.9 `[AS-009] Pull-to-refresh on dashboard` → NEW Vitest: `src/routes/(app)/+layout.test.ts` — onrefresh handler triggered.

## 11. Convention specs — \_conv-\* (the remaining ~30 IDs)

These describe cross-cutting rules. Each scenario MAY be cited by a representative test from a feature spec that exercises the rule. Where no feature test naturally covers a convention scenario, a dedicated test under `src-tauri/tests/conventions/` or `src/lib/__conventions__/` is added.

- [ ] 11.1 `_conv-user-errors` (ERR-001..ERR-007) — cite from Vitest tests that exercise toast notification flows.
- [ ] 11.2 `_conv-validation` (VAL-001..VAL-011) — cite from existing Rust validation tests (most overlap with IT-019..IT-027 and WT-005..WT-008 work above).
- [ ] 11.3 `_conv-modals` (MOD-001..MOD-004) — cite from `IntakeMask.test.ts`, `UserAvatar.test.ts`.
- [ ] 11.4 `_conv-empty-states` (EMP-001..EMP-003) — cite from `IntakeStack.test.ts::should display empty state when no entries` and `WeightScore.test.ts::should show tap to update when entry is stale`.
- [ ] 11.5 `_conv-gestures` (GES-001..GES-008) — cite from `IntakeStack.test.ts::should call onEdit when entry is long-pressed` and forthcoming history/swipe tests.
- [ ] 11.6 `_conv-animations` (ANI-001..ANI-003) — cite from layout/route-transition tests (mostly piggybacking on AS-001).
- [ ] 11.7 `_conv-progress-stages` (STG-001..STG-003) — cite from `test_export_cmd.rs::test_export_csv_all_stages_present`, etc.
- [ ] 11.8 `_conv-test-traceability` (TRC-001..TRC-009) — meta. Cite from `scripts/check-spec-traceability.sh` exercising the gate; add a small bash test or skip with `// allow-unattributed` for the script itself.

## 12. Validate + archive

- [ ] 12.1 Run `npm run test:traceability` — expect 163/163 covered, 0 orphans.
- [ ] 12.2 Run full pipeline: `cargo nextest run` + `npm run test:ci` — all green.
- [ ] 12.3 Re-enable the required status check on `main`: `gh api -X POST repos/thwbh/librefit/branches/main/protection/required_status_checks/contexts -f 'contexts[]=Spec ↔ test traceability gate'`.
- [ ] 12.4 Archive: `openspec archive --skip-specs backfill-test-citations`.
