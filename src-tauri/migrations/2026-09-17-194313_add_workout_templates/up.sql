-- Reusable workout templates (add-workout-templates, WO).
--
-- A template names an ordered list of library exercises with optional per-entry
-- targets (a rep RANGE as text, e.g. '8-12'), a target weight, and notes.
-- Ordering lives on the join (`template_exercise.sequence`, dense from 0), not on
-- the exercise. No `user_id` — the app is local, single-user, single-device.
--
-- `template_exercise.exercise_id` is a plain FK to the single `exercise` table
-- (seeded + user rows share it since add-exercise-library). Predefined templates
-- (is_predefined = 1) are seeded below, resolving each exercise by its stable
-- `slug` (added by the user_exercises migration) — never a hardcoded raw id,
-- which could collide with a user-created exercise.

CREATE TABLE workout_template
(
    id            INTEGER NOT NULL PRIMARY KEY,
    name          TEXT    NOT NULL,
    description   TEXT,
    is_predefined BOOLEAN NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL
);

CREATE TABLE template_exercise
(
    id               INTEGER NOT NULL PRIMARY KEY,
    template_id      INTEGER NOT NULL REFERENCES workout_template (id),
    exercise_id      INTEGER NOT NULL REFERENCES exercise (id),
    sequence         INTEGER NOT NULL,
    target_reps      TEXT,
    target_weight_kg REAL,
    notes            TEXT
);

-- Ordered fetch of a template's exercises, and the reverse lookup used by the
-- delete-guard (refuse deleting an exercise a template references).
CREATE INDEX idx_template_exercise_template ON template_exercise (template_id, sequence);
CREATE INDEX idx_template_exercise_exercise ON template_exercise (exercise_id);

-- Seed predefined templates with explicit ids (like seeded exercises), so
-- user-created templates take autoincrement ids above them and can't collide.
INSERT INTO workout_template (id, name, description, is_predefined, created_at)
VALUES (1, 'Push Day', 'Chest, shoulders, and triceps.', 1, datetime('now')),
       (2, 'Pull Day', 'Back and biceps.', 1, datetime('now')),
       (3, 'Leg Day', 'Quads, hamstrings, and calves.', 1, datetime('now'));

-- Exercises resolved by slug (scalar subqueries), preserving order via sequence.
INSERT INTO template_exercise (template_id, exercise_id, sequence, target_reps)
VALUES (1, (SELECT id FROM exercise WHERE slug = 'bench-press'), 0, '6-8'),
       (1, (SELECT id FROM exercise WHERE slug = 'overhead-press'), 1, '6-10'),
       (1, (SELECT id FROM exercise WHERE slug = 'incline-bench-press'), 2, '8-12'),
       (1, (SELECT id FROM exercise WHERE slug = 'tricep-pushdown'), 3, '10-15'),
       (1, (SELECT id FROM exercise WHERE slug = 'lateral-raise'), 4, '12-20'),

       (2, (SELECT id FROM exercise WHERE slug = 'deadlift'), 0, '3-5'),
       (2, (SELECT id FROM exercise WHERE slug = 'pull-up'), 1, '6-10'),
       (2, (SELECT id FROM exercise WHERE slug = 'barbell-row'), 2, '8-12'),
       (2, (SELECT id FROM exercise WHERE slug = 'dumbbell-curl'), 3, '10-15'),
       (2, (SELECT id FROM exercise WHERE slug = 'face-pulls'), 4, '12-20'),

       (3, (SELECT id FROM exercise WHERE slug = 'back-squat'), 0, '5-8'),
       (3, (SELECT id FROM exercise WHERE slug = 'romanian-deadlift'), 1, '8-12'),
       (3, (SELECT id FROM exercise WHERE slug = 'leg-press'), 2, '10-15'),
       (3, (SELECT id FROM exercise WHERE slug = 'leg-curl'), 3, '10-15'),
       (3, (SELECT id FROM exercise WHERE slug = 'seated-calf-raise'), 4, '12-20');
