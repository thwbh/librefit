use chrono::{NaiveDate, Utc};
use tauri::command;

use crate::crud::db::{
    comp::progress::Progress,
    model::{CalorieTracker, WeightTracker},
};

use super::{
    calorie::{get_calorie_tracker_for_date_range, get_last_calorie_target},
    weight::{get_last_weight_target, get_weight_tracker_for_date_range},
};

#[command]
pub fn get_tracker_progress() -> Result<Progress, String> {
    log::info!("get_tracker_progress >>>");

    match (get_last_calorie_target(), get_last_weight_target()) {
        (Ok(calorie_target), Ok(weight_target)) => {
            match (
                NaiveDate::parse_from_str(&calorie_target.start_date, "%Y-%m-%d"),
                NaiveDate::parse_from_str(&calorie_target.end_date, "%Y-%m-%d"),
            ) {
                (Ok(calorie_target_start_date), Ok(calorie_target_end_date)) => {
                    let today_date: NaiveDate = Utc::now().date_naive();
                    let calorie_tracker: Vec<CalorieTracker> = get_calorie_tracker_for_date_range(
                        calorie_target.start_date,
                        calorie_target.end_date,
                    )
                    .unwrap_or_default();

                    let weight_tracker: Vec<WeightTracker> = get_weight_tracker_for_date_range(
                        weight_target.start_date,
                        weight_target.end_date,
                    )
                    .unwrap_or_default();

                    let (average_calories, min_calories, max_calories) =
                        process_calories(&calorie_tracker);
                    let (average_weight, min_weight, max_weight) = process_weight(&weight_tracker);

                    let days_passed: i32 = if today_date < calorie_target_end_date {
                        today_date
                            .signed_duration_since(calorie_target_start_date)
                            .num_days() as i32
                    } else {
                        calorie_target_end_date
                            .signed_duration_since(calorie_target_start_date)
                            .num_days() as i32
                    };

                    Ok(Progress {
                        average_calories,
                        min_calories,
                        max_calories,
                        average_weight,
                        min_weight,
                        max_weight,
                        days_tracked_calories: calorie_tracker.len(),
                        days_tracked_weight: weight_tracker.len(),
                        days_passed,
                        calorie_tracker,
                        weight_tracker,
                        calories_legend: vec![],
                        weight_legend: vec![],
                    })
                }
                _ => Err("Error parsing dates.".to_string()),
            }
        }
        _ => Err("No calorie and weight target found.".to_string()),
    }
}

fn process_calories(calorie_tracker: &[CalorieTracker]) -> (f32, i32, i32) {
    if calorie_tracker.is_empty() {
        (0., 0, 0)
    } else {
        let mut sum = 0;
        let mut min = i32::MAX;
        let mut max = 0;

        for calories in calorie_tracker {
            sum += calories.amount;

            max = i32::max(max, calories.amount);
            min = i32::min(min, calories.amount);
        }

        (sum as f32 / calorie_tracker.len() as f32, min, max)
    }
}

fn process_weight(weight_tracker: &[WeightTracker]) -> (f32, f32, f32) {
    if weight_tracker.is_empty() {
        (0., 0., 0.)
    } else {
        let mut sum = 0.0;
        let mut min = f32::MAX;
        let mut max = 0.0;

        for weight in weight_tracker {
            sum += weight.amount;

            max = f32::max(max, weight.amount);
            min = f32::min(min, weight.amount);
        }

        (sum / weight_tracker.len() as f32, min, max)
    }
}
