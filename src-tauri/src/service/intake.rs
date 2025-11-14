use crate::db::connection::DbPool;
use crate::db::schema::{food_category, intake, intake_target};
use crate::db::DbExecutor;
use chrono::NaiveDate;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use validator::{Validate, ValidationError};

// ============================================================================
// MODELS
// ============================================================================

/// Represents the category for Intake. <key, value> pair for the category dropdown in the UI.
#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = food_category)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct FoodCategory {
    pub longvalue: String,
    pub shortvalue: String,
}

/// Represents an intake entry tied to a day. There may be multiple entries for the same
/// category.
#[derive(Queryable, Selectable, Serialize, Deserialize, Validate, Debug)]
#[diesel(table_name = intake)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct Intake {
    pub id: i32,
    pub added: String,
    #[validate(range(
        min = 1,
        max = 10000,
        message = "Calorie amount must be between 1 and 10,000"
    ))]
    pub amount: i32,
    #[validate(length(
        min = 1,
        max = 50,
        message = "Category must be between 1 and 50 characters"
    ))]
    pub category: String,
    #[validate(length(max = 500, message = "Description must be less than 500 characters"))]
    pub description: Option<String>,
}

/// For creation of a new [Intake] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Validate, Debug)]
#[diesel(table_name = intake)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewIntake {
    #[validate(custom(function = "validate_date_format"))]
    pub added: String,
    #[validate(range(
        min = 1,
        max = 10000,
        message = "Calorie amount must be between 1 and 10,000"
    ))]
    pub amount: i32,
    #[validate(length(
        min = 1,
        max = 50,
        message = "Category must be between 1 and 50 characters"
    ))]
    pub category: String,
    #[validate(length(max = 500, message = "Description must be less than 500 characters"))]
    pub description: Option<String>,
}

/// Represents a target for the maximum calorie intake per day. Will display a warning in the
/// UI if an overflow occurs.
#[derive(Queryable, Selectable, Serialize, Deserialize, Debug)]
#[diesel(table_name = intake_target)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct IntakeTarget {
    pub id: i32,
    pub added: String,
    pub end_date: String,
    pub maximum_calories: i32,
    pub start_date: String,
    pub target_calories: i32,
}

/// For creation of a new [IntakeTarget] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug, Validate)]
#[diesel(table_name = intake_target)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
#[validate(schema(function = "validate_intake_target"))]
pub struct NewIntakeTarget {
    #[validate(custom(function = "validate_date_format"))]
    pub added: String,
    #[validate(custom(function = "validate_date_format"))]
    pub end_date: String,
    #[validate(range(
        min = 1,
        max = 10000,
        message = "Maximum calories must be between 1 and 10,000"
    ))]
    pub maximum_calories: i32,
    #[validate(custom(function = "validate_date_format"))]
    pub start_date: String,
    #[validate(range(
        min = 1,
        max = 10000,
        message = "Target calories must be between 1 and 10,000"
    ))]
    pub target_calories: i32,
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

/// Validates that target calories doesn't exceed maximum calories and dates are logical
fn validate_intake_target(target: &NewIntakeTarget) -> Result<(), ValidationError> {
    use chrono::Utc;

    // Check target calories doesn't exceed maximum
    if target.target_calories > target.maximum_calories {
        return Err(ValidationError::new(
            "Target calories cannot exceed maximum calories",
        ));
    }

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

    Ok(())
}

// ============================================================================
// REPOSITORY
// ============================================================================

