## Why

Several feature scenarios across `intake-tracking`, `weight-tracking`, `history`, `plan-review`, `profile`, `onboarding`, `data-export`, and `app-shell` cannot be cited by tests today because the behavior lives inline in 500+ line route files (`dashboard/+page.svelte`, `history/+page.svelte`, `wizard/+page.svelte`, `profile/+page.svelte`, `export/+page.svelte`) that mix FABs, modals, swipe handlers, week pagers, and Tauri command orchestration into a single component. Testing them in place would require brittle 500-line render harnesses that mock five-plus Tauri commands; the `backfill-test-citations` change marked ~21 scenarios SKIP for this reason. Extracting small testable units lets those scenarios land cheaply afterwards and closes the traceability gap to ~163/163.

## What Changes

- Extract dashboard FAB + intake create/edit/delete flow into a standalone component (or composable) so `IntakeFab` + `IntakeModal` can be unit-tested without rendering the full dashboard.
- Extract dashboard plan-review expand/collapse into `PlanReviewPanel` so its toggle behavior is testable in isolation.
- Extract weight create/edit flow on the dashboard into `WeightModal`, mirroring `IntakeMask`'s shape, so frontend lower-bound rejection ([WT-009]) is assertable.
- Extract `wizard/Setup.svelte`'s `performSetup` orchestration into a pure-ish function (returns either an error or all three created targets) so [OB-015], [OB-016], [OB-017], [PF-015] can be unit-tested without driving the full `Stepper`.
- Extract `wizard/+page.svelte` step-4 title derivation into a pure helper so [OB-014] becomes a one-line assertion.
- Extract `history/+page.svelte` (592 lines) into `HistoryWeek` (week pager + swipe across week boundary) and `HistoryDayCard` (single day card with badges, swipe-to-edit/delete, weight read-out) so [HI-001]..[HI-013] UI parts are testable.
- Extract `profile/+page.svelte`'s edit flow into `ProfileEditModal` whose submit-state is testable directly (unblocks [PF-003], [PF-008]..[PF-011]).
- Extract `export/+page.svelte`'s progress modal into `ExportProgressModal` so [EX-007] (Close enabled after completion) becomes a derived-prop assertion.
- Backfill the previously-SKIP'd tests as part of this change (one Vitest file per extracted unit). Section 11 convention citations that depended on these extractions ([GES-002, 004..008], [ANI-001..003], [VAL-008]) get cited from the new tests.

**Non-goals**

- No spec scenarios change. Every requirement and acceptance criterion in `openspec/specs/<feature>/spec.md` stays as-is. Scenario IDs are not renumbered.
- No visual or interaction redesign. Extractions must produce the same DOM and the same user-observable behavior.
- Not changing the Tauri command surface, the Diesel schema, or any Rust code. This is purely a frontend structural refactor plus the unit tests it unlocks.
- Not introducing a new state-management library or pattern. Extracted components receive props and emit callbacks the way the rest of the codebase already does.
- Not addressing the toast/log emission gap ([ERR-003..ERR-007]); that splits out into a separate `add-toast-emission-tests` change.

## Capabilities

### New Capabilities

_None._ This is a structural refactor; no new behavior is introduced.

### Modified Capabilities

_None._ No requirement-level behavior changes. Affected feature specs (`intake-tracking`, `weight-tracking`, `history`, `plan-review`, `profile`, `onboarding`, `data-export`, `app-shell`) keep their current scenarios unchanged — this change only makes the existing scenarios reachable from Vitest. Convention specs (`_conv-gestures`, `_conv-animations`, `_conv-validation`) also remain unchanged; their pending IDs simply gain citations from the new component tests.

## Impact

- **Code** — net-new components under `src/lib/component/` (`intake/IntakeFab.svelte`, `intake/IntakeModal.svelte`, `dashboard/PlanReviewPanel.svelte`, `weight/WeightModal.svelte`, `wizard/setup-orchestration.ts` + `wizard/title.ts`, `history/HistoryWeek.svelte`, `history/HistoryDayCard.svelte`, `profile/ProfileEditModal.svelte`, `export/ExportProgressModal.svelte`). Each route file (`dashboard`, `history`, `wizard`, `profile`, `export`) shrinks substantially and becomes a thin composition layer.
- **Tests** — ~25 new Vitest files / cases colocated next to the extracted units per the test layout convention. Citations land in the new tests; the traceability gate (`scripts/check-spec-traceability.sh`) is expected to move from 100/163 to ~150+/163 once this change ships.
- **APIs / Tauri commands** — unchanged.
- **Dependencies** — none added.
- **Risk** — behavior-preserving refactor; mitigated by (a) extracting one unit at a time, (b) running `npm run test:ci` + `cargo nextest run` after each extraction, (c) manual smoke of each affected route after extraction. Largest single risk is `history/+page.svelte` (week-boundary swipe interacts with the SvelteKit `load` function); design.md will spell out the extraction boundary.
- **Follow-ups** — once this lands, `backfill-test-citations` archives cleanly with the convention gaps closed except those owned by `add-toast-emission-tests`.
