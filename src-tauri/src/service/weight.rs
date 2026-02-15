use crate::db::connection::DbPool;
use crate::db::schema::{weight_target, weight_tracker};
use crate::db::DbExecutor;
use chrono::NaiveDate;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use validator::{Validate, ValidationError};

// ============================================================================
// MODELS
// ============================================================================

/// Represents a weight tracker entry tied to a day. There may be multiple entries for one day.
#[derive(Queryable, Selectable, Serialize, Deserialize, Validate, Debug)]
#[diesel(table_name = weight_tracker)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct WeightTracker {
    pub id: i32,
    pub added: String,
    #[validate(range(
        min = 30.0,
        max = 330.0,
        message = "Weight must be between 30 and 330 kg"
    ))]
    pub amount: f32,
    #[validate(custom(function = "validate_time_format"))]
    pub time: String,
}

/// For creation of a new [WeightTracker] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug, Validate)]
#[diesel(table_name = weight_tracker)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewWeightTracker {
    #[validate(custom(function = "validate_date_format"))]
    pub added: String,
    #[validate(range(
        min = 30.0,
        max = 330.0,
        message = "Weight must be between 30 and 330 kg"
    ))]
    pub amount: f32,
    #[serde(default = "default_time")]
    #[validate(custom(function = "validate_time_format_optional"))]
    pub time: Option<String>,
}

impl NewWeightTracker {
    /// Create a new weight tracker entry with current time
    pub fn new(added: String, amount: f32) -> Self {
        Self {
            added,
            amount,
            time: default_time(),
        }
    }
}

/// Default time value set to current time
fn default_time() -> Option<String> {
    use chrono::Local;
    Some(Local::now().format("%H:%M:%S").to_string())
}

/// Represents a target weight that the user wants to reach until a specific date occurs.
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug)]
#[diesel(table_name = weight_target)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct WeightTarget {
    pub id: i32,
    pub added: String,
    pub end_date: String,
    pub initial_weight: f32,
    pub start_date: String,
    pub target_weight: f32,
}

/// For creation of a new [WeightTarget] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug, Validate)]
#[diesel(table_name = weight_target)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
#[validate(schema(function = "validate_weight_target"))]
pub struct NewWeightTarget {
    #[validate(custom(function = "validate_date_format"))]
    pub added: String,
    #[validate(custom(function = "validate_date_format"))]
    pub end_date: String,
    #[validate(range(
        min = 30.0,
        max = 300.0,
        message = "Initial weight must be between 30 and 300 kg"
    ))]
    pub initial_weight: f32,
    #[validate(custom(function = "validate_date_format"))]
    pub start_date: String,
    #[validate(range(
        min = 30.0,
        max = 300.0,
        message = "Target weight must be between 30 and 300 kg"
    ))]
    pub target_weight: f32,
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/// Validates date format (YYYY-MM-DD)
fn validate_date_format(date_str: &str) -> Result<(), ValidationError> {
    match NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        Ok(_) => Ok(()),
        Err(_) => Err(ValidationError::new(
            "Invalid date format. Expected YYYY-MM-DD",
        )),
    }
}

/// Validates time format (HH:MM:SS) for String fields
fn validate_time_format(time_str: &str) -> Result<(), ValidationError> {
    use chrono::NaiveTime;

    match NaiveTime::parse_from_str(time_str, "%H:%M:%S") {
        Ok(_) => Ok(()),
        Err(_) => Err(ValidationError::new(
            "Invalid time format. Expected HH:MM:SS",
        )),
    }
}

/// Validates time format (HH:MM:SS) for Option<String> fields
fn validate_time_format_optional(time_str: &str) -> Result<(), ValidationError> {
    use chrono::NaiveTime;

    // For Option fields, validator crate passes empty string for None
    if time_str.is_empty() {
        return Ok(()); // Empty is valid, will use default
    }

    match NaiveTime::parse_from_str(time_str, "%H:%M:%S") {
        Ok(_) => Ok(()),
        Err(_) => Err(ValidationError::new(
            "Invalid time format. Expected HH:MM:SS",
        )),
    }
}

