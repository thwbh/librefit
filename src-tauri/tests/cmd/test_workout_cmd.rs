use crate::helpers::setup_test_pool;
use diesel::prelude::*;
use librefit_lib::db::schema::workout_session;
use librefit_lib::scenario;
use librefit_lib::service::workout::{
    add_workout_set, create_workout_for_date, delete_workout, delete_workout_set,
    discard_workout_session, end_workout_session, get_active_workout, get_exercise_library,
    list_workouts, log_workout_set, pause_workout_session, resume_workout_session,
    start_workout_session, update_workout_set, LiftingSetMetrics,
};
use tauri::Manager;

fn metrics(reps: i32, weight_kg: f64) -> LiftingSetMetrics {
    LiftingSetMetrics { reps, weight_kg }
}

#[test]
fn start_creates_active_weight_lifting_session() {
    scenario!("[WO-001]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let detail = start_workout_session(app.state(), None).unwrap();

    assert_eq!(detail.session.workout_type, "wl");
    assert!(detail.session.ended_at.is_none());
    assert!(detail.exercises.is_empty());
}

#[test]
fn second_start_while_active_is_refused() {
    scenario!("[WO-002]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    let again = start_workout_session(app.state(), None);

    assert!(again.is_err());
    assert!(get_active_workout(app.state()).unwrap().is_some());
}

#[test]
fn log_set_records_under_exercise() {
    scenario!("[WO-003]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    let detail = log_workout_set(app.state(), 1, metrics(10, 80.0)).unwrap();

    assert_eq!(detail.exercises.len(), 1);
    assert_eq!(detail.exercises[0].exercise_id, 1);
    assert_eq!(detail.exercises[0].sets.len(), 1);
    assert_eq!(detail.exercises[0].sets[0].metrics.reps, 10);
    assert_eq!(detail.exercises[0].sets[0].metrics.weight_kg, 80.0);
    assert!(!detail.exercises[0].sets[0].logged_at.is_empty());
}

#[test]
fn multiple_exercises_and_sets_accumulate_in_order() {
    scenario!("[WO-004]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    log_workout_set(app.state(), 1, metrics(10, 80.0)).unwrap();
    log_workout_set(app.state(), 1, metrics(8, 85.0)).unwrap();
    let detail = log_workout_set(app.state(), 2, metrics(12, 40.0)).unwrap();

    assert_eq!(detail.exercises.len(), 2);
    assert_eq!(detail.exercises[0].exercise_id, 1);
    assert_eq!(detail.exercises[0].sets.len(), 2);
    assert_eq!(detail.exercises[0].sets[0].metrics.reps, 10);
    assert_eq!(detail.exercises[0].sets[1].metrics.reps, 8);
    assert_eq!(detail.exercises[1].exercise_id, 2);
    assert_eq!(detail.exercises[1].sets.len(), 1);
}

#[test]
fn ending_records_end_timestamp_and_clears_active() {
    scenario!("[WO-011]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    let ended = end_workout_session(app.state()).unwrap();

    assert!(ended.session.ended_at.is_some());
    assert!(get_active_workout(app.state()).unwrap().is_none());
}

#[test]
fn exercise_library_is_seeded_and_exposes_category_muscles_and_rest() {
    scenario!("[WO-012]", "[WO-013]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let library = get_exercise_library(app.state()).unwrap();
    assert!(!library.is_empty());

    let bench = library
        .iter()
        .find(|e| e.name == "Bench Press")
        .expect("Bench Press should be seeded");
    assert_eq!(bench.category, "barbell");
    assert!(bench.default_rest_seconds.is_some());
    assert!(bench
        .muscles
        .iter()
        .any(|m| m.muscle == "chest" && m.role == "primary"));
    assert!(bench.muscles.iter().any(|m| m.role == "secondary"));
}

// Exercise-library search (the WO-025/026/027 scenarios) is a frontend-only
// concern over the already-loaded library — there is no backend search command —
// so it is covered by ExercisePicker.svelte.test.ts, not here. (IDs written
// without brackets on purpose: the traceability scanner does a literal text scan,
// so a bracketed ID here would falsely credit a Rust test that doesn't exist.)

#[test]
fn edit_set_updates_metrics() {
    scenario!("[WO-014]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    let detail = log_workout_set(app.state(), 1, metrics(10, 80.0)).unwrap();
    let set_id = detail.exercises[0].sets[0].id;

    let updated = update_workout_set(app.state(), set_id, metrics(12, 100.0)).unwrap();

    assert_eq!(updated.exercises[0].sets[0].metrics.reps, 12);
    assert_eq!(updated.exercises[0].sets[0].metrics.weight_kg, 100.0);
}

#[test]
fn delete_set_removes_it() {
    scenario!("[WO-015]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    let detail = log_workout_set(app.state(), 1, metrics(10, 80.0)).unwrap();
    let set_id = detail.exercises[0].sets[0].id;

    let after = delete_workout_set(app.state(), set_id).unwrap();

    assert!(after.exercises[0].sets.is_empty());
}

#[test]
fn discard_deletes_session_and_data() {
    scenario!("[WO-016]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    log_workout_set(app.state(), 1, metrics(10, 80.0)).unwrap();
    discard_workout_session(app.state()).unwrap();

    assert!(get_active_workout(app.state()).unwrap().is_none());
}

#[test]
fn invalid_set_metrics_are_rejected_and_not_persisted() {
    scenario!("[WO-019]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    // reps = 0 violates the schema (min 1)
    let result = log_workout_set(app.state(), 1, metrics(0, 80.0));

    assert!(result.is_err());
    let detail = get_active_workout(app.state()).unwrap().unwrap();
    assert!(detail.exercises.is_empty());
}

#[test]
fn inactive_session_auto_completes() {
    scenario!("[WO-020]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool.clone());

    start_workout_session(app.state(), None).unwrap();

    // Backdate start well past the inactivity threshold, with no other activity.
    {
        let mut conn = pool.get().unwrap();
        diesel::update(workout_session::table)
            .set(workout_session::started_at.eq("2020-01-01T00:00:00.000Z"))
            .execute(&mut conn)
            .unwrap();
    }

    // Reading the active session triggers the stale check → auto-complete.
    assert!(get_active_workout(app.state()).unwrap().is_none());

    let ended_at: Option<String> = {
        let mut conn = pool.get().unwrap();
        workout_session::table
            .select(workout_session::ended_at)
            .first(&mut conn)
            .unwrap()
    };
    assert_eq!(ended_at.as_deref(), Some("2020-01-01T00:00:00.000Z"));
}

#[test]
fn pause_and_resume_workout_session() {
    scenario!("[WO-010]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    start_workout_session(app.state(), None).unwrap();
    let paused = pause_workout_session(app.state()).unwrap();

    assert_eq!(paused.pauses.len(), 1);
    assert!(paused.pauses[0].resumed_at.is_none());

    let resumed = resume_workout_session(app.state()).unwrap();
    assert_eq!(resumed.pauses.len(), 1);
    assert!(resumed.pauses[0].resumed_at.is_some());
}

#[test]
fn exercise_find_returns_correct_exercise() {
    scenario!("[WO-012]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let library = get_exercise_library(app.state()).unwrap();
    let bench_press = library.iter().find(|e| e.name == "Bench Press").unwrap();

    assert_eq!(bench_press.id, 1);
    assert_eq!(bench_press.category, "barbell");
    assert!(bench_press.default_rest_seconds.is_some());
    assert!(!bench_press.muscles.is_empty());
}

// ============================================================================
// WORKOUT HISTORY (list / retrospective add / delete / edit-completed)
// ============================================================================

#[test]
fn create_for_date_and_add_set_builds_completed_workout() {
    scenario!("[HI-022]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let created = create_workout_for_date(
        app.state(),
        "2026-05-01T10:00:00.000Z".into(),
        Some("Legs".into()),
    )
    .unwrap();
    // Stamped to the given date and already completed (so it never reads as active).
    assert_eq!(created.session.started_at, "2026-05-01T10:00:00.000Z");
    assert_eq!(
        created.session.ended_at.as_deref(),
        Some("2026-05-01T10:00:00.000Z")
    );
    assert!(get_active_workout(app.state()).unwrap().is_none());

    let detail = add_workout_set(app.state(), created.session.id, 1, metrics(10, 80.0)).unwrap();
    assert_eq!(detail.exercises.len(), 1);
    assert_eq!(detail.exercises[0].sets.len(), 1);
    // The added set lands on the workout's date, not today.
    assert_eq!(
        detail.exercises[0].sets[0].logged_at,
        "2026-05-01T10:00:00.000Z"
    );
    // Still not active.
    assert!(get_active_workout(app.state()).unwrap().is_none());
}

#[test]
fn list_workouts_returns_completed_in_range_excluding_active() {
    scenario!("[HI-014]", "[PG-012]", "[DH-011]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // A completed retrospective workout on 2026-05-01.
    let may =
        create_workout_for_date(app.state(), "2026-05-01T10:00:00.000Z".into(), None).unwrap();
    add_workout_set(app.state(), may.session.id, 1, metrics(10, 80.0)).unwrap();

    // An active session (ended_at NULL) must be excluded from history.
    start_workout_session(app.state(), None).unwrap();
    log_workout_set(app.state(), 1, metrics(5, 60.0)).unwrap();

    // A wide window still returns only the completed one, with its set detail.
    let all = list_workouts(
        app.state(),
        "2026-01-01T00:00:00.000Z".into(),
        "2027-01-01T00:00:00.000Z".into(),
    )
    .unwrap();
    assert_eq!(all.len(), 1);
    assert_eq!(all[0].session.id, may.session.id);
    assert_eq!(all[0].exercises[0].sets[0].metrics.reps, 10);

    // A single-day window bounding 2026-05-01 returns it.
    let day = list_workouts(
        app.state(),
        "2026-05-01T00:00:00.000Z".into(),
        "2026-05-02T00:00:00.000Z".into(),
    )
    .unwrap();
    assert_eq!(day.len(), 1);

    // A window not covering it returns nothing.
    let empty = list_workouts(
        app.state(),
        "2026-04-01T00:00:00.000Z".into(),
        "2026-05-01T00:00:00.000Z".into(),
    )
    .unwrap();
    assert!(empty.is_empty());
}

#[test]
fn delete_workout_removes_completed_and_refuses_active() {
    scenario!("[HI-021]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let completed =
        create_workout_for_date(app.state(), "2026-05-01T10:00:00.000Z".into(), None).unwrap();
    add_workout_set(app.state(), completed.session.id, 1, metrics(10, 80.0)).unwrap();

    delete_workout(app.state(), completed.session.id).unwrap();
    let after = list_workouts(
        app.state(),
        "2026-01-01T00:00:00.000Z".into(),
        "2027-01-01T00:00:00.000Z".into(),
    )
    .unwrap();
    assert!(after.is_empty());

    // The active session cannot be removed via delete_workout.
    let active = start_workout_session(app.state(), None).unwrap();
    let refused = delete_workout(app.state(), active.session.id);
    assert!(refused.is_err());
    assert!(get_active_workout(app.state()).unwrap().is_some());
}

#[test]
fn edit_and_delete_sets_on_completed_workout() {
    scenario!("[HI-020]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let created =
        create_workout_for_date(app.state(), "2026-05-01T10:00:00.000Z".into(), None).unwrap();
    let detail = add_workout_set(app.state(), created.session.id, 1, metrics(10, 80.0)).unwrap();
    let set_id = detail.exercises[0].sets[0].id;

    // No active session exists, yet editing a completed session's set still works.
    assert!(get_active_workout(app.state()).unwrap().is_none());
    let updated = update_workout_set(app.state(), set_id, metrics(12, 100.0)).unwrap();
    assert_eq!(updated.exercises[0].sets[0].metrics.reps, 12);
    assert_eq!(updated.exercises[0].sets[0].metrics.weight_kg, 100.0);

    let removed = delete_workout_set(app.state(), set_id).unwrap();
    assert!(removed.exercises[0].sets.is_empty());
}
