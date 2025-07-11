use tauri::command;

use crate::crud::db::{connection::create_db_connection, model::FoodCategory, repo::food_category};

use super::error_handler::handle_error;

#[command]
pub fn get_food_categories() -> Result<Vec<FoodCategory>, String> {
    let conn = &mut create_db_connection();

    food_category::get_food_categories(conn).map_err(handle_error)
}
