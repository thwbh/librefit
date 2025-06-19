use crate::crud::cmd::error_handler::handle_error;
use crate::crud::db::connection::create_db_connection;
use crate::crud::db::model::LibreUser;
use crate::crud::db::repo::user;
use tauri::command;

/// Update the user's avatar and nickname
#[command]
pub fn update_user(user_name: String, user_avatar: String) -> Result<LibreUser, String> {
    log::info!(
        ">>> update_user: user_name={}, user_avatar={}",
        user_name,
        user_avatar
    );

    let conn = &mut create_db_connection();
    user::update_user(conn, &user_name, &user_avatar).map_err(handle_error)
}

/// Return user data to determine if its a first time setup
#[command]
pub fn get_user() -> Result<Option<LibreUser>, String> {
    log::info!(">>> get_user");

    let conn = &mut create_db_connection();

    user::get_user(conn).map_err(handle_error)
}
