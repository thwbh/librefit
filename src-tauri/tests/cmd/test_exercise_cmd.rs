use crate::helpers::setup_test_pool;
use librefit_lib::scenario;
use librefit_lib::service::workout::{
    batch_tag_exercises, create_exercise, delete_exercise, get_exercise_library,
    list_unverified_exercises, log_workout_set, quick_add_exercise, start_workout_session,
    undo_batch_tag, unverified_exercise_summary, update_exercise, BatchTag, BatchTagInput,
    ExerciseInput, LiftingSetMetrics, MuscleInput,
};
use tauri::Manager;

fn full_input(name: &str, category: &str) -> ExerciseInput {
    ExerciseInput {
        name: name.to_string(),
        category: category.to_string(),
        default_rest_seconds: Some(90),
        muscles: vec![MuscleInput {
            muscle: "chest".to_string(),
            role: "primary".to_string(),
        }],
    }
}

#[test]
fn create_full_user_exercise_is_user_owned_and_verified() {
    scenario!("[WO-029]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let ex = create_exercise(app.state(), full_input("Atlas Press", "barbell")).unwrap();

    assert!(!ex.seeded, "user-created exercise must not be seeded");
    assert!(ex.verified, "full metadata should be verified");
    assert_eq!(ex.category, "barbell");
    assert_eq!(ex.muscles.len(), 1);
}

#[test]
fn quick_add_creates_unverified_ghost() {
    scenario!("[WO-034]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let ex = quick_add_exercise(app.state(), "Sandbag Carry".to_string()).unwrap();

    assert!(!ex.seeded);
    assert!(!ex.verified, "name-only exercise is a Ghost");
    assert_eq!(ex.category, "uncategorized");
    assert!(ex.muscles.is_empty());
}

#[test]
fn completing_metadata_promotes_to_verified() {
    scenario!("[WO-035]", "[WO-030]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let ghost = quick_add_exercise(app.state(), "Sled Push".to_string()).unwrap();
    assert!(!ghost.verified);

    let updated =
        update_exercise(app.state(), ghost.id, full_input("Sled Push", "machine")).unwrap();

    assert!(updated.verified, "supplying category + muscles verifies it");
    assert_eq!(updated.category, "machine");
    assert_eq!(updated.muscles.len(), 1);
}

#[test]
fn seeded_exercise_cannot_be_edited_or_deleted() {
    scenario!("[WO-028]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Seeded ids are 1..=49 (see the workout-tracking seed migration).
    let edit = update_exercise(app.state(), 1, full_input("Hacked", "barbell"));
    let del = delete_exercise(app.state(), 1);

    assert!(edit.is_err(), "seeded edit must be refused");
    assert!(del.is_err(), "seeded delete must be refused");
}

#[test]
fn delete_unreferenced_user_exercise_removes_it() {
    scenario!("[WO-031]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let ex = create_exercise(app.state(), full_input("Zercher Squat", "barbell")).unwrap();
    delete_exercise(app.state(), ex.id).unwrap();

    let library = get_exercise_library(app.state()).unwrap();
    assert!(!library.iter().any(|e| e.id == ex.id));
}

#[test]
fn deleting_referenced_user_exercise_is_guarded() {
    scenario!("[WO-032]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let ex = create_exercise(app.state(), full_input("Yoke Carry", "barbell")).unwrap();
    start_workout_session(app.state(), None).unwrap();
    log_workout_set(
        app.state(),
        ex.id,
        LiftingSetMetrics {
            reps: 5,
            weight_kg: 100.0,
        },
    )
    .unwrap();

    let result = delete_exercise(app.state(), ex.id);

    assert!(
        result.is_err(),
        "deleting a logged exercise must be refused"
    );
    let library = get_exercise_library(app.state()).unwrap();
    assert!(
        library.iter().any(|e| e.id == ex.id),
        "exercise must remain"
    );
}

#[test]
fn library_marks_seeded_and_user_rows() {
    scenario!("[WO-012]", "[WO-013]", "[WO-033]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    create_exercise(app.state(), full_input("Custom Move", "barbell")).unwrap();
    let library = get_exercise_library(app.state()).unwrap();

    let seeded = library.iter().find(|e| e.id == 1).unwrap();
    assert!(seeded.seeded && seeded.verified);
    assert!(!seeded.category.is_empty() && !seeded.muscles.is_empty());

    let user = library.iter().find(|e| e.name == "Custom Move").unwrap();
    assert!(!user.seeded);
}

#[test]
fn batch_tag_category_and_muscle_promotes_when_complete() {
    scenario!("[WO-041]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let a = quick_add_exercise(app.state(), "Ghost A".to_string()).unwrap();
    let b = quick_add_exercise(app.state(), "Ghost B".to_string()).unwrap();

    // Category alone is not enough to verify (still needs a muscle).
    batch_tag_exercises(
        app.state(),
        BatchTagInput {
            exercise_ids: vec![a.id, b.id],
            tag: BatchTag {
                kind: "category".into(),
                value: "dumbbell".into(),
                role: None,
            },
        },
    )
    .unwrap();
    assert_eq!(unverified_exercise_summary(app.state()).unwrap().count, 2);

    // Adding a muscle completes them -> verified, off the unverified list.
    batch_tag_exercises(
        app.state(),
        BatchTagInput {
            exercise_ids: vec![a.id, b.id],
            tag: BatchTag {
                kind: "muscle".into(),
                value: "biceps".into(),
                role: Some("primary".into()),
            },
        },
    )
    .unwrap();

    assert_eq!(unverified_exercise_summary(app.state()).unwrap().count, 0);
    assert!(list_unverified_exercises(app.state()).unwrap().is_empty());
}

#[test]
fn undo_batch_tag_reverts_state() {
    scenario!("[WO-042]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let g = quick_add_exercise(app.state(), "Ghost C".to_string()).unwrap();
    let res = batch_tag_exercises(
        app.state(),
        BatchTagInput {
            exercise_ids: vec![g.id],
            tag: BatchTag {
                kind: "muscle".into(),
                value: "chest".into(),
                role: Some("primary".into()),
            },
        },
    )
    .unwrap();

    undo_batch_tag(app.state(), res).unwrap();

    let after = list_unverified_exercises(app.state()).unwrap();
    let reverted = after.iter().find(|e| e.id == g.id).unwrap();
    assert!(
        reverted.muscles.is_empty(),
        "added muscle should be removed"
    );
    assert!(!reverted.verified);
}

#[test]
fn unverified_summary_counts_and_clears() {
    scenario!("[DH-019]", "[DH-021]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    assert_eq!(unverified_exercise_summary(app.state()).unwrap().count, 0);

    let g = quick_add_exercise(app.state(), "Ghost D".to_string()).unwrap();
    let summary = unverified_exercise_summary(app.state()).unwrap();
    assert_eq!(summary.count, 1);
    assert!(summary.oldest_added.is_some());
    assert!(summary.oldest_time.is_some());

    update_exercise(app.state(), g.id, full_input("Ghost D", "cable")).unwrap();
    assert_eq!(unverified_exercise_summary(app.state()).unwrap().count, 0);
}
