## 1. Update the helper tests to match the new scenario shape

- [x] 1.1 Rewrote IT-006..IT-009 `it(...)` cases in `tests/lib/api/category.spec.ts` to assert window endpoints + a midpoint.
- [x] 1.2 Removed IT-028..IT-032 `it(...)` cases.
- [x] 1.3 Cleaned up the only remaining stray citation (a doc comment in `src/lib/api/category.ts`).

## 2. Verify

- [x] 2.1 `npm run test` — green (6 tests for `defaultCategoryForHour`, all passing).
- [x] 2.2 `npm run test:traceability` — 104 / 168 pre-archive (IT-028..032 are now orphan because their citations were removed but the spec still has them). Will land at 104 / 163 post-archive once the delta merges and IT-028..032 disappear from the live spec.
- [x] 2.3 `cargo nextest run` — no Rust files touched; previous run was green.
- [x] 2.4 `openspec validate revise-intake-default-category-scenarios --strict` — passes.

## 3. Archive

- [x] 3.1 `openspec archive revise-intake-default-category-scenarios` once the change merges to `main`.
