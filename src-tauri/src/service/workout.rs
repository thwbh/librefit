//! Workout tracking domain — standalone (does not touch intake/weight).
//!
//! Hierarchy: `workout_session -> workout_exercise -> workout_set`. Only the
//! type-varying set metrics live in `workout_set.metrics` (JSON); the relational
//! skeleton is typed SQL. The typed metric payload (SSOT) + validation, the
//! repository methods, and the Tauri commands are added in subsequent tasks
//! (3.x, 4.x). This module currently defines the table-mapped models.

use crate::db::connection::{DbPool, PooledConnection};
use crate::db::schema::{
    exercise, exercise_category, exercise_muscle, muscle, workout_exercise, workout_pause,
    workout_session, workout_set, workout_type,
};
use crate::util::error_handler::handle_error;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use validator::Validate;

/// Auto-complete an active session after this much inactivity (no set logged, no
/// pause/resume). Protects trends from "zombie" sessions. See `[WO-020]`.
const STALE_AFTER_SECS: i64 = 4 * 60 * 60;

// ============================================================================
// LOOKUPS (seeded; follow the food_category precedent)
// ============================================================================

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = workout_type)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct WorkoutType {
    pub longvalue: String,
    pub shortvalue: String,
}

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = exercise_category)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct ExerciseCategory {
    pub longvalue: String,
    pub shortvalue: String,
}

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = muscle)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Muscle {
    pub longvalue: String,
    pub shortvalue: String,
}

// ============================================================================
// EXERCISE LIBRARY
// ============================================================================

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = exercise)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct Exercise {
    pub id: i32,
    pub name: String,
    pub category: String,
    pub default_rest_seconds: Option<i32>,
    /// Stable natural key for seeded rows; `None` for user-created rows.
    /// Doubles as the seeded/user discriminator (seeded == `slug.is_some()`).
    pub slug: Option<String>,
    /// User "Ghost" rows start `false`; promoted once categorised. Seeded == `true`.
    pub verified: bool,
    /// Local creation date + time (split, no offset — same `added`/`time` field
    /// names as intake/weight_tracker), set when a user row is created; drives the
    /// avatar graceful-decay window.
    pub added: Option<String>,
    pub time: Option<String>,
}

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = exercise_muscle)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct ExerciseMuscle {
    pub exercise_id: i32,
    pub muscle: String,
    pub role: String,
}

// ============================================================================
// WORKOUT SKELETON: session -> exercise -> set (+ pauses)
// ============================================================================

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = workout_session)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct WorkoutSession {
    pub id: i32,
    pub workout_type: String,
    pub name: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
}

#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug)]
#[diesel(table_name = workout_session)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewWorkoutSession {
    pub workout_type: String,
    pub name: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
}

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = workout_exercise)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct WorkoutExercise {
    pub id: i32,
    pub session_id: i32,
    pub exercise_id: i32,
}

#[derive(Insertable, Serialize, Deserialize, Debug)]
#[diesel(table_name = workout_exercise)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewWorkoutExercise {
    pub session_id: i32,
    pub exercise_id: i32,
}

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = workout_set)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct WorkoutSet {
    pub id: i32,
    pub workout_exercise_id: i32,
    pub logged_at: String,
    pub payload_ver: i32,
    /// Raw JSON metric payload — typed/validated against the workout type's
    /// schema by the metric-payload layer (task 3.x), not by the DB.
    pub metrics: String,
}

#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug)]
#[diesel(table_name = workout_set)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewWorkoutSet {
    pub workout_exercise_id: i32,
    pub logged_at: String,
    pub payload_ver: i32,
    pub metrics: String,
}

#[derive(Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = workout_pause)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct WorkoutPause {
    pub id: i32,
    pub session_id: i32,
    pub paused_at: String,
    pub resumed_at: Option<String>,
}

#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug)]
#[diesel(table_name = workout_pause)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewWorkoutPause {
    pub session_id: i32,
    pub paused_at: String,
    pub resumed_at: Option<String>,
}

// ============================================================================
// METRIC PAYLOAD (compiled schema — SSOT in Rust; tauri-typegen emits TS + Zod)
// ============================================================================

/// Current payload version for the weight-lifting metric schema.
pub const WL_PAYLOAD_VER: i32 = 1;

/// Weight-lifting set metrics. Single source of truth for the `wl` payload schema:
/// `tauri-typegen` generates the matching TS type + Zod validator from this struct, the
/// frontend pre-validates, and the command re-validates on write. Stored serialized in
/// `workout_set.metrics`; the DB never types the blob.
#[derive(Serialize, Deserialize, Validate, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LiftingSetMetrics {
    #[validate(range(min = 1, max = 1000, message = "Reps must be between 1 and 1000"))]
    pub reps: i32,
    #[validate(range(
        min = 0.0,
        max = 1000.0,
        message = "Weight must be between 0 and 1000 kg"
    ))]
    pub weight_kg: f64,
}

impl LiftingSetMetrics {
    /// Lenient read / migration-on-read: parse the stored payload by version, upcast to
    /// the current shape, return the strict current struct. serde is permissive (unknown
    /// keys ignored). Structural blob changes (rename/add/drop a key) are handled by JSON1
    /// SQL migrations (`json_set`/`json_remove`) that bump `payload_ver`; only semantic
    /// changes need a programmatic upcast arm here. A worked JSON1 migration and the
    /// lenient-read behavior are verified in `tests/repo/test_workout_metrics.rs`.
    pub fn from_stored(payload_ver: i32, metrics: &str) -> Result<Self, String> {
        match payload_ver {
            1 => serde_json::from_str::<LiftingSetMetrics>(metrics)
                .map_err(|e| format!("Failed to parse set metrics (v1): {}", e)),
            other => Err(format!("Unknown set metrics payload version {}", other)),
        }
    }

