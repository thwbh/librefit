## 1. ESLint plugin scaffold (rule 1)

- [x] 1.1 Create `tools/eslint-plugin-librefit/index.js` exporting `{ rules: { 'validation-from-schema': rule } }`.
- [x] 1.2 Implement the rule in `tools/eslint-plugin-librefit/validation-from-schema.js`: visit `CallExpression` where callee is `useFieldValidity`; locate the `validate` property's function body; report when it contains a `BinaryExpression` with a numeric `Literal` operand (`>=`/`<=`/`<`/`>` against a number, covers `.length` comparisons) or a `Property` named `message` whose value is a string `Literal`. Message points at `$lib/api/gen/types`. Severity surfaced via config, not the rule.
- [x] 1.3 Add `tools/README.md` documenting each rule and how to suppress with rationale (eslint-disable line + comment) for genuine migrations.

## 2. Wire the plugin into ESLint (rule 1)

- [x] 2.1 In `eslint.config.js`, register the local plugin. **Refinement during impl:** the existing config did NOT parse `.svelte` at all and applied the recommended rule sets globally. To add svelte linting without unleashing those sets, scoped the base `pluginJs`/`tseslint` recommended configs to `JS_TS` only, then added a `**/*.svelte` block with `parser: svelte-eslint-parser` + `parserOptions.parser: tseslint.parser` (needed for `<script lang="ts">`) running ONLY `librefit/validation-from-schema: warn`. Plus a `JS_TS` block for the rule. Both rule blocks `ignores` test files (they legitimately hand-roll validators).
- [x] 2.2 Confirmed `npm run lint` is back to the pre-existing baseline (39 unrelated errors) with **0** `validation-from-schema` warnings and **0** new svelte parse errors.

## 3. Rule 2 — scenario-ID format + uniqueness

- [x] 3.1 Added `scripts/check-spec-ids.mjs`: each `#### Scenario:` begins with `[PREFIX-NNN]` matching the spec's `**ID prefix:**`, NNN zero-padded to 3 digits, IDs **unique** per spec, every `_conv-*` declares a prefix. **Refinement during impl:** dropped positional _monotonicity_ — it contradicts the documented convention that a scenario keeps its ID when moved between requirements (onboarding's OB-018..020 sit before OB-008..017). Uniqueness ("numbers never get reused") is the real invariant.

## 4. Rule 3 — test file layout

- [x] 4.1 Added `scripts/check-test-layout.mjs`: flags `src/**/*.test.ts` with no colocated sibling and any `+`-prefixed test under `src/routes/`. **Refinement during impl:** a test counts as colocated if a base-name sibling exists OR a same-dir `./` import resolves — so aggregation tests like `target.test.ts` (which exercise generated `./gen` commands, no `target.ts`) are not false-positived.

## 5. Umbrella command

- [x] 5.1 Added npm scripts: `lint:specs`, `lint:tests`, and `lint:conventions`. **Refinement during impl:** `lint:conventions` runs eslint with a dedicated **`eslint.conventions.config.js`** (only the librefit rules, no recommended sets) rather than the full `eslint ./src`, so it reports convention violations exclusively and stays green despite ~39 pre-existing unrelated lint errors in the tree.

## 6. Tests + traceability (rule 1 carries VAL-015/016)

- [x] 6.1 Added `tools/eslint-plugin-librefit/validation-from-schema.test.ts` (vitest): runs the rule through the real svelte parser via ESLint's `Linter` (flat config). `[VAL-015]` asserts both `handRolledBound` + `handRolledMessage` fire on a hand-rolled callback; `[VAL-016]` asserts 0 violations on a `safeParse`-delegating callback. (Namespace-imported the svelte parser for vite ESM interop.)
- [x] 6.2 Added `$REPO_ROOT/tools` to `TEST_ROOTS` in `scripts/check-spec-traceability.sh`.
- [x] 6.3 Gate green at 160/0 now; VAL-015/016 live in the change delta until archive syncs them into `_conv-validation` (then 162). Citations confirmed discoverable under `tools/`.

## 7. Validate

- [x] 7.1 `npm run lint:conventions` exits 0 on the current tree.
- [x] 7.2 `npm run test:ci` green — 493 tests / 54 files pass (incl. VAL-015/016). Removed a stray `tsc`-emitted `validation-from-schema.test.js` (CJS duplicate of the `.ts`) that a compile-on-save watcher had produced and which broke under vitest.
- [x] 7.3 Sanity-checked via CLI on an in-tree fixture: a hand-rolled `validate` produced 2 warnings (bound + message); fixture removed.

## 8. Archive

- [x] 8.1 `openspec archive add-convention-lint-rules` (this change HAS spec deltas — VAL-015/016 — so do NOT use `--skip-specs`; let it sync into `_conv-validation`).
