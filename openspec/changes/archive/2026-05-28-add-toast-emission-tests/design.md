## Context

`_conv-user-errors` scenarios `[ERR-003..ERR-007]` are the last functional orphans in the traceability gate. They describe the toast-emission + error-logging layer, not a UI component, so `refactor-extract-testable-units` (which only extracts/tests components) was never their home. `backfill-test-citations` task 11.1 explicitly defers them here.

The behavior already lives in plain, testable functions in `src/lib/api/command-hooks.ts`:

- `createCommandHooks(options)` — returns `CommandHooks` whose `onValidationError` / `onInvokeError` both `logError(...)` and (gated by `showValidationErrors` / `showInvokeErrors`) call `toast.error(...)`; `onSuccess` calls `toast.success(...)` when a `successMessage` is set.
- `createSilentHooks(errorContext)` — returns hooks that `logError(...)` only, never toasting. This is the background-fetch path (`[ERR-003]`).

Both `toast` (from `@thwbh/veilchen`) and `logError` (from `@tauri-apps/plugin-log`) are module imports, so the test mocks them and asserts which side effects fire on each hook path.

## Goals / Non-Goals

**Goals:**

- Cite `[ERR-003]`, `[ERR-004]`, `[ERR-005]` from direct unit tests on `command-hooks.ts`.
- Cite `[ERR-006]`, `[ERR-007]` at the veilchen seam — assert the layout mounts `<ToastContainer>` (the component that owns dismiss + stacking), not the library's internal mechanics.
- Resolve the `[ERR-004]` wording-vs-code mismatch (warning vs error toast).

**Non-Goals:**

- No new production behavior. The only possible code change is a 1-line `toast.error` → `toast.warning` in `onValidationError`.
- Not re-testing veilchen's toast dismissal/stacking internals (the AS-001/AS-009 lesson: verify our wiring at the seam, not the library).
- No spec deltas — `_conv-user-errors` already declares ERR-003..007.

## Decisions

**Mock at the module boundary.** `vi.mock('@thwbh/veilchen')` and `vi.mock('@tauri-apps/plugin-log')`, then assert call counts/arguments. Alternative — a fake `CommandHooks` consumer driving real commands — was rejected as heavier and indirect; the hooks are pure functions, so call them directly.

**ERR-004: fix the code, don't relax the spec.** The convention's requirement heading is "Validation errors presented as warnings" and the scenario says "warning toast" — that is the intended UX. The code emitting `toast.error` is the deviation. Change `onValidationError` to `toast.warning(fullMessage, errorDuration)` so behavior matches the convention, and assert `toast.warning` in the `[ERR-004]` test.

- _Alternative considered:_ rewrite ERR-004 to say "error toast." Rejected — conventions are the source of truth and the warning semantics are deliberate (validation is a correctable user mistake, not a system failure). Bending the spec to match a stray call would be the wrong direction.
- _Confirm during implementation_ that `toast.warning` exists in the installed `@thwbh/veilchen`. If it does not, fall back to relaxing the scenario wording and record that reversal here.

**Relocate the pre-existing test rather than add a new one.** A comprehensive `tests/lib/api/command-hooks.test.ts` (33 cases, no scenario IDs) already exists in the legacy `tests/` tree. Rather than create a second colocated file (duplication), move it to `src/lib/api/command-hooks.test.ts` per the colocation convention (CLAUDE.md), add scenario-ID citations, fix its now-stale `toast.error` validation assertions to `toast.warning`, and delete the legacy copy.

**ERR-006/007 as seam citations.** These are inherently veilchen-owned (swipe-dismiss, vertical stacking). The honest assertion is "the layout renders `<ToastContainer>`." If that can't be asserted beyond mount, document them as veilchen-boundary citations in `tasks.md` rather than forcing deeper assertions.

## Risks / Trade-offs

- **[Risk] `toast.warning` may not exist in veilchen** → confirm before editing; if absent, keep `toast.error` and instead relax ERR-004's wording (and note the flip here). Either path clears the orphan.
- **[Risk] ERR-006/007 add little signal** ("ToastContainer is mounted") → accept it: the convention still needs a citation, and the seam assertion is the correct cheapest layer. Over-asserting library internals would be the worse trade.
- **[Trade-off] The 1-line code change makes this not a pure test-only change** → small, isolated, and aligns code with the documented convention; the win (behavior matches spec) outweighs the scope creep.
