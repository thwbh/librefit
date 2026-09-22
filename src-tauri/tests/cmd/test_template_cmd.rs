use crate::helpers::setup_test_pool;
use librefit_lib::scenario;
use librefit_lib::service::workout::{
    clone_workout_template, create_exercise, create_workout_template, delete_exercise,
    delete_workout_template, list_workout_templates, start_workout_from_template,
    swap_template_exercise, update_workout_template, ExerciseInput, MuscleInput,
    TemplateExerciseInput, TemplateInput,
};
use tauri::Manager;

fn entry(exercise_id: i32) -> TemplateExerciseInput {
    TemplateExerciseInput {
        exercise_id,
        target_reps: None,
        target_weight_kg: None,
        notes: None,
    }
}

fn tmpl(name: &str, exercise_ids: &[i32]) -> TemplateInput {
    TemplateInput {
        name: name.to_string(),
        description: None,
        exercises: exercise_ids.iter().map(|id| entry(*id)).collect(),
    }
}

fn full_exercise(name: &str) -> ExerciseInput {
    ExerciseInput {
        name: name.to_string(),
        category: "barbell".to_string(),
        default_rest_seconds: Some(90),
        muscles: vec![MuscleInput {
            muscle: "chest".to_string(),
            role: "primary".to_string(),
        }],
    }
}

#[test]
fn build_template_from_scratch_saves_ordered_exercises() {
    scenario!("[WO-037]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Seeded exercise ids: Bench Press=1, Back Squat=2, Barbell Row=5.
    let detail = create_workout_template(app.state(), tmpl("Custom Routine", &[1, 2, 5])).unwrap();

    assert!(!detail.template.is_predefined);
    assert_eq!(
        detail
            .exercises
            .iter()
            .map(|e| e.exercise_id)
            .collect::<Vec<_>>(),
        vec![1, 2, 5],
        "exercises kept in the given order"
    );
    assert_eq!(
        detail
            .exercises
            .iter()
            .map(|e| e.sequence)
            .collect::<Vec<_>>(),
        vec![0, 1, 2],
        "sequence is dense and 0-based"
    );
}

#[test]
fn clone_predefined_creates_editable_copy_leaving_source_unchanged() {
    scenario!("[WO-038]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Predefined "Push Day" is seeded as template id 1 with 5 exercises.
    let copy = clone_workout_template(app.state(), 1).unwrap();
    assert!(!copy.template.is_predefined, "copy is editable");
    assert!(copy.template.name.contains("(copy)"));
    assert_eq!(copy.exercises.len(), 5);

    // Editing the copy is allowed and does not touch the predefined source.
    update_workout_template(app.state(), copy.template.id, tmpl("My Push", &[1])).unwrap();

    let templates = list_workout_templates(app.state()).unwrap();
    let source = templates.iter().find(|t| t.template.id == 1).unwrap();
    assert!(source.template.is_predefined);
    assert_eq!(source.exercises.len(), 5, "predefined source unchanged");
    assert_eq!(source.template.name, "Push Day");

    // Editing a predefined template directly is refused.
    assert!(update_workout_template(app.state(), 1, tmpl("Hacked", &[1])).is_err());
    assert!(delete_workout_template(app.state(), 1).is_err());
}

#[test]
fn swap_exercise_preserves_position() {
    scenario!("[WO-039]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let detail = create_workout_template(app.state(), tmpl("Swap Me", &[1, 2, 5])).unwrap();
    let middle = detail.exercises[1].id; // the entry at sequence 1 (exercise 2)

    // Swap the middle entry for exercise 7 (Dumbbell Curl).
    let after = swap_template_exercise(app.state(), middle, 7).unwrap();

    assert_eq!(
        after
            .exercises
            .iter()
            .map(|e| e.exercise_id)
            .collect::<Vec<_>>(),
        vec![1, 7, 5],
        "replacement takes the middle position, order preserved"
    );
    assert_eq!(
        after
            .exercises
            .iter()
            .map(|e| e.sequence)
            .collect::<Vec<_>>(),
        vec![0, 1, 2],
        "sequence stays dense"
    );
}

#[test]
fn start_from_template_prefills_exercises_in_order() {
    scenario!("[WO-040]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Push Day (predefined id 1): bench-press(1), overhead-press(4),
    // incline-bench-press(13), tricep-pushdown(8), lateral-raise(14).
    let session = start_workout_from_template(app.state(), 1, None).unwrap();

    assert!(session.session.ended_at.is_none(), "session is active");
    assert_eq!(
        session
            .exercises
            .iter()
            .map(|e| e.exercise_id)
            .collect::<Vec<_>>(),
        vec![1, 4, 13, 8, 14],
        "session prefilled with the template's exercises in order"
    );

    // Single-active-session rule still applies.
    assert!(start_workout_from_template(app.state(), 2, None).is_err());
}

#[test]
fn deleting_exercise_referenced_by_template_is_guarded() {
    scenario!("[WO-032]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let ex = create_exercise(app.state(), full_exercise("Yoke Carry")).unwrap();
    create_workout_template(app.state(), tmpl("Uses Yoke", &[ex.id])).unwrap();

    let result = delete_exercise(app.state(), ex.id);
    assert!(
        result.is_err(),
        "an exercise a template references can't be deleted"
    );
}
