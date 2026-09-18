## 1. Data model & migrations

- [x] 1.1 Migration creating `workout_template` (`id, name, description NULL, is_predefined BOOLEAN, created_at`) + `template_exercise` (ordered: `sequence`, `target_reps NULL` rep-range text, `target_weight_kg NULL`, `notes NULL`, plain `exercise_id` FK); no `user_id`. (Replaced a stale/broken pre-existing `2026-06-03` draft; created via diesel CLI, timestamped after `user_exercises` so slug exists.)
- [x] 1.2 Seed migration for predefined templates (`is_predefined = TRUE`) — Push/Pull/Leg Day, resolving exercises **by slug**
- [x] 1.3 Regenerate Diesel `schema.rs`; confirm the template tables and joinables are present

## 2. Backend

- [x] 2.1 Template CRUD repository + commands (name/description, ordered exercises, target reps/weight, notes) [WO-037] (`WorkoutTemplate` impl + `list/create/update/delete_workout_template` commands)
- [x] 2.2 Clone command: deep-copy a predefined template to a new `is_predefined = FALSE` template; source unchanged; predefined templates not editable [WO-038] (`clone_workout_template`; `ensure_editable` guards edit/delete/swap)
- [x] 2.3 Swap-exercise command rebuilding dense `sequence` within a transaction [WO-039] (`swap_template_exercise` → `resequence`)
- [x] 2.4 Start-from-template: create a session prefilled with the template's exercises in order, subject to single-active-session [WO-040] (`start_workout_from_template`)
- [x] 2.5 Extend the exercise delete-guard to also refuse exercises referenced by a template (builds on WO-032) (`referenced_by_template` in `delete_user`)

## 3. API bindings

- [ ] 3.1 Surface template commands through generated `$lib/api` bindings; verify regenerated types compile

## 4. Frontend

- [ ] 4.1 Template list + builder (from scratch) per `_conv-modals` / `_conv-validation`; empty state per `_conv-empty-states` [WO-037]
- [ ] 4.2 Clone-a-predefined action [WO-038]
- [ ] 4.3 Bottom-sheet exercise replacement per `_conv-modals` [WO-039]
- [ ] 4.4 Start-from-template selection in the Start Workout flow [WO-040]

## 5. Tests (traceability — every scenario cited)

- [x] 5.1 Rust integration tests for build/clone/swap/start-from + delete-guard, each citing its WO id via `scenario!` [WO-037..WO-040, WO-032] (`tests/cmd/test_template_cmd.rs`, 5 tests green)
- [ ] 5.2 Vitest component tests for the builder, clone action, bottom-sheet replacement, and start-from-template selection [WO-037..WO-040]
- [ ] 5.3 Run the traceability lint to confirm every new WO scenario is cited
