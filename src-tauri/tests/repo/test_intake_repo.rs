use crate::helpers::setup_test_pool;
use librefit_lib::crud::db::model::{NewIntakeTarget, NewIntake};
use librefit_lib::crud::db::repo::intake;

// ============================================================================
// Intake Target Tests
// ============================================================================

#[test]
fn test_create_intake_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_target = NewIntakeTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let result = intake::create_intake_target(&mut conn, &new_target);

    assert!(result.is_ok());
    let target = result.unwrap();
    assert_eq!(target.target_calories, 2000);
    assert_eq!(target.maximum_calories, 2500);
    assert_eq!(target.start_date, "2025-01-15");
    assert_eq!(target.end_date, "2025-06-15");
    assert!(target.id > 0);
}

#[test]
fn test_get_intake_targets() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple targets
    let target1 = NewIntakeTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let target2 = NewIntakeTarget {
        added: "2025-06-01".to_string(),
        start_date: "2025-06-01".to_string(),
        end_date: "2025-12-01".to_string(),
        target_calories: 1800,
        maximum_calories: 2200,
    };

    intake::create_intake_target(&mut conn, &target1).unwrap();
    intake::create_intake_target(&mut conn, &target2).unwrap();

    // Retrieve all targets
    let result = intake::get_intake_targets(&mut conn);

    assert!(result.is_ok());
    let targets = result.unwrap();
    assert_eq!(targets.len(), 2);
    assert_eq!(targets[0].target_calories, 2000);
    assert_eq!(targets[1].target_calories, 1800);
}

#[test]
fn test_get_intake_targets_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = intake::get_intake_targets(&mut conn);

    assert!(result.is_ok());
    let targets = result.unwrap();
    assert_eq!(targets.len(), 0);
}

#[test]
fn test_update_intake_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create initial target
    let new_target = NewIntakeTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let created = intake::create_intake_target(&mut conn, &new_target).unwrap();

    // Update target
    let updated_target = NewIntakeTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        target_calories: 1800,
        maximum_calories: 2200,
    };

    let result = intake::update_intake_target(&mut conn, created.id, updated_target);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.id, created.id);
    assert_eq!(updated.target_calories, 1800);
    assert_eq!(updated.maximum_calories, 2200);
}

#[test]
fn test_delete_intake_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create target
    let new_target = NewIntakeTarget {
        added: "2025-01-15".to_string(),
        start_date: "2025-01-15".to_string(),
        end_date: "2025-06-15".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let created = intake::create_intake_target(&mut conn, &new_target).unwrap();

    // Delete
    let delete_result = intake::delete_intake_target(&mut conn, created.id);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 1);

    // Verify deleted
    let targets = intake::get_intake_targets(&mut conn).unwrap();
    assert_eq!(targets.len(), 0);
}

#[test]
fn test_delete_nonexistent_intake_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let delete_result = intake::delete_intake_target(&mut conn, 999);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 0); // No rows deleted
}

#[test]
fn test_find_last_intake_target() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple targets
    let target1 = NewIntakeTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        target_calories: 2000,
        maximum_calories: 2500,
    };

    let target2 = NewIntakeTarget {
        added: "2025-06-01".to_string(),
        start_date: "2025-06-01".to_string(),
        end_date: "2025-12-01".to_string(),
        target_calories: 1800,
        maximum_calories: 2200,
    };

    intake::create_intake_target(&mut conn, &target1).unwrap();
    let last_created = intake::create_intake_target(&mut conn, &target2).unwrap();

    // Find last target (should be target2)
    let result = intake::find_last_intake_target(&mut conn);

    assert!(result.is_ok());
    let last = result.unwrap();
    assert_eq!(last.id, last_created.id);
    assert_eq!(last.target_calories, 1800);
}

#[test]
fn test_find_last_intake_target_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = intake::find_last_intake_target(&mut conn);

    assert!(result.is_err()); // Should fail when no targets exist
}

// ============================================================================
// Intake Tests
// ============================================================================

#[test]
fn test_create_intake_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("Breakfast oatmeal".to_string()),
    };

    let result = intake::create_intake_entry(&mut conn, &new_entry);

    assert!(result.is_ok());
    let entry = result.unwrap();
    assert_eq!(entry.amount, 500);
    assert_eq!(entry.category, "b");
    assert_eq!(entry.description, Some("Breakfast oatmeal".to_string()));
    assert_eq!(entry.added, "2025-01-15");
    assert!(entry.id > 0);
}

#[test]
fn test_create_intake_entry_no_description() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 300,
        category: "s".to_string(),
        description: None,
    };

    let result = intake::create_intake_entry(&mut conn, &new_entry);

    assert!(result.is_ok());
    let entry = result.unwrap();
    assert_eq!(entry.amount, 300);
    assert_eq!(entry.description, None);
}

