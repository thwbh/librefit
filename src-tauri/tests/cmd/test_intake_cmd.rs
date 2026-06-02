use crate::helpers::setup_test_pool;
use chrono::{Days, Local};
use librefit_lib::scenario;
use librefit_lib::service::intake::{
    create_intake, create_intake_target, delete_intake, get_food_categories,
    get_intake_dates_in_range, get_intake_for_date_range, get_last_intake_target, update_intake,
    NewIntake, NewIntakeTarget,
};
use tauri::Manager;

/// Returns test dates relative to today to avoid "target date lies in the past" validation errors.
/// Returns (start_date, end_date) as formatted strings.
fn get_future_test_dates() -> (String, String) {
    let today = Local::now().date_naive();
    let start = today.checked_add_days(Days::new(1)).unwrap();
    let end = today.checked_add_days(Days::new(180)).unwrap(); // 6 months in the future
    (
        start.format("%Y-%m-%d").to_string(),
        end.format("%Y-%m-%d").to_string(),
    )
}

// ============================================================================
// INTAKE TARGET TESTS
// ============================================================================

#[test]
fn test_create_intake_target_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewIntakeTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let result = create_intake_target(app.state(), new_target);

    if result.is_err() {
        eprintln!("Error: {:?}", result.as_ref().unwrap_err());
    }
    assert!(result.is_ok());
    let target = result.unwrap();
    assert_eq!(target.target_calories, 2000);
    assert_eq!(target.maximum_calories, 2500);
}

#[test]
fn test_create_intake_target_validation_target_exceeds_maximum() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewIntakeTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        target_calories: 3000, // Exceeds maximum
        maximum_calories: 2500,
    };

    let result = create_intake_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .contains("Target calories cannot exceed maximum calories"));
}

#[test]
fn test_create_intake_target_validation_past_end_date() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewIntakeTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2020-01-01".to_string(), // Past date
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let result = create_intake_target(app.state(), new_target);

    assert!(result.is_err());
    let err = result.unwrap_err();
    eprintln!("Actual error: {}", err);
    assert!(err.contains("End date must be after start date"));
}

#[test]
fn test_create_intake_target_validation_end_before_start() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewIntakeTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-06-15".to_string(),
        end_date: "2026-01-15".to_string(), // Before start
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let result = create_intake_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .contains("End date must be after start date"));
}

#[test]
fn test_get_last_intake_target_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool.clone());

    // Create two targets with future dates to avoid validation errors
    let (start_date1, end_date1) = get_future_test_dates();

    // Second target starts a few days later to ensure proper ordering
    let today = Local::now().date_naive();
    let start_date2 = today.checked_add_days(Days::new(5)).unwrap();
    let end_date2 = today.checked_add_days(Days::new(185)).unwrap();

    let target1 = NewIntakeTarget {
        added: start_date1.clone(),
        start_date: start_date1,
        end_date: end_date1,
        target_calories: 1800,
        maximum_calories: 2300,
    };

    let target2 = NewIntakeTarget {
        added: start_date2.format("%Y-%m-%d").to_string(),
        start_date: start_date2.format("%Y-%m-%d").to_string(),
        end_date: end_date2.format("%Y-%m-%d").to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    create_intake_target(app.state(), target1).unwrap();
    create_intake_target(app.state(), target2).unwrap();

    let result = get_last_intake_target(app.state());

    assert!(result.is_ok());
    let last_target = result.unwrap();
    assert_eq!(last_target.target_calories, 2000); // Should be the last created
}

#[test]
fn test_get_last_intake_target_no_targets() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_last_intake_target(app.state());

    assert!(result.is_err());
}

// ============================================================================
// INTAKE TRACKER TESTS
// ============================================================================

#[test]
fn test_create_intake_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake::new(
        "2026-01-15".to_string(),
        500,
        "b".to_string(),
        Some("Breakfast".to_string()),
    );

    let result = create_intake(app.state(), new_entry);

    assert!(result.is_ok());
    let entry = result.unwrap();
    assert_eq!(entry.amount, 500);
    assert_eq!(entry.category, "b");
    assert_eq!(entry.description, Some("Breakfast".to_string()));
}

