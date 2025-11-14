use crate::helpers::setup_test_pool;
use librefit_lib::service::weight::{
    create_weight_target, create_weight_tracker_entry, delete_weight_tracker_entry,
    get_weight_tracker_for_date_range, update_weight_tracker_entry, NewWeightTarget,
    NewWeightTracker,
};
use tauri::Manager;

// ============================================================================
// WEIGHT TARGET TESTS
// ============================================================================

#[test]
fn test_create_weight_target_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        initial_weight: 80.0,
        target_weight: 70.0,
    };

    let result = create_weight_target(app.state(), new_target);

    assert!(result.is_ok());
    let target = result.unwrap();
    assert_eq!(target.initial_weight, 80.0);
    assert_eq!(target.target_weight, 70.0);
}

#[test]
fn test_create_weight_target_validation_start_weight_too_low() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        initial_weight: 10.0, // Too low
        target_weight: 70.0,
    };

    let result = create_weight_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_weight_target_validation_start_weight_too_high() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        initial_weight: 500.0, // Too high
        target_weight: 70.0,
    };

    let result = create_weight_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_weight_target_validation_target_weight_too_low() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        initial_weight: 80.0,
        target_weight: 10.0, // Too low
    };

    let result = create_weight_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_weight_target_validation_target_weight_too_high() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        initial_weight: 80.0,
        target_weight: 500.0, // Too high
    };

    let result = create_weight_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_weight_target_validation_past_end_date() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2020-01-01".to_string(), // Past date
        initial_weight: 80.0,
        target_weight: 70.0,
    };

    let result = create_weight_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .contains("End date must be after start date"));
}

#[test]
fn test_create_weight_target_validation_end_before_start() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_target = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-06-15".to_string(),
        end_date: "2026-01-15".to_string(), // Before start
        initial_weight: 80.0,
        target_weight: 70.0,
    };

    let result = create_weight_target(app.state(), new_target);

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .contains("End date must be after start date"));
}

// ============================================================================
// WEIGHT TRACKER TESTS
// ============================================================================

#[test]
fn test_create_weight_tracker_entry_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 75.5,
    };

    let result = create_weight_tracker_entry(app.state(), new_entry);

    assert!(result.is_ok());
    let entry = result.unwrap();
    assert_eq!(entry.amount, 75.5);
    assert_eq!(entry.added, "2026-01-15");
}

#[test]
fn test_create_weight_tracker_entry_validation_weight_too_low() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 10.0, // Too low
    };

    let result = create_weight_tracker_entry(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_weight_tracker_entry_validation_weight_too_high() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 500.0, // Too high
    };

    let result = create_weight_tracker_entry(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_weight_tracker_entry_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entry
    let new_entry = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 75.5,
    };

    let created = create_weight_tracker_entry(app.state(), new_entry).unwrap();

    // Update entry
    let updated_entry = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 74.8,
    };

    let result = update_weight_tracker_entry(app.state(), created.id, updated_entry);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.amount, 74.8);
    assert_eq!(updated.id, created.id);
}

#[test]
fn test_update_weight_tracker_entry_validation_weight_too_low() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entry
    let new_entry = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 75.5,
    };

    let created = create_weight_tracker_entry(app.state(), new_entry).unwrap();

    // Update with invalid weight
    let updated_entry = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 10.0, // Too low
    };

    let result = update_weight_tracker_entry(app.state(), created.id, updated_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_delete_weight_tracker_entry_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entry
    let new_entry = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 75.5,
    };

    let created = create_weight_tracker_entry(app.state(), new_entry).unwrap();

    // Delete
    let result = delete_weight_tracker_entry(app.state(), created.id);

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 1);
}

#[test]
fn test_delete_weight_tracker_entry_nonexistent() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = delete_weight_tracker_entry(app.state(), 99999);

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0); // No rows deleted
}

#[test]
fn test_get_weight_tracker_for_date_range_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entries on different dates
    let entry1 = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 75.5,
    };

    let entry2 = NewWeightTracker {
        added: "2026-01-16".to_string(),
        amount: 75.2,
    };

    let entry3 = NewWeightTracker {
        added: "2026-01-20".to_string(), // Outside range
        amount: 74.8,
    };

    create_weight_tracker_entry(app.state(), entry1).unwrap();
    create_weight_tracker_entry(app.state(), entry2).unwrap();
    create_weight_tracker_entry(app.state(), entry3).unwrap();

    let result = get_weight_tracker_for_date_range(
        app.state(),
        "2026-01-15".to_string(),
        "2026-01-17".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2); // Only entries within range
}

#[test]
fn test_get_weight_tracker_for_date_range_empty() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_weight_tracker_for_date_range(
        app.state(),
        "2026-01-15".to_string(),
        "2026-01-17".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_get_weight_tracker_for_date_range_order() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create entries in non-chronological order
    let entry1 = NewWeightTracker {
        added: "2026-01-16".to_string(),
        amount: 75.2,
    };

    let entry2 = NewWeightTracker {
        added: "2026-01-15".to_string(),
        amount: 75.5,
    };

    create_weight_tracker_entry(app.state(), entry1).unwrap();
    create_weight_tracker_entry(app.state(), entry2).unwrap();

    let result = get_weight_tracker_for_date_range(
        app.state(),
        "2026-01-15".to_string(),
        "2026-01-17".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2);
    // Should be ordered by date descending (newest first)
    assert_eq!(entries[0].added, "2026-01-16");
    assert_eq!(entries[1].added, "2026-01-15");
}