    pub fn volume(&self) -> f64 {
        self.reps as f64 * self.weight_kg
    }
}

// ============================================================================
// VIEW DTOs (returned to the frontend with typed, parsed metrics)
// ============================================================================

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExerciseDetail {
    pub id: i32,
    pub name: String,
    pub category: String,
    pub default_rest_seconds: Option<i32>,
    pub muscles: Vec<ExerciseMuscle>,
    /// `true` for seeded (read-only) exercises, `false` for user-created ones (`[WO-033]`).
    pub seeded: bool,
    /// `false` while a user exercise is an unverified "Ghost" (`[WO-034]`).
    pub verified: bool,
    /// Local creation date + time for user rows (graceful-decay input); `None` for seeded.
    pub added: Option<String>,
    pub time: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LoggedSet {
    pub id: i32,
    pub logged_at: String,
    pub metrics: LiftingSetMetrics,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkoutExerciseView {
    pub id: i32,
    pub exercise_id: i32,
    pub name: String,
    pub default_rest_seconds: Option<i32>,
    pub sets: Vec<LoggedSet>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkoutPauseView {
    pub paused_at: String,
    pub resumed_at: Option<String>,
}

/// Full detail of a session (active or just-ended) with its exercises, sets, and pauses.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkoutDetail {
    pub session: WorkoutSession,
    pub exercises: Vec<WorkoutExerciseView>,
    pub pauses: Vec<WorkoutPauseView>,
}

// ============================================================================
// TIME HELPERS (UTC RFC3339 — sortable lexicographically, DST-safe)
// ============================================================================

fn now_ts() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

/// Backend-set local creation date (`added`, `YYYY-MM-DD`) and time (`time`,
/// `HH:MM:SS`) for a user exercise, mirroring the intake/weight_tracker
/// `default_time` convention: the stamp is set by the backend, never the client.
/// Split across two columns with no timezone offset — the app is local,
/// single-user, single-device.
fn default_date() -> Option<String> {
    Some(chrono::Local::now().format("%Y-%m-%d").to_string())
}

fn default_time() -> Option<String> {
    Some(chrono::Local::now().format("%H:%M:%S").to_string())
}

fn parse_ts(s: &str) -> Result<chrono::DateTime<chrono::FixedOffset>, String> {
    chrono::DateTime::parse_from_rfc3339(s).map_err(|e| format!("Invalid timestamp '{}': {}", s, e))
}

// ============================================================================
// REPOSITORY
// ============================================================================

impl WorkoutSession {
    /// The single active session (`ended_at IS NULL`), if any.
    pub fn active(conn: &mut SqliteConnection) -> QueryResult<Option<WorkoutSession>> {
        workout_session::table
            .filter(workout_session::ended_at.is_null())
            .order(workout_session::started_at.desc())
            .first::<Self>(conn)
            .optional()
    }

    /// Start a session of the given type. Caller MUST ensure none is active (`[WO-002]`).
    pub fn start(
        conn: &mut SqliteConnection,
        workout_type: &str,
        name: Option<String>,
    ) -> QueryResult<Self> {
        let new = NewWorkoutSession {
            workout_type: workout_type.to_string(),
            name,
            started_at: now_ts(),
            ended_at: None,
        };
        diesel::insert_into(workout_session::table)
            .values(&new)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Insert an already-completed session stamped to a past date (retrospective
    /// logging, `[HI-022]`). `ended_at` is set so it never reads as active and the
    /// stale auto-completer ignores it; with no live timing, `ended_at == started_at`.
    pub fn create_completed(
        conn: &mut SqliteConnection,
        workout_type: &str,
        name: Option<String>,
        started_at: String,
    ) -> QueryResult<Self> {
        let new = NewWorkoutSession {
            workout_type: workout_type.to_string(),
            name,
            ended_at: Some(started_at.clone()),
            started_at,
        };
        diesel::insert_into(workout_session::table)
            .values(&new)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Find a session by id.
    pub fn find(conn: &mut SqliteConnection, id: i32) -> QueryResult<Self> {
        workout_session::table
            .filter(workout_session::id.eq(id))
            .first(conn)
    }

    /// Resolve the session that owns a given set (`set -> exercise -> session`). Used
    /// by the set-mutation commands so they work on completed sessions too, not just
    /// the active one.
    pub fn for_set(conn: &mut SqliteConnection, set_id: i32) -> QueryResult<Self> {
        let we_id: i32 = workout_set::table
            .filter(workout_set::id.eq(set_id))
            .select(workout_set::workout_exercise_id)
            .first(conn)?;
        let session_id: i32 = workout_exercise::table
            .filter(workout_exercise::id.eq(we_id))
            .select(workout_exercise::session_id)
            .first(conn)?;
        Self::find(conn, session_id)
    }

    /// Completed sessions (`ended_at IS NOT NULL`) whose start falls in `[from, to)`,
    /// most recent first. Bounds are RFC3339 UTC strings (sortable lexicographically),
    /// so a single day is just a one-day window. Powers history, dashboard, and the
    /// progress Workout segment.
    pub fn completed_in_range(
        conn: &mut SqliteConnection,
        from: &str,
        to: &str,
    ) -> QueryResult<Vec<Self>> {
        workout_session::table
            .filter(workout_session::ended_at.is_not_null())
            .filter(workout_session::started_at.ge(from))
            .filter(workout_session::started_at.lt(to))
            .order(workout_session::started_at.desc())
            .load(conn)
    }

    /// Record the end timestamp.
    pub fn end(conn: &mut SqliteConnection, id: i32, ended_at: &str) -> QueryResult<Self> {
        diesel::update(workout_session::table.filter(workout_session::id.eq(id)))
            .set(workout_session::ended_at.eq(ended_at))
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Cascade-delete a session and all its exercises, sets, and pauses (`[WO-016]`).
    /// The four deletes run in one transaction so a mid-cascade failure can't leave
    /// a half-deleted session (orphaned sets/pauses or a childless session row).
    pub fn discard(conn: &mut SqliteConnection, id: i32) -> QueryResult<usize> {
        conn.transaction(|conn| {
            let ex_ids: Vec<i32> = workout_exercise::table
                .filter(workout_exercise::session_id.eq(id))
                .select(workout_exercise::id)
                .load(conn)?;
            diesel::delete(
                workout_set::table.filter(workout_set::workout_exercise_id.eq_any(&ex_ids)),
            )
            .execute(conn)?;
            diesel::delete(workout_exercise::table.filter(workout_exercise::session_id.eq(id)))
                .execute(conn)?;
            diesel::delete(workout_pause::table.filter(workout_pause::session_id.eq(id)))
                .execute(conn)?;
            diesel::delete(workout_session::table.filter(workout_session::id.eq(id))).execute(conn)
        })
    }

    /// Most recent activity timestamp for a session: max of set log times, pause/resume
    /// events, falling back to the start timestamp.
    fn last_activity(conn: &mut SqliteConnection, session: &WorkoutSession) -> QueryResult<String> {
        let ex_ids: Vec<i32> = workout_exercise::table
            .filter(workout_exercise::session_id.eq(session.id))
            .select(workout_exercise::id)
            .load(conn)?;
        let max_set: Option<String> = workout_set::table
            .filter(workout_set::workout_exercise_id.eq_any(&ex_ids))
            .select(diesel::dsl::max(workout_set::logged_at))
            .first(conn)?;
        let max_paused: Option<String> = workout_pause::table
            .filter(workout_pause::session_id.eq(session.id))
            .select(diesel::dsl::max(workout_pause::paused_at))
            .first(conn)?;
        let max_resumed: Option<String> = workout_pause::table
            .filter(workout_pause::session_id.eq(session.id))
            .select(diesel::dsl::max(workout_pause::resumed_at))
            .first(conn)?;

        let mut last = session.started_at.clone();
        for candidate in [max_set, max_paused, max_resumed].into_iter().flatten() {
            if candidate > last {
                last = candidate;
            }
        }
        Ok(last)
    }

    /// Auto-complete the active session if it has been inactive past the threshold,
    /// setting `ended_at` to the last activity time (`[WO-020]`).
    pub fn auto_complete_if_stale(conn: &mut SqliteConnection) -> Result<(), String> {
        let session = match Self::active(conn).map_err(handle_error)? {
            Some(s) => s,
            None => return Ok(()),
        };
        let last = Self::last_activity(conn, &session).map_err(handle_error)?;
        let elapsed = chrono::Utc::now().signed_duration_since(parse_ts(&last)?);
        if elapsed.num_seconds() > STALE_AFTER_SECS {
            Self::end(conn, session.id, &last).map_err(handle_error)?;
        }
        Ok(())
    }

    /// Build the full detail view (exercises -> sets with typed metrics, pauses).
    pub fn detail(
        conn: &mut SqliteConnection,
        session: WorkoutSession,
    ) -> Result<WorkoutDetail, String> {
        let wexs = workout_exercise::table
            .filter(workout_exercise::session_id.eq(session.id))
            .order(workout_exercise::id.asc())
            .load::<WorkoutExercise>(conn)
            .map_err(handle_error)?;

        let mut exercises = Vec::with_capacity(wexs.len());
        for we in wexs {
            let ex = Exercise::find(conn, we.exercise_id).map_err(handle_error)?;
            let raw_sets = workout_set::table
                .filter(workout_set::workout_exercise_id.eq(we.id))
                .order(workout_set::id.asc())
                .load::<WorkoutSet>(conn)
                .map_err(handle_error)?;
            let mut sets = Vec::with_capacity(raw_sets.len());
            for s in raw_sets {
                let metrics = LiftingSetMetrics::from_stored(s.payload_ver, &s.metrics)?;
                sets.push(LoggedSet {
                    id: s.id,
                    logged_at: s.logged_at,
                    metrics,
                });
            }
            exercises.push(WorkoutExerciseView {
                id: we.id,
                exercise_id: we.exercise_id,
                name: ex.name,
                default_rest_seconds: ex.default_rest_seconds,
                sets,
            });
        }

        let pauses = workout_pause::table
            .filter(workout_pause::session_id.eq(session.id))
            .order(workout_pause::paused_at.asc())
            .load::<WorkoutPause>(conn)
            .map_err(handle_error)?
            .into_iter()
            .map(|p| WorkoutPauseView {
                paused_at: p.paused_at,
                resumed_at: p.resumed_at,
            })
            .collect();

        Ok(WorkoutDetail {
            session,
            exercises,
            pauses,
        })
    }
}

impl WorkoutExercise {
    fn find_in_session(
        conn: &mut SqliteConnection,
        session_id: i32,
        exercise_id: i32,
    ) -> QueryResult<Option<Self>> {
        workout_exercise::table
            .filter(workout_exercise::session_id.eq(session_id))
            .filter(workout_exercise::exercise_id.eq(exercise_id))
            .first::<Self>(conn)
            .optional()
    }

    /// Find the exercise within the session, or append it (id carries order).
    pub fn add_or_get(
        conn: &mut SqliteConnection,
        session_id: i32,
        exercise_id: i32,
    ) -> QueryResult<Self> {
        if let Some(existing) = Self::find_in_session(conn, session_id, exercise_id)? {
            return Ok(existing);
        }
        let new = NewWorkoutExercise {
            session_id,
            exercise_id,
        };
        diesel::insert_into(workout_exercise::table)
            .values(&new)
            .returning(Self::as_returning())
            .get_result(conn)
    }
}

impl WorkoutSet {
    /// Append a set under an exercise (ordering carried by the autoincrement id).
    pub fn log(
        conn: &mut SqliteConnection,
        workout_exercise_id: i32,
        metrics_json: String,
        payload_ver: i32,
        logged_at: String,
    ) -> QueryResult<Self> {
        let new = NewWorkoutSet {
            workout_exercise_id,
            logged_at,
            payload_ver,
            metrics: metrics_json,
        };
        diesel::insert_into(workout_set::table)
            .values(&new)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    pub fn update_metrics(
        conn: &mut SqliteConnection,
        id: i32,
        metrics_json: String,
    ) -> QueryResult<Self> {
        diesel::update(workout_set::table.filter(workout_set::id.eq(id)))
            .set(workout_set::metrics.eq(metrics_json))
            .returning(Self::as_returning())
            .get_result(conn)
    }

    pub fn delete(conn: &mut SqliteConnection, id: i32) -> QueryResult<usize> {
        diesel::delete(workout_set::table.filter(workout_set::id.eq(id))).execute(conn)
    }
}

impl WorkoutPause {
    /// Open a pause interval.
    pub fn open(
        conn: &mut SqliteConnection,
        session_id: i32,
        paused_at: String,
    ) -> QueryResult<Self> {
        let new = NewWorkoutPause {
            session_id,
            paused_at,
            resumed_at: None,
        };
        diesel::insert_into(workout_pause::table)
            .values(&new)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Close the currently-open pause (resumed_at IS NULL) for the session.
    pub fn close_open(
        conn: &mut SqliteConnection,
        session_id: i32,
        resumed_at: String,
    ) -> QueryResult<usize> {
        diesel::update(
            workout_pause::table
                .filter(workout_pause::session_id.eq(session_id))
                .filter(workout_pause::resumed_at.is_null()),
        )
        .set(workout_pause::resumed_at.eq(resumed_at))
        .execute(conn)
    }
}

/// Sentinel category for name-only "Ghost" exercises (see migration + design note).
const UNCATEGORIZED: &str = "uncategorized";

/// Validated input for creating/editing a user exercise via the full add/edit screen.
#[derive(Serialize, Deserialize, Validate, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExerciseInput {
    #[validate(length(min = 1, max = 80, message = "Name must be 1–80 characters"))]
    pub name: String,
    #[validate(length(min = 1, message = "A category is required"))]
    pub category: String,
    pub default_rest_seconds: Option<i32>,
    #[validate(length(min = 1, message = "Select at least one muscle"))]
    pub muscles: Vec<MuscleInput>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MuscleInput {
    pub muscle: String,
    pub role: String,
}

/// A tag applied in bulk to unverified exercises (`[WO-041]`). Flat struct (not a
/// tagged enum) so it round-trips cleanly through the generated TS/Zod binding:
/// `kind` is `"category"` or `"muscle"`; `value` is the category/muscle shortvalue;
/// `role` (`primary`/`secondary`) applies only to a muscle tag.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BatchTag {
    pub kind: String,
    pub value: String,
    pub role: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BatchTagInput {
    pub exercise_ids: Vec<i32>,
    /// One or more tags (a category and/or several muscle roles) applied together to
    /// every selected exercise (`[WO-041]`).
    pub tags: Vec<BatchTag>,
}

/// Per-exercise snapshot captured before a batch tag, enough to revert it (`[WO-042]`).
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BatchTagUndoItem {
    pub exercise_id: i32,
    pub prev_category: String,
    pub prev_verified: bool,
    /// Muscle rows newly inserted by this apply (so undo deletes exactly them).
    pub muscles_added: Vec<MuscleInput>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BatchTagResult {
    pub items: Vec<BatchTagUndoItem>,
}

/// Summary backing the dashboard avatar indicator (`[DH-019]`–`[DH-021]`).
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnverifiedSummary {
    pub count: i64,
    /// `added` date + `time` of the oldest unverified exercise; the dashboard derives
    /// the decay state from it.
    pub oldest_added: Option<String>,
    pub oldest_time: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = exercise)]
struct NewExerciseRow<'a> {
    name: &'a str,
    category: &'a str,
    default_rest_seconds: Option<i32>,
    slug: Option<String>,
    verified: bool,
    added: Option<String>,
    time: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = exercise_muscle)]
struct NewExerciseMuscle<'a> {
    exercise_id: i32,
    muscle: &'a str,
    role: &'a str,
}

impl Exercise {
    pub fn find(conn: &mut SqliteConnection, id: i32) -> QueryResult<Exercise> {
        exercise::table.filter(exercise::id.eq(id)).first(conn)
    }

    /// Single guarded mutation choke-point (`[WO-028]`): every exercise write goes
    /// through here, which refuses seeded (slug-bearing) rows. Seeded immutability
    /// is structural — not a per-command `WHERE` check that can be forgotten.
    fn ensure_user(conn: &mut SqliteConnection, id: i32) -> Result<Exercise, String> {
        let ex = Self::find(conn, id).map_err(handle_error)?;
        if ex.slug.is_some() {
            return Err("Seeded exercises can't be edited or deleted".to_string());
        }
        Ok(ex)
    }

    /// Recompute and persist `verified`: a user exercise is verified once it has a
    /// real category (not the `uncategorized` sentinel) and at least one muscle.
    fn recompute_verified(conn: &mut SqliteConnection, id: i32) -> QueryResult<()> {
        let category: String = exercise::table
            .filter(exercise::id.eq(id))
            .select(exercise::category)
            .first(conn)?;
        let muscle_count: i64 = exercise_muscle::table
            .filter(exercise_muscle::exercise_id.eq(id))
            .count()
            .get_result(conn)?;
        let verified = category != UNCATEGORIZED && muscle_count > 0;
        diesel::update(exercise::table.filter(exercise::id.eq(id)))
            .set(exercise::verified.eq(verified))
            .execute(conn)?;
        Ok(())
    }

    fn detail_of(conn: &mut SqliteConnection, e: Exercise) -> QueryResult<ExerciseDetail> {
        let muscles = exercise_muscle::table
            .filter(exercise_muscle::exercise_id.eq(e.id))
            .load::<ExerciseMuscle>(conn)?;
        Ok(ExerciseDetail {
            id: e.id,
            name: e.name,
            category: e.category,
            default_rest_seconds: e.default_rest_seconds,
            muscles,
            seeded: e.slug.is_some(),
            verified: e.verified,
            added: e.added,
            time: e.time,
        })
    }

    /// The full exercise library (seeded + user-created) with each exercise's
    /// muscles, marked seeded/verified (`[WO-012]`, `[WO-013]`, `[WO-033]`).
    pub fn library(conn: &mut SqliteConnection) -> QueryResult<Vec<ExerciseDetail>> {
        let exercises = exercise::table
            .order(exercise::name.asc())
            .load::<Exercise>(conn)?;
        exercises
            .into_iter()
            .map(|e| Self::detail_of(conn, e))
            .collect()
    }

    /// Create a fully-specified user exercise (verified) with its muscles (`[WO-029]`).
    pub fn create_full(
        conn: &mut SqliteConnection,
        input: &ExerciseInput,
    ) -> Result<ExerciseDetail, String> {
        conn.transaction::<_, diesel::result::Error, _>(|conn| {
            let id = diesel::insert_into(exercise::table)
                .values(NewExerciseRow {
                    name: input.name.trim(),
                    category: &input.category,
                    default_rest_seconds: input.default_rest_seconds,
                    slug: None,
                    verified: false,
                    added: default_date(),
                    time: default_time(),
                })
                .returning(exercise::id)
                .get_result::<i32>(conn)?;
            Self::write_muscles(conn, id, &input.muscles)?;
            Self::recompute_verified(conn, id)?;
            let row = Self::find(conn, id)?;
            Self::detail_of(conn, row)
        })
        .map_err(handle_error)
    }

    /// Create a name-only "Ghost" (unverified, parked under `uncategorized`) (`[WO-034]`).
    pub fn create_ghost(conn: &mut SqliteConnection, name: &str) -> Result<ExerciseDetail, String> {
        let name = name.trim();
        if name.is_empty() {
            return Err("Name is required".to_string());
        }
        let id = diesel::insert_into(exercise::table)
            .values(NewExerciseRow {
                name,
                category: UNCATEGORIZED,
                default_rest_seconds: None,
                slug: None,
                verified: false,
                added: default_date(),
                time: default_time(),
            })
            .returning(exercise::id)
            .get_result::<i32>(conn)
            .map_err(handle_error)?;
        let row = Self::find(conn, id).map_err(handle_error)?;
        Self::detail_of(conn, row).map_err(handle_error)
    }

    /// Edit a user exercise; re-derives `verified` (`[WO-030]`, `[WO-035]`). Guarded.
    pub fn update_user(
        conn: &mut SqliteConnection,
        id: i32,
        input: &ExerciseInput,
    ) -> Result<ExerciseDetail, String> {
        Self::ensure_user(conn, id)?;
        conn.transaction::<_, diesel::result::Error, _>(|conn| {
            diesel::update(exercise::table.filter(exercise::id.eq(id)))
                .set((
                    exercise::name.eq(input.name.trim()),
                    exercise::category.eq(&input.category),
                    exercise::default_rest_seconds.eq(input.default_rest_seconds),
                ))
                .execute(conn)?;
            diesel::delete(exercise_muscle::table.filter(exercise_muscle::exercise_id.eq(id)))
                .execute(conn)?;
            Self::write_muscles(conn, id, &input.muscles)?;
            Self::recompute_verified(conn, id)?;
            let row = Self::find(conn, id)?;
            Self::detail_of(conn, row)
        })
        .map_err(handle_error)
    }

    /// Delete a user exercise; refuses seeded rows and rows referenced by a logged
    /// set (`[WO-031]`, `[WO-032]`).
    pub fn delete_user(conn: &mut SqliteConnection, id: i32) -> Result<(), String> {
        Self::ensure_user(conn, id)?;
        if Self::referenced_by_set(conn, id).map_err(handle_error)? {
            return Err(
                "This exercise is used in a logged workout and can't be deleted".to_string(),
            );
        }
        conn.transaction::<_, diesel::result::Error, _>(|conn| {
            diesel::delete(exercise_muscle::table.filter(exercise_muscle::exercise_id.eq(id)))
                .execute(conn)?;
            diesel::delete(exercise::table.filter(exercise::id.eq(id))).execute(conn)?;
            Ok(())
        })
        .map_err(handle_error)
    }

    /// True if any logged set exists under this exercise (via workout_exercise).
    fn referenced_by_set(conn: &mut SqliteConnection, id: i32) -> QueryResult<bool> {
        let we_ids: Vec<i32> = workout_exercise::table
            .filter(workout_exercise::exercise_id.eq(id))
            .select(workout_exercise::id)
            .load(conn)?;
        if we_ids.is_empty() {
            return Ok(false);
        }
        let n: i64 = workout_set::table
            .filter(workout_set::workout_exercise_id.eq_any(&we_ids))
            .count()
            .get_result(conn)?;
        Ok(n > 0)
    }

    fn write_muscles(
        conn: &mut SqliteConnection,
        exercise_id: i32,
        muscles: &[MuscleInput],
    ) -> QueryResult<()> {
        for m in muscles {
            diesel::insert_into(exercise_muscle::table)
                .values(NewExerciseMuscle {
                    exercise_id,
                    muscle: &m.muscle,
                    role: &m.role,
                })
                .execute(conn)?;
        }
        Ok(())
    }

    /// Unverified user exercises, oldest first (`[WO-043]` workspace list).
    pub fn unverified(conn: &mut SqliteConnection) -> QueryResult<Vec<ExerciseDetail>> {
        let rows = exercise::table
            .filter(exercise::slug.is_null())
            .filter(exercise::verified.eq(false))
            .order((exercise::added.asc(), exercise::time.asc()))
            .load::<Exercise>(conn)?;
        rows.into_iter().map(|e| Self::detail_of(conn, e)).collect()
    }

    /// Count + oldest timestamp for the avatar indicator (`[DH-019]`–`[DH-021]`).
    pub fn unverified_summary(conn: &mut SqliteConnection) -> QueryResult<UnverifiedSummary> {
        let base = exercise::table
            .filter(exercise::slug.is_null())
            .filter(exercise::verified.eq(false));
        let count: i64 = base.clone().count().get_result(conn)?;
        let oldest: Option<(Option<String>, Option<String>)> = base
            .select((exercise::added, exercise::time))
            .order((exercise::added.asc(), exercise::time.asc()))
            .first::<(Option<String>, Option<String>)>(conn)
            .optional()?;
        let (oldest_added, oldest_time) = oldest.unwrap_or((None, None));
        Ok(UnverifiedSummary {
            count,
            oldest_added,
            oldest_time,
        })
    }

    /// Apply one or more tags (a category and/or several muscle roles) to many
    /// unverified exercises in a single transaction, re-deriving `verified` and
    /// returning an undo snapshot (`[WO-041]`). Seeded rows are refused.
    pub fn batch_tag(
        conn: &mut SqliteConnection,
        input: &BatchTagInput,
    ) -> Result<BatchTagResult, String> {
        for &id in &input.exercise_ids {
            Self::ensure_user(conn, id)?;
        }
        conn.transaction::<_, diesel::result::Error, _>(|conn| {
            let mut items = Vec::with_capacity(input.exercise_ids.len());
            for &id in &input.exercise_ids {
                let ex = Self::find(conn, id)?;
                let mut undo = BatchTagUndoItem {
                    exercise_id: id,
                    prev_category: ex.category.clone(),
                    prev_verified: ex.verified,
                    muscles_added: Vec::new(),
                };
                for tag in &input.tags {
                    match tag.kind.as_str() {
                        "category" => {
                            diesel::update(exercise::table.filter(exercise::id.eq(id)))
                                .set(exercise::category.eq(&tag.value))
                                .execute(conn)?;
                        }
                        "muscle" => {
                            let role = tag.role.as_deref().unwrap_or("primary");
                            let exists: i64 = exercise_muscle::table
                                .filter(exercise_muscle::exercise_id.eq(id))
                                .filter(exercise_muscle::muscle.eq(&tag.value))
                                .count()
                                .get_result(conn)?;
                            if exists == 0 {
                                diesel::insert_into(exercise_muscle::table)
                                    .values(NewExerciseMuscle {
                                        exercise_id: id,
                                        muscle: &tag.value,
                                        role,
                                    })
                                    .execute(conn)?;
                                undo.muscles_added.push(MuscleInput {
                                    muscle: tag.value.clone(),
                                    role: role.to_string(),
                                });
                            }
                        }
                        other => {
                            return Err(diesel::result::Error::QueryBuilderError(
                                format!("Unknown batch tag kind '{}'", other).into(),
                            ));
                        }
                    }
                }
                Self::recompute_verified(conn, id)?;
                items.push(undo);
            }
            Ok(BatchTagResult { items })
        })
        .map_err(handle_error)
    }

    /// Revert a previous batch tag from its snapshot (`[WO-042]`).
    pub fn undo_batch_tag(
        conn: &mut SqliteConnection,
        result: &BatchTagResult,
    ) -> Result<(), String> {
        conn.transaction::<_, diesel::result::Error, _>(|conn| {
            for item in &result.items {
                for m in &item.muscles_added {
                    diesel::delete(
                        exercise_muscle::table
                            .filter(exercise_muscle::exercise_id.eq(item.exercise_id))
                            .filter(exercise_muscle::muscle.eq(&m.muscle)),
                    )
                    .execute(conn)?;
                }
                diesel::update(exercise::table.filter(exercise::id.eq(item.exercise_id)))
                    .set((
                        exercise::category.eq(&item.prev_category),
                        exercise::verified.eq(item.prev_verified),
                    ))
                    .execute(conn)?;
            }
            Ok(())
        })
        .map_err(handle_error)
    }

    pub fn categories(conn: &mut SqliteConnection) -> QueryResult<Vec<ExerciseCategory>> {
        exercise_category::table
            .filter(exercise_category::shortvalue.ne(UNCATEGORIZED))
            .order(exercise_category::longvalue.asc())
            .load(conn)
    }

    pub fn muscles(conn: &mut SqliteConnection) -> QueryResult<Vec<Muscle>> {
        muscle::table.order(muscle::longvalue.asc()).load(conn)
    }
}

// ============================================================================
// COMMANDS (Tauri)
// ============================================================================

fn conn_from(pool: &State<DbPool>) -> Result<PooledConnection, String> {
    pool.get()
        .map_err(|e| format!("Failed to get connection: {}", e))
}

fn require_active(conn: &mut SqliteConnection) -> Result<WorkoutSession, String> {
    WorkoutSession::active(conn)
        .map_err(handle_error)?
        .ok_or_else(|| "No active workout session".to_string())
}

/// Start a weight-lifting session. Refuses if one is already active (`[WO-001]`, `[WO-002]`).
#[command]
pub fn start_workout_session(
    pool: State<DbPool>,
    name: Option<String>,
) -> Result<WorkoutDetail, String> {
    let mut conn = conn_from(&pool)?;
    if WorkoutSession::active(&mut conn)
        .map_err(handle_error)?
        .is_some()
    {
        return Err("A workout session is already active".to_string());
    }
    let session = WorkoutSession::start(&mut conn, "wl", name).map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, session)
}

/// Log a set under an exercise (added to the workout if new). Validates metrics
/// against the type schema before persisting (`[WO-003]`, `[WO-004]`, `[WO-019]`).
#[command]
pub fn log_workout_set(
    pool: State<DbPool>,
    exercise_id: i32,
    metrics: LiftingSetMetrics,
) -> Result<WorkoutDetail, String> {
    if let Err(e) = metrics.validate() {
        return Err(format!("Validation failed: {:?}", e));
    }
    let mut conn = conn_from(&pool)?;
    let session = require_active(&mut conn)?;
    let json = serde_json::to_string(&metrics).map_err(|e| format!("Serialize failed: {}", e))?;
    // Adding the exercise (if new) and logging the set are one unit: a failed set
    // insert must not strand a childless workout_exercise row.
    conn.transaction(|conn| {
        let we = WorkoutExercise::add_or_get(conn, session.id, exercise_id)?;
        WorkoutSet::log(conn, we.id, json, WL_PAYLOAD_VER, now_ts())
    })
    .map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, session)
}

/// Edit a logged set's metrics (`[WO-014]`). The owning session is resolved from the
/// set, so this works on completed sessions too (history flat-CRUD edit), not only the
/// active one.
#[command]
pub fn update_workout_set(
    pool: State<DbPool>,
    set_id: i32,
    metrics: LiftingSetMetrics,
) -> Result<WorkoutDetail, String> {
    if let Err(e) = metrics.validate() {
        return Err(format!("Validation failed: {:?}", e));
    }
    let mut conn = conn_from(&pool)?;
    let json = serde_json::to_string(&metrics).map_err(|e| format!("Serialize failed: {}", e))?;
    WorkoutSet::update_metrics(&mut conn, set_id, json).map_err(handle_error)?;
    let session = WorkoutSession::for_set(&mut conn, set_id).map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, session)
}

/// Delete a logged set (`[WO-015]`). Resolves the owning session from the set first so
/// it works on completed sessions too.
#[command]
pub fn delete_workout_set(pool: State<DbPool>, set_id: i32) -> Result<WorkoutDetail, String> {
    let mut conn = conn_from(&pool)?;
    let session = WorkoutSession::for_set(&mut conn, set_id).map_err(handle_error)?;
    WorkoutSet::delete(&mut conn, set_id).map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, session)
}

/// Add a set to a specific session (active or completed). Powers history/flat-CRUD where
/// there is no active session; `logged_at` is anchored to the session's start so the
/// set lands on the workout's date. Validates metrics before persisting (`[HI-020]`,
/// `[HI-022]`).
#[command]
pub fn add_workout_set(
    pool: State<DbPool>,
    session_id: i32,
    exercise_id: i32,
    metrics: LiftingSetMetrics,
) -> Result<WorkoutDetail, String> {
    if let Err(e) = metrics.validate() {
        return Err(format!("Validation failed: {:?}", e));
    }
    let mut conn = conn_from(&pool)?;
    let session = WorkoutSession::find(&mut conn, session_id).map_err(handle_error)?;
    let json = serde_json::to_string(&metrics).map_err(|e| format!("Serialize failed: {}", e))?;
    let logged_at = session.started_at.clone();
    conn.transaction(|conn| {
        let we = WorkoutExercise::add_or_get(conn, session.id, exercise_id)?;
        WorkoutSet::log(conn, we.id, json, WL_PAYLOAD_VER, logged_at)
    })
    .map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, session)
}

