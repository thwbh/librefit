use crate::helpers::setup_test_pool;
use librefit_lib::service::intake::{
    create_calorie_target, create_calorie_tracker_entry, NewIntake, NewIntakeTarget,
};
use librefit_lib::service::progress::get_tracker_progress;
use librefit_lib::service::weight::{
    create_weight_target, create_weight_tracker_entry, NewWeightTarget, NewWeightTracker,
};
use tauri::Manager;

// ============================================================================
// PROGRESS TRACKER TESTS
// ============================================================================

#[test]
fn test_get_tracker_progress_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create targets
    let calorie_target = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_calorie_target(app.state(), calorie_target).unwrap();

    let weight_target = NewWeightTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Create tracker entries
    let entry1 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 1800,
        category: "b".to_string(),
        description: None,
    };
    create_calorie_tracker_entry(app.state(), entry1).unwrap();

    let entry2 = NewIntake {
        added: "2026-01-06".to_string(),
        amount: 2000,
        category: "l".to_string(),
        description: None,
    };
    create_calorie_tracker_entry(app.state(), entry2).unwrap();

    let weight_entry = NewWeightTracker {
        added: "2026-01-05".to_string(),
        amount: 79.5,
    };
    create_weight_tracker_entry(app.state(), weight_entry).unwrap();

    // Get progress
    let result = get_tracker_progress(app.state(), "2026-01-10".to_string());

    assert!(result.is_ok());
    let progress = result.unwrap();
    assert_eq!(progress.calorie_target.target_calories, 2000);
    assert_eq!(progress.weight_target.target_weight, 75.0);
    assert!(progress.days_passed >= 0);
    assert!(progress.days_total > 0);
}

#[test]
fn test_get_tracker_progress_no_calorie_target() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create only weight target
    let weight_target = NewWeightTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    let result = get_tracker_progress(app.state(), "2026-01-10".to_string());

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("No calorie target found"));
}

#[test]
fn test_get_tracker_progress_no_weight_target() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create only calorie target
    let calorie_target = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_calorie_target(app.state(), calorie_target).unwrap();

    let result = get_tracker_progress(app.state(), "2026-01-10".to_string());

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("No weight target found"));
}

#[test]
fn test_get_tracker_progress_empty_trackers() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create targets but no tracker entries
    let calorie_target = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_calorie_target(app.state(), calorie_target).unwrap();

    let weight_target = NewWeightTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    let result = get_tracker_progress(app.state(), "2026-01-10".to_string());

    assert!(result.is_ok());
    let progress = result.unwrap();
    // Empty trackers should return zeroed chart data
    assert_eq!(progress.calorie_chart_data.avg, 0.0);
    assert_eq!(progress.calorie_chart_data.legend.len(), 0);
    assert_eq!(progress.weight_chart_data.avg, 0.0);
}

#[test]
fn test_get_tracker_progress_invalid_date_format() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create targets
    let calorie_target = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_calorie_target(app.state(), calorie_target).unwrap();

    let weight_target = NewWeightTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    let result = get_tracker_progress(app.state(), "invalid-date".to_string());

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Invalid date format"));
}

#[test]
fn test_get_tracker_progress_with_multiple_entries_same_day() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create targets
    let calorie_target = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_calorie_target(app.state(), calorie_target).unwrap();

    let weight_target = NewWeightTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Create multiple entries on same day
    let entry1 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };
    create_calorie_tracker_entry(app.state(), entry1).unwrap();

    let entry2 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 700,
        category: "l".to_string(),
        description: None,
    };
    create_calorie_tracker_entry(app.state(), entry2).unwrap();

    let entry3 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 800,
        category: "d".to_string(),
        description: None,
    };
    create_calorie_tracker_entry(app.state(), entry3).unwrap();

    let result = get_tracker_progress(app.state(), "2026-01-10".to_string());

    assert!(result.is_ok());
    let progress = result.unwrap();
    // Should aggregate entries for the same day
    assert!(progress.calorie_chart_data.values.len() > 0);
}

#[test]
fn test_get_tracker_progress_date_before_target_end() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create targets
    let calorie_target = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_calorie_target(app.state(), calorie_target).unwrap();

    let weight_target = NewWeightTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Query date before target end date
    let result = get_tracker_progress(app.state(), "2026-01-15".to_string());

    assert!(result.is_ok());
    let progress = result.unwrap();
    assert!(progress.days_passed < progress.days_total);
}

#[test]
fn test_get_tracker_progress_date_after_target_end() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create targets
    let calorie_target = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_calorie_target(app.state(), calorie_target).unwrap();

    let weight_target = NewWeightTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-15".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Query date after target end date
    let result = get_tracker_progress(app.state(), "2026-01-31".to_string());

    assert!(result.is_ok());
    let progress = result.unwrap();
    // Should cap at target end date
    assert_eq!(progress.days_passed, progress.days_total);
}

#[test]
fn test_get_tracker_progress_with_weight_entries() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create targets
    let calorie_target = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_calorie_target(app.state(), calorie_target).unwrap();

    let weight_target = NewWeightTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-01-31".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Create weight entries
    let weight1 = NewWeightTracker {
        added: "2026-01-05".to_string(),
        amount: 79.8,
    };
    create_weight_tracker_entry(app.state(), weight1).unwrap();

    let weight2 = NewWeightTracker {
        added: "2026-01-10".to_string(),
        amount: 78.5,
    };
    create_weight_tracker_entry(app.state(), weight2).unwrap();

    let weight3 = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 77.2,
    };
    create_weight_tracker_entry(app.state(), weight3).unwrap();

    let result = get_tracker_progress(app.state(), "2026-01-20".to_string());

    assert!(result.is_ok());
    let progress = result.unwrap();
    assert_eq!(progress.weight_chart_data.values.len(), 3);
    assert!(progress.weight_chart_data.avg > 0.0);
    assert!(progress.weight_chart_data.min > 0.0);
    assert!(progress.weight_chart_data.max > 0.0);
}
