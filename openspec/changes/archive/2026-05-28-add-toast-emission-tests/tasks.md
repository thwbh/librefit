## 1. ERR-004 code/spec alignment

The convention (`_conv-user-errors` → "Validation errors presented as warnings", `[ERR-004]`) says validation errors surface as a **warning** toast, but `command-hooks.ts:onValidationError` emits `toast.error`. Decision (design.md): fix the code, keep the spec. `toast.warning(message, duration)` exists in the installed `@thwbh/veilchen` (confirmed in `dist/components/toast/toast.svelte.d.ts`), so the change is a 1-line swap.

- [x] 1.1 In `src/lib/api/command-hooks.ts`, change `onValidationError` in `createCommandHooks` from `toast.error(fullMessage, errorDuration)` to `toast.warning(fullMessage, errorDuration)`. (Only the validation path; `onInvokeError` stays `toast.error`.)

## 2. Direct unit tests — `src/lib/api/command-hooks.test.ts`

New colocated Vitest file mocking `@thwbh/veilchen` (`toast`) and `@tauri-apps/plugin-log` (`error` as `logError`). Each `it(...)` embeds its bracketed scenario ID per `_conv-test-traceability`.

- [x] 2.1 `[ERR-003]` Background fetch fails → logged, no toast. `createSilentHooks('ctx').onInvokeError(err)` calls `logError` once and never calls any `toast.*`. Add a companion assertion that `onValidationError` on silent hooks also stays toast-free.
- [x] 2.2 `[ERR-004]` Validation violation → warning toast with validator message. `createCommandHooks({ errorContext: 'Save failed' }).onValidationError(zodErr)` calls `toast.warning` (NOT `toast.error`) with a message that includes the formatted Zod text, prefixed by the `errorContext` label. Add a second case with no `errorContext` asserting the bare message, and one with `showValidationErrors: false` asserting no toast fires.
- [x] 2.3 `[ERR-005]` Any error logged with type + context label. Parametrize over both hook factories and both error paths (`onValidationError`, `onInvokeError`): each `logError` call contains the error-type tag (`[Validation Error]` / `[Invoke Error]`) and the `errorContext` label. Multi-cite `[ERR-005]` alongside the relevant ERR-003/004 ids where the same assertion covers them.

## 3. Seam citations — `src/routes/(app)/layout.render.test.ts`

ERR-006 (dismiss) and ERR-007 (stacking) are veilchen-owned mechanics. Per the AS-001/AS-009 lesson, assert only OUR wiring: the layout mounts `<ToastContainer>` (`+layout.svelte:66`). Do not re-test veilchen's swipe/stack internals.

- [x] 3.1 `[ERR-006]` `[ERR-007]` Add a case to `layout.render.test.ts` asserting the rendered layout mounts `ToastContainer` (the component that owns dismiss + vertical stacking). If the existing veilchen mock makes the container un-queryable, assert via the mock that `ToastContainer` is referenced/instantiated; document in this file if the assertion can't go deeper than "mounted."

## 4. Validate

- [x] 4.1 `npm run test:ci` (or the command-hooks + layout files) green; new `it(...)` IDs print on failure. (Full Vitest: 491 passing, 53 files.)
- [x] 4.2 `npm run test:traceability` — `[ERR-003..ERR-007]` no longer orphaned. (Remaining 3 orphans VAL-003/009/010 belong to `backfill-test-citations` task 11.2, not this change.)
- [x] 4.3 Archive with `openspec archive --skip-specs add-toast-emission-tests` (no spec deltas; mirrors `backfill-test-citations`).
