## Why

The 17 feature and convention specs currently describe what LibreFit does in prose, but lack the verifiable acceptance criteria needed to drive end-to-end testing and to serve as a complete behavioral contract. `USE_CASES.md` (952 lines) was authored separately and holds those acceptance criteria in Given/When/Then-ready form. Two sources of truth is one too many. This change folds `USE_CASES.md` into the spec corpus and deletes the standalone catalog so the corpus alone defines behavior.

## What Changes

- Lift every acceptance criterion from `USE_CASES.md` into the matching feature spec as `#### Scenario:` blocks under appropriate `### Requirement:` headings.
- Add new requirements where a use case describes behavior that has no corresponding spec requirement today.
- Distribute cross-cutting use cases (Section 12 "Error Handling", "Cross-Cutting Concerns") into the relevant `_conv-*` specs.
- Decide the fate of the "About Page" section (UC-11.x): fold into `app-shell` or introduce a new `about` capability — pick one in design.md based on the scenarios actually present.
- Delete `USE_CASES.md` on archive.

Non-breaking. No code changes. No new dependencies. Spec contents grow; spec organization is preserved.

## Capabilities

None — this change is a corpus-wide normalization applied directly to live specs (ID assignment, SHALL→scenario refactor, absorption of `USE_CASES.md`). It was archived with `openspec archive --skip-specs` because the work did not fit OpenSpec's delta mechanism cleanly (every requirement would become a MODIFIED block to add IDs, with no behavioral change). See `design.md` for the per-spec mapping of what landed where.

## Impact

- **Specs:** all feature specs and most convention specs gain scenarios; structure of each spec is unchanged.
- **Code:** none.
- **Docs:** `USE_CASES.md` is deleted on archive.
- **Downstream changes:** unlocks `conv-e2e-tests`, which assumes feature spec scenarios are testable acceptance criteria.
