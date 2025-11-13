use crate::crud::cmd::error_handler::handle_error;
use crate::crud::db::connection::DbPool;
use crate::crud::db::model::{NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker};
use crate::crud::db::repo::weight;
use tauri::{command, State};
use validator::Validate;

/// Create a new weight target
#[command]
pub fn create_weight_target(
    pool: State<DbPool>,
    new_target: NewWeightTarget,
) -> Result<WeightTarget, String> {
    if let Err(validation_errors) = new_target.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    log::info!("Creating new weight target: {:?}", new_target);

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::create_weight_target(&mut conn, &new_target).map_err(handle_error)
}

/// Retrieve all weight targets
#[command]
pub fn get_weight_targets(pool: State<DbPool>) -> Result<Vec<WeightTarget>, String> {
    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::get_weight_targets(&mut conn).map_err(handle_error)
}

/// Retrieve last weight target
#[command]
pub fn get_last_weight_target(pool: State<DbPool>) -> Result<WeightTarget, String> {
    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::get_latest_weight_target(&mut conn).map_err(handle_error)
}

/// Update a weight target by ID
#[command]
pub fn update_weight_target(
    pool: State<DbPool>,
    target_id: i32,
    updated_target: NewWeightTarget,
) -> Result<WeightTarget, String> {
    if let Err(validation_errors) = updated_target.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    log::info!("Updating weight target {}: {:?}", target_id, updated_target);

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::update_weight_target(&mut conn, target_id, updated_target).map_err(handle_error)
}

/// Delete a weight target by ID
#[command]
pub fn delete_weight_target(pool: State<DbPool>, target_id: i32) -> Result<usize, String> {
    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::delete_weight_target(&mut conn, target_id).map_err(handle_error)
}

/// Create a new weight tracker entry and return tracker data for that day
#[command]
pub fn create_weight_tracker_entry(
    pool: State<DbPool>,
    new_entry: NewWeightTracker,
) -> Result<WeightTracker, String> {
    if let Err(validation_errors) = new_entry.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    log::info!("Creating new weight tracker entry: {:?}", new_entry);

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::create_weight_tracker_entry(&mut conn, &new_entry).map_err(handle_error)
}

/// Update a weight tracker entry by ID and return tracker data for that day
#[command]
pub fn update_weight_tracker_entry(
    pool: State<DbPool>,
    tracker_id: i32,
    updated_entry: NewWeightTracker,
) -> Result<WeightTracker, String> {
    if let Err(validation_errors) = updated_entry.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    log::info!(
        "Updating weight tracker entry {}: {:?}",
        tracker_id,
        updated_entry
    );

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::update_weight_tracker_entry(&mut conn, &tracker_id, &updated_entry)
        .map_err(handle_error)
}

/// Delete a weight tracker entry by ID and return tracker data for that day
#[command]
pub fn delete_weight_tracker_entry(pool: State<DbPool>, tracker_id: i32) -> Result<usize, String> {
    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::delete_weight_tracker_entry(&mut conn, tracker_id).map_err(handle_error)
}

#[command]
pub fn get_weight_tracker_for_date_range(
    pool: State<DbPool>,
    date_from_str: String,
    date_to_str: String,
) -> Result<Vec<WeightTracker>, String> {
    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;
    weight::find_weight_tracker_by_date_range(&mut conn, &date_from_str, &date_to_str)
        .map_err(handle_error)
}
