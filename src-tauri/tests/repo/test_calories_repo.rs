use crate::helpers::setup_test_pool;
use librefit_lib::crud::db::model::{NewCalorieTarget, NewCalorieTracker};
use librefit_lib::crud::db::repo::calories;

// ============================================================================
// Calorie Target Tests
// ============================================================================

#[test]
fn test_create_calorie_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_target = NewCalorieTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let result = calories::create_calorie_target(&mut conn, &new_target);

    assert!(result.is_ok());
    let target = result.unwrap();
    assert_eq!(target.target_calories, 2000);
    assert_eq!(target.maximum_calories, 2500);
    assert_eq!(target.start_date, "2025-01-15");
    assert_eq!(target.end_date, "2025-06-15");
    assert!(target.id > 0);
}

#[test]
fn test_get_calorie_targets() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple targets
    let target1 = NewCalorieTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let target2 = NewCalorieTarget {
        added: "2025-06-01".to_string(),
        start_date: "2025-06-01".to_string(),
        end_date: "2025-12-01".to_string(),
        target_calories: 1800,
        maximum_calories: 2200,
    };

    calories::create_calorie_target(&mut conn, &target1).unwrap();
    calories::create_calorie_target(&mut conn, &target2).unwrap();

    // Retrieve all targets
    let result = calories::get_calorie_targets(&mut conn);

    assert!(result.is_ok());
    let targets = result.unwrap();
    assert_eq!(targets.len(), 2);
    assert_eq!(targets[0].target_calories, 2000);
    assert_eq!(targets[1].target_calories, 1800);
}

#[test]
fn test_get_calorie_targets_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = calories::get_calorie_targets(&mut conn);

    assert!(result.is_ok());
    let targets = result.unwrap();
    assert_eq!(targets.len(), 0);
}

#[test]
fn test_update_calorie_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create initial target
    let new_target = NewCalorieTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let created = calories::create_calorie_target(&mut conn, &new_target).unwrap();

    // Update target
    let updated_target = NewCalorieTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        target_calories: 1800,
        maximum_calories: 2200,
    };

    let result = calories::update_calorie_target(&mut conn, created.id, updated_target);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.id, created.id);
    assert_eq!(updated.target_calories, 1800);
    assert_eq!(updated.maximum_calories, 2200);
}

#[test]
fn test_delete_calorie_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create target
    let new_target = NewCalorieTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let created = calories::create_calorie_target(&mut conn, &new_target).unwrap();

    // Delete
    let delete_result = calories::delete_calorie_target(&mut conn, created.id);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 1);

    // Verify deleted
    let targets = calories::get_calorie_targets(&mut conn).unwrap();
    assert_eq!(targets.len(), 0);
}

#[test]
fn test_delete_nonexistent_calorie_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let delete_result = calories::delete_calorie_target(&mut conn, 999);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 0); // No rows deleted
}

#[test]
fn test_find_last_calorie_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple targets
    let target1 = NewCalorieTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let target2 = NewCalorieTarget {
        added: "2025-06-01".to_string(),
        start_date: "2025-06-01".to_string(),
        end_date: "2025-12-01".to_string(),
        target_calories: 1800,
        maximum_calories: 2200,
    };

    calories::create_calorie_target(&mut conn, &target1).unwrap();
    let last_created = calories::create_calorie_target(&mut conn, &target2).unwrap();

    // Find last target (should be target2)
    let result = calories::find_last_calorie_target(&mut conn);

    assert!(result.is_ok());
    let last = result.unwrap();
    assert_eq!(last.id, last_created.id);
    assert_eq!(last.target_calories, 1800);
}

#[test]
fn test_find_last_calorie_target_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = calories::find_last_calorie_target(&mut conn);

    assert!(result.is_err()); // Should fail when no targets exist
}

// ============================================================================
// Calorie Tracker Tests
// ============================================================================

#[test]
fn test_create_calorie_tracker_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("Breakfast oatmeal".to_string()),
    };

    let result = calories::create_calorie_tracker_entry(&mut conn, &new_entry);

    assert!(result.is_ok());
    let entry = result.unwrap();
    assert_eq!(entry.amount, 500);
    assert_eq!(entry.category, "b");
    assert_eq!(entry.description, Some("Breakfast oatmeal".to_string()));
    assert_eq!(entry.added, "2025-01-15");
    assert!(entry.id > 0);
}

#[test]
fn test_create_calorie_tracker_entry_no_description() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 300,
        category: "s".to_string(),
        description: None,
    };

    let result = calories::create_calorie_tracker_entry(&mut conn, &new_entry);

    assert!(result.is_ok());
    let entry = result.unwrap();
    assert_eq!(entry.amount, 300);
    assert_eq!(entry.description, None);
}

#[test]
fn test_get_calorie_tracker_entries() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple entries
    let entry1 = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("Breakfast".to_string()),
    };

    let entry2 = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 700,
        category: "l".to_string(),
        description: Some("Lunch".to_string()),
    };

    calories::create_calorie_tracker_entry(&mut conn, &entry1).unwrap();
    calories::create_calorie_tracker_entry(&mut conn, &entry2).unwrap();

    // Retrieve all entries
    let result = calories::get_calorie_tracker_entries(&mut conn);

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2);
}

