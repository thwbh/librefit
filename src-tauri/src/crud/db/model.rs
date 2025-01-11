use diesel::prelude::*;
use serde::{Deserialize, Serialize};

/// Represents a user profile. There may be only one.
#[derive(Queryable, Selectable, AsChangeset, Serialize, Deserialize)]
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
#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::crud::db::schema::calorie_tracker)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct CalorieTracker {
    pub id: i32,
    pub added: String,
    pub amount: i32,
    pub category: String,
    pub description: Option<String>,
}

/// Represents a weight tracker entry tied to a day. There may be multiple entries for one day.
#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::crud::db::schema::weight_tracker)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct WeightTracker {
    pub id: i32,
    pub added: String,
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
#[derive(Insertable, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = crate::crud::db::schema::calorie_tracker)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewCalorieTracker {
    pub added: String,
    pub amount: i32,
    pub category: String,
    pub description: String,
}

/// For creation of a new [WeightTracker] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug)]
#[diesel(table_name = crate::crud::db::schema::weight_tracker)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewWeightTracker {
    pub added: String,
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
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug)]
#[diesel(table_name = crate::crud::db::schema::calorie_target)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewCalorieTarget {
    pub added: String,
    pub end_date: String,
    pub maximum_calories: i32,
    pub start_date: String,
    pub target_calories: i32,
}

/// For creation of a new [WeightTarget] entry.
#[derive(Insertable, AsChangeset, Serialize, Deserialize, Debug)]
#[diesel(table_name = crate::crud::db::schema::weight_target)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct NewWeightTarget {
    pub added: String,
    pub end_date: String,
    pub initial_weight: f32,
    pub start_date: String,
    pub target_weight: f32,
}

/// Represents the body data upon profile creation.
#[derive(Insertable, Queryable, Selectable, AsChangeset, Serialize, Deserialize, Debug)]
#[diesel(table_name = crate::crud::db::schema::body_data)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct BodyData {
    pub id: i32,
    pub age: i32,
    pub height: f32,
    pub weight: f32,
    pub sex: String,
}
