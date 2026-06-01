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
       ('bodyweight', 'Bodyweight'),
       ('kettlebell', 'Kettlebell');

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
       ('obliques', 'Obliques'),
       ('adductors', 'Adductors');

-- Exercise library
CREATE TABLE exercise
(
    id                   INTEGER NOT NULL PRIMARY KEY,
    name                 TEXT    NOT NULL,
    category             TEXT    NOT NULL REFERENCES exercise_category (shortvalue),
    default_rest_seconds INTEGER
);
-- default_rest_seconds: static per-exercise rest approximation (NULL -> global
-- fallback). Recommended rest really derives from rep range / training intent
-- (a future workout-plan feature); see the rest-timer requirement note in
-- openspec/specs/workout-tracking/spec.md for the eventual precedence.
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
       (10, 'Plank', 'bodyweight', 60),
       (11, 'Romanian Deadlift', 'barbell', 90),
       (12, 'Front Squat', 'barbell', 90),
       (13, 'Incline Bench Press', 'barbell', 60),
       (14, 'Lateral Raise', 'dumbbell', 45),
       (15, 'Bulgarian Split Squat', 'dumbbell', 60),
       (16, 'Single Arm Row', 'dumbbell', 60),
       (17, 'Hammer Curl', 'dumbbell', 45),
       (18, 'Chest Fly', 'dumbbell', 60),
       (19, 'Lat Pulldown', 'machine', 60),
       (20, 'Leg Extension', 'machine', 60),
       (21, 'Leg Curl', 'machine', 60),
       (22, 'Chest Press', 'machine', 60),
       (23, 'Push-up', 'bodyweight', 60),
       (24, 'Dips', 'bodyweight', 60),
       (25, 'Hanging Leg Raise', 'bodyweight', 45),
       (26, 'Lunges', 'bodyweight', 60),
       (27, 'Kettlebell Swing', 'kettlebell', 60),
       (28, 'Sumo Deadlift', 'barbell', 180),
       (29, 'Power Clean', 'barbell', 120),
       (30, 'Close-Grip Bench Press', 'barbell', 180),
       (31, 'Dumbbell Shoulder Press', 'dumbbell', 90),
       (32, 'Dumbbell Bench Press', 'dumbbell', 120),
       (33, 'Face Pulls', 'cable', 60),
       (34, 'Seated Calf Raise', 'machine', 45),
       (35, 'Hip Adductor Machine', 'machine', 60),
       (36, 'Cable Hip Abduction', 'cable', 45),
       (37, 'Chin-ups', 'bodyweight', 150),
       (38, 'Pistol Squats', 'bodyweight', 60),
       (39, 'Crunches', 'bodyweight', 45),
       (40, 'Russian Twists', 'bodyweight', 45),
       (41, 'Bicycle Crunches', 'bodyweight', 45),
       (42, 'Ab Wheel Rollouts', 'bodyweight', 60),
       (43, 'Pallof Press', 'cable', 45),
       (44, 'Reverse Crunches', 'bodyweight', 45),
       (45, 'Dragon Flags', 'bodyweight', 60),
       (46, 'Dead Bug', 'bodyweight', 30),
       (47, 'Bird Dog', 'bodyweight', 30),
       (48, 'Cable Woodchoppers', 'cable', 45),
       (49, 'Hanging Knee Raises', 'bodyweight', 45);

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
       (10, 'obliques', 'secondary'),
       (11, 'hamstring', 'primary'),
       (11, 'gluteal', 'secondary'),
       (11, 'lower-back', 'secondary'),
       (12, 'quadriceps', 'primary'),
       (12, 'gluteal', 'secondary'),
       (12, 'abs', 'secondary'),
       (12, 'lower-back', 'secondary'),
       (13, 'chest', 'primary'),
       (13, 'deltoids', 'secondary'),
       (13, 'triceps', 'secondary'),
       (14, 'deltoids', 'primary'),
       (14, 'upper-back', 'secondary'),
       (15, 'quadriceps', 'primary'),
       (15, 'hamstring', 'secondary'),
       (15, 'gluteal', 'secondary'),
       (15, 'abs', 'secondary'),
       (16, 'upper-back', 'primary'),
       (16, 'biceps', 'secondary'),
       (16, 'deltoids', 'secondary'),
       (17, 'biceps', 'primary'),
       (17, 'forearm', 'secondary'),
       (18, 'chest', 'primary'),
       (18, 'deltoids', 'secondary'),
       (19, 'upper-back', 'primary'),
       (19, 'biceps', 'secondary'),
       (19, 'deltoids', 'secondary'),
       (20, 'quadriceps', 'primary'),
       (21, 'hamstring', 'primary'),
       (21, 'gluteal', 'secondary'),
       (22, 'chest', 'primary'),
       (22, 'deltoids', 'secondary'),
       (22, 'triceps', 'secondary'),
       (23, 'chest', 'primary'),
       (23, 'deltoids', 'secondary'),
       (23, 'triceps', 'secondary'),
       (23, 'abs', 'secondary'),
       (24, 'triceps', 'primary'),
       (24, 'chest', 'secondary'),
       (24, 'deltoids', 'secondary'),
       (25, 'abs', 'primary'),
       (25, 'obliques', 'secondary'),
       (26, 'quadriceps', 'primary'),
       (26, 'hamstring', 'secondary'),
       (26, 'gluteal', 'secondary'),
       (26, 'abs', 'secondary'),
       (27, 'hamstring', 'primary'),
       (27, 'gluteal', 'secondary'),
       (27, 'deltoids', 'secondary'),
       (27, 'abs', 'secondary'),
       (28, 'hamstring', 'primary'),
       (28, 'gluteal', 'secondary'),
       (28, 'quadriceps', 'secondary'),
       (28, 'lower-back', 'secondary'),
       (29, 'quadriceps', 'secondary'),
       (29, 'hamstring', 'secondary'),
       (29, 'gluteal', 'secondary'),
       (29, 'deltoids', 'secondary'),
       (29, 'trapezius', 'secondary'),
       (30, 'triceps', 'primary'),
       (30, 'chest', 'secondary'),
       (30, 'deltoids', 'secondary'),
       (31, 'deltoids', 'primary'),
       (31, 'triceps', 'secondary'),
       (32, 'chest', 'primary'),
       (32, 'triceps', 'secondary'),
       (32, 'deltoids', 'secondary'),
       (33, 'deltoids', 'primary'),
       (33, 'upper-back', 'secondary'),
       (33, 'trapezius', 'secondary'),
       (34, 'calves', 'primary'),
       (35, 'adductors', 'primary'),
       (36, 'gluteal', 'primary'),
       (37, 'upper-back', 'primary'),
       (37, 'biceps', 'secondary'),
       (38, 'quadriceps', 'primary'),
       (38, 'gluteal', 'secondary'),
       (38, 'hamstring', 'secondary'),
       (38, 'abs', 'secondary'),
       (39, 'abs', 'primary'),
       (40, 'obliques', 'primary'),
       (40, 'abs', 'secondary'),
       (41, 'abs', 'primary'),
       (41, 'obliques', 'secondary'),
       (42, 'abs', 'primary'),
       (42, 'obliques', 'secondary'),
       (43, 'abs', 'primary'),
       (43, 'obliques', 'secondary'),
       (44, 'abs', 'primary'),
       (45, 'abs', 'primary'),
       (45, 'obliques', 'secondary'),
       (46, 'abs', 'primary'),
       (46, 'obliques', 'secondary'),
       (46, 'gluteal', 'secondary'),
       (47, 'abs', 'primary'),
       (47, 'lower-back', 'secondary'),
       (47, 'gluteal', 'secondary'),
       (48, 'obliques', 'primary'),
       (48, 'abs', 'secondary'),
       (49, 'abs', 'primary'),
       (49, 'obliques', 'secondary');

-- Workout skeleton: session -> exercise -> set
CREATE TABLE workout_session
(
    id           INTEGER NOT NULL PRIMARY KEY,
    workout_type TEXT    NOT NULL REFERENCES workout_type (shortvalue),
    name         TEXT,
    started_at   TEXT    NOT NULL,
    ended_at     TEXT
);

-- Ordering of exercises within a session, and sets within an exercise, is carried
-- by the autoincrement `id` (monotonic = insertion order); no explicit sequence column.
CREATE TABLE workout_exercise
(
    id          INTEGER NOT NULL PRIMARY KEY,
    session_id  INTEGER NOT NULL REFERENCES workout_session (id),
    exercise_id INTEGER NOT NULL REFERENCES exercise (id)
);

CREATE TABLE workout_set
(
    id                  INTEGER NOT NULL PRIMARY KEY,
    workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercise (id),
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
