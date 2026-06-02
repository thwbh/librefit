## Context

The previous change (`add-intake-time-based-default-category`, archived 2026-05-26) introduced time-based category defaulting. To pin the meal-window boundaries it added IT-028..IT-032 as separate boundary scenarios while leaving IT-006..IT-009 unchanged as example-hour scenarios. The result is two layers describing the same contract: the example hours + the boundary endpoints. Five extra scenarios for a four-window contract.

## Goals / Non-Goals

**Goals:**

- One scenario per meal window, each encoding its endpoints directly so readers don't have to assemble the contract from multiple scenarios.
- No drift in behavior; the helper and call site stay byte-identical.

**Non-Goals:**

- Adding new behavior, changing window boundaries, or introducing new categories.
- Re-numbering existing scenarios (the no-reuse rule applies).

## Decisions

**Decision 1: Each of IT-006..IT-009 pins its window's endpoints in a single scenario using `WHEN ... AND WHEN ...` form.**

Why: this is the same structure the previous IT-029..IT-031 boundary scenarios used (e.g. `WHEN at 10:59 THEN b AND WHEN at 11:00 THEN l`). Applying it to IT-006..IT-009 means each one fully pins its window without depending on an adjacent boundary scenario.

Alternative considered: keep the example-hour single-WHEN form and rely on IT-028..032 for boundaries. Rejected — that's the current state we're refactoring away from.

**Decision 2: REMOVE IT-028..IT-032 rather than keep them as redundant duplicates.**

Why: every boundary they pin is also pinned by the rewritten IT-006..IT-009. Keeping both would re-introduce the same readability problem this change is solving.

Trade-off: the IDs IT-028..IT-032 are burned (never reusable per `_conv-test-traceability`). That's the cost of one iteration on the spec shape.

**Decision 3: Snack (IT-009) is described as "all hours outside the meal windows" rather than enumerating its boundaries.**

Why: Snack is the negative case — it owns "everything else." Enumerating both wrap-around endpoints (`21:00 → s`, `04:59 → s`) plus a midpoint (`02:00 → s`) gives test coverage; describing the window as "outside meal windows" matches how the helper actually implements it (default branch after three positive checks).

## Risks / Trade-offs

- **Risk:** IT-028..032 citations in the test file become orphan-test-citations after the spec change → **Mitigation:** the tests are updated in the same change. The traceability gate tolerates test citations of non-existent scenario IDs; it only fails on the inverse (spec scenarios without test citations).
- **Risk:** Someone reading git blame on the spec sees IT-028..032 introduced and then removed within two days → **Mitigation:** that's the point of openspec iteration. The archived `add-intake-time-based-default-category` and this change together tell the full story.
