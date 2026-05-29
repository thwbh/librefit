## ADDED Requirements

### Requirement: No hand-rolled duplication of schema constraints

Frontend validation predicates SHALL NOT re-express bounds or error messages already declared in the generated Zod schemas. The repository's lint tooling SHALL flag direct numeric/string comparisons and string-literal `message` values inside `validate` callbacks as violations, and SHALL suggest the equivalent schema reference from `$lib/api/gen/types`.

This complements [VAL-014] (which is user-observable: the displayed message matches the schema). [VAL-015] is implementation-shape: the predicate IS the schema, not a parallel re-statement of its rules.

#### Scenario: [VAL-015] Lint rule catches hand-rolled bounds in validate callbacks

- **WHEN** a `useFieldValidity({ validate })` callback contains a numeric comparison against a literal bound (e.g. `parsed >= 30`, `value.length <= 40`) or returns a string-literal `message` value
- **THEN** `npm run lint:conventions` reports it as a violation
- **AND** the report includes a pointer to the matching schema in `$lib/api/gen/types`

#### Scenario: [VAL-016] Lint rule passes for schema-driven validators

- **WHEN** a `validate` callback delegates to `safeParse` on a schema imported from `$lib/api/gen/types` and surfaces `result.error.issues[0].message`
- **THEN** `npm run lint:conventions` does not report a violation for that callback
