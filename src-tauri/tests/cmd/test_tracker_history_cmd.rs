use crate::helpers::setup_test_pool;
use librefit_lib::service::intake::{create_intake, NewIntake};
use librefit_lib::service::tracker_history::get_tracker_history;
use librefit_lib::service::weight::{create_weight_tracker_entry, NewWeightTracker};
use tauri::Manager;

// ============================================================================
// TRACKER HISTORY TESTS
// ============================================================================

#[test]
fn test_get_tracker_history_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create tracker entries
    let entry1 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 1800,
        category: "b".to_string(),
        description: None,
    };
    create_intake(app.state(), entry1).unwrap();

    let entry2 = NewIntake {
        added: "2026-01-06".to_string(),
        amount: 2000,
        category: "l".to_string(),
        description: None,
    };
    create_intake(app.state(), entry2).unwrap();

    let weight_entry = NewWeightTracker {
        added: "2026-01-05".to_string(),
        amount: 79.5,
    };
    create_weight_tracker_entry(app.state(), weight_entry).unwrap();

    let result = get_tracker_history(
        app.state(),
        "2026-01-01".to_string(),
        "2026-01-10".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    assert!(history.intake_history.len() > 0);
    assert!(history.weight_history.len() > 0);
    assert_eq!(history.date_last_str, "2026-01-10");
}

#[test]
fn test_get_tracker_history_empty_range() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_tracker_history(
        app.state(),
        "2026-01-01".to_string(),
        "2026-01-10".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    // Should interpolate empty days
    assert!(history.intake_history.len() > 0);
    assert_eq!(history.calories_average, 0.0);
}

#[test]
fn test_get_tracker_history_invalid_date_from() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_tracker_history(
        app.state(),
        "invalid-date".to_string(),
        "2026-01-10".to_string(),
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Invalid date_from format"));
}

#[test]
fn test_get_tracker_history_invalid_date_to() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_tracker_history(
        app.state(),
        "2026-01-01".to_string(),
        "invalid-date".to_string(),
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Invalid date_to format"));
}

#[test]
fn test_get_tracker_history_single_day_range() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let entry = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 1800,
        category: "b".to_string(),
        description: None,
    };
    create_intake(app.state(), entry).unwrap();

    let result = get_tracker_history(
        app.state(),
        "2026-01-05".to_string(),
        "2026-01-05".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    assert_eq!(history.intake_history.len(), 1);
    assert!(history.intake_history.contains_key("2026-01-05"));
}

#[test]
fn test_get_tracker_history_multiple_entries_same_day() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create multiple entries on same day
    let entry1 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };
    create_intake(app.state(), entry1).unwrap();

    let entry2 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 700,
        category: "l".to_string(),
        description: None,
    };
    create_intake(app.state(), entry2).unwrap();

    let entry3 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 800,
        category: "d".to_string(),
        description: None,
    };
    create_intake(app.state(), entry3).unwrap();

    let result = get_tracker_history(
        app.state(),
        "2026-01-05".to_string(),
        "2026-01-05".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    assert_eq!(history.intake_history.len(), 1);
    // All 3 entries should be in the same day
    let day_entries = history.intake_history.get("2026-01-05").unwrap();
    assert_eq!(day_entries.len(), 3);
}

#[test]
fn test_get_tracker_history_interpolates_missing_days() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entries only on day 1 and day 10
    let entry1 = NewIntake {
        added: "2026-01-01".to_string(),
        amount: 1800,
        category: "b".to_string(),
        description: None,
    };
    create_intake(app.state(), entry1).unwrap();

    let entry2 = NewIntake {
        added: "2026-01-10".to_string(),
        amount: 2000,
        category: "l".to_string(),
        description: None,
    };
    create_intake(app.state(), entry2).unwrap();

    let result = get_tracker_history(
        app.state(),
        "2026-01-01".to_string(),
        "2026-01-10".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    // Should have 10 days (interpolated)
    assert_eq!(history.intake_history.len(), 10);
    // Days without entries should have empty vectors
    assert!(history.intake_history.get("2026-01-05").is_some());
}

#[test]
fn test_get_tracker_history_calculates_average() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entries with known values
    let entry1 = NewIntake {
        added: "2026-01-05".to_string(),
        amount: 1000,
        category: "b".to_string(),
        description: None,
    };
    create_intake(app.state(), entry1).unwrap();

    let entry2 = NewIntake {
        added: "2026-01-06".to_string(),
        amount: 2000,
        category: "l".to_string(),
        description: None,
    };
    create_intake(app.state(), entry2).unwrap();

    let result = get_tracker_history(
        app.state(),
        "2026-01-05".to_string(),
        "2026-01-06".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    // Average should be calculated (1000 + 2000) / 2 days = 1500
    assert!(history.calories_average > 0.0);
}

#[test]
fn test_get_tracker_history_with_weight_entries() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let weight1 = NewWeightTracker {
        added: "2026-01-05".to_string(),
        amount: 79.8,
    };
    create_weight_tracker_entry(app.state(), weight1).unwrap();

    let weight2 = NewWeightTracker {
        added: "2026-01-08".to_string(),
        amount: 78.5,
    };
    create_weight_tracker_entry(app.state(), weight2).unwrap();

    let result = get_tracker_history(
        app.state(),
        "2026-01-01".to_string(),
        "2026-01-10".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    assert!(history.weight_history.len() > 0);
    // Weight entries should be present
    assert!(history.weight_history.get("2026-01-05").is_some());
    assert!(history.weight_history.get("2026-01-08").is_some());
}

#[test]
fn test_get_tracker_history_week_range() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create some entries
    for day in 1..=7 {
        let entry = NewIntake {
            added: format!("2026-01-{:02}", day),
            amount: 1800 + (day * 100),
            category: "b".to_string(),
            description: None,
        };
        create_intake(app.state(), entry).unwrap();
    }

    let result = get_tracker_history(
        app.state(),
        "2026-01-01".to_string(),
        "2026-01-07".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    assert_eq!(history.intake_history.len(), 7);
    assert!(history.calories_average > 0.0);
}

#[test]
fn test_get_tracker_history_month_range() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entries on first and last day of month
    let entry1 = NewIntake {
        added: "2026-01-01".to_string(),
        amount: 1800,
        category: "b".to_string(),
        description: None,
    };
    create_intake(app.state(), entry1).unwrap();

    let entry2 = NewIntake {
        added: "2026-01-31".to_string(),
        amount: 2000,
        category: "l".to_string(),
        description: None,
    };
    create_intake(app.state(), entry2).unwrap();

    let result = get_tracker_history(
        app.state(),
        "2026-01-01".to_string(),
        "2026-01-31".to_string(),
    );

    assert!(result.is_ok());
    let history = result.unwrap();
    // Should have 31 days interpolated
    assert_eq!(history.intake_history.len(), 31);
}
