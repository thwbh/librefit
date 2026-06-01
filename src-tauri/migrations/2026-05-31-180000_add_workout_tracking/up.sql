-- Workout tracking: lookups, exercise library, and the workout -> exercise -> set skeleton.
-- Standalone domain (does not touch intake/weight). Only the type-varying set metrics
-- live in workout_set.metrics (JSON); the relational skeleton is typed SQL.

-- Lookup: workout type (selects layout + metric schema). Only weight lifting ships now.
CREATE TABLE workout_type
(
    shortvalue TEXT NOT NULL PRIMARY KEY,
    longvalue  TEXT NOT NULL
);
INSERT INTO workout_type (shortvalue, longvalue)
VALUES ('wl', 'Weight lifting');

-- Lookup: exercise category (equipment / movement grouping)
CREATE TABLE exercise_category
(
    shortvalue TEXT NOT NULL PRIMARY KEY,
    longvalue  TEXT NOT NULL
);
INSERT INTO exercise_category (shortvalue, longvalue)
VALUES ('barbell', 'Barbell'),
       ('dumbbell', 'Dumbbell'),
       ('machine', 'Machine'),
       ('cable', 'Cable'),
       ('bodyweight', 'Bodyweight');

-- Lookup: muscle (body region)
CREATE TABLE muscle
(
    shortvalue TEXT NOT NULL PRIMARY KEY,
    longvalue  TEXT NOT NULL
);
-- shortvalue == svelte-body-highlighter slug: one shared muscle vocabulary
-- across the dataset and the completion-screen heat map (no frontend mapping).
INSERT INTO muscle (shortvalue, longvalue)
VALUES ('chest', 'Chest'),
       ('upper-back', 'Upper Back'),
       ('lower-back', 'Lower Back'),
       ('trapezius', 'Trapezius'),
       ('deltoids', 'Shoulders'),
       ('biceps', 'Biceps'),
       ('triceps', 'Triceps'),
       ('forearm', 'Forearm'),
       ('quadriceps', 'Quadriceps'),
       ('hamstring', 'Hamstrings'),
       ('gluteal', 'Glutes'),
       ('calves', 'Calves'),
       ('abs', 'Abs'),
       ('obliques', 'Obliques');

-- Exercise library
CREATE TABLE exercise
(
    id                   INTEGER NOT NULL PRIMARY KEY,
    name                 TEXT    NOT NULL,
    category             TEXT    NOT NULL REFERENCES exercise_category (shortvalue),
    default_rest_seconds INTEGER
);
INSERT INTO exercise (id, name, category, default_rest_seconds)
VALUES (1, 'Bench Press', 'barbell', 180),
       (2, 'Back Squat', 'barbell', 240),
       (3, 'Deadlift', 'barbell', 240),
       (4, 'Overhead Press', 'barbell', 180),
       (5, 'Barbell Row', 'barbell', 150),
       (6, 'Pull-up', 'bodyweight', 150),
       (7, 'Dumbbell Curl', 'dumbbell', 90),
       (8, 'Tricep Pushdown', 'cable', 90),
       (9, 'Leg Press', 'machine', 180),
       (10, 'Plank', 'bodyweight', 60);

-- Exercise <-> muscle (M:N) with primary/secondary role
CREATE TABLE exercise_muscle
(
    exercise_id INTEGER NOT NULL REFERENCES exercise (id),
    muscle      TEXT    NOT NULL REFERENCES muscle (shortvalue),
    role        TEXT    NOT NULL,
    PRIMARY KEY (exercise_id, muscle)
);
INSERT INTO exercise_muscle (exercise_id, muscle, role)
VALUES (1, 'chest', 'primary'),
       (1, 'triceps', 'secondary'),
       (1, 'deltoids', 'secondary'),
       (2, 'quadriceps', 'primary'),
       (2, 'gluteal', 'secondary'),
       (2, 'hamstring', 'secondary'),
       (3, 'lower-back', 'primary'),
       (3, 'gluteal', 'secondary'),
       (3, 'hamstring', 'secondary'),
       (3, 'trapezius', 'secondary'),
       (4, 'deltoids', 'primary'),
       (4, 'triceps', 'secondary'),
       (4, 'trapezius', 'secondary'),
       (5, 'upper-back', 'primary'),
       (5, 'biceps', 'secondary'),
       (5, 'trapezius', 'secondary'),
       (6, 'upper-back', 'primary'),
       (6, 'biceps', 'secondary'),
       (6, 'forearm', 'secondary'),
       (7, 'biceps', 'primary'),
       (7, 'forearm', 'secondary'),
       (8, 'triceps', 'primary'),
       (9, 'quadriceps', 'primary'),
       (9, 'gluteal', 'secondary'),
       (9, 'hamstring', 'secondary'),
       (10, 'abs', 'primary'),
       (10, 'obliques', 'secondary');

-- Workout skeleton: session -> exercise -> set
CREATE TABLE workout_session
(
    id           INTEGER NOT NULL PRIMARY KEY,
    workout_type TEXT    NOT NULL REFERENCES workout_type (shortvalue),
    name         TEXT,
    started_at   TEXT    NOT NULL,
    ended_at     TEXT
);

CREATE TABLE workout_exercise
(
    id          INTEGER NOT NULL PRIMARY KEY,
    session_id  INTEGER NOT NULL REFERENCES workout_session (id),
    exercise_id INTEGER NOT NULL REFERENCES exercise (id),
    sequence    INTEGER NOT NULL
);

CREATE TABLE workout_set
(
    id                  INTEGER NOT NULL PRIMARY KEY,
    workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercise (id),
    sequence            INTEGER NOT NULL,
    logged_at           TEXT    NOT NULL,
    payload_ver         INTEGER NOT NULL DEFAULT 1,
    metrics             TEXT    NOT NULL
);

CREATE TABLE workout_pause
(
    id         INTEGER NOT NULL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES workout_session (id),
    paused_at  TEXT    NOT NULL,
    resumed_at TEXT
);

-- Indexes for frequent queries (active session, hierarchy joins)
CREATE INDEX idx_workout_session_active ON workout_session (ended_at);
CREATE INDEX idx_workout_exercise_session ON workout_exercise (session_id);
CREATE INDEX idx_workout_set_exercise ON workout_set (workout_exercise_id);
CREATE INDEX idx_workout_pause_session ON workout_pause (session_id);
CREATE INDEX idx_exercise_muscle_exercise ON exercise_muscle (exercise_id);
