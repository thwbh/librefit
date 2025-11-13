use tauri::{command, State};

use crate::crud::db::{connection::DbPool, model::FoodCategory, repo::food_category};

use super::error_handler::handle_error;

#[command]
pub fn get_food_categories(pool: State<DbPool>) -> Result<Vec<FoodCategory>, String> {
    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    food_category::get_food_categories(&mut conn).map_err(handle_error)
}

#[command]
pub fn get_food_category(pool: State<DbPool>, shortvalue: String) -> Result<FoodCategory, String> {
    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    food_category::get_food_category(&mut conn, shortvalue).map_err(handle_error)
}
