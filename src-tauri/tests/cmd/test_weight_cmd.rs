use crate::helpers::setup_test_pool;
use librefit_lib::service::weight::{
    create_weight_target, create_weight_tracker_entry, delete_weight_tracker_entry,
    get_last_weight_target, get_last_weight_tracker, get_weight_tracker_for_date_range,
    update_weight_tracker_entry, NewWeightTarget, NewWeightTracker,
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

    let new_entry = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

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

    let new_entry = NewWeightTracker::new("2026-01-15".to_string(), 10.0); // Too low

    let result = create_weight_tracker_entry(app.state(), new_entry);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_create_weight_tracker_entry_validation_weight_too_high() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let new_entry = NewWeightTracker::new("2026-01-15".to_string(), 500.0); // Too high

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
    let new_entry = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

    let created = create_weight_tracker_entry(app.state(), new_entry).unwrap();

    // Update entry
    let updated_entry = NewWeightTracker::new("2026-01-15".to_string(), 74.8);

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
    let new_entry = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

    let created = create_weight_tracker_entry(app.state(), new_entry).unwrap();

    // Update with invalid weight
    let updated_entry = NewWeightTracker::new("2026-01-15".to_string(), 10.0); // Too low

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
    let new_entry = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

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
    let entry1 = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

    let entry2 = NewWeightTracker::new("2026-01-16".to_string(), 75.2);

    let entry3 = NewWeightTracker::new("2026-01-20".to_string(), 74.8); // Outside range

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
    let entry1 = NewWeightTracker::new("2026-01-16".to_string(), 75.2);

    let entry2 = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

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

// ============================================================================
// GET LAST WEIGHT TARGET TESTS
// ============================================================================

#[test]
fn test_get_last_weight_target_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create multiple weight targets
    let target1 = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        initial_weight: 80.0,
        target_weight: 70.0,
    };

    let target2 = NewWeightTarget {
        added: "2026-02-01".to_string(),
        start_date: "2026-02-01".to_string(),
        end_date: "2026-08-01".to_string(),
        initial_weight: 75.0,
        target_weight: 68.0,
    };

    create_weight_target(app.state(), target1).unwrap();
    let created_target2 = create_weight_target(app.state(), target2).unwrap();

    // Get last weight target
    let result = get_last_weight_target(app.state());

    assert!(result.is_ok());
    let last_target = result.unwrap();
    // Should return the most recently created target (by ID)
    assert_eq!(last_target.id, created_target2.id);
    assert_eq!(last_target.initial_weight, 75.0);
    assert_eq!(last_target.target_weight, 68.0);
}

#[test]
fn test_get_last_weight_target_empty_database() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_last_weight_target(app.state());

    assert!(result.is_err());
    let error = result.unwrap_err();
    // Diesel returns "Record not found" when .first() finds nothing
    assert!(
        error.contains("Record not found") || error.contains("no rows"),
        "Unexpected error: {}",
        error
    );
}

#[test]
fn test_get_last_weight_target_single_entry() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let target = NewWeightTarget {
        added: "2026-01-15".to_string(),
        start_date: "2026-01-15".to_string(),
        end_date: "2026-06-15".to_string(),
        initial_weight: 80.0,
        target_weight: 70.0,
    };

    let created = create_weight_target(app.state(), target).unwrap();

    let result = get_last_weight_target(app.state());

    assert!(result.is_ok());
    let last_target = result.unwrap();
    assert_eq!(last_target.id, created.id);
    assert_eq!(last_target.initial_weight, 80.0);
}

// ============================================================================
// GET LAST WEIGHT TRACKER TESTS
// ============================================================================

#[test]
fn test_get_last_weight_tracker_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create multiple weight tracker entries
    let entry1 = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

    let entry2 = NewWeightTracker::new("2026-01-16".to_string(), 75.2);

    let entry3 = NewWeightTracker::new("2026-01-17".to_string(), 74.8);

    create_weight_tracker_entry(app.state(), entry1).unwrap();
    create_weight_tracker_entry(app.state(), entry2).unwrap();
    let created_entry3 = create_weight_tracker_entry(app.state(), entry3).unwrap();

    // Get last weight tracker entry
    let result = get_last_weight_tracker(app.state());

    assert!(result.is_ok());
    let last_entry = result.unwrap();
    // Should return the most recently created entry (by ID)
    assert_eq!(last_entry.id, created_entry3.id);
    assert_eq!(last_entry.amount, 74.8);
    assert_eq!(last_entry.added, "2026-01-17");
}

#[test]
fn test_get_last_weight_tracker_empty_database() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_last_weight_tracker(app.state());

    assert!(result.is_err());
    let error = result.unwrap_err();
    // Diesel returns "Record not found" when .first() finds nothing
    assert!(
        error.contains("Record not found") || error.contains("no rows"),
        "Unexpected error: {}",
        error
    );
}

#[test]
fn test_get_last_weight_tracker_single_entry() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let entry = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

    let created = create_weight_tracker_entry(app.state(), entry).unwrap();

    let result = get_last_weight_tracker(app.state());

    assert!(result.is_ok());
    let last_entry = result.unwrap();
    assert_eq!(last_entry.id, created.id);
    assert_eq!(last_entry.amount, 75.5);
}

#[test]
fn test_get_last_weight_tracker_different_dates_same_day() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create multiple entries on the same date
    let entry1 = NewWeightTracker::new("2026-01-15".to_string(), 75.5);

    let entry2 = NewWeightTracker::new("2026-01-15".to_string(), 75.2);

    create_weight_tracker_entry(app.state(), entry1).unwrap();
    let created_entry2 = create_weight_tracker_entry(app.state(), entry2).unwrap();

    let result = get_last_weight_tracker(app.state());

    assert!(result.is_ok());
    let last_entry = result.unwrap();
    // Should return the last one by ID, even if same date
    assert_eq!(last_entry.id, created_entry2.id);
    assert_eq!(last_entry.amount, 75.2);
}
