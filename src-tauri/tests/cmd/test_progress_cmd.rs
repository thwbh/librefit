use crate::helpers::setup_test_pool;
use chrono::{Days, Local};
use librefit_lib::service::intake::{
    create_intake, create_intake_target, NewIntake, NewIntakeTarget,
};
use librefit_lib::service::progress::get_tracker_progress;
use librefit_lib::service::weight::{
    create_weight_target, create_weight_tracker_entry, NewWeightTarget, NewWeightTracker,
};
use tauri::Manager;

/// Returns test dates relative to today to avoid "target date lies in the past" validation errors.
/// Returns (start_date, end_date, mid_date, query_date) as formatted strings.
fn get_future_test_dates() -> (String, String, String, String) {
    let today = Local::now().date_naive();
    let start = today.checked_add_days(Days::new(1)).unwrap();
    let end = today.checked_add_days(Days::new(31)).unwrap();
    let mid = today.checked_add_days(Days::new(5)).unwrap();
    let query = today.checked_add_days(Days::new(10)).unwrap();
    (
        start.format("%Y-%m-%d").to_string(),
        end.format("%Y-%m-%d").to_string(),
        mid.format("%Y-%m-%d").to_string(),
        query.format("%Y-%m-%d").to_string(),
    )
}

// ============================================================================
// PROGRESS TRACKER TESTS
// ============================================================================

#[test]
fn test_get_tracker_progress_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let (start_date, end_date, mid_date, query_date) = get_future_test_dates();

    // Create targets
    let intake_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_intake_target(app.state(), intake_target).unwrap();

    let weight_target = NewWeightTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Create tracker entries
    let entry1 = NewIntake::new(mid_date.clone(), 1800, "b".to_string(), None);
    create_intake(app.state(), entry1).unwrap();

    let entry2 = NewIntake::new(mid_date.clone(), 2000, "l".to_string(), None);
    create_intake(app.state(), entry2).unwrap();

    let weight_entry = NewWeightTracker::new(mid_date.clone(), 79.5);
    create_weight_tracker_entry(app.state(), weight_entry).unwrap();

    // Get progress
    let result = get_tracker_progress(app.state(), query_date);

    assert!(result.is_ok());
    let progress = result.unwrap();
    assert_eq!(progress.intake_target.target_calories, 2000);
    assert_eq!(progress.weight_target.target_weight, 75.0);
    assert!(progress.days_passed >= 0);
    assert!(progress.days_total > 0);
}

#[test]
fn test_get_tracker_progress_no_intake_target() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let (start_date, end_date, _, query_date) = get_future_test_dates();

    // Create only weight target
    let weight_target = NewWeightTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    let result = get_tracker_progress(app.state(), query_date);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("No calorie target found"));
}

#[test]
fn test_get_tracker_progress_no_weight_target() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let (start_date, end_date, _, query_date) = get_future_test_dates();

    // Create only calorie target
    let intake_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_intake_target(app.state(), intake_target).unwrap();

    let result = get_tracker_progress(app.state(), query_date);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("No weight target found"));
}

#[test]
fn test_get_tracker_progress_empty_trackers() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let (start_date, end_date, _, query_date) = get_future_test_dates();

    // Create targets but no tracker entries
    let intake_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_intake_target(app.state(), intake_target).unwrap();

    let weight_target = NewWeightTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    let result = get_tracker_progress(app.state(), query_date);

    assert!(result.is_ok());
    let progress = result.unwrap();
    // Empty trackers should return zeroed chart data
    assert_eq!(progress.intake_chart_data.avg, 0.0);
    assert_eq!(progress.intake_chart_data.legend.len(), 0);
    assert_eq!(progress.weight_chart_data.avg, 0.0);
}

