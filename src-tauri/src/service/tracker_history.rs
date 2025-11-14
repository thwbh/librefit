use crate::db::connection::DbPool;
use crate::service::intake::Intake;
use crate::service::weight::WeightTracker;
use crate::util::math_f32::floor_f32;
use chrono::{Duration, NaiveDate};
use diesel::SqliteConnection;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use tauri::{command, State};

// ============================================================================
// COMPOSITION MODEL
// ============================================================================

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TrackerHistory {
    pub calories_history: BTreeMap<String, Vec<Intake>>,
    pub calories_average: f32,
    pub weight_history: BTreeMap<String, Vec<WeightTracker>>,
    pub date_last_str: String,
}

// ============================================================================
// COMPOSITION LOGIC
// ============================================================================

impl TrackerHistory {
    /// Build tracker history for a date range
    pub fn build_for_date_range(
        conn: &mut SqliteConnection,
        date_from_str: &str,
        date_to_str: &str,
    ) -> Result<Self, String> {
        let date_from = NaiveDate::parse_from_str(date_from_str, "%Y-%m-%d")
            .map_err(|_| "Invalid date_from format".to_string())?;
        let date_to = NaiveDate::parse_from_str(date_to_str, "%Y-%m-%d")
            .map_err(|_| "Invalid date_to format".to_string())?;

        let calories_range =
            Intake::find_by_date_range(conn, &date_from_str.to_string(), &date_to_str.to_string())
                .map_err(|e| format!("Failed to get calorie tracker data: {}", e))?;

        let weight_range = WeightTracker::find_by_date_range(
            conn,
            &date_from_str.to_string(),
            &date_to_str.to_string(),
        )
        .map_err(|e| format!("Failed to get weight tracker data: {}", e))?;

        let mut calories_history = interpolate_calories(calories_range);
        let mut weight_history = interpolate_weight(weight_range);

        interpolate_history(
            date_from,
            date_to,
            &mut calories_history,
            &mut weight_history,
        );

        let calories_average: f32 = match calories_history
            .values()
            .flatten()
            .map(|c| c.amount)
            .reduce(|acc, a| acc + a)
        {
            Some(sum) => floor_f32(sum as f32 / calories_history.len() as f32, 1),
            None => 0.0,
        };

        Ok(TrackerHistory {
            calories_history,
            calories_average,
            weight_history,
            date_last_str: date_to_str.to_string(),
        })
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn interpolate_calories(db_result: Vec<Intake>) -> BTreeMap<String, Vec<Intake>> {
    let mut history_map: BTreeMap<String, Vec<Intake>> = BTreeMap::new();

    for calorie_tracker in db_result {
        let added_date = &calorie_tracker.added;

        history_map
            .entry(added_date.to_string())
            .or_default()
            .push(calorie_tracker);
    }

    history_map
}

fn interpolate_weight(db_result: Vec<WeightTracker>) -> BTreeMap<String, Vec<WeightTracker>> {
    let mut history_map: BTreeMap<String, Vec<WeightTracker>> = BTreeMap::new();

    for weight_tracker in db_result {
        let added_date = &weight_tracker.added;

        history_map
            .entry(added_date.to_string())
            .or_default()
            .push(weight_tracker);
    }

    history_map
}

fn interpolate_history(
    date_from: NaiveDate,
    date_to: NaiveDate,
    calorie_map: &mut BTreeMap<String, Vec<Intake>>,
    weight_map: &mut BTreeMap<String, Vec<WeightTracker>>,
) {
    let mut current_date = date_from;

    while current_date <= date_to {
        let current_date_str = NaiveDate::format(&current_date, "%Y-%m-%d").to_string();

        calorie_map.entry(current_date_str.clone()).or_default();
        weight_map.entry(current_date_str.clone()).or_default();

        current_date += Duration::days(1);
    }
}

// ============================================================================
// COMMANDS (Tauri)
// ============================================================================

#[command]
pub fn get_tracker_history(
    pool: State<DbPool>,
    date_from_str: String,
    date_to_str: String,
) -> Result<TrackerHistory, String> {
    log::info!(
        ">>> date_from_str: {}, date_to_str: {}",
        date_from_str,
        date_to_str
    );

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;

    TrackerHistory::build_for_date_range(&mut conn, &date_from_str, &date_to_str)
}
