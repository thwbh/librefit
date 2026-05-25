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
- Every test (Rust, Vitest, Playwright) MUST be traceable to one or more scenario IDs. Cite the ID in the test name or a comment so the link survives renames.
- Concrete values (ranges, lengths, formats) live **inside scenarios**, not inside the SHALL prose. A scenario is a test case; the SHALL describes the behavior. Keep SHALLs behavioral and short.

The current prefix registry:

| Spec            | Prefix |     | Spec                    | Prefix |
| --------------- | ------ | --- | ----------------------- | ------ |
| onboarding      | `OB`   |     | `_conv-user-errors`     | `ERR`  |
| intake-tracking | `IT`   |     | `_conv-validation`      | `VAL`  |
| weight-tracking | `WT`   |     | `_conv-modals`          | `MOD`  |
| plan-review     | `PR`   |     | `_conv-empty-states`    | `EMP`  |
| history         | `HI`   |     | `_conv-gestures`        | `GES`  |
| progress        | `PG`   |     | `_conv-animations`      | `ANI`  |
| profile         | `PF`   |     | `_conv-progress-stages` | `STG`  |
| data-export     | `EX`   |     |                         |        |
| data-import     | `IM`   |     |                         |        |
| app-shell       | `AS`   |     |                         |        |

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
- E2E tests are a Definition of Done for every feature spec. The convention and tooling are introduced by the `conv-e2e-tests` change.
