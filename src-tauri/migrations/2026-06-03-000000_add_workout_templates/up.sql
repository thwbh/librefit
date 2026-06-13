-- Add workout templates: user-created and predefined workout plans.
-- Templates contain exercises with target metrics (reps/weight) and notes.
-- A template can be used to quickly start a new workout session.

CREATE TABLE workout_template
(
    id            INTEGER NOT NULL PRIMARY KEY,
    user_id       INTEGER REFERENCES user (id),
    name          TEXT    NOT NULL,
    description   TEXT,
    is_predefined BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TEXT    NOT NULL
);

CREATE TABLE template_exercise
(
    id                  INTEGER NOT NULL PRIMARY KEY,
    template_id         INTEGER NOT NULL REFERENCES workout_template (id),
    exercise_id         INTEGER NOT NULL REFERENCES exercise (id),
    sequence            INTEGER NOT NULL,
    target_reps         TEXT,
    target_weight_kg    REAL,
    notes               TEXT
);

-- Indexes for common queries
CREATE INDEX idx_template_exercise_template ON template_exercise (template_id, sequence);
CREATE INDEX idx_template_exercise_exercise ON template_exercise (exercise_id);
CREATE INDEX idx_workout_template_user ON workout_template (user_id);