/// List completed workouts whose start falls in `[from, to)` (RFC3339 UTC bounds), each
/// with full detail, most recent first (`[HI-014]`–`[HI-018]`, `[DH-011]`, `[PG-012]`).
#[command]
pub fn list_workouts(
    pool: State<DbPool>,
    from: String,
    to: String,
) -> Result<Vec<WorkoutDetail>, String> {
    let mut conn = conn_from(&pool)?;
    let sessions =
        WorkoutSession::completed_in_range(&mut conn, &from, &to).map_err(handle_error)?;
    sessions
        .into_iter()
        .map(|s| WorkoutSession::detail(&mut conn, s))
        .collect()
}

/// Delete a completed workout and all its data (`[HI-021]`). Refuses the active session —
/// that path is `discard_workout_session`.
#[command]
pub fn delete_workout(pool: State<DbPool>, session_id: i32) -> Result<(), String> {
    let mut conn = conn_from(&pool)?;
    let session = WorkoutSession::find(&mut conn, session_id).map_err(handle_error)?;
    if session.ended_at.is_none() {
        return Err("Cannot delete an active session; discard it instead".to_string());
    }
    WorkoutSession::discard(&mut conn, session_id).map_err(handle_error)?;
    Ok(())
}

/// Create a completed workout stamped to a past date (`[HI-022]`). Returns its detail so
/// the caller can immediately add sets via `add_workout_set`. `started_at` is RFC3339.
#[command]
pub fn create_workout_for_date(
    pool: State<DbPool>,
    started_at: String,
    name: Option<String>,
) -> Result<WorkoutDetail, String> {
    parse_ts(&started_at)?;
    let mut conn = conn_from(&pool)?;
    let session = WorkoutSession::create_completed(&mut conn, "wl", name, started_at)
        .map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, session)
}

