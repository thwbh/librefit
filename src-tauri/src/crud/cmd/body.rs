use tauri::command;
use validator::Validate;

use crate::crud::db::{connection::with_db_connection, model::BodyData, repo::body};

use super::error_handler::handle_error;

#[command]
pub fn get_body_data() -> Result<BodyData, String> {
    with_db_connection(body::get_body_data).map_err(handle_error)
}

#[command]
pub fn update_body_data(
    age: i32,
    height: f32,
    weight: f32,
    sex: String,
) -> Result<BodyData, String> {
    log::info!(
        ">>> update_body_data: age={:?} height={:?} weight={:?} sex={:?}",
        age,
        height,
        weight,
        sex
    );

    let body_data = BodyData {
        id: 0,
        age,
        height,
        weight,
        sex: sex.clone(),
    };

    if let Err(validation_errors) = body_data.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    with_db_connection(|conn| body::update_body_data(conn, &age, &height, &weight, &sex))
        .map_err(handle_error)
}
