## Why

Several conventions in `openspec/specs/_conv-*` describe rules whose shape is "the code should always look like X" rather than "in case Y, behavior is Z." Spec scenarios are good at the second; they leak around the first. The new `[VAL-014]` (frontend validation messages must come from generated Zod schemas) is the immediate example — the rule is testable per-instance via the message text, but nothing prevents a future contributor from re-introducing a hand-rolled predicate that happens to produce a similar string. The dropped `[VAL-015]` (the "no hand-rolled bounds" claim) is the same idea stated negatively, which is exactly the shape tooling fits.

This change adds lightweight static enforcement for the conventions that have repeatedly proven drift-prone, starting with validation and possibly extending to test-layout and spec-ID hygiene as warranted. Tooling here is a **complement** to specs, not a replacement — scenarios remain the source of truth for observable behavior; tooling enforces the code-shape that makes those scenarios cheap to keep true.

## What Changes

Three rules, ordered by ROI:

### 1. Validation predicates must source from generated schemas (high)

Add an ESLint custom rule that flags `useFieldValidity({ validate: ... })` call sites whose `validate` callback contains:

- Numeric comparison literals (`>= NUMBER`, `<= NUMBER`, `< NUMBER`, `> NUMBER`).
- String comparisons against character-length literals (`.length >= NUMBER`, etc.).
- String-literal `message` values inside the returned `{ ok: false, message: '...' }`.

The expected shape calls `safeParse` on a schema from `$lib/api/gen/types` and surfaces `result.error.issues[0].message`. Severity: **warning** initially (the existing codebase is clean post-`VAL-014` work, but the rule should not block CI until we confirm zero false positives over a few PRs); **error** once stable.

Carries `[VAL-014]` enforcement; closes the [VAL-015]-shaped gap that motivated dropping that scenario.

### 2. Scenario ID format + monotonicity (medium)

Extend `npm run test:traceability` (or a sibling `npm run lint:specs`) with checks:

- Every `#### Scenario:` heading begins with `[PREFIX-NNN]` where `PREFIX` matches the `**ID prefix:**` declared in `## Purpose`.
- `NNN` is zero-padded to three digits.
- Within a spec, IDs are monotonically increasing (gaps allowed, collisions not).
- No `_conv-*` spec is missing its `**ID prefix:**` declaration.

Carries `[TRC-003]` enforcement; catches paste mistakes that the human eye misses.

### 3. Test file layout (low)

Glob check, runnable as `npm run lint:tests`:

- Any `*.test.ts` not colocated next to a sibling source file is reported.
- Any `+page.test.ts` / `+layout.test.ts` etc. inside `src/routes/` is reported (the `+` prefix is reserved by SvelteKit and breaks the dev server).

Carries the file-layout sentence in `CLAUDE.md` and `_conv-test-traceability`.

## Capabilities

A small spec delta on `_conv-validation` to either:

- Re-introduce `[VAL-015]` with a clarifying note that enforcement is tool-side (the scenario describes desired code shape; tooling verifies); or
- Leave `_conv-validation` unchanged and let `[VAL-014]` carry the user-observable rule, with the ESLint enforcement living purely in repo tooling (no spec scenario for it).

Decision deferred to design.md when this change is engaged.

## Impact

- **New dev dependency**: an ESLint plugin scaffold under `tools/eslint-plugin-librefit/` (or similar). One custom rule to start; structure ready for the other two.
- **CI**: a new `npm run lint:conventions` (or fold into existing `npm run lint`) — green from day one because the codebase is already clean.
- **Documentation**: a short `tools/README.md` explaining what each rule enforces and how to suppress with rationale when genuinely warranted (e.g. legacy code being migrated).
- **No production runtime changes.** No new component code, no spec deltas to feature specs.

## Open questions

- ESLint vs. a custom node script via `tsc` AST walking — ESLint is the obvious choice but adds plugin scaffolding overhead for a small ruleset. A standalone script might be lighter for this scale. Defer to design.
- Whether to extend to `useEntryModal` validations (the entity-level shape) once the simpler field-level rule is stable.
- Whether to gate at pre-commit (husky) vs. CI-only. CI-only is friendlier for the solo-dev pace this project runs at today; husky becomes valuable when contributor count grows.
