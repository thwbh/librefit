## 1. Data model & migrations

- [x] 1.1 Migration hardening `exercise`: add `slug TEXT UNIQUE`, `verified BOOLEAN NOT NULL DEFAULT 0`, and an `added` (date) + `time` creation stamp (split two-column local date/time, matching intake/weight_tracker); backfill seeded rows with a stable `slug` and `verified = 1`. (Category stays NOT NULL with an `'uncategorized'` sentinel — see design note; pure ALTER ADD avoids an unsafe FK-parent rebuild.)
- [x] 1.2 Update Diesel `schema.rs`; `exercise` exposes `slug` + `verified` + `added` + `time`

## 2. Backend — exercises

- [x] 2.1 Single guarded exercise-mutation choke-point in the repository (`Exercise::ensure_user`): refuses writes to slug-bearing (seeded) rows [WO-028]
- [x] 2.2 Command to create a user exercise with full metadata: `slug = NULL`, verified once complete [WO-029]
- [x] 2.3 Command to create a name-only exercise: `slug = NULL`, `verified = 0`, `added`/`time` set [WO-034]
- [x] 2.4 Edit user exercise command; flip `verified = 1` when category + muscles are present [WO-030, WO-035]
- [x] 2.5 Delete user exercise command; refuse when referenced by a logged set per `_conv-user-errors` [WO-031, WO-032]
- [x] 2.6 Library query returns seeded + user rows, tags source (`slug IS NULL` → `seeded`), and exposes `verified` [WO-012, WO-013, WO-033]

## 3. Backend — maintenance

- [x] 3.1 Unverified-exercise count + listing (with `added`/`time`) commands for the avatar indicator [DH-019, DH-021]
- [x] 3.2 Batch-tag command: apply one category/muscle to a set of exercise ids in one transaction; flip `verified` when complete [WO-041]
- [x] 3.3 Undo support for batch-tag (revert the last application) [WO-042]

## 4. API bindings

- [x] 4.1 New commands surfaced through generated `$lib/api` bindings (build.rs/tauri-typegen); types regenerated and verified. (BatchTag switched to a flat struct so the tagged-enum binding round-trips correctly.)

## 5. Frontend — exercises

- [x] 5.1 Quick-add in the in-session exercise picker: name-only, selects in place, session stays active, no metadata form [WO-036]
- [x] 5.2 Exercise add/edit screen (name, category, muscles primary/secondary, default rest) per `_conv-modals` / `_conv-validation` [WO-029, WO-030] (`ExerciseFormModal.svelte`; promotes Ghosts via the verified flip [WO-035]; in-modal `AlertBox` feedback so messages don't render behind the dialog)
- [x] 5.3 Picker/search marker distinguishing user vs seeded exercises [WO-033]; seeded edit/delete disabled in UI [WO-028]
- [x] 5.4 Delete flow with referenced-exercise error per `_conv-user-errors` [WO-031, WO-032] (guarded delete in `ExerciseFormModal.svelte` edit mode)
- [x] 5.5 Dedicated library-management screen `routes/(app)/exercises` (linked from Settings): browse/edit/delete all user exercises (seeded excluded, read-only) [WO-028, WO-030, WO-031] — the entry point for verified user exercises, which the quick-fix (unverified-only) doesn't reach

## 6. Frontend — maintenance

- [x] 6.1 Avatar indicator on the dashboard with count [DH-019] and graceful-decay states [DH-020]; clears when none [DH-021] (`AvatarMaintenanceIndicator.svelte`, 48h one-step decay window)
- [x] 6.2 Quick-action entry from the indicator into the quick-fix workspace [DH-022]
- [x] 6.3 Batch-tagging workspace: multi-select + contextual tag bar with staged tag + explicit Apply [WO-041], in-modal Undo per `_conv-user-errors` [WO-042], empty state per `_conv-empty-states` [WO-043] (`ExerciseQuickFix.svelte`; feedback via in-modal `AlertBox`, not a layout snackbar — it would render behind the dialog)

## 7. Tests (traceability — every scenario cited)

- [x] 7.1 Rust integration tests for exercise create/edit/delete/guards and verification flips, each citing its WO id via `scenario!` [WO-028–WO-032, WO-034, WO-035; WO-012/013/033 data] (`tests/cmd/test_exercise_cmd.rs`, all green)
- [x] 7.2 Rust integration tests for unverified count and batch-tag/undo [WO-041, WO-042; DH-019/021 data] (green)
- [x] 7.3 Vitest component tests: quick-add [WO-036] + picker marker [WO-033]; add/edit screen [WO-029, WO-030, WO-035], delete guard [WO-031, WO-032], batch-tagging UI [WO-041, WO-042], empty state [WO-043]
- [x] 7.4 Vitest tests for the dashboard avatar indicator and quick-fix entry [DH-019..DH-022] (`AvatarMaintenanceIndicator.svelte.test.ts`)
- [x] 7.5 Run the traceability lint to confirm every new WO/DH scenario is cited (`npm run lint:traceability` green: 227/227 covered)
