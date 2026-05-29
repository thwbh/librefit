## Context

The existing 17 specs (10 feature + 7 convention) described behavior in prose, with thin scenario coverage. `USE_CASES.md` (952 lines) held more granular acceptance criteria as bulleted checklists per use case. Two sources of truth for behavior was one too many. This change folded the use case catalog into the spec corpus and used the opportunity to introduce two cross-cutting normalizations: scenario-level IDs for test traceability, and a refactor of SHALL prose to push concrete values into scenarios.

## Goals / Non-Goals

**Goals:**

- Every acceptance criterion from the use case catalog ends up reflected in the spec corpus, as a `Scenario` under an appropriate `Requirement`.
- Cross-cutting use cases (error handling, validation boundaries, gesture interactions) go to the matching `_conv-*` spec, not the feature specs.
- Every spec declares an ID prefix and every scenario carries a stable `[<PREFIX>-<NNN>]` ID for test traceability.
- SHALL statements describe behavior; concrete values (ranges, lengths, formats) live in scenarios.
- `USE_CASES.md` is deleted on archive.

**Non-Goals:**

- Validating the spec corpus against the running app. That happens during the `conv-e2e-tests` change.
- Capturing implementation references (Tauri command names, Svelte component paths) — those describe the _how_, which does not belong in specs.

## Decisions

### Capability mapping

| Use case area                        | Target spec                                                                                | Notes                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Onboarding (welcome + 5-step wizard) | `onboarding`                                                                               |                                                                                   |
| Daily Intake Tracking                | `intake-tracking`                                                                          |                                                                                   |
| Daily Weight Tracking                | `weight-tracking`                                                                          |                                                                                   |
| Plan Review                          | `plan-review`                                                                              |                                                                                   |
| History                              | `history`                                                                                  |                                                                                   |
| Progress & Analytics                 | `progress`                                                                                 |                                                                                   |
| Profile Management                   | `profile`                                                                                  |                                                                                   |
| Data Export                          | `data-export`                                                                              |                                                                                   |
| Data Import                          | `data-import`                                                                              |                                                                                   |
| Navigation & App Shell               | `app-shell`                                                                                |                                                                                   |
| About Page                           | `app-shell`                                                                                | Folded — too thin to warrant its own spec                                         |
| Global error page                    | `app-shell`                                                                                | Distinct from `_conv-user-errors` (which is about API/validation toasts)          |
| Input Validation Boundaries          | distributed: each feature spec owns its field bounds; `_conv-validation` holds rule shapes | See "Where validation values live" below                                          |
| Data Freshness & Reactivity          | `app-shell`                                                                                | One general convention covering all pages                                         |
| Gesture Interactions                 | `_conv-gestures`                                                                           | Generic navigation gestures; picker-specific semantics (avatar) live in `profile` |

**Decision: no new `about` capability.** Single trivial behavior ("page displays logo, tagline, badges, version"). Folded into `app-shell`. Promote later if it acquires meaningful behavior.

**Decision: error handling has two surfaces, two specs.** `_conv-user-errors` covers toast notifications for API/validation failures. `app-shell` covers the SvelteKit error boundary page for unhandled navigation errors. Different audiences.

### Where validation values live

Concrete per-field bounds (weight 30–330 kg, nickname 2–40 chars, etc.) live **with the field's owning feature spec**, expressed as boundary scenarios (lower-bound accepted, upper-bound accepted, just-below-lower rejected, just-above-upper rejected). `_conv-validation` holds the _rule shapes_ (numeric range, enum, text length, date/time format) and the authoritative-bound principle. The boundary table that existed in the use case catalog is intentionally NOT preserved as a flat reference — values are field-local.

### Scenario ID convention

Every spec declares an `ID prefix:` line under `## Purpose`. Every scenario heading begins with `[<PREFIX>-<NNN>]`, where `NNN` is zero-padded three-digit, monotonically increasing per spec, never reused. The IDs are the contract between specs and tests: every test must cite at least one scenario ID; every scenario should be covered by at least one test (enforcement is part of `conv-e2e-tests`).

### Implementation references are dropped

Tauri command names, Svelte component paths, route file names — none of these are behavioral requirements; they are pointers to the current implementation. They served their purpose during use case authoring and do not survive into the specs.

### Archive shape: `--skip-specs`

This change applied as a corpus-wide normalization (ID assignment + SHALL refactor) directly to the live specs, alongside absorbing the use case catalog. The work did not fit cleanly into the OpenSpec delta mechanism — every requirement would have become a MODIFIED block purely to add IDs to existing scenarios, with no behavioral change. The OpenSpec CLI provides `archive --skip-specs` for exactly this case (per its help: "useful for infrastructure, tooling, or doc-only changes"). This change is archived with that flag; the proposal/design/tasks remain as the audit record. Future changes use the normal delta flow.

## Risks / Trade-offs

- **[Risk] One-time exception to the change-driven workflow** → Mitigation: documented here as a deliberate `--skip-specs` archive; from the next change onward, the corpus is normalized and deltas apply cleanly.
- **[Risk] Some criteria were too granular for a spec (e.g. "icon X displays at position Y")** → Mitigation: filtered to _behavior_, not _appearance_. Visual details belong in implementation or design tokens, not specs.
- **[Risk] Spec growth makes scenarios harder to skim** → Accepted. Scenarios are the test contract; volume is the cost of testability.

## Migration Plan

1. Apply normalization directly to live specs (done in-flight: ID prefixes, scenario IDs, SHALL→scenario refactor, USE_CASES absorption).
2. Delete `USE_CASES.md` from the repo root.
3. Archive the change with `openspec archive --skip-specs reconcile-specs-from-use-cases`.
4. Commit. No code changes; no rollback complexity.

## Open Questions

- None blocking. Three inconsistencies were surfaced during reconciliation and are recorded in `tasks.md §2` for follow-up changes.
