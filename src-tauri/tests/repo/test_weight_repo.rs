use crate::helpers::setup_test_pool;
use librefit_lib::crud::db::model::{NewWeightTarget, NewWeightTracker};
use librefit_lib::crud::db::repo::weight;

// ============================================================================
// Weight Target Tests
// ============================================================================

#[test]
fn test_create_weight_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_target = NewWeightTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        initial_weight: 85.0,
        target_weight: 75.0,
    };

    let result = weight::create_weight_target(&mut conn, &new_target);

    assert!(result.is_ok());
    let target = result.unwrap();
    assert_eq!(target.initial_weight, 85.0);
    assert_eq!(target.target_weight, 75.0);
    assert_eq!(target.start_date, "2025-01-15");
    assert_eq!(target.end_date, "2025-06-15");
    assert!(target.id > 0);
}

#[test]
fn test_get_weight_targets() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple targets
    let target1 = NewWeightTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        initial_weight: 90.0,
        target_weight: 80.0,
    };

    let target2 = NewWeightTarget {
        added: "2025-06-01".to_string(),
        start_date: "2025-06-01".to_string(),
        end_date: "2025-12-01".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };

    weight::create_weight_target(&mut conn, &target1).unwrap();
    weight::create_weight_target(&mut conn, &target2).unwrap();

    // Retrieve all targets
    let result = weight::get_weight_targets(&mut conn);

    assert!(result.is_ok());
    let targets = result.unwrap();
    assert_eq!(targets.len(), 2);
    assert_eq!(targets[0].target_weight, 80.0);
    assert_eq!(targets[1].target_weight, 75.0);
}

#[test]
fn test_get_weight_targets_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = weight::get_weight_targets(&mut conn);

    assert!(result.is_ok());
    let targets = result.unwrap();
    assert_eq!(targets.len(), 0);
}

#[test]
fn test_get_latest_weight_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple targets
    let target1 = NewWeightTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        initial_weight: 90.0,
        target_weight: 80.0,
    };

    let target2 = NewWeightTarget {
        added: "2025-06-01".to_string(),
        start_date: "2025-06-01".to_string(),
        end_date: "2025-12-01".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };

    weight::create_weight_target(&mut conn, &target1).unwrap();
    let last_created = weight::create_weight_target(&mut conn, &target2).unwrap();

    // Get latest target (should be target2)
    let result = weight::get_latest_weight_target(&mut conn);

    assert!(result.is_ok());
    let latest = result.unwrap();
    assert_eq!(latest.id, last_created.id);
    assert_eq!(latest.target_weight, 75.0);
}

#[test]
fn test_get_latest_weight_target_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = weight::get_latest_weight_target(&mut conn);

    assert!(result.is_err()); // Should fail when no targets exist
}

#[test]
fn test_update_weight_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create initial target
    let new_target = NewWeightTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        initial_weight: 85.0,
        target_weight: 75.0,
    };

    let created = weight::create_weight_target(&mut conn, &new_target).unwrap();

    // Update target
    let updated_target = NewWeightTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        initial_weight: 85.0,
        target_weight: 70.0,
    };

    let result = weight::update_weight_target(&mut conn, created.id, updated_target);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.id, created.id);
    assert_eq!(updated.target_weight, 70.0);
}

#[test]
fn test_delete_weight_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create target
    let new_target = NewWeightTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        initial_weight: 85.0,
        target_weight: 75.0,
    };

    let created = weight::create_weight_target(&mut conn, &new_target).unwrap();

    // Delete
    let delete_result = weight::delete_weight_target(&mut conn, created.id);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 1);

    // Verify deleted
    let targets = weight::get_weight_targets(&mut conn).unwrap();
    assert_eq!(targets.len(), 0);
}

#[test]
fn test_delete_nonexistent_weight_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let delete_result = weight::delete_weight_target(&mut conn, 999);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 0); // No rows deleted
}

#[test]
fn test_find_last_weight_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple targets
    let target1 = NewWeightTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        initial_weight: 90.0,
        target_weight: 80.0,
    };

    let target2 = NewWeightTarget {
        added: "2025-06-01".to_string(),
        start_date: "2025-06-01".to_string(),
        end_date: "2025-12-01".to_string(),
        initial_weight: 80.0,
        target_weight: 75.0,
    };

    weight::create_weight_target(&mut conn, &target1).unwrap();
    let last_created = weight::create_weight_target(&mut conn, &target2).unwrap();

    // Find last target (should be target2)
    let result = weight::find_last_weight_target(&mut conn);

    assert!(result.is_ok());
    let last = result.unwrap();
    assert_eq!(last.id, last_created.id);
    assert_eq!(last.target_weight, 75.0);
}

#[test]
fn test_find_last_weight_target_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = weight::find_last_weight_target(&mut conn);

    assert!(result.is_err()); // Should fail when no targets exist
}

// ============================================================================
// Weight Tracker Tests
// ============================================================================

#[test]
fn test_create_weight_tracker_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_entry = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.5,
    };

    let result = weight::create_weight_tracker_entry(&mut conn, &new_entry);

    assert!(result.is_ok());
    let entry = result.unwrap();
    assert_eq!(entry.amount, 82.5);
    assert_eq!(entry.added, "2025-01-15");
    assert!(entry.id > 0);
}

