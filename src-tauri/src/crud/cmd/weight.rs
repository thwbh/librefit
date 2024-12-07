use crate::crud::cmd::error_handler::handle_error;
use crate::crud::db::connection::create_db_connection;
use crate::crud::db::model::{NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker};
use crate::crud::db::repo::weight;
use tauri::command;

/// Create a new weight target
#[command]
pub fn create_weight_target(new_target: NewWeightTarget) -> Result<WeightTarget, String> {
    let conn = &mut create_db_connection();
    weight::create_weight_target(conn, &new_target).map_err(handle_error)
}

/// Retrieve all weight targets
#[command]
pub fn get_weight_targets() -> Result<Vec<WeightTarget>, String> {
    let conn = &mut create_db_connection();
    weight::get_weight_targets(conn).map_err(handle_error)
}

/// Update a weight target by ID
#[command]
pub fn update_weight_target(
    target_id: i32,
    updated_target: NewWeightTarget,
) -> Result<WeightTarget, String> {
    let conn = &mut create_db_connection();
    weight::update_weight_target(conn, target_id, updated_target).map_err(handle_error)
}

/// Delete a weight target by ID
#[command]
pub fn delete_weight_target(target_id: i32) -> Result<usize, String> {
    let conn = &mut create_db_connection();
    weight::delete_weight_target(conn, target_id).map_err(handle_error)
}

/// Create a new weight tracker entry and return tracker data for that day
#[command]
pub fn create_weight_tracker_entry(
    new_entry: NewWeightTracker,
) -> Result<Vec<WeightTracker>, String> {
    let conn = &mut create_db_connection();
    weight::create_weight_tracker_entry(conn, &new_entry).map_err(handle_error)?;
    weight::find_weight_tracker_by_date(conn, &new_entry.added).map_err(handle_error)
}

/// Update a weight tracker entry by ID and return tracker data for that day
#[command]
pub fn update_weight_tracker_entry(
    tracker_id: i32,
    updated_entry: NewWeightTracker,
) -> Result<Vec<WeightTracker>, String> {
    let conn = &mut create_db_connection();
    weight::update_weight_tracker_entry(conn, &tracker_id, &updated_entry).map_err(handle_error)?;
    weight::find_weight_tracker_by_date(conn, &updated_entry.added).map_err(handle_error)
}

/// Delete a weight tracker entry by ID and return tracker data for that day
#[command]
pub fn delete_weight_tracker_entry(
    tracker_id: i32,
    added_str: String,
) -> Result<Vec<WeightTracker>, String> {
    let conn = &mut create_db_connection();
    weight::delete_weight_tracker_entry(conn, tracker_id).map_err(handle_error)?;
    weight::find_weight_tracker_by_date(conn, &added_str).map_err(handle_error)
}

#[command]
pub fn get_weight_tracker_for_date_range(
    date_from_str: String,
    date_to_str: String
) -> Result<Vec<WeightTracker>, String> {
    let conn = &mut create_db_connection();

    weight::find_weight_tracker_by_date_range(conn, &date_from_str, &date_to_str).map_err(handle_error)
}