/// Open a pause interval (`[WO-010]`).
#[command]
pub fn pause_workout_session(pool: State<DbPool>) -> Result<WorkoutDetail, String> {
    let mut conn = conn_from(&pool)?;
    let session = require_active(&mut conn)?;
    WorkoutPause::open(&mut conn, session.id, now_ts()).map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, session)
}

/// Close the open pause interval (`[WO-010]`).
#[command]
pub fn resume_workout_session(pool: State<DbPool>) -> Result<WorkoutDetail, String> {
    let mut conn = conn_from(&pool)?;
    let session = require_active(&mut conn)?;
    WorkoutPause::close_open(&mut conn, session.id, now_ts()).map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, session)
}

/// End the active session (closing any open pause first). Returns the ended session's
/// detail so the frontend can render the summary (`[WO-011]`).
#[command]
pub fn end_workout_session(pool: State<DbPool>) -> Result<WorkoutDetail, String> {
    let mut conn = conn_from(&pool)?;
    let session = require_active(&mut conn)?;
    // Closing any open pause and recording the end timestamp are one unit, so the
    // session can't end up ended-but-with-an-open-pause (or vice versa).
    let ended = conn
        .transaction(|conn| {
            WorkoutPause::close_open(conn, session.id, now_ts())?;
            WorkoutSession::end(conn, session.id, &now_ts())
        })
        .map_err(handle_error)?;
    WorkoutSession::detail(&mut conn, ended)
}

