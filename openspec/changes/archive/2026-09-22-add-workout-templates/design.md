## Context

Workout sessions today start from an empty picker; there is no saved-routine concept. This change adds templates on top of the exercise library reworked by `add-exercise-library-templates` (single hardened `exercise` table with a `slug` natural key, plus user-created exercises). The app runs **locally, single-device, single-user**, so there is no ownership to model.

## Goals / Non-Goals

**Goals:**

- Save/build reusable routines; clone-and-swap a predefined template; start a session prefilled from a template.

**Non-Goals:**

- Template sharing/export, per-template analytics/history.
- Rep-range/intent-driven rest targets (the deferred plan domain noted in `workout-tracking`).
- New workout types beyond `wl`.

## Decisions

### Two tables: `workout_template` + ordered `template_exercise`

- **Decision:** `workout_template` (`id, name, description NULL, is_predefined BOOLEAN NOT NULL DEFAULT 0, created_at`) and `template_exercise` (`id, template_id FK, exercise_id FK, sequence, target_reps NULL, target_weight_kg NULL, notes NULL`). No `user_id`. `template_exercise.exercise_id` is a **plain FK to `exercise`** — no polymorphism — because `add-exercise-library-templates` keeps seeded and user exercises in one `exercise` table.
- **Rationale:** Ordering belongs on the join (`sequence`); target reps/weight/notes are per-template-exercise, not per-exercise. The single-table exercise model means a plain FK suffices.
- **Alternatives considered:** Embedding exercises as JSON in the template (rejected — loses FK integrity and the swap/reorder queries).

### Seeded templates resolve exercises by `slug`

- **Decision:** Predefined templates (`is_predefined = 1`) are seeded by migration; their `template_exercise` rows resolve `exercise_id` by **looking up the exercise's `slug`** at seed time, never a hardcoded raw id.
- **Rationale:** This is exactly why `add-exercise-library-templates` adds `slug` — user-created exercises can occupy arbitrary ids, so seeded references must key on the stable slug.
- **Alternatives considered:** Hardcoded ids (rejected — collide with user rows; the original concern that drove the slug design).

### Clone is a deep copy; predefined sources are immutable

- **Decision:** Cloning a predefined template inserts a new `workout_template` with `is_predefined = 0` and copies its `template_exercise` rows. Edits target the copy. Predefined templates are not editable.
- **Rationale:** Keeps predefined content stable without copy-on-write indirection; matches the clone-and-swap flow.
- **Alternatives considered:** Copy-on-write references to the source (rejected — adds a "still linked?" question the flow doesn't need).

### Start-from-template prefills, then behaves like a normal session

- **Decision:** Starting from a template creates a session and pre-populates its `workout_exercise` rows from the template's exercises in order; set logging proceeds normally. Subject to the existing single-active-session rule (`WO-002`).
- **Rationale:** A template seeds the session's exercises; it does not couple the session back to the template afterward (no live link), keeping the session model unchanged.
- **Alternatives considered:** Keeping a session→template link for "templated" stats (deferred with history).

## Risks / Trade-offs

- **[Risk] Lands before its dependency.** → This change depends on the `slug` key and user-extensible library from `add-exercise-library-templates`; sequence it after that change archives.
- **[Risk] A template references a user exercise that is later deleted.** → Extend the exercise change's guarded delete (WO-032, which covers logged sets) to also refuse deleting an exercise referenced by a template, so templates can't be silently broken. (Implemented as part of this change since the template tables land here.)
- **[Risk] Swapping/reordering corrupts `sequence`.** → Treat `sequence` as a dense ordering rebuilt on mutation within a transaction, validated by tests (WO-039).

## Migration Plan

1. New Diesel migration: `workout_template` + `template_exercise`; seed predefined templates resolving exercises by slug.
2. Regenerate `schema.rs`; add repository + command layers; regenerate TS bindings.
3. Build frontend (list, builder, clone, bottom-sheet replacement, start-from-template selection).
4. **Rollback:** additive — new tables unused by existing code; reverting the frontend leaves them harmless.

## Open Questions

- Which predefined templates to ship (e.g. Push/Pull/Legs, Full Body) — content decision for the seed.
- Whether to add a session→template link for future "templated workout" stats (deferred with the history surface).
