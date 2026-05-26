## Why

`intake-tracking` spec scenarios [IT-006..IT-009] describe a "category auto-selection at meal time" behavior: when the user opens the add-intake modal, the category should default to Breakfast/Lunch/Dinner/Snack based on the current hour. The code currently hardcodes `category: 'l'` in `src/routes/(app)/+page.svelte::getBlankEntry`. This gap was surfaced by the `backfill-test-citations` traceability audit; closing it removes four orphan scenarios and matches what the spec already documents as the intended behavior.

## What Changes

- New time-of-day → category mapping helper in `src/lib/api/category.ts` (or co-located) that maps an hour-of-day to one of `b`, `l`, `d`, `s`.
- Dashboard `getBlankEntry` in `src/routes/(app)/+page.svelte` calls the helper instead of returning a hardcoded `'l'`.
- Four new Vitest tests citing `[IT-006]`, `[IT-007]`, `[IT-008]`, `[IT-009]` exercise the helper at the documented hours (08:00, 13:00, 18:00, 02:00).
- No DB, schema, or API change. No backwards-compatibility shim needed (the previous behavior was a fallback constant, not a contract).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `intake-tracking`: scenarios IT-006..IT-009 are already documented; this change makes the code conform. The spec deltas tighten the SHALLs that govern the default-category behavior (currently the relevant requirement is implicit in the scenarios).

## Impact

- Code: `src/routes/(app)/+page.svelte` (one function), `src/lib/api/category.ts` (new helper).
- Tests: extend the existing `tests/lib/api/category.spec.ts` — pure-function tests, no Tauri or component harness needed.
- Traceability: closes IT-006..IT-009 against the live spec (orphan → covered), and pre-cites the new boundary scenarios IT-028..IT-032 introduced by the spec delta. Net coverage at archive: 100 → 109 / 168.
- No user-visible UX change for users who pick the category manually; for users who tap save without changing it, the default now matches their meal time instead of always being Lunch.