impl Intake {
    /// Insert a new intake entry to the tracker
    pub fn create(conn: &mut SqliteConnection, new_entry: &NewIntake) -> QueryResult<Self> {
        diesel::insert_into(intake::table)
            .values(new_entry)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Retrieve all intake entries
    pub fn all(conn: &mut SqliteConnection) -> QueryResult<Vec<Self>> {
        intake::table.load::<Self>(conn)
    }

    /// Update an intake entry by ID
    pub fn update(
        conn: &mut SqliteConnection,
        tracker_id: i32,
        updated_entry: &NewIntake,
    ) -> QueryResult<Self> {
        diesel::update(intake::table.filter(intake::id.eq(tracker_id)))
            .set(updated_entry)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Delete an intake entry by ID
    pub fn delete(conn: &mut SqliteConnection, tracker_id: &i32) -> QueryResult<usize> {
        diesel::delete(intake::table.filter(intake::id.eq(tracker_id))).execute(conn)
    }

    /// Find intake entries by date
    pub fn find_by_date(conn: &mut SqliteConnection, date: &String) -> QueryResult<Vec<Self>> {
        intake::table
            .filter(intake::added.eq(date))
            .load::<Self>(conn)
    }

    /// Find intake entries by date range
    pub fn find_by_date_range(
        conn: &mut SqliteConnection,
        date_from: &String,
        date_to: &String,
    ) -> QueryResult<Vec<Self>> {
        intake::table
            .filter(intake::added.between(date_from, date_to))
            .order(intake::added.desc())
            .load::<Self>(conn)
    }
}

impl IntakeTarget {
    /// Create a new intake target
    pub fn create(conn: &mut SqliteConnection, new_target: &NewIntakeTarget) -> QueryResult<Self> {
        diesel::insert_into(intake_target::table)
            .values(new_target)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Retrieve all intake targets
    pub fn all(conn: &mut SqliteConnection) -> QueryResult<Vec<Self>> {
        intake_target::table.load::<Self>(conn)
    }

    /// Update an intake target by ID
    pub fn update(
        conn: &mut SqliteConnection,
        target_id: i32,
        updated_target: NewIntakeTarget,
    ) -> QueryResult<Self> {
        diesel::update(intake_target::table.filter(intake_target::id.eq(target_id)))
            .set(&updated_target)
            .returning(Self::as_returning())
            .get_result(conn)
    }

    /// Delete an intake target by ID
    pub fn delete(conn: &mut SqliteConnection, target_id: i32) -> QueryResult<usize> {
        diesel::delete(intake_target::table.filter(intake_target::id.eq(target_id))).execute(conn)
    }

    /// Find the last intake target
    pub fn find_last(conn: &mut SqliteConnection) -> QueryResult<Self> {
        intake_target::table
            .order(intake_target::id.desc())
            .first::<Self>(conn)
    }
}

// ============================================================================
// COMMANDS (Tauri)
// ============================================================================

/// Create a new intake target
#[command]
pub fn create_calorie_target(
    pool: State<DbPool>,
    new_target: NewIntakeTarget,
) -> Result<IntakeTarget, String> {
    if let Err(validation_errors) = new_target.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    log::info!("Creating new intake target: {:?}", new_target);

    pool.execute(|conn| IntakeTarget::create(conn, &new_target))
}

#[command]
pub fn get_last_calorie_target(pool: State<DbPool>) -> Result<IntakeTarget, String> {
    pool.execute(IntakeTarget::find_last)
}

/// Create a new intake tracker entry and return the created one
#[command]
pub fn create_calorie_tracker_entry(
    pool: State<DbPool>,
    new_entry: NewIntake,
) -> Result<Intake, String> {
    if let Err(validation_errors) = new_entry.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    log::info!("Creating new intake tracker entry: {:?}", new_entry);

    pool.execute(|conn| Intake::create(conn, &new_entry))
}

/// Update an intake tracker entry by ID and return it
#[command]
pub fn update_calorie_tracker_entry(
    pool: State<DbPool>,
    tracker_id: i32,
    updated_entry: NewIntake,
) -> Result<Intake, String> {
    if let Err(validation_errors) = updated_entry.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    log::info!(
        "Updating intake tracker entry {}: {:?}",
        tracker_id,
        updated_entry
    );

    pool.execute(|conn| Intake::update(conn, tracker_id, &updated_entry))
}

/// Delete an intake tracker entry by ID and return the deleted row count
#[command]
pub fn delete_calorie_tracker_entry(pool: State<DbPool>, tracker_id: i32) -> Result<usize, String> {
    pool.execute(|conn| Intake::delete(conn, &tracker_id))
}

#[command]
pub fn get_calorie_tracker_for_date_range(
    pool: State<DbPool>,
    date_from_str: String,
    date_to_str: String,
) -> Result<Vec<Intake>, String> {
    pool.execute(|conn| Intake::find_by_date_range(conn, &date_from_str, &date_to_str))
}

/// Return all dates the user has actually tracked something in the given range.
#[command]
pub fn get_calorie_tracker_dates_in_range(
    pool: State<DbPool>,
    date_from_str: String,
    date_to_str: String,
) -> Result<Vec<String>, String> {
    log::info!(
        ">>> get_calorie_tracker_dates_in_range date_from_str={:?} date_to_str={:?}",
        date_from_str,
        date_to_str
    );

    pool.execute(|conn| {
        Intake::find_by_date_range(conn, &date_from_str, &date_to_str).map(|result| {
            let mut vec = result
                .into_iter()
                .map(|tracker| tracker.added)
                .collect::<Vec<String>>();

            vec.dedup();
            vec
        })
    })
}

// ============================================================================
// FOOD CATEGORY - Additional functionality for Intake
// ============================================================================

impl FoodCategory {
    /// Get all food categories
    pub fn all(conn: &mut SqliteConnection) -> QueryResult<Vec<Self>> {
        food_category::table.load::<Self>(conn)
    }

    /// Get a specific food category by its short value (key)
    pub fn find_by_key(conn: &mut SqliteConnection, key: String) -> QueryResult<Self> {
        food_category::table
            .filter(food_category::shortvalue.eq(key))
            .first(conn)
    }
}

// ============================================================================
// COMMANDS (Tauri) - Food Category
// ============================================================================

#[command]
pub fn get_food_categories(pool: State<DbPool>) -> Result<Vec<FoodCategory>, String> {
    pool.execute(FoodCategory::all)
}
