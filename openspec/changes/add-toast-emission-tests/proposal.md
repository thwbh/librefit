## Why

`_conv-user-errors` scenarios `[ERR-003..ERR-007]` are the last functional orphans in the traceability gate (alongside a few backend `VAL-*` items owned by `backfill-test-citations`). They describe the toast-emission + error-logging layer, not any UI component, so the `refactor-extract-testable-units` change — which only extracts/test components — was never their home. This change gives them one.

The behavior already lives in testable code: `src/lib/api/command-hooks.ts` exposes `createCommandHooks` (emits `toast.error` / `toast.success` via veilchen and logs) and `createSilentHooks` (logs only, no toast). These are plain functions returning `CommandHooks` — directly unit-testable by mocking veilchen's `toast` and the logger and asserting which side effects fire on each hook path. No new production code is required; this is a pure test-citation backfill.

## What Changes

Add `src/lib/api/command-hooks.test.ts` covering:

- **`[ERR-003]`** Background fetch fails → no toast, logged. `createSilentHooks(...).onInvokeError(err)` calls `logError` and does NOT call `toast.error`.
- **`[ERR-004]`** Validation violation → toast with the validator's message. `createCommandHooks({ showValidationErrors: true }).onValidationError(zodErr)` calls `toast` with the formatted Zod message (prefixed by `errorContext` when set). _Note:_ the spec says "warning toast" but the code emits `toast.error` — flag during implementation; either adjust the code to `toast.warning` or relax the scenario wording. Decide in `tasks.md`.
- **`[ERR-005]`** Any API failure → logged with type + context label. Both `createCommandHooks` and `createSilentHooks` `logError` an entry containing the `errorContext` label on validation and invoke errors.

For the veilchen-owned `ToastContainer` UI behaviors, assert OUR wiring at the layer boundary (the AS-001/AS-009 lesson — verify the library suits our needs at the seam, don't re-test the library internals):

- **`[ERR-006]`** Dismiss a toast → removed. Assert the layout renders `<ToastContainer>` (the component that owns swipe/click-to-dismiss); the dismissal mechanics are veilchen's.
- **`[ERR-007]`** Multiple toasts stack. Same wiring assertion; stacking layout is veilchen's.

If ERR-006/007 can't be meaningfully asserted beyond "ToastContainer is mounted," document them as veilchen-boundary citations in `tasks.md` rather than forcing deeper assertions.

## Capabilities

None. No spec deltas — `_conv-user-errors` already declares ERR-003..007. This change only adds test citations and (possibly) a one-line `toast.error`→`toast.warning` fix for ERR-004. Archive with `--skip-specs` (mirrors `backfill-test-citations`).

## Impact

- **New test:** `src/lib/api/command-hooks.test.ts` (~6-8 cases). Mocks `@thwbh/veilchen` (`toast`) and the log sink.
- **Possible 1-line code change:** `toast.error` → `toast.warning` in `onValidationError` if we honor ERR-004's "warning toast" wording.
- **Traceability gate:** clears `[ERR-003..ERR-007]` — combined with `backfill`'s remaining `VAL-003/009/010`, brings the gate to full green.
- **No runtime behavior change** (unless the ERR-004 wording fix is taken).
