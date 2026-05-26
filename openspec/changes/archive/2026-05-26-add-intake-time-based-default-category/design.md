## Context

`src/routes/(app)/+page.svelte::getBlankEntry` returns a `NewIntake` with `category: 'l'` hardcoded. The `intake-tracking` spec already documents the intended behavior (IT-006..IT-009): the default category should reflect meal time — Breakfast for morning, Lunch for midday, Dinner for evening, Snack outside those windows. The hardcode is a leftover; closing the gap was deferred from `backfill-test-citations` because traceability work should not include feature implementation.

## Goals / Non-Goals

**Goals:**

- New intake entries created from the dashboard FAB default to a category appropriate for the user's local time of day.
- Logic is a pure function so it can be unit-tested at the cheapest correct layer without rendering the dashboard.

**Non-Goals:**

- No change to how categories are persisted, validated, or displayed.
- No user-configurable meal windows (out of scope; spec doesn't currently require it).
- No change to the History page's add-intake flow (the spec ties this default to the dashboard add flow specifically — see IT-006..IT-009 wording).

## Decisions

**Decision 1: Locate the helper in `src/lib/api/category.ts`.**
That file already owns category-related lookups (`getFoodCategoryIcon`, `getFoodCategoryLongvalue`). The helper joins them as small pure functions, testable without Tauri or component harness.

Alternative considered: a Svelte 5 `$derived` inside `+page.svelte`. Rejected because it couples the logic to the page, makes it untestable without rendering the dashboard, and the spec scenarios are pure-function in nature.

**Decision 2: Use the host's local time via `new Date().getHours()`.**
Spec scenarios state times as wall-clock (08:00, 13:00, 18:00, 02:00) without timezone qualification. The dashboard is single-user, single-device, offline-first; "local time" is the only sensible interpretation.

Alternative considered: pass a `Date` argument so the call site decides. Rejected for the dashboard call but adopted for the helper itself — the helper takes a `Date` (or hour number) so tests can inject without `vi.useFakeTimers()`. The dashboard passes `new Date()`.

**Decision 3: Meal windows.**
The four spec scenarios pin specific hours (08:00 → b, 13:00 → l, 18:00 → d, 02:00 → s). They do not pin the boundaries between windows. We pick reasonable boundaries that match the cited example hours:

- 05:00 – 10:59 → Breakfast (`b`)
- 11:00 – 14:59 → Lunch (`l`)
- 15:00 – 20:59 → Dinner (`d`)
- All other hours → Snack (`s`)

These will be documented in the spec delta scenarios and locked in by the tests.

## Risks / Trade-offs

- **Risk:** Users in the boundary hours (e.g. 10:55) see a different default than they expect → **Mitigation:** the category picker is one tap away; defaults are always overridable. Boundaries chosen to be conservative (later than typical mealtimes).
- **Risk:** Travel across timezones could surprise a user mid-trip → **Mitigation:** this is true of any clock-derived feature on a local-only app; acceptable.

## Open Questions

None.
