use crate::db::connection::DbPool;
use crate::service::intake::{FoodCategory, Intake, IntakeTarget};
use crate::service::weight::{WeightTarget, WeightTracker};
use crate::util::math_f32;
use chrono::{Days, NaiveDate};
use diesel::SqliteConnection;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use tauri::{command, State};

// ============================================================================
// COMPOSITION MODEL
// ============================================================================

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CalorieChartData {
    pub avg: f32,
    pub min: i32,
    pub max: i32,
    pub legend: Vec<String>,
    pub values: Vec<i32>,
    pub category_average: BTreeMap<String, f32>,
    pub daily_average: f32,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WeightChartData {
    pub avg: f32,
    pub min: f32,
    pub max: f32,
    pub legend: Vec<String>,
    pub values: Vec<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub calorie_target: IntakeTarget,
    pub weight_target: WeightTarget,
    pub days_passed: i32,
    pub days_total: i32,
    pub calorie_chart_data: CalorieChartData,
    pub weight_chart_data: WeightChartData,
}

// ============================================================================
// COMPOSITION LOGIC
// ============================================================================

impl Progress {
    /// Load tracker progress with start and end date of the last valid calorie_target
    pub fn build_for_date(conn: &mut SqliteConnection, date_str: &str) -> Result<Self, String> {
        let calorie_target =
            IntakeTarget::find_last(conn).map_err(|_| "No calorie target found".to_string())?;

        let weight_target =
            WeightTarget::find_last(conn).map_err(|_| "No weight target found".to_string())?;

        let calorie_target_start_date =
            NaiveDate::parse_from_str(&calorie_target.start_date, "%Y-%m-%d")
                .map_err(|_| "Invalid date format".to_string())?;
        let calorie_target_end_date =
            NaiveDate::parse_from_str(&calorie_target.end_date, "%Y-%m-%d")
                .map_err(|_| "Invalid date format".to_string())?;

        let today_date: NaiveDate = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
            .map_err(|_| "Invalid date format".to_string())?;

        let end_date: NaiveDate = if today_date < calorie_target_end_date {
            today_date
                .checked_sub_days(Days::new(1))
                .ok_or("Failed to subtract day".to_string())?
        } else {
            calorie_target_end_date
        };

        let end_date_str = end_date.format("%Y-%m-%d").to_string();

        let calorie_tracker: Vec<Intake> =
            Intake::find_by_date_range(conn, &calorie_target.start_date, &end_date_str)
                .unwrap_or_default();

        let weight_tracker: Vec<WeightTracker> =
            WeightTracker::find_by_date_range(conn, &weight_target.start_date, &end_date_str)
                .unwrap_or_default();

        let calorie_chart_data = process_calories(conn, &calorie_tracker)?;
        let weight_chart_data = process_weight(&weight_tracker);

        let days_passed: i32 = end_date
            .signed_duration_since(calorie_target_start_date)
            .num_days() as i32;

        let days_total: i32 = calorie_target_end_date
            .signed_duration_since(calorie_target_start_date)
            .num_days() as i32;

        Ok(Progress {
            calorie_target,
            weight_target,
            days_passed,
            days_total,
            calorie_chart_data,
            weight_chart_data,
        })
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Process intake tracker to prepare client side graph rendering
fn process_calories(
    conn: &mut SqliteConnection,
    calorie_tracker: &[Intake],
) -> Result<CalorieChartData, String> {
    if calorie_tracker.is_empty() {
        Ok(CalorieChartData {
            avg: 0.,
            min: 0,
            max: 0,
            legend: vec![],
            values: vec![],
            category_average: BTreeMap::new(),
            daily_average: 0.0,
        })
    } else {
        let mut sum = 0;
        let mut min = i32::MAX;
        let mut max = 0;
        let mut progress_map: BTreeMap<String, i32> = BTreeMap::new();
        let mut distribution_map: BTreeMap<String, (f32, u32)> = BTreeMap::new();

        for calories in calorie_tracker {
            sum += calories.amount;

            max = i32::max(max, calories.amount);
            min = i32::min(min, calories.amount);

            *progress_map.entry(calories.added.clone()).or_insert(0) += calories.amount;

            distribution_map
                .entry(calories.category.clone())
                .and_modify(|(sum, count)| {
                    *sum += calories.amount as f32;
                    *count += 1;
                })
                .or_insert((calories.amount as f32, 1));
        }

        let (legend, sums): (Vec<String>, Vec<i32>) = progress_map
            .into_iter()
            .map(|(date, sum)| {
                (
                    NaiveDate::parse_from_str(&date, "%Y-%m-%d")
                        .unwrap()
                        .format("%d.%m")
                        .to_string(),
                    sum,
                )
            })
            .unzip();
        let daily_average: f32 =
            math_f32::floor_f32(sums.iter().sum::<i32>() as f32 / legend.len() as f32, 0);

        let category_average: BTreeMap<String, f32> = distribution_map
            .into_iter()
            .map(|(category, (sum, count))| {
                FoodCategory::find_by_key(conn, category)
                    .map(|cat| (cat.longvalue, math_f32::floor_f32(sum / count as f32, 0)))
                    .map_err(|e| format!("Failed to get food category: {}", e))
            })
            .collect::<Result<BTreeMap<String, f32>, String>>()?;

        Ok(CalorieChartData {
            avg: math_f32::floor_f32(sum as f32 / legend.len() as f32, 0),
            min: *sums.iter().min().unwrap_or(&0),
            max: *sums.iter().max().unwrap_or(&0),
            legend,
            values: sums,
            category_average,
            daily_average,
        })
    }
}

/// Process weight_tracker to prepare client side graph rendering
fn process_weight(weight_tracker: &[WeightTracker]) -> WeightChartData {
    if weight_tracker.is_empty() {
        WeightChartData {
            avg: 0.,
            min: 0.,
            max: 0.,
            legend: vec![],
            values: vec![],
        }
    } else {
        let mut sum = 0.0;
        let mut min = f32::MAX;
        let mut max = 0.0;

        // store date -> (weight_sum, entry_len)
        let mut progress_map: BTreeMap<String, (f32, u32)> = BTreeMap::new();

        for weight in weight_tracker {
            sum += weight.amount;

            max = f32::max(max, weight.amount);
            min = f32::min(min, weight.amount);

            progress_map
                .entry(weight.added.clone())
                .and_modify(|(sum, count)| {
                    *sum += weight.amount;
                    *count += 1;
                })
                .or_insert((weight.amount, 1));
        }

        let (legend, averages): (Vec<String>, Vec<f32>) = progress_map
            .into_iter()
            .map(|(date, (weight_sum, count))| {
                (
                    NaiveDate::parse_from_str(&date, "%Y-%m-%d")
                        .unwrap()
                        .format("%d.%m")
                        .to_string(),
                    math_f32::floor_f32(weight_sum / count as f32, 1),
                )
            })
            .unzip();

        WeightChartData {
            avg: math_f32::floor_f32(sum / weight_tracker.len() as f32, 0),
            min,
            max,
            legend,
            values: averages,
        }
    }
}

// ============================================================================
// COMMANDS (Tauri)
// ============================================================================

#[command]
pub fn get_tracker_progress(pool: State<DbPool>, date_str: String) -> Result<Progress, String> {
    log::info!(">>> get_tracker_progress date_str={:?}", date_str);

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;

    Progress::build_for_date(&mut conn, &date_str)
}