#[test]
fn test_get_tracker_progress_invalid_date_format() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let (start_date, end_date, _, _) = get_future_test_dates();

    // Create targets
    let intake_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_intake_target(app.state(), intake_target).unwrap();

    let weight_target = NewWeightTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
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

    let (start_date, end_date, mid_date, query_date) = get_future_test_dates();

    // Create targets
    let intake_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_intake_target(app.state(), intake_target).unwrap();

    let weight_target = NewWeightTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Create multiple entries on same day
    let entry1 = NewIntake::new(mid_date.clone(), 500, "b".to_string(), None);
    create_intake(app.state(), entry1).unwrap();

    let entry2 = NewIntake::new(mid_date.clone(), 700, "l".to_string(), None);
    create_intake(app.state(), entry2).unwrap();

    let entry3 = NewIntake::new(mid_date.clone(), 800, "d".to_string(), None);
    create_intake(app.state(), entry3).unwrap();

    let result = get_tracker_progress(app.state(), query_date);

    assert!(result.is_ok());
    let progress = result.unwrap();
    // Should aggregate entries for the same day
    assert!(progress.intake_chart_data.values.len() > 0);
}

#[test]
fn test_get_tracker_progress_date_before_target_end() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let (start_date, end_date, _, query_date) = get_future_test_dates();

    // Create targets
    let intake_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_intake_target(app.state(), intake_target).unwrap();

    let weight_target = NewWeightTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Query date before target end date
    let result = get_tracker_progress(app.state(), query_date);

    assert!(result.is_ok());
    let progress = result.unwrap();
    assert!(progress.days_passed < progress.days_total);
}

#[test]
fn test_get_tracker_progress_date_after_target_end() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let today = Local::now().date_naive();
    let start = today.checked_add_days(Days::new(1)).unwrap();
    let end = today.checked_add_days(Days::new(15)).unwrap(); // Shorter range
    let query_after_end = today.checked_add_days(Days::new(31)).unwrap(); // Query after end

    let start_date = start.format("%Y-%m-%d").to_string();
    let end_date = end.format("%Y-%m-%d").to_string();
    let query_date = query_after_end.format("%Y-%m-%d").to_string();

    // Create targets
    let intake_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_intake_target(app.state(), intake_target).unwrap();

    let weight_target = NewWeightTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Query date after target end date
    let result = get_tracker_progress(app.state(), query_date);

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

    let today = Local::now().date_naive();
    let start = today.checked_add_days(Days::new(1)).unwrap();
    let end = today.checked_add_days(Days::new(31)).unwrap();
    let entry1_date = today.checked_add_days(Days::new(5)).unwrap();
    let entry2_date = today.checked_add_days(Days::new(10)).unwrap();
    let entry3_date = today.checked_add_days(Days::new(15)).unwrap();
    let query = today.checked_add_days(Days::new(20)).unwrap();

    let start_date = start.format("%Y-%m-%d").to_string();
    let end_date = end.format("%Y-%m-%d").to_string();
    let query_date = query.format("%Y-%m-%d").to_string();

    // Create targets
    let intake_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        target_calories: 2000,
        maximum_calories: 2500,
    };
    create_intake_target(app.state(), intake_target).unwrap();

    let weight_target = NewWeightTarget {
        added: start_date.clone(),
        start_date: start_date.clone(),
        end_date: end_date.clone(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };
    create_weight_target(app.state(), weight_target).unwrap();

    // Create weight entries
    let weight1 = NewWeightTracker::new(entry1_date.format("%Y-%m-%d").to_string(), 79.8);
    create_weight_tracker_entry(app.state(), weight1).unwrap();

    let weight2 = NewWeightTracker::new(entry2_date.format("%Y-%m-%d").to_string(), 78.5);
    create_weight_tracker_entry(app.state(), weight2).unwrap();

    let weight3 = NewWeightTracker::new(entry3_date.format("%Y-%m-%d").to_string(), 77.2);
    create_weight_tracker_entry(app.state(), weight3).unwrap();

    let result = get_tracker_progress(app.state(), query_date);

    assert!(result.is_ok());
    let progress = result.unwrap();
    assert_eq!(progress.weight_chart_data.values.len(), 3);
    assert!(progress.weight_chart_data.avg > 0.0);
    assert!(progress.weight_chart_data.min > 0.0);
    assert!(progress.weight_chart_data.max > 0.0);
}
