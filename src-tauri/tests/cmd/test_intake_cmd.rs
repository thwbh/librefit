use crate::helpers::setup_test_pool;
use librefit_lib::service::intake::{
    create_calorie_target, create_calorie_tracker_entry, delete_calorie_tracker_entry,
    get_calorie_tracker_dates_in_range, get_calorie_tracker_for_date_range, get_food_categories,
    get_last_calorie_target, update_calorie_tracker_entry, NewIntake, NewIntakeTarget,
};
use tauri::Manager;

// ============================================================================
// INTAKE TARGET TESTS
// ============================================================================

#[test]
fn test_create_calorie_target_success() {
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

    let result = create_calorie_target(app.state(), new_target);

    if result.is_err() {
        eprintln!("Error: {:?}", result.as_ref().unwrap_err());
    }
    assert!(result.is_ok());
    let target = result.unwrap();
    assert_eq!(target.target_calories, 2000);
    assert_eq!(target.maximum_calories, 2500);
}

#[test]
fn test_create_calorie_target_validation_target_exceeds_maximum() {
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

    let result = create_calorie_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .contains("Target calories cannot exceed maximum calories"));
}

#[test]
fn test_create_calorie_target_validation_past_end_date() {
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

    let result = create_calorie_target(app.state(), new_target);

    assert!(result.is_err());
    let err = result.unwrap_err();
    eprintln!("Actual error: {}", err);
    assert!(err.contains("End date must be after start date"));
}

#[test]
fn test_create_calorie_target_validation_end_before_start() {
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

    let result = create_calorie_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .contains("End date must be after start date"));
}

#[test]
fn test_get_last_calorie_target_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool.clone());

    // Create two targets
    let target1 = NewIntakeTarget {
        added: "2026-01-01".to_string(),
        start_date: "2026-01-01".to_string(),
        end_date: "2026-06-01".to_string(),
        target_calories: 1800,
        maximum_calories: 2300,
    };

    let target2 = NewIntakeTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    create_calorie_target(app.state(), target1).unwrap();
    create_calorie_target(app.state(), target2).unwrap();

    let result = get_last_calorie_target(app.state());

    assert!(result.is_ok());
    let last_target = result.unwrap();
    assert_eq!(last_target.target_calories, 2000); // Should be the last created
}

#[test]
fn test_get_last_calorie_target_no_targets() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_last_calorie_target(app.state());

    assert!(result.is_err());
}

// ============================================================================
// INTAKE TRACKER TESTS
// ============================================================================

#[test]
fn test_create_calorie_tracker_entry_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("Breakfast".to_string()),
    };

    let result = create_calorie_tracker_entry(app.state(), new_entry);

    assert!(result.is_ok());
    let entry = result.unwrap();
    assert_eq!(entry.amount, 500);
    assert_eq!(entry.category, "b");
    assert_eq!(entry.description, Some("Breakfast".to_string()));
}

#[test]
fn test_create_calorie_tracker_entry_validation_amount_too_low() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 0, // Invalid: too low
        category: "b".to_string(),
        description: None,
    };

    let result = create_calorie_tracker_entry(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_calorie_tracker_entry_validation_amount_too_high() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 15000, // Invalid: too high
        category: "b".to_string(),
        description: None,
    };

    let result = create_calorie_tracker_entry(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_calorie_tracker_entry_validation_category_too_long() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 500,
        category: "a".repeat(60), // Invalid: too long
        description: None,
    };

    let result = create_calorie_tracker_entry(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_calorie_tracker_entry_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entry
    let new_entry = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("Original".to_string()),
    };

    let created = create_calorie_tracker_entry(app.state(), new_entry).unwrap();

    // Update entry
    let updated_entry = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 600,
        category: "b".to_string(),
        description: Some("Updated".to_string()),
    };

    let result = update_calorie_tracker_entry(app.state(), created.id, updated_entry);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.amount, 600);
    assert_eq!(updated.description, Some("Updated".to_string()));
}

#[test]
fn test_delete_calorie_tracker_entry_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entry
    let new_entry = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    let created = create_calorie_tracker_entry(app.state(), new_entry).unwrap();

    // Delete
    let result = delete_calorie_tracker_entry(app.state(), created.id);

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 1);
}

#[test]
fn test_get_calorie_tracker_for_date_range_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entries on different dates
    let entry1 = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    let entry2 = NewIntake {
        added: "2026-01-16".to_string(),
        amount: 700,
        category: "l".to_string(),
        description: None,
    };

    let entry3 = NewIntake {
        added: "2026-01-20".to_string(), // Outside range
        amount: 300,
        category: "s".to_string(),
        description: None,
    };

    create_calorie_tracker_entry(app.state(), entry1).unwrap();
    create_calorie_tracker_entry(app.state(), entry2).unwrap();
    create_calorie_tracker_entry(app.state(), entry3).unwrap();

    let result = get_calorie_tracker_for_date_range(
        app.state(),
        "2026-01-15".to_string(),
        "2026-01-17".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2); // Only entries within range
}

#[test]
fn test_get_calorie_tracker_dates_in_range_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create multiple entries on same dates
    let entry1 = NewIntake {
        added: "2026-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    let entry2 = NewIntake {
        added: "2026-01-15".to_string(), // Same date as entry1
        amount: 700,
        category: "l".to_string(),
        description: None,
    };

    let entry3 = NewIntake {
        added: "2026-01-16".to_string(),
        amount: 300,
        category: "s".to_string(),
        description: None,
    };

    create_calorie_tracker_entry(app.state(), entry1).unwrap();
    create_calorie_tracker_entry(app.state(), entry2).unwrap();
    create_calorie_tracker_entry(app.state(), entry3).unwrap();

    let result = get_calorie_tracker_dates_in_range(
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
