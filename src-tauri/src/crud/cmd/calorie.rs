use crate::crud::cmd::error_handler::handle_error;
use crate::crud::db::connection::create_db_connection;
use crate::crud::db::model::{CalorieTarget, CalorieTracker, NewCalorieTarget, NewCalorieTracker};
use crate::crud::db::repo::calories;
use tauri::command;
use validator::Validate;

/// Create a new calorie target
#[command]
pub fn create_calorie_target(new_target: NewCalorieTarget) -> Result<CalorieTarget, String> {
    if let Err(validation_errors) = new_target.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }
    
    log::info!("Creating new calorie target: {:?}", new_target);
    let conn = &mut create_db_connection();
    calories::create_calorie_target(conn, &new_target).map_err(handle_error)
}

#[command]
pub fn get_last_calorie_target() -> Result<CalorieTarget, String> {
    let conn = &mut create_db_connection();
    calories::find_last_calorie_target(conn).map_err(handle_error)
}

/// Create a new calorie tracker entry and return the created one
#[command]
pub fn create_calorie_tracker_entry(
    new_entry: NewCalorieTracker,
) -> Result<CalorieTracker, String> {
    if let Err(validation_errors) = new_entry.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }
    
    log::info!("Creating new calorie tracker entry: {:?}", new_entry);
    let conn = &mut create_db_connection();
    calories::create_calorie_tracker_entry(conn, &new_entry).map_err(handle_error)
}

/// Update a calorie tracker entry by ID and return it
#[command]
pub fn update_calorie_tracker_entry(
    tracker_id: i32,
    updated_entry: NewCalorieTracker,
) -> Result<CalorieTracker, String> {
    if let Err(validation_errors) = updated_entry.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }
    
    log::info!("Updating calorie tracker entry {}: {:?}", tracker_id, updated_entry);
    let conn = &mut create_db_connection();
    calories::update_calorie_tracker_entry(conn, tracker_id, &updated_entry).map_err(handle_error)
}

/// Delete a calorie tracker entry by ID and return the deleted row count
#[command]
pub fn delete_calorie_tracker_entry(tracker_id: i32) -> Result<usize, String> {
    let conn = &mut create_db_connection();
    calories::delete_calorie_tracker_entry(conn, &tracker_id).map_err(handle_error)
}

#[command]
pub fn get_calorie_tracker_for_date_range(
    date_from_str: String,
    date_to_str: String,
) -> Result<Vec<CalorieTracker>, String> {
    let conn = &mut create_db_connection();
    calories::find_calorie_tracker_by_date_range(conn, &date_from_str, &date_to_str)
        .map_err(handle_error)
}

/// Return all dates the user has actually tracked something in the given range.
#[command]
pub fn get_calorie_tracker_dates_in_range(
    date_from_str: String,
    date_to_str: String,
) -> Result<Vec<String>, String> {
    log::info!(
        ">>> get_calorie_tracker_dates_in_range date_from_str={:?} date_to_str={:?}",
        date_from_str,
        date_to_str
    );

    let conn = &mut create_db_connection();

    match calories::find_calorie_tracker_by_date_range(conn, &date_from_str, &date_to_str) {
        Ok(result) => {
            let mut vec = result
                .into_iter()
                .map(|tracker| tracker.added)
                .collect::<Vec<String>>();

            vec.dedup();

            Ok(vec)
        }
        Err(error) => Err(handle_error(error)),
    }
}
