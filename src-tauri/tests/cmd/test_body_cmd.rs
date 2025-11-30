use crate::helpers::setup_test_pool;
use librefit_lib::service::body::{get_body_data, update_body_data};
use tauri::Manager;

// ============================================================================
// BODY DATA TESTS
// ============================================================================

#[test]
fn test_get_body_data_no_data() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_body_data(app.state());

    // get_body_data returns Err when no data exists
    assert!(result.is_err());
}

#[test]
fn test_update_body_data_creates_new_data() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_body_data(
        app.state(),
        25,              // age
        170.0,           // height
        70.0,            // weight
        "m".to_string(), // sex
        1.25,            // activityLevel
    );

    assert!(result.is_ok());
    let body_data = result.unwrap();
    assert_eq!(body_data.age, 25);
    assert_eq!(body_data.height, 170.0);
    assert_eq!(body_data.weight, 70.0);
    assert_eq!(body_data.sex, "m");
    assert_eq!(body_data.activity_level, 1.25);
}

#[test]
fn test_update_body_data_updates_existing_data() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create initial body data
    update_body_data(app.state(), 25, 170.0, 70.0, "m".to_string(), 1.25).unwrap();

    // Update body data
    let result = update_body_data(app.state(), 26, 175.0, 72.0, "f".to_string(), 1.5);

    assert!(result.is_ok());
    let body_data = result.unwrap();
    assert_eq!(body_data.age, 26);
    assert_eq!(body_data.height, 175.0);
    assert_eq!(body_data.weight, 72.0);
    assert_eq!(body_data.sex, "f");
    assert_eq!(body_data.activity_level, 1.5);
}

#[test]
fn test_get_body_data_returns_created_data() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create body data
    update_body_data(app.state(), 25, 170.0, 70.0, "m".to_string(), 1.25).unwrap();

    // Get body data
    let result = get_body_data(app.state());

    assert!(result.is_ok());
    let body_data = result.unwrap();
    assert_eq!(body_data.age, 25);
    assert_eq!(body_data.height, 170.0);
    assert_eq!(body_data.weight, 70.0);
    assert_eq!(body_data.sex, "m");
    assert_eq!(body_data.activity_level, 1.25);
}

#[test]
fn test_update_body_data_validation_height_too_low() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_body_data(
        app.state(),
        25,
        50.0, // Too low (min is 100)
        70.0,
        "m".to_string(),
        1.25,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_body_data_validation_height_too_high() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_body_data(
        app.state(),
        25,
        250.0, // Too high (max is 220)
        70.0,
        "m".to_string(),
        1.25,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_body_data_validation_weight_too_low() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_body_data(
        app.state(),
        25,
        170.0,
        20.0, // Too low (min is 30)
        "m".to_string(),
        1.25,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_body_data_validation_weight_too_high() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_body_data(
        app.state(),
        25,
        170.0,
        350.0, // Too high (max is 330)
        "m".to_string(),
        1.25,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_body_data_validation_age_too_low() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_body_data(
        app.state(),
        15, // Too low (min is 18)
        170.0,
        70.0,
        "m".to_string(),
        1.25,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_body_data_validation_age_too_high() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_body_data(
        app.state(),
        100, // Too high (max is 99)
        170.0,
        70.0,
        "m".to_string(),
        1.25,
    );

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Validation failed"));
}

#[test]
fn test_update_body_data_valid_boundary_values() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Test minimum valid values
    let result = update_body_data(
        app.state(),
        18,    // Minimum age
        100.0, // Minimum height
        30.0,  // Minimum weight
        "m".to_string(),
        1.25,
    );

    assert!(result.is_ok());
    let body_data = result.unwrap();
    assert_eq!(body_data.age, 18);
    assert_eq!(body_data.height, 100.0);
    assert_eq!(body_data.weight, 30.0);
}

#[test]
fn test_update_body_data_valid_maximum_values() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Test maximum valid values
    let result = update_body_data(
        app.state(),
        99,    // Maximum age
        220.0, // Maximum height
        330.0, // Maximum weight
        "f".to_string(),
        1.25,
    );

    assert!(result.is_ok());
    let body_data = result.unwrap();
    assert_eq!(body_data.age, 99);
    assert_eq!(body_data.height, 220.0);
    assert_eq!(body_data.weight, 330.0);
}

#[test]
fn test_update_body_data_different_sexes() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Test male
    let result_m = update_body_data(app.state(), 25, 170.0, 70.0, "m".to_string(), 1.25);
    assert!(result_m.is_ok());
    assert_eq!(result_m.unwrap().sex, "m");

    // Test female
    let result_f = update_body_data(app.state(), 25, 170.0, 70.0, "f".to_string(), 1.25);
    assert!(result_f.is_ok());
    assert_eq!(result_f.unwrap().sex, "f");
}

#[test]
fn test_update_body_data_with_empty_sex() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_body_data(app.state(), 25, 170.0, 70.0, "".to_string(), 1.25);

    // Empty sex should be accepted
    assert!(result.is_ok());
    let body_data = result.unwrap();
    assert_eq!(body_data.sex, "");
}
