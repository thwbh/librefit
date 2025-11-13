use tauri::{command, State};
use validator::Validate;

use crate::crud::db::{connection::DbPool, model::BodyData, repo::body};

use super::error_handler::handle_error;

#[command]
pub fn get_body_data(pool: State<DbPool>) -> Result<BodyData, String> {
    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    body::get_body_data(&mut conn).map_err(handle_error)
}

#[command]
pub fn update_body_data(
    pool: State<DbPool>,
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

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    body::update_body_data(&mut conn, &age, &height, &weight, &sex).map_err(handle_error)
}
