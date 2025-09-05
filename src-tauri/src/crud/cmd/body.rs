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
    // Validate age (18-99 years, matching frontend)
    if age < 18 || age > 99 {
        return Err("Age must be between 18 and 99 years".to_string());
    }
    
    // Validate height (100-220 cm, matching frontend)
    if height < 100.0 || height > 220.0 {
        return Err("Height must be between 100 and 220 cm".to_string());
    }
    
    // Validate weight (30-300 kg, matching frontend wizard validation)
    if weight < 30.0 || weight > 300.0 {
        return Err("Please provide a weight between 30kg and 300kg".to_string());
    }
    
    // Validate sex
    if sex != "male" && sex != "female" {
        return Err("Sex must be either 'male' or 'female'".to_string());
    }
    
    log::info!(
        ">>> update_body_data: age={:?} height={:?} weight={:?} sex={:?}",
        age,
        height,
        weight,
        sex
    );

    let conn = &mut create_db_connection();
    body::update_body_data(conn, &age, &height, &weight, &sex).map_err(handle_error)
}
