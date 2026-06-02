# Convention lint tooling

Static checks that enforce code-shape conventions which spec scenarios can't
express well (see the `add-convention-lint-rules` change and `_conv-*` specs).
Run all of them with:

```sh
npm run lint:conventions
```

## Rules

### 1. `librefit/validation-from-schema` (ESLint, severity `warn`)

Lives in `eslint-plugin-librefit/`. Flags a `useFieldValidity({ validate })`
callback that re-expresses bounds or messages already declared in the generated
Zod schemas:

- a numeric/length comparison against a literal (`value.length <= 40`, `parsed >= 30`)
- a string-literal `message` value (`{ ok: false, message: 'Too short' }`)

The expected shape delegates to a schema from `$lib/api/gen/types`:

```ts
const result = schema.safeParse(value);
return result.success ? { ok: true } : { ok: false, message: result.error.issues[0].message };
```

Enforces `_conv-validation` `[VAL-014]`/`[VAL-015]`/`[VAL-016]`.

### 2. `scripts/check-spec-ids.mjs` (`npm run lint:specs`)

Scenario-ID hygiene across `openspec/specs/*/spec.md`: every `#### Scenario:`
begins with `[PREFIX-NNN]` matching the spec's declared `**ID prefix:**`, NNN is
zero-padded to three digits and monotonically increasing per spec (gaps allowed,
collisions not), and every `_conv-*` spec declares an `**ID prefix:**`.

### 3. `scripts/check-test-layout.mjs` (`npm run lint:tests`)

Test-file layout: `*.test.ts` must be colocated next to a sibling source file,
and no `+`-prefixed test file (`+page.test.ts`, ...) may live in `src/routes/`
(the `+` prefix is reserved by SvelteKit and breaks the dev server).

## Suppressing a finding

Only when genuinely warranted (e.g. legacy code mid-migration), disable the
ESLint rule on the offending line with a rationale:

```ts
// eslint-disable-next-line librefit/validation-from-schema -- migrating FooModal to schema in PR #123
```

The script-based rules (2, 3) have no inline suppression — fix the spec/file
instead, since they guard repo-wide invariants.