#[test]
fn test_get_intake_entries() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create multiple entries
    let entry1 = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("Breakfast".to_string()),
    };

    let entry2 = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 700,
        category: "l".to_string(),
        description: Some("Lunch".to_string()),
    };

    intake::create_intake_entry(&mut conn, &entry1).unwrap();
    intake::create_intake_entry(&mut conn, &entry2).unwrap();

    // Retrieve all entries
    let result = intake::get_intake_entries(&mut conn);

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2);
}

#[test]
fn test_update_intake_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entry
    let new_entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("Original description".to_string()),
    };

    let created = intake::create_intake_entry(&mut conn, &new_entry).unwrap();

    // Update entry
    let updated_entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 550,
        category: "b".to_string(),
        description: Some("Updated description".to_string()),
    };

    let result = intake::update_intake_entry(&mut conn, created.id, &updated_entry);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.id, created.id);
    assert_eq!(updated.amount, 550);
    assert_eq!(updated.description, Some("Updated description".to_string()));
}

#[test]
fn test_delete_intake_entry() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let new_entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    let created = intake::create_intake_entry(&mut conn, &new_entry).unwrap();

    // Delete
    let delete_result = intake::delete_intake_entry(&mut conn, &created.id);

    assert!(delete_result.is_ok());
    assert_eq!(delete_result.unwrap(), 1);

    // Verify deleted
    let entries = intake::get_intake_entries(&mut conn).unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_find_intake_by_date() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entries on different dates
    let entry1 = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    let entry2 = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 700,
        category: "l".to_string(),
        description: None,
    };

    let entry3 = NewIntake {
        added: "2025-01-16".to_string(),
        amount: 600,
        category: "d".to_string(),
        description: None,
    };

    intake::create_intake_entry(&mut conn, &entry1).unwrap();
    intake::create_intake_entry(&mut conn, &entry2).unwrap();
    intake::create_intake_entry(&mut conn, &entry3).unwrap();

    // Find entries for 2025-01-15
    let result = intake::find_intake_by_date(&mut conn, &"2025-01-15".to_string());

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 2);
    assert!(entries.iter().all(|e| e.added == "2025-01-15"));
}

#[test]
fn test_find_intake_by_date_no_results() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = intake::find_intake_by_date(&mut conn, &"2025-01-15".to_string());

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 0);
}

#[test]
fn test_find_intake_by_date_range() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create entries across multiple days
    let dates = vec!["2025-01-15", "2025-01-16", "2025-01-17", "2025-01-18"];

    for (i, date) in dates.iter().enumerate() {
        let entry = NewIntake {
            added: date.to_string(),
            amount: (i as i32 + 1) * 100,
            category: "b".to_string(),
            description: None,
        };
        intake::create_intake_entry(&mut conn, &entry).unwrap();
    }

    // Test date range query
    let result = intake::find_intake_by_date_range(
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
fn test_find_intake_by_date_range_single_day() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: None,
    };

    intake::create_intake_entry(&mut conn, &entry).unwrap();

    // Same date for start and end
    let result = intake::find_intake_by_date_range(
        &mut conn,
        &"2025-01-15".to_string(),
        &"2025-01-15".to_string(),
    );

    assert!(result.is_ok());
    let entries = result.unwrap();
    assert_eq!(entries.len(), 1);
}

#[test]
fn test_find_intake_by_date_range_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = intake::find_intake_by_date_range(
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
        let entry = NewIntake {
            added: "2025-01-15".to_string(),
            amount: i * 100,
            category: "b".to_string(),
            description: Some(format!("Breakfast item {}", i)),
        };
        intake::create_intake_entry(&mut conn, &entry).unwrap();
    }

    let result = intake::find_intake_by_date(&mut conn, &"2025-01-15".to_string());

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
fn test_intake_validation_amount_too_low() {
    use validator::Validate;

    let entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 0, // Invalid: below minimum of 1
        category: "b".to_string(),
        description: None,
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_intake_validation_amount_too_high() {
    use validator::Validate;

    let entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 10001, // Invalid: above maximum of 10000
        category: "b".to_string(),
        description: None,
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_intake_validation_category_too_long() {
    use validator::Validate;

    let entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "a".repeat(51), // Invalid: exceeds 50 characters
        description: None,
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_intake_validation_description_too_long() {
    use validator::Validate;

    let entry = NewIntake {
        added: "2025-01-15".to_string(),
        amount: 500,
        category: "b".to_string(),
        description: Some("a".repeat(501)), // Invalid: exceeds 500 characters
    };

    let validation = entry.validate();
    assert!(validation.is_err());
}

#[test]
fn test_intake_target_validation_target_too_low() {
    use validator::Validate;

    let target = NewIntakeTarget {
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
fn test_intake_target_validation_maximum_too_high() {
    use validator::Validate;

    let target = NewIntakeTarget {
        added: "2025-01-01".to_string(),
        start_date: "2025-01-01".to_string(),
        end_date: "2025-06-01".to_string(),
        target_calories: 2000,
        maximum_calories: 10001, // Invalid: above maximum of 10000
    };

    let validation = target.validate();
    assert!(validation.is_err());
}
