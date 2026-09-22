## Why

Every workout currently starts from an empty exercise picker — there is no way to save a routine ("Push Day") and reuse it, nor to start a session prefilled with a known set of exercises. This change adds reusable **workout templates** on top of the user-extensible exercise library, so lifters can build a routine once, clone a predefined one and tweak it, and start a session from it.

## What Changes

- **Templates as reusable routines.** A template names an ordered list of exercises (optionally with target reps/weight and notes). Users can build one from scratch.
- **Clone-and-swap.** Predefined templates can be cloned into an independent, editable copy; editing the clone never mutates the predefined source. A template exercise can be swapped for another library exercise via a bottom-sheet picker.
- **Start from a template.** Starting a workout can begin from a template, prefilling the session with its exercises in order.
- **Non-goals.** No template sharing/export, no per-template analytics/history, no rep-range/intent-driven rest targets (that future plan domain stays deferred — see the `workout-tracking` rest-timer note). No new workout types.

## Capabilities

### New Capabilities

_None._ Extends an existing capability.

### Modified Capabilities

- `workout-tracking` (`WO`): adds workout templates (build / clone-and-swap), the bottom-sheet exercise replacement, and start-from-template session creation. Templates reference exercises from the library introduced by `add-exercise-library-templates` (seeded + user-created).

## Impact

- **Depends on `add-exercise-library-templates`.** That change hardens the `exercise` table with a `slug` natural key and adds user-created exercises; templates reference exercises by their library id and seeded templates resolve their exercises **by slug** at seed time. This change should land after it.
- **Backend (Rust/Diesel):** new `workout_template` (`id, name, description NULL, is_predefined BOOLEAN, created_at`) and `template_exercise` (ordered, with `target_reps`/`target_weight_kg`/`notes`, plain `exercise_id` FK) tables; no `user_id` (single local user). Seeded predefined templates. Repository functions and Tauri commands for template CRUD, clone, exercise swap, and start-from-template.
- **API bindings (TS):** new template commands surfaced through generated `$lib/api` bindings.
- **Frontend (SvelteKit 5):** template list and builder, clone action, bottom-sheet exercise replacement (per `_conv-modals`), and start-from-template selection in the Start Workout flow.
- **Conventions:** `_conv-modals` (builder, replacement sheet), `_conv-validation` (template fields), `_conv-empty-states` (no-templates state), `_conv-test-traceability`.