#[test]
fn test_update_calorie_tracker_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entry
    let new_entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("Original description".to_string()),
    };

    let created = calories::create_calorie_tracker_entry(&mut conn, &new_entry).unwrap();

    // Update entry
    let updated_entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 550,
        category: "b".to_string(),
        description: Some("Updated description".to_string()),
    };

    let result = calories::update_calorie_tracker_entry(&mut conn, created.id, &updated_entry);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.id, created.id);
    assert_eq!(updated.amount, 550);
    assert_eq!(updated.description, Some("Updated description".to_string()));
}

#[test]
fn test_delete_calorie_tracker_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    let created = calories::create_calorie_tracker_entry(&mut conn, &new_entry).unwrap();

    // Delete
    let delete_result = calories::delete_calorie_tracker_entry(&mut conn, &created.id);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 1);

    // Verify deleted
    let entries = calories::get_calorie_tracker_entries(&mut conn).unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_find_calorie_tracker_by_date() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entries on different dates
    let entry1 = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    let entry2 = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 700,
        category: "l".to_string(),
        description: None,
    };

    let entry3 = NewCalorieTracker {
        added: "2025-01-16".to_string(),
        amount: 600,
        category: "d".to_string(),
        description: None,
    };

    calories::create_calorie_tracker_entry(&mut conn, &entry1).unwrap();
    calories::create_calorie_tracker_entry(&mut conn, &entry2).unwrap();
    calories::create_calorie_tracker_entry(&mut conn, &entry3).unwrap();

    // Find entries for 2025-01-15
    let result = calories::find_calorie_tracker_by_date(&mut conn, &"2025-01-15".to_string());

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2);
    assert!(entries.iter().all(|e| e.added == "2025-01-15"));
}

#[test]
fn test_find_calorie_tracker_by_date_no_results() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = calories::find_calorie_tracker_by_date(&mut conn, &"2025-01-15".to_string());

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_find_calorie_tracker_by_date_range() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entries across multiple days
    let dates = vec!["2025-01-15", "2025-01-16", "2025-01-17", "2025-01-18"];

    for (i, date) in dates.iter().enumerate() {
        let entry = NewCalorieTracker {
            added: date.to_string(),
            amount: (i as i32 + 1) * 100,
            category: "b".to_string(),
            description: None,
        };
        calories::create_calorie_tracker_entry(&mut conn, &entry).unwrap();
    }

    // Test date range query
    let result = calories::find_calorie_tracker_by_date_range(
        &mut conn,
        &"2025-01-15".to_string(),
        &"2025-01-17".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 3); // Should include 15, 16, 17

    // Verify dates are within range
    for entry in &entries {
        assert!(entry.added >= "2025-01-15".to_string() && entry.added <= "2025-01-17".to_string());
    }

    // Verify ordering (descending by date)
    assert_eq!(entries[0].added, "2025-01-17");
    assert_eq!(entries[1].added, "2025-01-16");
    assert_eq!(entries[2].added, "2025-01-15");
}

#[test]
fn test_find_calorie_tracker_by_date_range_single_day() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    calories::create_calorie_tracker_entry(&mut conn, &entry).unwrap();

    // Same date for start and end
    let result = calories::find_calorie_tracker_by_date_range(
        &mut conn,
        &"2025-01-15".to_string(),
        &"2025-01-15".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 1);
}

#[test]
fn test_find_calorie_tracker_by_date_range_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = calories::find_calorie_tracker_by_date_range(
        &mut conn,
        &"2025-01-15".to_string(),
        &"2025-01-20".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_multiple_entries_same_date_same_category() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple breakfast entries on the same day
    for i in 1..=3 {
        let entry = NewCalorieTracker {
            added: "2025-01-15".to_string(),
            amount: i * 100,
            category: "b".to_string(),
            description: Some(format!("Breakfast item {}", i)),
        };
        calories::create_calorie_tracker_entry(&mut conn, &entry).unwrap();
    }

    let result = calories::find_calorie_tracker_by_date(&mut conn, &"2025-01-15".to_string());

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 3);

    // Verify all are breakfast category
    assert!(entries.iter().all(|e| e.category == "b"));
}

// ============================================================================
// Validation Tests
// ============================================================================

#[test]
fn test_calorie_tracker_validation_amount_too_low() {
    use validator::Validate;

    let entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 0, // Invalid: below minimum of 1
        category: "b".to_string(),
        description: None,
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_calorie_tracker_validation_amount_too_high() {
    use validator::Validate;

    let entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 10001, // Invalid: above maximum of 10000
        category: "b".to_string(),
        description: None,
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_calorie_tracker_validation_category_too_long() {
    use validator::Validate;

    let entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "a".repeat(51), // Invalid: exceeds 50 characters
        description: None,
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_calorie_tracker_validation_description_too_long() {
    use validator::Validate;

    let entry = NewCalorieTracker {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("a".repeat(501)), // Invalid: exceeds 500 characters
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_calorie_target_validation_target_too_low() {
    use validator::Validate;

    let target = NewCalorieTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        target_calories: 0, // Invalid: below minimum of 1
        maximum_calories: 2500,
    };

    let validation = target.validate();
    assert!(validation.is_err());
}

#[test]
fn test_calorie_target_validation_maximum_too_high() {
    use validator::Validate;

    let target = NewCalorieTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        target_calories: 2000,
        maximum_calories: 10001, // Invalid: above maximum of 10000
    };

    let validation = target.validate();
    assert!(validation.is_err());
}
