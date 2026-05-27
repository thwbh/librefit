## Notation

Each extraction is "component + parent route update + colocated test, in one commit." Tasks marked **(unblocks …)** cite which previously-SKIP'd scenarios from `backfill-test-citations` become reachable.

Component file paths follow the test-layout convention: tests are colocated as `<Name>.svelte.test.ts` next to the component, and route tests drop the `+` prefix (`page.test.ts`, not `+page.test.ts`).

## 1. Wizard — pure helpers (smallest extraction first)

- [x] 1.1 Extract `deriveStep4Title(input): string` into `src/lib/component/wizard/title.ts` (pure function reading `wizardInput`).
- [x] 1.2 Update `src/routes/(app)/wizard/+page.svelte` to import `deriveStep4Title` for `currentConfig.title` on step 4.
- [x] 1.3 Add `src/lib/component/wizard/title.test.ts` citing `[OB-014]` — hold vs. loss vs. gain title flip.
- [x] 1.4 Extract `performSetup(input, deps): Promise<SetupResult>` into `src/lib/component/wizard/setup-orchestration.ts`. Dependencies injected: `updateUser`, `updateBodyData`, `wizardCreateTargets`, plus optional `onStepStart(step)` for progress-message choreography (the route owns `goto` + fade-out FX per design Decision D2).
- [x] 1.5 Update `src/lib/component/wizard/Setup.svelte` to import `performSetup` and pass real Tauri commands as deps.
- [x] 1.6 Add `src/lib/component/wizard/setup-orchestration.test.ts` citing `[OB-015]` (happy path), `[OB-016]` (rollback when `wizardCreateTargets` throws), `[OB-017]` (all-three persisted), `[PF-015]` (new targets after wizard re-run).

## 2. Export — progress modal

- [x] 2.1 Extract `ExportProgressModal.svelte` into `src/lib/component/export/`. Props: `dialog` (bindable), `message`, `stage`, `progress`, `isExporting`, `filePath`, `bytesInfo`, callbacks `oncancel`, `onclose`. Close is `disabled={isExporting}` (preserved from original to honor Non-Goal "no interaction redesign"; design.md proposed `stage === 'complete'` but that would have been stricter than current shipping behavior).
- [x] 2.2 Update `src/routes/(app)/export/+page.svelte` to compose the new modal. Removed inlined `LoadingIndicator`/`ModalDialog` block + unused `stageIcons`/`stageIcon` derivation + phosphor icons that only lived inside the modal.
- [x] 2.3 Add `src/lib/component/export/ExportProgressModal.svelte.test.ts` — 9 tests citing `[EX-007]` (Close disabled/enabled), `[EX-006]` (Cancel enabled then disabled), `[EX-004]` (file-path alert), `[STG-001..STG-003]` (badge state transitions per progress %).

## 3. Profile — edit modal

- [x] 3.1 Extract `ProfileEditModal.svelte` into `src/lib/component/profile/`. Props: `dialog` (bindable), `entry` (bindable LibreUser | null/undefined), `errorMessage`, callbacks `onsave`, `oncancel`. Owns its `showAvatarPicker` toggle internally; resets the picker view each time the modal opens via `$effect` tracking entry-presence transitions.
- [x] 3.2 Update `src/routes/(app)/profile/+page.svelte` to compose the new modal; swipe-to-open `SwipeableListItem` stays in the route. Removed inline `ModalDialog`/`Avatar`/`ValidatedInput`/`AvatarPickerContent` imports + the route-local `showAvatarPicker` state + `handleCancel` (the modal handles its own reset).
- [x] 3.3 Add `src/lib/component/profile/ProfileEditModal.svelte.test.ts` — 7 tests citing `[PF-003]` (bind:entry round-trips name mutation), `[PF-008]..[PF-011]` (nickname bounds 2/40 enforced via native `minLength`/`maxLength`), `[MOD-001]` (errorMessage surfaces as alert), `[MOD-004]` (avatar click opens picker).

## 4. Weight — modal

- [ ] 4.1 Extract `WeightModal.svelte` into `src/lib/component/weight/`. Props: `open`, `entry`, `min`, `max`, callbacks `onsave`, `oncancel`, `ondelete`.
- [ ] 4.2 Update `src/routes/(app)/+page.svelte` (dashboard) to compose the new modal in place of the inlined weight flow.
- [ ] 4.3 Add `src/lib/component/weight/WeightModal.svelte.test.ts` citing `[WT-009]` / `[VAL-008]` — UI permits a value below the backend lower bound (documented gap; backend rejects). Multi-cite `[MOD-001..MOD-004]` and any relevant `[GES-*]` if swipe-to-delete is on the modal.

## 5. Dashboard — intake FAB + modal + plan-review