/// Discard the active session and all its data (`[WO-016]`).
#[command]
pub fn discard_workout_session(pool: State<DbPool>) -> Result<(), String> {
    let mut conn = conn_from(&pool)?;
    let session = require_active(&mut conn)?;
    WorkoutSession::discard(&mut conn, session.id).map_err(handle_error)?;
    Ok(())
}

/// Fetch the active session detail, auto-completing it first if stale (`[WO-020]`).
#[command]
pub fn get_active_workout(pool: State<DbPool>) -> Result<Option<WorkoutDetail>, String> {
    let mut conn = conn_from(&pool)?;
    WorkoutSession::auto_complete_if_stale(&mut conn)?;
    match WorkoutSession::active(&mut conn).map_err(handle_error)? {
        Some(session) => WorkoutSession::detail(&mut conn, session).map(Some),
        None => Ok(None),
    }
}

/// The exercise library — seeded + user-created (`[WO-012]`, `[WO-013]`, `[WO-033]`).
#[command]
pub fn get_exercise_library(pool: State<DbPool>) -> Result<Vec<ExerciseDetail>, String> {
    let mut conn = conn_from(&pool)?;
    Exercise::library(&mut conn).map_err(handle_error)
}

/// Surface the first human-readable message from a validation failure (`_conv-user-errors`).
fn first_validation_message(e: validator::ValidationErrors) -> String {
    e.field_errors()
        .values()
        .flat_map(|errs| errs.iter())
        .find_map(|err| err.message.as_ref().map(|m| m.to_string()))
        .unwrap_or_else(|| "Please check the highlighted fields".to_string())
}