/// Validates weight target logic
fn validate_weight_target(target: &NewWeightTarget) -> Result<(), ValidationError> {
    use chrono::Utc;

    // Parse and validate date order
    let start_date = NaiveDate::parse_from_str(&target.start_date, "%Y-%m-%d")
        .map_err(|_| ValidationError::new("Invalid start date format"))?;
    let end_date = NaiveDate::parse_from_str(&target.end_date, "%Y-%m-%d")
        .map_err(|_| ValidationError::new("Invalid end date format"))?;

    if end_date <= start_date {
        return Err(ValidationError::new("End date must be after start date"));
    }

    // Ensure end date is in the future (matching frontend validation)
    let today = Utc::now().naive_utc().date();
    if end_date <= today {
        return Err(ValidationError::new("Your target date lies in the past"));
    }

    // Validate weight difference is reasonable (not more than 50% change)
    let weight_change_ratio =
        (target.target_weight - target.initial_weight).abs() / target.initial_weight;
    if weight_change_ratio > 0.5 {
        return Err(ValidationError::new(
            "Weight change cannot exceed 50% of initial weight",
        ));
    }

    Ok(())
}

// ============================================================================
// REPOSITORY
// ============================================================================

impl WeightTracker {
    /// Insert a new weight entry to the tracker
    pub fn create(conn: &mut SqliteConnection, new_entry: &NewWeightTracker) -> QueryResult<Self> {
        // Ensure time field is set, use default if None
        let entry_with_time = NewWeightTracker {
            added: new_entry.added.clone(),
            amount: new_entry.amount,
            time: new_entry.time.clone().or_else(default_time),
        };

        diesel::insert_into(weight_tracker::table)
            .values(&entry_with_time)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Retrieve all weight tracker entries
    pub fn all(conn: &mut SqliteConnection) -> QueryResult<Vec<Self>> {
        weight_tracker::table.load::<Self>(conn)
    }

    /// Update a weight tracker entry by ID
    pub fn update(
        conn: &mut SqliteConnection,
        tracker_id: &i32,
        updated_entry: &NewWeightTracker,
    ) -> QueryResult<Self> {
        // Ensure time field is set, use default if None
        let entry_with_time = NewWeightTracker {
            added: updated_entry.added.clone(),
            amount: updated_entry.amount,
            time: updated_entry.time.clone().or_else(default_time),
        };

        diesel::update(weight_tracker::table.filter(weight_tracker::id.eq(tracker_id)))
            .set(&entry_with_time)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Delete a weight tracker entry by ID
    pub fn delete(conn: &mut SqliteConnection, tracker_id: i32) -> QueryResult<usize> {
        diesel::delete(weight_tracker::table.filter(weight_tracker::id.eq(tracker_id)))
            .execute(conn)
    }

    /// Find weight tracker entries by date
    pub fn find_by_date(conn: &mut SqliteConnection, date: &String) -> QueryResult<Vec<Self>> {
        weight_tracker::table
            .filter(weight_tracker::added.eq(date))
            .load::<Self>(conn)
    }

    /// Find weight tracker entries by date range
    pub fn find_by_date_range(
        conn: &mut SqliteConnection,
        date_from: &String,
        date_to: &String,
    ) -> QueryResult<Vec<Self>> {
        weight_tracker::table
            .filter(weight_tracker::added.between(date_from, date_to))
            .order(weight_tracker::added.desc())
            .load::<Self>(conn)
    }

    /// Find most recent weight tracker entry
    pub fn get_latest(conn: &mut SqliteConnection) -> QueryResult<Self> {
        weight_tracker::table
            .order(weight_tracker::added.desc())
            .first::<Self>(conn)
    }
}

impl WeightTarget {
    /// Create a new weight target
    pub fn create(conn: &mut SqliteConnection, new_target: &NewWeightTarget) -> QueryResult<Self> {
        diesel::insert_into(weight_target::table)
            .values(new_target)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Retrieve all weight targets
    pub fn all(conn: &mut SqliteConnection) -> QueryResult<Vec<Self>> {
        weight_target::table.load::<Self>(conn)
    }

    /// Get the latest weight target
    pub fn get_latest(conn: &mut SqliteConnection) -> QueryResult<Self> {
        weight_target::table
            .order(weight_target::id.desc())
            .first::<Self>(conn)
    }

    /// Update a weight target by ID
    pub fn update(
        conn: &mut SqliteConnection,
        target_id: i32,
        updated_target: NewWeightTarget,
    ) -> QueryResult<Self> {
        diesel::update(weight_target::table.filter(weight_target::id.eq(target_id)))
            .set(&updated_target)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Delete a weight target by ID
    pub fn delete(conn: &mut SqliteConnection, target_id: i32) -> QueryResult<usize> {
        diesel::delete(weight_target::table.filter(weight_target::id.eq(target_id))).execute(conn)
    }

    /// Find the last weight target
    pub fn find_last(conn: &mut SqliteConnection) -> QueryResult<Self> {
        weight_target::table
            .order(weight_target::id.desc())
            .first::<Self>(conn)
    }
}

// ============================================================================
// COMMANDS
// ============================================================================

/// Create a new weight target
#[command]
pub fn create_weight_target(
    pool: State<DbPool>,
    new_target: NewWeightTarget,
) -> Result<WeightTarget, String> {
    log::debug!("Creating new weight target: {:?}", new_target);

    if let Err(validation_errors) = new_target.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    pool.execute(|conn| WeightTarget::create(conn, &new_target))
}

/// Retrieve all weight targets
#[command]
pub fn get_weight_targets(pool: State<DbPool>) -> Result<Vec<WeightTarget>, String> {
    pool.execute(WeightTarget::all)
}

/// Retrieve last weight target
#[command]
pub fn get_last_weight_target(pool: State<DbPool>) -> Result<WeightTarget, String> {
    pool.execute(WeightTarget::get_latest)
}

/// Update a weight target by ID
#[command]
pub fn update_weight_target(
    pool: State<DbPool>,
    target_id: i32,
    updated_target: NewWeightTarget,
) -> Result<WeightTarget, String> {
    log::debug!("Updating weight target {}: {:?}", target_id, updated_target);

    if let Err(validation_errors) = updated_target.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    pool.execute(|conn| WeightTarget::update(conn, target_id, updated_target))
}

/// Delete a weight target by ID
#[command]
pub fn delete_weight_target(pool: State<DbPool>, target_id: i32) -> Result<usize, String> {
    pool.execute(|conn| WeightTarget::delete(conn, target_id))
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

    log::debug!("Creating new weight tracker entry: {:?}", new_entry);

    pool.execute(|conn| WeightTracker::create(conn, &new_entry))
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

    log::debug!(
        "Updating weight tracker entry {}: {:?}",
        tracker_id,
        updated_entry
    );

    pool.execute(|conn| WeightTracker::update(conn, &tracker_id, &updated_entry))
}

/// Delete a weight tracker entry by ID and return tracker data for that day
#[command]
pub fn delete_weight_tracker_entry(pool: State<DbPool>, tracker_id: i32) -> Result<usize, String> {
    pool.execute(|conn| WeightTracker::delete(conn, tracker_id))
}

#[command]
pub fn get_weight_tracker_for_date_range(
    pool: State<DbPool>,
    date_from_str: String,
    date_to_str: String,
) -> Result<Vec<WeightTracker>, String> {
    pool.execute(|conn| WeightTracker::find_by_date_range(conn, &date_from_str, &date_to_str))
}

/// Return last weight tracker entry
#[command]
pub fn get_last_weight_tracker(pool: State<DbPool>) -> Result<WeightTracker, String> {
    pool.execute(WeightTracker::get_latest)
}
