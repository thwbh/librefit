use crate::helpers::setup_test_pool;
use librefit_lib::{db::schema::body_data::activity_level, service::body::BodyData};

/// Should fail when no body data exists
#[test]
fn test_get_body_data_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = BodyData::get(&mut conn);

    assert!(result.is_err()); // Should fail when no body data exists
}

/// Updating empty body data should create a dataset
#[test]
fn test_update_body_data_creates_new() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // When no body data exists, update_body_data should create one
    let result = BodyData::update(&mut conn, &30, &175.0, &75.0, "male", &1.25);

    assert!(result.is_ok());
    let created = result.unwrap();
    assert_eq!(created.id, 1); // First body data gets ID 1
    assert_eq!(created.age, 30);
    assert_eq!(created.height, 175.0);
    assert_eq!(created.weight, 75.0);
    assert_eq!(created.sex, "male");
    assert_eq!(created.activity_level, 1.25);
}

/// Updating existing body data should update the dataset
#[test]
fn test_update_body_data_updates_existing() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create initial body data
    BodyData::update(&mut conn, &25, &170.0, &70.0, "female", &1.25).unwrap();

    // Update the body data
    let result = BodyData::update(&mut conn, &26, &171.0, &69.0, "female", &1.5);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.id, 1); // Should still be ID 1
    assert_eq!(updated.age, 26);
    assert_eq!(updated.height, 171.0);
    assert_eq!(updated.weight, 69.0);
    assert_eq!(updated.sex, "female");
    assert_eq!(updated.activity_level, 1.5);

    // Verify only one body data record exists
    let fetched = BodyData::get(&mut conn).unwrap();
    assert_eq!(fetched.age, 26);
}

/// Should return created body data immediately
#[test]
fn test_get_body_data_after_creation() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create body data
    BodyData::update(&mut conn, &35, &180.0, &85.0, "male", &1.25).unwrap();

    // Get body data
    let result = BodyData::get(&mut conn);

    assert!(result.is_ok());
    let fetched = result.unwrap();
    assert_eq!(fetched.age, 35);
    assert_eq!(fetched.height, 180.0);
    assert_eq!(fetched.weight, 85.0);
    assert_eq!(fetched.sex, "male");
    assert_eq!(fetched.activity_level, 1.25);
}

/// Should not fail multiple body data updates
#[test]
fn test_update_body_data_multiple_times() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create and update multiple times
    BodyData::update(&mut conn, &20, &160.0, &50.0, "female", &1.25).unwrap();
    BodyData::update(&mut conn, &21, &161.0, &51.0, "female", &1.5).unwrap();
    let final_update = BodyData::update(&mut conn, &22, &162.0, &52.0, "female", &1.75).unwrap();

    // Should still be the same record (ID 1)
    assert_eq!(final_update.id, 1);
    assert_eq!(final_update.age, 22);
    assert_eq!(final_update.height, 162.0);
    assert_eq!(final_update.weight, 52.0);
    assert_eq!(final_update.activity_level, 1.75);
}

/// Should update selected gender
#[test]
fn test_update_body_data_change_sex() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create with one sex
    BodyData::update(&mut conn, &30, &175.0, &75.0, "male", &1.25).unwrap();

    // Update to different sex
    let result = BodyData::update(&mut conn, &30, &175.0, &75.0, "female", &1.25);

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.sex, "female");
}

/// Should accept validated edge cases
#[test]
fn test_update_body_data_boundary_values() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Test with edge case values
    let result = BodyData::update(&mut conn, &18, &100.0, &30.0, "male", &2.0);

    assert!(result.is_ok());
    let created = result.unwrap();
    assert_eq!(created.age, 18);
    assert_eq!(created.height, 100.0);
    assert_eq!(created.weight, 30.0);
    assert_eq!(created.activity_level, 2.0);
}

/// Should accept upper contraints
#[test]
fn test_update_body_data_high_values() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Test with high values
    let result = BodyData::update(&mut conn, &100, &250.0, &300.0, "male", &1.25);

    assert!(result.is_ok());
    let created = result.unwrap();
    assert_eq!(created.age, 100);
    assert_eq!(created.height, 250.0);
    assert_eq!(created.weight, 300.0);
}

/// Should accept decimal precision
#[test]
fn test_update_body_data_precision() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Test decimal precision
    let result = BodyData::update(&mut conn, &30, &175.456, &75.789, "male", &1.25);

    assert!(result.is_ok());
    let created = result.unwrap();
    // SQLite might round f32 values, but should be close
    assert!((created.height - 175.456).abs() < 0.01);
    assert!((created.weight - 75.789).abs() < 0.01);
}

#[test]
fn test_update_body_data_custom_sex_value() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Test with custom sex value (the database doesn't enforce enum, just string)
    let result = BodyData::update(&mut conn, &30, &175.0, &75.0, "other", &1.25);

    assert!(result.is_ok());
    let created = result.unwrap();
    assert_eq!(created.sex, "other");
}

/// Validation Tests

#[test]
fn test_body_data_validation_age_too_low() {
    use validator::Validate;

    let body = BodyData {
        id: 1,
        age: 17, // Invalid: below minimum of 18
        height: 175.0,
        weight: 75.0,
        sex: "male".to_string(),
        activity_level: 1.25,
    };

    let validation = body.validate();
    assert!(validation.is_err());
}

#[test]
fn test_body_data_validation_age_too_high() {
    use validator::Validate;

    let body = BodyData {
        id: 1,
        age: 100, // Invalid: above maximum of 99
        height: 175.0,
        weight: 75.0,
        sex: "male".to_string(),
        activity_level: 1.25,
    };

    let validation = body.validate();
    assert!(validation.is_err());
}

#[test]
fn test_body_data_validation_height_too_low() {
    use validator::Validate;

    let body = BodyData {
        id: 1,
        age: 30,
        height: 99.9, // Invalid: below minimum of 100.0
        weight: 75.0,
        sex: "male".to_string(),
        activity_level: 1.25,
    };

    let validation = body.validate();
    assert!(validation.is_err());
}

#[test]
fn test_body_data_validation_height_too_high() {
    use validator::Validate;

    let body = BodyData {
        id: 1,
        age: 30,
        height: 220.1, // Invalid: above maximum of 220.0
        weight: 75.0,
        sex: "male".to_string(),
        activity_level: 1.25,
    };

    let validation = body.validate();
    assert!(validation.is_err());
}

#[test]
fn test_body_data_validation_weight_too_low() {
    use validator::Validate;

    let body = BodyData {
        id: 1,
        age: 30,
        height: 175.0,
        weight: 29.9, // Invalid: below minimum of 30.0
        sex: "male".to_string(),
        activity_level: 1.25,
    };

    let validation = body.validate();
    assert!(validation.is_err());
}

#[test]
fn test_body_data_validation_weight_too_high() {
    use validator::Validate;

    let body = BodyData {
        id: 1,
        age: 30,
        height: 175.0,
        weight: 330.1, // Invalid: above maximum of 330.0
        sex: "male".to_string(),
        activity_level: 1.25,
    };

    let validation = body.validate();
    assert!(validation.is_err());
}

#[test]
fn test_body_data_validation_activity_level_unknown() {
    use validator::Validate;

    let body = BodyData {
        id: 1,
        age: 30,
        height: 175.0,
        weight: 330.0,
        sex: "male".to_string(),
        activity_level: 1.6,
    };

    let validation = body.validate();
    assert!(validation.is_err());
}
