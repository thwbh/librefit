## Why

The just-archived `add-intake-time-based-default-category` change pinned the four meal-time windows via _five additional_ boundary scenarios (IT-028..IT-032) layered on top of the existing example-hour scenarios (IT-006..IT-009). The result is correct but redundant — readers have to combine nine scenarios to derive a four-window contract. Rewriting IT-006..IT-009 so each one encodes its window's endpoints directly produces the same contract in four scenarios, with no boundary inference required.

## What Changes

- Rewrite scenarios IT-006..IT-009 so each one pins the _endpoints_ of its meal window (and IT-009 captures "all hours outside the meal windows"), not just a single example hour.
- REMOVE redundant boundary scenarios IT-028..IT-032 from `intake-tracking`. Their numbers are burned per the no-reuse rule.
- Update the existing helper tests in `tests/lib/api/category.spec.ts` to mirror the new scenario shapes (each IT-006..IT-009 test asserts both endpoints + a midpoint).
- No code change to `src/lib/api/category.ts` or `src/routes/(app)/+page.svelte` — the behavior is unchanged; this change is a spec refactor + test renumber.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `intake-tracking`: scenarios IT-006..IT-009 reworded; IT-028..IT-032 removed.

## Impact

- Spec: `openspec/specs/intake-tracking/spec.md` — the `Add intake entry` requirement block.
- Tests: `tests/lib/api/category.spec.ts` — 5 `it(...)` cases citing IT-028..IT-032 are removed; the 4 cases citing IT-006..IT-009 are expanded to cover the window endpoints.
- Traceability: scenario count drops from 168 to 163 (IT-028..032 removed). Covered count drops by 5 too. Net coverage stays at 104 / 163 against the live spec.
- No user-visible UX change. No code behavior change.
