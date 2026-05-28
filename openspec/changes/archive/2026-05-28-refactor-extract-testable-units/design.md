## Context

Five SvelteKit route files concentrate behavior that the feature specs describe as discrete scenarios:

| Route                                                                            | Lines     | Concentrates                                                                                                                                     |
| -------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/routes/(app)/+page.svelte` (dashboard)                                      | 431       | intake FAB, intake/weight create-edit-delete modals, plan-review expand/collapse, pull-to-refresh wiring                                         |
| `src/routes/(app)/history/+page.svelte`                                          | 592       | week pager, swipe-across-week-boundary, day card with category badges and weight read-out, swipe-to-edit/delete, intake-on-historical-date modal |
| `src/routes/(app)/wizard/+page.svelte` + `src/lib/component/wizard/Setup.svelte` | 115 + 450 | step-4 title derivation; `performSetup` orchestrates ~5 sequential Tauri commands and rolls back on failure                                      |
| `src/routes/(app)/profile/+page.svelte`                                          | 148       | swipe-to-edit + inline edit form for nickname/avatar                                                                                             |
| `src/routes/(app)/export/+page.svelte`                                           | 345       | export progress modal whose `Close` button is gated on `stage === 'complete'`                                                                    |

The `backfill-test-citations` change cited ~100 / 163 scenarios; the remaining 21 SKIP rows all share the same root cause — the unit under test is not addressable as a component, only as a fully-rendered route with a Tauri command harness. Test traceability (`_conv-test-traceability`) requires every scenario to be cited at the cheapest correct layer. For these scenarios the cheapest correct layer is "a small Svelte component" — which doesn't yet exist.

The codebase already uses small focused components elsewhere (`IntakeMask.svelte`, `IntakeStack.svelte`, `WeightScore.svelte`, `UserAvatar.svelte`), each with colocated `.test.ts`. This refactor extends that pattern to the remaining route files.

## Goals / Non-Goals

**Goals:**

- Every previously-SKIP'd scenario in `backfill-test-citations` becomes citable from a Vitest file colocated with the extracted unit, per the test-layout convention.
- Each extracted component owns one concern: a single modal, a single panel, a single day card, a single orchestration function. Props in, callbacks out.
- The DOM and observable behavior of each affected route is preserved bit-for-bit. The traceability gate (`scripts/check-spec-traceability.sh`) moves from 100/163 toward ~150+/163 without any spec edit.
- Convention citations that depended on the extractions ([GES-002, 004..008], [ANI-001..003], [VAL-008]) land in the new component tests.

**Non-Goals:**

- No state-management library, no global store rework. Extracted components consume props and emit callbacks; the parent route keeps owning the data fetched by `load`.
- No visual or interaction redesign. CSS classes, gesture thresholds, animation timings stay the same.
- No Tauri or Rust changes.
- No change to scenario IDs, requirements, or SHALLs in any spec.
- Not addressing `[ERR-003..ERR-007]` (toast/log emission); split into a separate `add-toast-emission-tests` change.

## Decisions

### D1. Extraction granularity = "one component per modal / panel / orchestrated flow"

Extract the smallest unit that makes a SKIP'd scenario testable. Specifically:

- `IntakeFab.svelte` — the floating action button + its click handler.
- `IntakeModal.svelte` — the create/edit/delete modal for intake entries (wraps `IntakeMask` + save/cancel/delete buttons + `useEntryModal` composition).
- `WeightModal.svelte` — same shape for weight entries; isolates [WT-009] (UI lets value below backend lower bound through).
- `PlanReviewPanel.svelte` — the expandable plan-review card; isolates [PR-001] / [PR-002].
- `HistoryWeek.svelte` — week pager + week-boundary swipe ([HI-001]..[HI-004], [HI-006], [HI-007]).
- `HistoryDayCard.svelte` — single day card with category badges, weight read-out, swipe-to-edit/delete ([HI-005], [HI-008]..[HI-013]).
- `ProfileEditModal.svelte` — nickname + avatar edit submit-state ([PF-003], [PF-008..PF-011]).
- `ExportProgressModal.svelte` — progress UI with derived Close-enabled prop ([EX-007]).
- `wizard/setup-orchestration.ts` — `performSetup(input, deps)` returns `{ ok: true, targets } | { ok: false, error }`; the function injects the five Tauri commands so the test can mock them without touching `Stepper` ([OB-015..017], [PF-015]).
- `wizard/title.ts` — pure `deriveStep4Title(input): string` ([OB-014]).

**Alternatives considered:**

- _Page object pattern in Vitest._ Rejected — still requires rendering 500+ lines of unrelated DOM per test and mocking the full `load` function.
- _Storybook stories as the test surface._ Rejected — adds a dependency, and the project's traceability gate already greps `.test.ts` files.
- _One big "DashboardShell" / "HistoryShell" extraction._ Rejected — re-creates the original testability problem at the next level down.

### D2. Component contracts — props in, callbacks out, no internal `load` calls

Every extracted Svelte component takes its data via props (`$props()`) and reports user actions via callback props (`onsave`, `oncancel`, `ondelete`, `onweekchange`). No extracted component imports `$app/navigation`, `$app/stores`, or calls Tauri commands directly. Side-effecting orchestration (Tauri commands, `goto`) stays in the route file or in an injectable helper (`wizard/setup-orchestration.ts`).

**Why:** This is what makes the components testable without a SvelteKit harness. It also localizes the seam between presentational and orchestration code, matching how `IntakeStack`, `WeightScore`, and `UserAvatar` are already shaped.

**Alternative considered:** Letting components reach into `$page` / `goto` directly. Rejected — would force every test to stub SvelteKit modules and reproduces today's coupling at a smaller scale.

### D3. `performSetup` becomes pure-ish via dependency injection

`Setup.svelte`'s setup flow today inlines:

```
invoke('create_user_profile', ...) → invoke('create_weight_tracker_entry', ...) → wizardCreateTargets(...) → goto('/')
```

Extract as:

```ts
type SetupDeps = {
  createUserProfile: typeof invoke<...>;
  createWeightEntry: typeof invoke<...>;
  wizardCreateTargets: typeof invoke<...>;
  // ...
};
async function performSetup(input: WizardInput, deps: SetupDeps): Promise<SetupResult> { ... }
```

`Setup.svelte` wires the real Tauri `invoke` calls at the call site; tests pass mock functions. The rollback path ([OB-016]) becomes a one-test assertion: mock `wizardCreateTargets` to throw, assert prior steps' compensating actions fire.

**Alternative considered:** Mock `@tauri-apps/api/core` at the module level. Rejected — module-level mocks leak across tests and don't compose well when one test needs a different mock per command.

### D4. History page extraction order: `HistoryDayCard` first, then `HistoryWeek`

`HistoryDayCard` has fewer cross-component dependencies (it just renders props). Extract it first, citing [HI-005], [HI-008..HI-013] from its test. Then extract `HistoryWeek` (which composes `HistoryDayCard`) and cite the week-navigation scenarios. Doing this in reverse would force re-doing `HistoryWeek`'s internals when `HistoryDayCard` peels off.

### D5. Tests land in the same PR as the extraction

Each extraction commit includes (a) the new component, (b) the parent route updated to compose it, (c) the colocated `.test.ts` citing the now-reachable scenario IDs. **No "extract now, test later"**: the whole point of the change is making the SKIP'd tests citable; deferring the test means the gate doesn't move.

### D6. Convention constraints to preserve

- `_conv-modals` — extracted modals must still satisfy [MOD-001..MOD-004] (escape closes, backdrop click closes, focus trap, scroll lock). The existing `useEntryModal` composable already encodes this; extracted modals consume it.
- `_conv-gestures` — swipe thresholds and directions in `HistoryDayCard` and `ProfileEditModal` must match the existing `swipe-*` action wrappers. Citations for [GES-002, GES-004..GES-008] land in the new tests.
- `_conv-animations` — modal open/close timings stay on the existing Svelte transition primitives; [ANI-001..ANI-003] cite from the new modal tests.
- `_conv-validation` — `WeightModal` keeps the existing frontend `min`/`max` props; the test for [VAL-008] / [WT-009] verifies the frontend permits a value below the backend bound (the documented gap).
- `_conv-test-traceability` — every new test calls `it('[XX-NNN] …', …)` per [TRC-003].

## Risks / Trade-offs

- **[Risk]** Behavior drift during extraction (off-by-one in swipe direction, missing `aria-*`, lost focus return) → **Mitigation:** extract one component per commit; run `npm run test:ci` + manual smoke of the affected route between commits; the new component test asserts the same DOM the old route asserted via DevTools snapshot review.
- **[Risk]** `HistoryWeek` extraction interacts with the SvelteKit `load` function (week boundary triggers data refresh via `invalidate`). Pulling pager state into a child component without breaking `load` invalidation is the trickiest piece → **Mitigation:** keep `invalidate` calls in the route file; `HistoryWeek` emits `onweekchange(weekStart)` and the route owns the data fetch.
- **[Risk]** `performSetup` extraction subtly changes execution order (e.g., parallelizing what was sequential) → **Mitigation:** the extraction is a textual move; sequence is preserved verbatim. Test asserts the order via mock call recording.
- **[Risk]** PR size sprawls past reviewable → **Accepted, not mitigated.** Ship the whole refactor as a single PR. For a project of this size the stacked-PR overhead is not worth the smaller per-PR diff; the per-commit isolation inside the PR (one extracted unit per commit) is enough to bisect any regression.
- **[Trade-off]** ~9 new files under `src/lib/component/`. Slight surface-area increase, offset by 1000+ lines moved out of route files. Net code volume is roughly flat; cognitive complexity per file drops sharply.
- **[Trade-off]** A handful of currently-private helpers in route files become exported from the new components. Acceptable — they were already implicitly part of the page's API surface; making it explicit is the whole point.

## Migration Plan

This is a frontend-only structural refactor; no data migration. Rollout:

1. Land each extraction (component + parent update + colocated test) as an independent commit.
2. After each commit, run `npm run test:ci` and `cargo nextest run` — both must stay green.
3. After the final extraction, run `npm run test:traceability`; expect ≥150 / 163 covered.
4. The remaining gap is `[ERR-003..ERR-007]` plus a few VAL/TRC orphans; these are explicit non-goals and handed off as follow-up changes.

**Rollback:** each extraction is independently revertable (single commit, no schema or API change). If a regression surfaces post-merge, revert the offending commit; the route file's previous inline implementation is restored verbatim.

## Resolved Questions

- **Modal shape.** `IntakeModal` and `WeightModal` both compose `@thwbh/veilchen`'s `ModalDialog` and the `useEntryModal` composable. They stay as parallel components — no shared `EntryModal` wrapper — because the abstraction beyond what `ModalDialog` + `useEntryModal` already provide isn't free.
- **State ownership.** The route owns state in every extraction. `HistoryWeek` receives `weekStart` as a prop and reports navigation via `onweekchange`; it does not own its own index. `ProfileEditModal` receives `open` and `profile` as props. Extracted components are presentational; routes keep `load`, `invalidate`, and Tauri command wiring.
- **Swipe ownership.** Swipe gestures stay in the route. Extracted modals only know about `open` / `closed`. For `ProfileEditModal` specifically, the swipe-to-open lives in `profile/+page.svelte` and is asserted via the route's existing affordance assertion; the modal test only covers submit/cancel/validation.