#[test]
fn amount_below_lower_bound_rejected() {
    scenario!("[IT-021]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake::new("2026-01-15".to_string(), 0, "b".to_string(), None);

    let result = create_intake(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn amount_above_upper_bound_rejected() {
    scenario!("[IT-022]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake::new("2026-01-15".to_string(), 15000, "b".to_string(), None);

    let result = create_intake(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_intake_validation_category_too_long() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake::new("2026-01-15".to_string(), 500, "a".repeat(60), None); // Invalid: too long

    let result = create_intake(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_intake_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entry
    let new_entry = NewIntake::new(
        "2026-01-15".to_string(),
        500,
        "b".to_string(),
        Some("Original".to_string()),
    );

    let created = create_intake(app.state(), new_entry).unwrap();

    // Update entry
    let updated_entry = NewIntake::new(
        "2026-01-15".to_string(),
        600,
        "b".to_string(),
        Some("Updated".to_string()),
    );

    let result = update_intake(app.state(), created.id, updated_entry);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.amount, 600);
    assert_eq!(updated.description, Some("Updated".to_string()));
}

#[test]
fn test_delete_intake_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entry
    let new_entry = NewIntake::new("2026-01-15".to_string(), 500, "b".to_string(), None);

    let created = create_intake(app.state(), new_entry).unwrap();

    // Delete
    let result = delete_intake(app.state(), created.id);

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 1);
}

#[test]
fn test_get_intake_for_date_range_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entries on different dates
    let entry1 = NewIntake::new("2026-01-15".to_string(), 500, "b".to_string(), None);

    let entry2 = NewIntake::new("2026-01-16".to_string(), 700, "l".to_string(), None);

    let entry3 = NewIntake::new("2026-01-20".to_string(), 300, "s".to_string(), None);

    create_intake(app.state(), entry1).unwrap();
    create_intake(app.state(), entry2).unwrap();
    create_intake(app.state(), entry3).unwrap();

    let result = get_intake_for_date_range(
        app.state(),
        "2026-01-15".to_string(),
        "2026-01-17".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2); // Only entries within range
}

#[test]
fn test_get_intake_dates_in_range_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create multiple entries on same dates
    let entry1 = NewIntake::new("2026-01-15".to_string(), 500, "b".to_string(), None);

    let entry2 = NewIntake::new("2026-01-15".to_string(), 700, "l".to_string(), None);

    let entry3 = NewIntake::new("2026-01-16".to_string(), 300, "s".to_string(), None);

    create_intake(app.state(), entry1).unwrap();
    create_intake(app.state(), entry2).unwrap();
    create_intake(app.state(), entry3).unwrap();

    let result = get_intake_dates_in_range(
        app.state(),
        "2026-01-15".to_string(),
        "2026-01-17".to_string(),
    );

    assert!(result.is_ok());
    let dates = result.unwrap();
    assert_eq!(dates.len(), 2); // Should dedup dates: 15th and 16th
    assert!(dates.contains(&"2026-01-15".to_string()));
    assert!(dates.contains(&"2026-01-16".to_string()));
}

// ============================================================================
// FOOD CATEGORY TESTS
// ============================================================================

#[test]
fn test_get_food_categories_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_food_categories(app.state());

    assert!(result.is_ok());
    let categories = result.unwrap();
    assert!(categories.len() > 0); // Should have seeded categories

    // Verify some expected categories exist
    let breakfast_exists = categories.iter().any(|c| c.shortvalue == "b");
    assert!(breakfast_exists);
}

#[test]
fn amount_at_lower_bound_accepted() {
    scenario!("[IT-019]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake::new("2026-01-15".to_string(), 1, "b".to_string(), None);

    let result = create_intake(app.state(), new_entry);

    assert!(result.is_ok(), "amount=1 should be accepted: {:?}", result);
    assert_eq!(result.unwrap().amount, 1);
}

#[test]
fn amount_at_upper_bound_accepted() {
    scenario!("[IT-020]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake::new("2026-01-15".to_string(), 10000, "b".to_string(), None);

    let result = create_intake(app.state(), new_entry);

    assert!(
        result.is_ok(),
        "amount=10000 should be accepted: {:?}",
        result
    );
    assert_eq!(result.unwrap().amount, 10000);
}

#[test]
fn invalid_date_format_rejected() {
    scenario!("[IT-026]", "[VAL-002]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Non-YYYY-MM-DD format (slashes instead of hyphens, day-first).
    let new_entry = NewIntake::new("15/01/2026".to_string(), 500, "b".to_string(), None);

    let result = create_intake(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn time_defaults_when_unset() {
    scenario!("[IT-027]", "[VAL-004]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake::new("2026-01-15".to_string(), 500, "b".to_string(), None);

    let entry = create_intake(app.state(), new_entry).unwrap();

    // Time should be set (defaulted), 8 chars in HH:MM:SS form.
    assert_eq!(entry.time.len(), 8);
    assert_eq!(entry.time.chars().nth(2), Some(':'));
    assert_eq!(entry.time.chars().nth(5), Some(':'));
}

#[test]
fn explicit_time_in_hms_format_accepted() {
    scenario!("[VAL-003]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
        time: Some("14:30:45".to_string()),
    };

    let entry =
        create_intake(app.state(), new_entry).expect("valid HH:MM:SS time should be accepted");

    assert_eq!(entry.time, "14:30:45");
}
