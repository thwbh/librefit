use crate::crud::cmd::error_handler::handle_error;
use crate::crud::db::connection::DbPool;
use crate::crud::db::model::LibreUser;
use crate::crud::db::repo::user;
use tauri::{command, State};

/// Update the user's avatar and nickname
#[command]
pub fn update_user(
    pool: State<DbPool>,
    user_name: String,
    user_avatar: String,
) -> Result<LibreUser, String> {
    // Validate username (reasonable length limits)
    if user_name.trim().is_empty() {
        return Err("Username cannot be empty".to_string());
    }
    if user_name.len() > 50 {
        return Err("Username must be less than 50 characters".to_string());
    }

    // Validate avatar (optional field, but if provided should be reasonable length)
    if user_avatar.len() > 500 {
        return Err("Avatar path must be less than 500 characters".to_string());
    }

    log::info!(
        ">>> update_user: user_name={}, user_avatar={}",
        user_name,
        user_avatar
    );

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    user::update_user(&mut conn, &user_name, &user_avatar).map_err(handle_error)
}

/// Return user data to determine if its a first time setup
#[command]
pub fn get_user(pool: State<DbPool>) -> Result<Option<LibreUser>, String> {
    log::info!(">>> get_user");

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    user::get_user(&mut conn).map_err(handle_error)
}