- [ ] 5.1 Extract `IntakeFab.svelte` into `src/lib/component/intake/`. Props: callback `onclick`. Renders the floating action button.
- [ ] 5.2 Extract `IntakeModal.svelte` into `src/lib/component/intake/`. Props: `open`, `entry`, `categories`, callbacks `onsave`, `oncancel`, `ondelete`. Wraps `IntakeMask` + save/cancel/delete actions; consumes `useEntryModal`.
- [ ] 5.3 Extract `PlanReviewPanel.svelte` into `src/lib/component/dashboard/`. Props: `plan`, `expanded`, callbacks `ontoggle`.
- [ ] 5.4 Update `src/routes/(app)/+page.svelte` to compose `IntakeFab`, `IntakeModal`, `PlanReviewPanel`. The route owns the data (`load`) and the Tauri command wiring.
- [ ] 5.5 Add `src/lib/component/intake/IntakeFab.svelte.test.ts` citing `[IT-005]` (click invokes onclick → opens create modal — covered by composition assertion).
- [ ] 5.6 Add `src/lib/component/intake/IntakeModal.svelte.test.ts` citing `[IT-010]` (cancel without saving), `[IT-012]` (save edited entry), `[IT-013]` (delete with confirmation), `[IT-014]` (cancel delete). Multi-cite `[MOD-001..MOD-004]`.
- [ ] 5.7 Add `src/lib/component/dashboard/PlanReviewPanel.svelte.test.ts` citing `[PR-001]` (expand), `[PR-002]` (collapse). Multi-cite `[ANI-001..ANI-003]` if the transition primitives are observable.

## 6. History — day card first, then week pager

- [ ] 6.1 Extract `HistoryDayCard.svelte` into `src/lib/component/history/`. Props: `date`, `entries`, `weight`, callbacks `onedit`, `ondelete`, `onaddintake`.
- [ ] 6.2 Update `src/routes/(app)/history/+page.svelte` to use `HistoryDayCard` for each day in the visible week.
- [ ] 6.3 Add `src/lib/component/history/HistoryDayCard.svelte.test.ts` citing `[HI-005]` (select a date — focus/active state), `[HI-008]` (category badges reflect entries), `[HI-009]` UI part (add intake on historical date — fires onaddintake with correct date), `[HI-010]` (edit via swipe — fires onedit), `[HI-011]` (delete via swipe — fires ondelete), `[HI-012]` UI part (weight present), `[HI-013]` UI part (no weight for date). Multi-cite `[GES-002, GES-004..GES-008]` where the test exercises a gesture.
- [ ] 6.4 Extract `HistoryWeek.svelte` into `src/lib/component/history/`. Props: `weekStart`, `days`, callbacks `onweekchange`. Owns swipe-across-week-boundary; `invalidate` stays in the route.
- [ ] 6.5 Update `src/routes/(app)/history/+page.svelte` to compose `HistoryWeek`.
- [ ] 6.6 Add `src/lib/component/history/HistoryWeek.svelte.test.ts` citing `[HI-001]` UI part (current week renders), `[HI-002]` (navigate to previous week — onweekchange fires), `[HI-003]` (no future data — next-week affordance disabled at this week), `[HI-004]` (week header content), `[HI-006]` (swipe between days), `[HI-007]` (swipe across week boundary).

## 7. Cross-cutting test citations to backfill

- [ ] 7.1 Audit which `_conv-gestures` IDs land in the new tests; confirm `[GES-002, GES-004..GES-008]` all have at least one citation. Add missing citations to the closest new component test.
- [ ] 7.2 Audit which `_conv-animations` IDs land in the new tests; confirm `[ANI-001..ANI-003]` have at least one citation each. Add to `PlanReviewPanel.svelte.test.ts` or modal tests as appropriate.
- [ ] 7.3 Cite `[VAL-008]` from `WeightModal.svelte.test.ts` (frontend permits below backend min).
- [ ] 7.4 Re-check `[AS-002]` (settings opens modal — now testable from the dashboard composition), `[AS-007]` (page navigation refreshes data — testable from the route file once data fetching is the only thing left there), `[AS-008]` (CRUD triggers view refresh — testable via the parent's mock `invalidate`). Cite where they land.

## 8. Validate and ship

- [ ] 8.1 Run `npm run test:ci` — all Vitest tests green, including the new ones.
- [ ] 8.2 Run `cargo nextest run` — no Rust regression (this is a frontend-only refactor).
- [ ] 8.3 Run `npm run test:traceability` — confirm gate moves from 100/163 toward ≥150/163. Print the remaining orphans; they should be only `[ERR-003..ERR-007]` (handed off to `add-toast-emission-tests`) plus any TRC/VAL meta-orphans documented as acceptable in `backfill-test-citations` §11.
- [ ] 8.4 Manual smoke each affected route: dashboard (intake create/edit/delete, weight modal, plan-review toggle, pull-to-refresh), history (week navigation, day card swipes, add-intake-on-date), wizard (full 5-step happy path), profile (swipe-to-edit, save, cancel), export (run an export to completion, confirm Close enables).
- [ ] 8.5 If `backfill-test-citations` is still open, return there and tick the previously-SKIP'd rows that this change unblocked; otherwise note in the archive of this change which scenarios it newly covered.
- [ ] 8.6 Archive with `openspec archive --skip-specs refactor-extract-testable-units` (no spec deltas to apply).
