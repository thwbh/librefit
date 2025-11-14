use crate::helpers::setup_test_pool;
use librefit_lib::crud::db::repo::user;

#[test]
fn test_get_user_empty() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = user::get_user(&mut conn);

    assert!(result.is_ok());
    let user_opt = result.unwrap();
    assert!(user_opt.is_none());
}

#[test]
fn test_update_user_creates_new_user() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // When no user exists, update_user should create one
    let result = user::update_user(&mut conn, "Alice", "avatar1.png");

    assert!(result.is_ok());
    let created_user = result.unwrap();
    assert_eq!(created_user.id, 1); // First user gets ID 1
    assert_eq!(created_user.name, Some("Alice".to_string()));
    assert_eq!(created_user.avatar, Some("avatar1.png".to_string()));
}

#[test]
fn test_update_user_updates_existing_user() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create initial user
    user::update_user(&mut conn, "Alice", "avatar1.png").unwrap();

    // Update the user
    let result = user::update_user(&mut conn, "Bob", "avatar2.png");

    assert!(result.is_ok());
    let updated_user = result.unwrap();
    assert_eq!(updated_user.id, 1); // Should still be ID 1
    assert_eq!(updated_user.name, Some("Bob".to_string()));
    assert_eq!(updated_user.avatar, Some("avatar2.png".to_string()));

    // Verify only one user exists
    let fetched = user::get_user(&mut conn).unwrap();
    assert!(fetched.is_some());
    assert_eq!(fetched.unwrap().name, Some("Bob".to_string()));
}

#[test]
fn test_get_user_after_creation() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create user
    user::update_user(&mut conn, "Charlie", "avatar3.png").unwrap();

    // Get user
    let result = user::get_user(&mut conn);

    assert!(result.is_ok());
    let user_opt = result.unwrap();
    assert!(user_opt.is_some());

    let fetched_user = user_opt.unwrap();
    assert_eq!(fetched_user.name, Some("Charlie".to_string()));
    assert_eq!(fetched_user.avatar, Some("avatar3.png".to_string()));
}

#[test]
fn test_update_user_multiple_times() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create and update multiple times
    user::update_user(&mut conn, "User1", "avatar1.png").unwrap();
    user::update_user(&mut conn, "User2", "avatar2.png").unwrap();
    let final_update = user::update_user(&mut conn, "User3", "avatar3.png").unwrap();

    // Should still be the same user (ID 1)
    assert_eq!(final_update.id, 1);
    assert_eq!(final_update.name, Some("User3".to_string()));
    assert_eq!(final_update.avatar, Some("avatar3.png".to_string()));

    // Verify only one user exists
    let result = user::get_user(&mut conn).unwrap();
    assert!(result.is_some());
}

#[test]
fn test_update_user_with_empty_strings() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Create user with empty strings (should still work)
    let result = user::update_user(&mut conn, "", "");

    assert!(result.is_ok());
    let created_user = result.unwrap();
    assert_eq!(created_user.name, Some("".to_string()));
    assert_eq!(created_user.avatar, Some("".to_string()));
}

#[test]
fn test_update_user_with_special_characters() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Test with special characters
    let result = user::update_user(&mut conn, "User 👤", "avatar/path/🎨.png");

    assert!(result.is_ok());
    let created_user = result.unwrap();
    assert_eq!(created_user.name, Some("User 👤".to_string()));
    assert_eq!(created_user.avatar, Some("avatar/path/🎨.png".to_string()));
}

#[test]
fn test_update_user_with_long_strings() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let long_name = "A".repeat(500);
    let long_avatar = "path/".repeat(200);

    let result = user::update_user(&mut conn, &long_name, &long_avatar);

    assert!(result.is_ok());
    let created_user = result.unwrap();
    assert_eq!(created_user.name, Some(long_name));
    assert_eq!(created_user.avatar, Some(long_avatar));
}
