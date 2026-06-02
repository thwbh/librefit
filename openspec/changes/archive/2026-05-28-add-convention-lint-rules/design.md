## Context

Some `_conv-*` conventions describe _code shape_ ("the validator IS the schema") rather than observable behavior. Spec scenarios test the second well and leak around the first. `[VAL-014]` makes the user-observable half testable (displayed message == schema message); the new `[VAL-015]`/`[VAL-016]` deltas capture the code-shape half, enforced by tooling.

Current state worth knowing before building:

- `eslint.config.js` is flat-config and lints **only** `**/*.{js,mjs,cjs,ts}` — it does **not** parse `.svelte` files today, even though `eslint-plugin-svelte` + `svelte-eslint-parser@0.43` are installed. The `validate` callbacks we want to lint live in `.svelte` `<script>` blocks (e.g. `ProfileEditModal.svelte:62`, `WeightModal.svelte`, `IntakeModal.svelte`).
- The schema-driven shape is: `const result = schema.safeParse(value); return result.success ? { ok: true } : { ok: false, message: result.error.issues[0].message };`. A violation is a `validate` callback containing numeric/length comparison literals or a string-literal `message`.
- `scripts/check-spec-traceability.sh` already excludes the `TRC` meta prefix and scans `TEST_ROOTS` that does **not** include `tools/`.

## Goals / Non-Goals

**Goals:**

- Rule 1 (ESLint custom rule): flag hand-rolled bounds/messages in `useFieldValidity` `validate` callbacks; carry `[VAL-015]`/`[VAL-016]`.
- Rule 2 (script): scenario-ID format + monotonicity + `**ID prefix:**` presence across `_conv-*` and feature specs.
- Rule 3 (script): test-file-layout — non-colocated `*.test.ts`, and `+`-prefixed test files inside `src/routes/`.
- A single `npm run lint:conventions` umbrella running all three; green from day one (codebase is already clean post-VAL-014).

**Non-Goals:**

- Not turning on `eslint-plugin-svelte`'s full recommended ruleset — that would surface a flood of pre-existing violations. We add svelte parsing _scoped to our one rule only_.
- No production runtime changes.
- Not gating at pre-commit (husky) — CI-only for the solo-dev pace (proposal open question resolved: CI-only).

## Decisions

**Rule 1 = ESLint custom plugin (`tools/eslint-plugin-librefit/`).** User-selected over a standalone AST script: integrates with `eslint ./src` and editor squiggles. Rule `validation-from-schema`. To reach `.svelte` validators without unleashing the svelte recommended set, add a **targeted** config block to `eslint.config.js`: `files: ['**/*.svelte']`, `languageOptions.parser: svelte-eslint-parser`, `plugins: { librefit }`, and _only_ `'librefit/validation-from-schema': 'warn'` — no `...svelte.configs.recommended`. Also apply the rule to `**/*.svelte.ts` / `**/*.ts` where `useFieldValidity` may live.

- **Severity: `warn` initially** (proposal). Flip to `error` after a few clean PRs confirm zero false positives.
- _Alternative considered:_ standalone script (lighter scaffolding). Rejected per user choice — editor integration + reuse of the existing eslint invocation win.

**Rules 2 & 3 = node scripts, not ESLint.** They operate on `.md` spec files and file-path globs, which ESLint doesn't fit. `scripts/check-spec-ids.mjs` and `scripts/check-test-layout.mjs`. `npm run lint:conventions` runs all three: `eslint ./src` (carrying rule 1) `&&` the two node scripts. The `[VAL-015]` scenario's "`npm run lint:conventions` reports it" is satisfied because eslint runs inside that umbrella.

**Testing rule 1 by executing ESLint on fixtures, not RuleTester.** The scenarios are about end-to-end command behavior. A vitest test (`tools/eslint-plugin-librefit/validation-from-schema.test.ts`) uses the ESLint Node API (`new ESLint({ overrideConfig })` or `Linter`) against two inline `.svelte` fixtures — one hand-rolled (expect a violation, `[VAL-015]`), one schema-driven (expect none, `[VAL-016]`). This avoids RuleTester's svelte-parser wiring friction and tests the actual rule wired through the svelte parser.

- **Traceability wiring:** add `$REPO_ROOT/tools` to `TEST_ROOTS` in `check-spec-traceability.sh` so the `[VAL-015]`/`[VAL-016]` citations in the plugin test are counted. (Mirrors the earlier `tests/` addition.)

**Rules 2 & 3 carry no spec scenarios.** Their motivating rules live in `_conv-test-traceability` (TRC, gate-excluded) and `CLAUDE.md`, not as observable feature behavior. They are tooling-only; no traceability citation is expected or required for them.

## Risks / Trade-offs

- **[Risk] Adding `.svelte` to eslint surfaces unrelated violations** → Mitigate by scoping the svelte block to _only_ `librefit/validation-from-schema` at `warn`; do not extend `svelte.configs.recommended`. Verify `npm run lint` output is unchanged except for the new rule.
- **[Risk] AST detection false-positives/negatives** (e.g. a legitimate non-validation numeric literal) → Scope detection to the `validate` property of a `useFieldValidity({...})` call argument only, and within it flag `BinaryExpression` with numeric `Literal` operands and `Property` named `message` with a string-`Literal` value. Keep `warn` until proven.
- **[Risk] svelte-eslint-parser version drift vs installed svelte** → parser 0.43 is already installed and matches the project's svelte; pin nothing new beyond the local plugin.
- **[Trade-off] Plugin scaffolding for one rule** → accepted (user choice); the `tools/` structure leaves room for future rules.

## Open Questions

- Whether to extend rule 1 to entity-level `useEntryModal` validations once the field-level rule is stable — deferred, not in this change.
- Exact `eslint.config.js` plugin-registration shape for a local (non-published) plugin — resolve during implementation (import the local module and register under the `librefit` namespace).
