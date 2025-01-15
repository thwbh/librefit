use tauri::command;

use crate::crud::db::{connection::create_db_connection, model::BodyData, repo::body};

use super::error_handler::handle_error;

#[command]
pub fn get_body_data() -> Result<BodyData, String> {
    let conn = &mut create_db_connection();

    body::get_body_data(conn).map_err(handle_error)
}

#[command]
pub fn update_body_data(
    age: i32,
    height: f32,
    weight: f32,
    sex: String,
) -> Result<BodyData, String> {
    let conn = &mut create_db_connection();

    body::update_body_data(conn, &age, &height, &weight, &sex).map_err(handle_error)
}