/// Create a fully-specified user exercise (`[WO-029]`).
#[command]
pub fn create_exercise(
    pool: State<DbPool>,
    input: ExerciseInput,
) -> Result<ExerciseDetail, String> {
    input.validate().map_err(first_validation_message)?;
    let mut conn = conn_from(&pool)?;
    Exercise::create_full(&mut conn, &input)
}

/// Mid-workout quick-add: create a name-only unverified exercise and return it so the
/// caller can select it in place (`[WO-034]`, `[WO-036]`).
#[command]
pub fn quick_add_exercise(pool: State<DbPool>, name: String) -> Result<ExerciseDetail, String> {
    let mut conn = conn_from(&pool)?;
    Exercise::create_ghost(&mut conn, &name)
}

/// Edit a user exercise; promotes to verified once complete (`[WO-030]`, `[WO-035]`).
#[command]
pub fn update_exercise(
    pool: State<DbPool>,
    id: i32,
    input: ExerciseInput,
) -> Result<ExerciseDetail, String> {
    input.validate().map_err(first_validation_message)?;
    let mut conn = conn_from(&pool)?;
    Exercise::update_user(&mut conn, id, &input)
}

/// Delete a user exercise; guarded against seeded rows and logged-set references
/// (`[WO-028]`, `[WO-031]`, `[WO-032]`).
#[command]
pub fn delete_exercise(pool: State<DbPool>, id: i32) -> Result<(), String> {
    let mut conn = conn_from(&pool)?;
    Exercise::delete_user(&mut conn, id)
}

