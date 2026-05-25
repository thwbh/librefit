//! Composable seed primitives for end-to-end tests.
//!
//! Compiled only when the `e2e-seed` Cargo feature is on. Each command wraps
//! an existing service function with a simplified signature.
//!
//! Dates are deliberately REQUIRED (no defaults). Tests that depend on "today"
//! are flaky across midnight rollovers and run-day variance; the seed layer
//! refuses to inject that risk. Times-of-day are stable constants and may be
//! defaulted.

use tauri::{command, State};

use crate::db::connection::DbPool;
use crate::service::body::BodyData;
use crate::service::intake::{Intake, IntakeTarget, NewIntake, NewIntakeTarget};
use crate::service::user::LibreUser;
use crate::service::weight::{NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker};

#[command]
pub fn seed_user(
    pool: State<DbPool>,
    name: Option<String>,
    avatar: Option<String>,
) -> Result<LibreUser, String> {
    let name = name.unwrap_or_else(|| "Testuser".to_string());
    let avatar = avatar.unwrap_or_else(|| name.clone());
    crate::service::user::update_user(pool, name, avatar)
}

#[command]
pub fn seed_body_data(
    pool: State<DbPool>,
    age: Option<i32>,
    height: Option<f32>,
    weight: Option<f32>,
    sex: Option<String>,
    activity_level: Option<f32>,
) -> Result<BodyData, String> {
    crate::service::body::update_body_data(
        pool,
        age.unwrap_or(30),
        height.unwrap_or(175.0),
        weight.unwrap_or(75.0),
        sex.unwrap_or_else(|| "MALE".to_string()),
        activity_level.unwrap_or(1.5),
    )
}

#[command]
pub fn seed_intake_target(
    pool: State<DbPool>,
    start_date: String,
    end_date: String,
    target_calories: Option<i32>,
    maximum_calories: Option<i32>,
) -> Result<IntakeTarget, String> {
    let new_target = NewIntakeTarget {
        added: start_date.clone(),
        start_date,
        end_date,
        target_calories: target_calories.unwrap_or(2000),
        maximum_calories: maximum_calories.unwrap_or(2500),
    };
    crate::service::intake::create_intake_target(pool, new_target)
}

#[command]
pub fn seed_weight_target(
    pool: State<DbPool>,
    start_date: String,
    end_date: String,
    initial_weight: Option<f32>,
    target_weight: Option<f32>,
) -> Result<WeightTarget, String> {
    let new_target = NewWeightTarget {
        added: start_date.clone(),
        start_date,
        end_date,
        initial_weight: initial_weight.unwrap_or(75.0),
        target_weight: target_weight.unwrap_or(70.0),
    };
    crate::service::weight::create_weight_target(pool, new_target)
}

#[command]
pub fn seed_intake_entry(
    pool: State<DbPool>,
    date: String,
    amount: i32,
    category: Option<String>,
    time: Option<String>,
    description: Option<String>,
) -> Result<Intake, String> {
    let new_entry = NewIntake {
        amount,
        category: category.unwrap_or_else(|| "s".to_string()),
        added: date,
        time: Some(time.unwrap_or_else(|| "12:00:00".to_string())),
        description,
    };
    crate::service::intake::create_intake(pool, new_entry)
}

#[command]
pub fn seed_weight_entry(
    pool: State<DbPool>,
    date: String,
    weight: f32,
    time: Option<String>,
) -> Result<WeightTracker, String> {
    let new_entry = NewWeightTracker {
        amount: weight,
        added: date,
        time: Some(time.unwrap_or_else(|| "08:00:00".to_string())),
    };
    crate::service::weight::create_weight_tracker_entry(pool, new_entry)
}
