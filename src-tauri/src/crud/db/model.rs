use chrono::NaiveDate;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use validator::{Validate, ValidationError};

/// Represents a user profile. There may be only one.
#[derive(Queryable, Selectable, Insertable, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = crate::crud::db::schema::libre_user)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct LibreUser {
    pub id: i32,
    pub avatar: Option<String>,
    pub name: Option<String>,
}

/// Represents a calorie tracker entry tied to a day. There may be multiple entries for the same
/// category.
#[derive(Queryable, Selectable, Serialize, Deserialize, Validate)]
#[diesel(table_name = crate::crud::db::schema::calorie_tracker)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct CalorieTracker {
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

/// Represents a weight tracker entry tied to a day. There may be multiple entries for one day.
#[derive(Queryable, Selectable, Serialize, Deserialize, Validate)]
#[diesel(table_name = crate::crud::db::schema::weight_tracker)]
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
}

/// Represents the category for [CalorieTracker]. <key, value> pair for the cateogry dropdown in
/// the UI.
#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::crud::db::schema::food_category)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct FoodCategory {
    pub longvalue: String,
    pub shortvalue: String,
}

/// Represents a target for the maximum calorie intake for per day. Will display a warning in the
/// UI if an overflow occurs.
#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::crud::db::schema::calorie_target)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct CalorieTarget {
    pub id: i32,
    pub added: String,
    pub end_date: String,
    pub maximum_calories: i32,
    pub start_date: String,
    pub target_calories: i32,
}

/// Represents a target weight that the [LibreUser] wants to reach until a specific date occurrs.
#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::crud::db::schema::weight_target)]
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

/// For creation of a new [CalorieTracker] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Validate, Debug)]
#[diesel(table_name = crate::crud::db::schema::calorie_tracker)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewCalorieTracker {
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

/// For creation of a new [WeightTracker] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug, Validate)]
#[diesel(table_name = crate::crud::db::schema::weight_tracker)]
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
}

/// For creation of a new [FoodCategory] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = crate::crud::db::schema::food_category)]
pub struct NewFoodCategory {
    pub longvalue: String,
    pub shortvalue: String,
}

/// For creation of a new [CalorieTarget] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug, Validate)]
#[diesel(table_name = crate::crud::db::schema::calorie_target)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
#[validate(schema(function = "validate_calorie_target"))]
pub struct NewCalorieTarget {
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

/// For creation of a new [WeightTarget] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug, Validate)]
#[diesel(table_name = crate::crud::db::schema::weight_target)]
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

/// Represents the body data upon profile creation.
#[derive(
    Insertable, Queryable, Selectable, AsChangeset, Serialize, Deserialize, Debug, Validate,
)]
#[diesel(table_name = crate::crud::db::schema::body_data)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct BodyData {
    pub id: i32,
    #[validate(range(min = 18, max = 99, message = "Age must be between 18 and 99 years."))]
    pub age: i32,
    #[validate(range(
        min = 100.0,
        max = 220.0,
        message = "Height must be between 100 and 220cm."
    ))]
    pub height: f32,
    #[validate(range(
        min = 30.0,
        max = 330.0,
        message = "Weight must be btween 30 and 330kg."
    ))]
    pub weight: f32,
    pub sex: String,
}

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
fn validate_calorie_target(target: &NewCalorieTarget) -> Result<(), ValidationError> {
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