/// Unverified user exercises for the quick-fix workspace (`[WO-043]`).
#[command]
pub fn list_unverified_exercises(pool: State<DbPool>) -> Result<Vec<ExerciseDetail>, String> {
    let mut conn = conn_from(&pool)?;
    Exercise::unverified(&mut conn).map_err(handle_error)
}

/// Count + oldest timestamp backing the dashboard avatar indicator (`[DH-019]`–`[DH-021]`).
#[command]
pub fn unverified_exercise_summary(pool: State<DbPool>) -> Result<UnverifiedSummary, String> {
    let mut conn = conn_from(&pool)?;
    Exercise::unverified_summary(&mut conn).map_err(handle_error)
}

/// Apply one category/muscle tag to many unverified exercises at once (`[WO-041]`).
#[command]
pub fn batch_tag_exercises(
    pool: State<DbPool>,
    input: BatchTagInput,
) -> Result<BatchTagResult, String> {
    if input.exercise_ids.is_empty() {
        return Err("Select at least one exercise".to_string());
    }
    let mut conn = conn_from(&pool)?;
    Exercise::batch_tag(&mut conn, &input)
}

/// Revert a previous batch tag (Undo) (`[WO-042]`).
#[command]
pub fn undo_batch_tag(pool: State<DbPool>, result: BatchTagResult) -> Result<(), String> {
    let mut conn = conn_from(&pool)?;
    Exercise::undo_batch_tag(&mut conn, &result)
}

/// Exercise categories for the add/edit form (excludes the `uncategorized` sentinel).
#[command]
pub fn list_exercise_categories(pool: State<DbPool>) -> Result<Vec<ExerciseCategory>, String> {
    let mut conn = conn_from(&pool)?;
    Exercise::categories(&mut conn).map_err(handle_error)
}

/// Muscle vocabulary for the add/edit form.
#[command]
pub fn list_muscles(pool: State<DbPool>) -> Result<Vec<Muscle>, String> {
    let mut conn = conn_from(&pool)?;
    Exercise::muscles(&mut conn).map_err(handle_error)
}