#[test]
fn test_get_weight_tracker_entries() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple entries
    let entry1 = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.5,
    };

    let entry2 = NewWeightTracker {
        added: "2025-01-16".to_string(),
        amount: 82.0,
    };

    weight::create_weight_tracker_entry(&mut conn, &entry1).unwrap();
    weight::create_weight_tracker_entry(&mut conn, &entry2).unwrap();

    // Retrieve all entries
    let result = weight::get_weight_tracker_entries(&mut conn);

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2);
}

#[test]
fn test_update_weight_tracker_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entry
    let new_entry = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.5,
    };

    let created = weight::create_weight_tracker_entry(&mut conn, &new_entry).unwrap();

    // Update entry
    let updated_entry = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.0,
    };

    let result = weight::update_weight_tracker_entry(&mut conn, &created.id, &updated_entry);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.id, created.id);
    assert_eq!(updated.amount, 82.0);
}

#[test]
fn test_delete_weight_tracker_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_entry = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.5,
    };

    let created = weight::create_weight_tracker_entry(&mut conn, &new_entry).unwrap();

    // Delete
    let delete_result = weight::delete_weight_tracker_entry(&mut conn, created.id);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 1);

    // Verify deleted
    let entries = weight::get_weight_tracker_entries(&mut conn).unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_find_weight_tracker_by_date() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entries on different dates
    let entry1 = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.5,
    };

    let entry2 = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.3,
    };

    let entry3 = NewWeightTracker {
        added: "2025-01-16".to_string(),
        amount: 82.0,
    };

    weight::create_weight_tracker_entry(&mut conn, &entry1).unwrap();
    weight::create_weight_tracker_entry(&mut conn, &entry2).unwrap();
    weight::create_weight_tracker_entry(&mut conn, &entry3).unwrap();

    // Find entries for 2025-01-15
    let result = weight::find_weight_tracker_by_date(&mut conn, &"2025-01-15".to_string());

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2);
    assert!(entries.iter().all(|e| e.added == "2025-01-15"));
}

#[test]
fn test_find_weight_tracker_by_date_no_results() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = weight::find_weight_tracker_by_date(&mut conn, &"2025-01-15".to_string());

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_find_weight_tracker_by_date_range() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entries across multiple days
    let dates = vec!["2025-01-15", "2025-01-16", "2025-01-17", "2025-01-18"];

    for (i, date) in dates.iter().enumerate() {
        let entry = NewWeightTracker {
            added: date.to_string(),
            amount: 85.0 - (i as f32 * 0.5),
        };
        weight::create_weight_tracker_entry(&mut conn, &entry).unwrap();
    }

    // Test date range query
    let result = weight::find_weight_tracker_by_date_range(
        &mut conn,
        &"2025-01-15".to_string(),
        &"2025-01-17".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 3); // Should include 15, 16, 17

    // Verify ordering (descending by date)
    assert_eq!(entries[0].added, "2025-01-17");
    assert_eq!(entries[1].added, "2025-01-16");
    assert_eq!(entries[2].added, "2025-01-15");
}

#[test]
fn test_find_weight_tracker_by_date_range_single_day() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let entry = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.5,
    };

    weight::create_weight_tracker_entry(&mut conn, &entry).unwrap();

    // Same date for start and end
    let result = weight::find_weight_tracker_by_date_range(
        &mut conn,
        &"2025-01-15".to_string(),
        &"2025-01-15".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 1);
}

#[test]
fn test_find_weight_tracker_by_date_range_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = weight::find_weight_tracker_by_date_range(
        &mut conn,
        &"2025-01-15".to_string(),
        &"2025-01-20".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_multiple_entries_same_day() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple weight entries on the same day (e.g., morning and evening)
    for i in 1..=3 {
        let entry = NewWeightTracker {
            added: "2025-01-15".to_string(),
            amount: 82.5 - (i as f32 * 0.1),
        };
        weight::create_weight_tracker_entry(&mut conn, &entry).unwrap();
    }

    let result = weight::find_weight_tracker_by_date(&mut conn, &"2025-01-15".to_string());

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 3);

    // Verify all are on the same date
    assert!(entries.iter().all(|e| e.added == "2025-01-15"));
}

#[test]
fn test_weight_precision() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Test that weight values maintain precision
    let new_entry = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 82.456,
    };

    let created = weight::create_weight_tracker_entry(&mut conn, &new_entry).unwrap();

    // SQLite might round f32 values, but should be close
    assert!((created.amount - 82.456).abs() < 0.01);
}

// ============================================================================
// Validation Tests
// ============================================================================

#[test]
fn test_weight_tracker_validation_amount_too_low() {
    use validator::Validate;

    let entry = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 29.9, // Invalid: below minimum of 30.0
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_weight_tracker_validation_amount_too_high() {
    use validator::Validate;

    let entry = NewWeightTracker {
        added: "2025-01-15".to_string(),
        amount: 330.1, // Invalid: above maximum of 330.0
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_weight_target_validation_initial_weight_too_low() {
    use validator::Validate;

    let target = NewWeightTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        initial_weight: 29.9, // Invalid: below minimum of 30.0
        target_weight: 75.0,
    };

    let validation = target.validate();
    assert!(validation.is_err());
}

#[test]
fn test_weight_target_validation_target_weight_too_high() {
    use validator::Validate;

    let target = NewWeightTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        initial_weight: 85.0,
        target_weight: 300.1, // Invalid: above maximum of 300.0
    };

    let validation = target.validate();
    assert!(validation.is_err());
}
