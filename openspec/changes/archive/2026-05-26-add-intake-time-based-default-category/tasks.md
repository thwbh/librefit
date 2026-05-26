## 1. Helper

- [x] 1.1 Add `defaultCategoryForHour(hour: number): string` to `src/lib/api/category.ts` implementing the windows from the spec delta (05–10 → b, 11–14 → l, 15–20 → d, else s).
- [x] 1.2 Add a convenience wrapper `defaultCategoryForDate(date: Date): string` that calls `defaultCategoryForHour(date.getHours())`.

## 2. Wire into the dashboard

- [x] 2.1 In `src/routes/(app)/+page.svelte::getBlankEntry`, replace the hardcoded `category: 'l'` with `category: defaultCategoryForDate(new Date())` and import the helper.

## 3. Tests

- [x] 3.1 Extended `tests/lib/api/category.spec.ts` with `it(...)` cases citing `[IT-006]`, `[IT-007]`, `[IT-008]`, `[IT-009]`.
- [x] 3.2 Added boundary tests citing `[IT-028]` (breakfast lower bound 05:00), `[IT-029]` (b/l boundary 10→11), `[IT-030]` (l/d boundary 14→15), `[IT-031]` (d/s boundary 20→21), `[IT-032]` (snack range 04 → s).

## 4. Verify

- [x] 4.1 `npm run test` — 382 / 382 passing (+7 from this change).
- [x] 4.2 `npm run test:traceability` — covered count 100 → 104 (IT-006..009 newly credited; IT-028/029 are pre-cited against the spec delta and will credit at archive).
- [x] 4.3 `cargo nextest run` from `src-tauri/` — 231 / 231 passing (no regression).

## 5. Archive

- [x] 5.1 `openspec archive add-intake-time-based-default-category` once the change merges to `main`.
