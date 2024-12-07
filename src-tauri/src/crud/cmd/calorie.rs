use crate::crud::db::connection::create_db_connection;
use crate::crud::db::model::{CalorieTarget, CalorieTracker, NewCalorieTarget, NewCalorieTracker};
use crate::crud::db::repo::calories;
use tauri::command;
use crate::crud::cmd::error_handler::handle_error;

/// Create a new calorie target
#[command]
pub fn create_calorie_target(new_target: NewCalorieTarget) -> Result<CalorieTarget, String> {
    let conn = &mut create_db_connection(); // Your function to create database connections
    calories::create_calorie_target(conn, &new_target).map_err(handle_error)
}

/// Retrieve all calorie targets
#[command]
fn get_calorie_targets() -> Result<Vec<CalorieTarget>, String> {
    let conn = &mut create_db_connection();
    calories::get_calorie_targets(conn).map_err(handle_error)
}

/// Update a calorie target by ID
#[command]
fn update_calorie_target(
    target_id: i32,
    updated_target: NewCalorieTarget,
) -> Result<CalorieTarget, String> {
    let conn = &mut create_db_connection();
    calories::update_calorie_target(conn, target_id, updated_target).map_err(handle_error)
}

/// Delete a calorie target by ID
#[command]
fn delete_calorie_target(target_id: i32) -> Result<usize, String> {
    let conn = &mut create_db_connection();
    calories::delete_calorie_target(conn, target_id).map_err(handle_error)
}

/// Create a new calorie tracker entry and return that day's tracker data
#[command]
pub fn create_calorie_tracker_entry(
    new_entry: NewCalorieTracker,
) -> Result<Vec<CalorieTracker>, String> {
    let conn = &mut create_db_connection();

    calories::create_calorie_tracker_entry(conn, &new_entry).map_err(handle_error)?;
    calories::find_calorie_tracker_by_date(conn, &new_entry.added).map_err(handle_error)
}

/// Update a calorie tracker entry by ID and return that day's tracker data
#[command]
pub fn update_calorie_tracker_entry(
    tracker_id: i32,
    updated_entry: NewCalorieTracker,
) -> Result<Vec<CalorieTracker>, String> {
    let conn = &mut create_db_connection();
    calories::update_calorie_tracker_entry(conn, tracker_id, &updated_entry)
        .map_err(handle_error)?;
    calories::find_calorie_tracker_by_date(conn, &updated_entry.added).map_err(handle_error)
}

/// Delete a calorie tracker entry by ID and return that day's tracker data
#[command]
pub fn delete_calorie_tracker_entry(
    tracker_id: i32,
    added_str: String,
) -> Result<Vec<CalorieTracker>, String> {
    let conn = &mut create_db_connection();
    calories::delete_calorie_tracker_entry(conn, &tracker_id).map_err(handle_error)?;
    calories::find_calorie_tracker_by_date(conn, &added_str).map_err(handle_error)
}

#[command]
pub fn get_calorie_tracker_for_date_range(
    date_from_str: String,
    date_to_str: String
) -> Result<Vec<CalorieTracker>, String> {
    let conn = &mut create_db_connection();

    calories::find_calorie_tracker_by_date_range(conn, &date_from_str, &date_to_str).map_err(handle_error)
}

/// Return all dates the user has actually tracked something in the given range.
#[command]
pub fn get_calorie_tracker_dates_in_range(
    date_from_str: String,
    date_to_str: String
) -> Result<Vec<String>, String> {
    let conn = &mut create_db_connection();

    calories::find_calorie_tracker_by_date_range(conn, &date_from_str, &date_to_str)
        .map(|trackers| trackers.into_iter().map(|tracker| tracker.added).collect())
        .map_err(handle_error)
}
