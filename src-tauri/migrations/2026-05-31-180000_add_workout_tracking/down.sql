-- Drop workout indexes
DROP INDEX IF EXISTS idx_exercise_muscle_exercise;
DROP INDEX IF EXISTS idx_workout_pause_session;
DROP INDEX IF EXISTS idx_workout_set_exercise;
DROP INDEX IF EXISTS idx_workout_exercise_session;
DROP INDEX IF EXISTS idx_workout_session_active;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS workout_pause;
DROP TABLE IF EXISTS workout_set;
DROP TABLE IF EXISTS workout_exercise;
DROP TABLE IF EXISTS workout_session;
DROP TABLE IF EXISTS exercise_muscle;
DROP TABLE IF EXISTS exercise;
DROP TABLE IF EXISTS muscle;
DROP TABLE IF EXISTS exercise_category;
DROP TABLE IF EXISTS workout_type;
