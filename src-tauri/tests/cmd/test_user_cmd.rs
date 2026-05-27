use crate::helpers::setup_test_pool;
use librefit_lib::scenario;
use librefit_lib::service::user::{get_user, update_user};
use tauri::Manager;

// ============================================================================
// USER PROFILE TESTS
// ============================================================================

#[test]
fn test_get_user_no_profile() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = get_user(app.state());

    assert!(result.is_ok());
    assert!(result.unwrap().is_none());
}

#[test]
fn test_update_user_creates_new_profile() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_user(app.state(), "John Doe".to_string(), "avatar1".to_string());

    assert!(result.is_ok());
    let user = result.unwrap();
    assert_eq!(user.name, "John Doe");
    assert_eq!(user.avatar, "avatar1");
}

#[test]
fn test_update_user_updates_existing_profile() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create initial profile
    update_user(app.state(), "John Doe".to_string(), "avatar1".to_string()).unwrap();

    // Update profile
    let result = update_user(app.state(), "Jane Smith".to_string(), "avatar2".to_string());

    assert!(result.is_ok());
    let user = result.unwrap();
    assert_eq!(user.name, "Jane Smith");
    assert_eq!(user.avatar, "avatar2");
}

#[test]
fn test_get_user_returns_created_profile() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // Create profile
    update_user(app.state(), "John Doe".to_string(), "avatar1".to_string()).unwrap();

    // Get profile
    let result = get_user(app.state());

    assert!(result.is_ok());
    let user_opt = result.unwrap();
    assert!(user_opt.is_some());

    let user = user_opt.unwrap();
    assert_eq!(user.name, "John Doe");
    assert_eq!(user.avatar, "avatar1");
}

#[test]
fn nickname_below_backend_lower_bound_rejected() {
    scenario!("[PF-012]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    // 1 char — one below the validator's min of 2.
    let result = update_user(app.state(), "A".to_string(), "avatar1".to_string());

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.contains("Validation failed"), "unexpected error: {err}");
    assert!(
        err.contains("name"),
        "error should mention the name field: {err}"
    );
}

#[test]
fn test_update_user_with_empty_avatar() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_user(app.state(), "John Doe".to_string(), "".to_string());

    // Empty avatar is allowed
    assert!(result.is_ok());
    let user = result.unwrap();
    assert_eq!(user.avatar, "");
}

#[test]
fn nickname_above_backend_upper_bound_rejected() {
    scenario!("[PF-013]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let long_name = "A".repeat(41); // One above the validator's max of 40.
    let result = update_user(app.state(), long_name.clone(), "avatar1".to_string());

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.contains("Validation failed"), "unexpected error: {err}");
    assert!(
        err.contains("name"),
        "error should mention the name field: {err}"
    );
}

#[test]
fn test_update_user_validation_avatar_too_long() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let long_avatar = "A".repeat(501); // Over 500 character limit
    let result = update_user(app.state(), "John Doe".to_string(), long_avatar);

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.contains("Validation failed"), "unexpected error: {err}");
    assert!(
        err.contains("avatar"),
        "error should mention the avatar field: {err}"
    );
}

#[test]
fn test_update_user_with_special_characters() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = update_user(
        app.state(),
        "José María O'Connor".to_string(),
        "avatar_ñ".to_string(),
    );

    assert!(result.is_ok());
    let user = result.unwrap();
    assert_eq!(user.name, "José María O'Connor");
    assert_eq!(user.avatar, "avatar_ñ");
}
