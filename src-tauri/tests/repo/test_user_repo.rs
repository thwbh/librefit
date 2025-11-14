use crate::helpers::setup_test_pool;
use librefit_lib::service::user::LibreUser;

#[test]
fn test_get_user_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = LibreUser::get(&mut conn);

    assert!(result.is_ok());
    let user_opt = result.unwrap();
    assert!(user_opt.is_none());
}

#[test]
fn test_update_user_creates_new_user() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // When no user exists, update_user should create one
    let result = LibreUser::update(&mut conn, "Alice", "avatar1.png");

    assert!(result.is_ok());
    let created_user = result.unwrap();
    assert_eq!(created_user.id, 1); // First user gets ID 1
    assert_eq!(created_user.name, "Alice");
    assert_eq!(created_user.avatar, "avatar1.png");
}

#[test]
fn test_update_user_updates_existing_user() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create initial user
    LibreUser::update(&mut conn, "Alice", "avatar1.png").unwrap();

    // Update the user
    let result = LibreUser::update(&mut conn, "Bob", "avatar2.png");

    assert!(result.is_ok());
    let updated_user = result.unwrap();
    assert_eq!(updated_user.id, 1); // Should still be ID 1
    assert_eq!(updated_user.name, "Bob");
    assert_eq!(updated_user.avatar, "avatar2.png");

    // Verify only one user exists
    let fetched = LibreUser::get(&mut conn).unwrap();
    assert!(fetched.is_some());
    assert_eq!(fetched.unwrap().name, "Bob");
}

#[test]
fn test_get_user_after_creation() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create user
    LibreUser::update(&mut conn, "Charlie", "avatar3.png").unwrap();

    // Get user
    let result = LibreUser::get(&mut conn);

    assert!(result.is_ok());
    let user_opt = result.unwrap();
    assert!(user_opt.is_some());

    let fetched_user = user_opt.unwrap();
    assert_eq!(fetched_user.name, "Charlie");
    assert_eq!(fetched_user.avatar, "avatar3.png");
}

#[test]
fn test_update_user_multiple_times() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create and update multiple times
    LibreUser::update(&mut conn, "User1", "avatar1.png").unwrap();
    LibreUser::update(&mut conn, "User2", "avatar2.png").unwrap();
    let final_update = LibreUser::update(&mut conn, "User3", "avatar3.png").unwrap();

    // Should still be the same user (ID 1)
    assert_eq!(final_update.id, 1);
    assert_eq!(final_update.name, "User3");
    assert_eq!(final_update.avatar, "avatar3.png");

    // Verify only one user exists
    let result = LibreUser::get(&mut conn).unwrap();
    assert!(result.is_some());
}

#[test]
fn test_update_user_with_empty_strings() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create user with empty strings (should still work)
    let result = LibreUser::update(&mut conn, "", "");

    assert!(result.is_ok());
    let created_user = result.unwrap();
    assert_eq!(created_user.name, "");
    assert_eq!(created_user.avatar, "");
}

#[test]
fn test_update_user_with_special_characters() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Test with special characters
    let result = LibreUser::update(&mut conn, "User 👤", "avatar/path/🎨.png");

    assert!(result.is_ok());
    let created_user = result.unwrap();
    assert_eq!(created_user.name, "User 👤");
    assert_eq!(created_user.avatar, "avatar/path/🎨.png");
}

#[test]
fn test_update_user_with_long_strings() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let long_name = "A".repeat(500);
    let long_avatar = "path/".repeat(200);

    let result = LibreUser::update(&mut conn, &long_name, &long_avatar);

    assert!(result.is_ok());
    let created_user = result.unwrap();
    assert_eq!(created_user.name, long_name);
    assert_eq!(created_user.avatar, long_avatar);
}
