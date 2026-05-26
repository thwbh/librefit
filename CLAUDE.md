# LibreFit — AI Working Instructions

Stack: Tauri 2 + SvelteKit 5 + Rust + Diesel + SQLite. Mobile target is Android. Frontend uses Tailwind v4 + DaisyUI + the `@thwbh/veilchen` component library.

## Source of truth

**Specs in `openspec/specs/` are the single source of truth for application behavior and requirements.** Read the relevant spec(s) before proposing a change. If a behavior is not in the specs, it is not yet a requirement — propose it explicitly.

- Feature specs: `openspec/specs/<feature>/spec.md` (e.g. `intake-tracking`, `wizard`, `history`)
- Cross-cutting conventions: `openspec/specs/_conv-*/spec.md` — these are **hand-written**, not produced via the openspec change workflow. They sort to the top because of the underscore prefix; the prefix is the only thing carrying that ordering, no priority is implied between conventions.

## Scenario IDs (traceability convention)

Every spec declares an **ID prefix** in its `## Purpose` section. Every `#### Scenario:` heading begins with `[<PREFIX>-<NNN>]`, where `NNN` is a zero-padded three-digit monotonically increasing number scoped to that spec.

```markdown
## Purpose

**ID prefix:** `WT`

...

#### Scenario: [WT-007] Weight below lower bound rejected

- **WHEN** a weight of 29.9 kg is submitted
- **THEN** the backend returns a validation error
```

Rules:

- Numbers are **flat per spec** (not nested per requirement); a scenario keeps the same ID even if it moves between requirements.
- Numbers **never get reused** — removed scenarios leave gaps. New scenarios take the next free number.
- Every test (Rust, Vitest) MUST be traceable to one or more scenario IDs, surfaced where the runner prints them on failure. For Vitest, use the literal bracketed form in `it(...)`: `it('[IT-005] add intake creates entry', ...)`. For Rust, call the `scenario!` macro (defined in `src-tauri/src/test_support.rs`) as the first line of the test body — `scenario!("[IT-021]", "[VAL-007]");` — and let the function name describe the _behavior_, not the ID: `fn amount_below_lower_bound_rejected()`. nextest captures the macro's stdout per-test and prints it on failure, so every cited ID surfaces in CI output. See `_conv-test-traceability` for the authoritative rule.
- Concrete values (ranges, lengths, formats) live **inside scenarios**, not inside the SHALL prose. A scenario is a test case; the SHALL describes the behavior. Keep SHALLs behavioral and short.
- **Test layout.** Vitest tests live **colocated** as `<name>.test.ts` (or `<name>.svelte.test.ts` when the test uses runes) next to the source file they exercise — e.g. `src/lib/api/category.test.ts` next to `category.ts`, `src/lib/component/intake/IntakeMask.test.ts` next to `IntakeMask.svelte`. For SvelteKit route files, **drop the `+` prefix** on the test (`src/routes/welcome/page.test.ts`, not `+page.test.ts`); the `+` prefix is reserved by SvelteKit and breaks the dev server. Shared test infrastructure (`TestWrapper.svelte`, mocks, polyfills, `setup.ts`) stays under `tests/`. Rust integration tests follow the standard `src-tauri/tests/<cmd|repo>/test_*.rs` layout.

The current prefix registry:

| Spec            | Prefix |     | Spec                      | Prefix |
| --------------- | ------ | --- | ------------------------- | ------ |
| onboarding      | `OB`   |     | `_conv-user-errors`       | `ERR`  |
| intake-tracking | `IT`   |     | `_conv-validation`        | `VAL`  |
| weight-tracking | `WT`   |     | `_conv-modals`            | `MOD`  |
| plan-review     | `PR`   |     | `_conv-empty-states`      | `EMP`  |
| history         | `HI`   |     | `_conv-gestures`          | `GES`  |
| progress        | `PG`   |     | `_conv-animations`        | `ANI`  |
| profile         | `PF`   |     | `_conv-progress-stages`   | `STG`  |
| data-export     | `EX`   |     | `_conv-test-traceability` | `TRC`  |
| data-import     | `IM`   |     |                           |        |
| app-shell       | `AS`   |     |                           |        |

## Change workflow

For any non-trivial change to behavior, use OpenSpec:

- `/opsx:explore` — think through ideas before committing to a proposal
- `/opsx:propose` — create a change with proposal + design + tasks
- `/opsx:apply` — implement the tasks
- `/opsx:archive` — finalize once shipped

Conventions do **not** go through this flow — write the spec file directly under `openspec/specs/_conv-<topic>/spec.md`.

## Release versioning

CalVer in the form `YY.WW.MICRO` (e.g. `26.05.0`). Android `versionCode` is `YYWWMMMM`. See `docs/release.md` for the automation details.

## Notes for future-you

- Several long planning docs that used to live at the repo root (prop drilling analysis, state management refactor, error handling implementation, test coverage summaries) have been deleted — their conclusions are now either applied in code, captured as convention specs (e.g. `_conv-user-errors`), or pending as OpenSpec changes.
- `USE_CASES.md` will be absorbed into feature spec scenarios via the `reconcile-specs-from-use-cases` change and then deleted.
- Test traceability is enforced by `_conv-test-traceability` (prefix `TRC`): every spec scenario must be cited by at least one test, at the cheapest correct layer (Rust integration, Vitest component, etc.). End-to-end testing was evaluated and dropped — see the archived `conv-e2e-tests` change for the journey and the conditions to revisit.
