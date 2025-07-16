use std::collections::BTreeMap;

use chrono::{Days, NaiveDate, Utc};
use tauri::command;

use crate::{
    calc::math_f32,
    crud::{
        cmd::food_category,
        db::{
            comp::progress::{CalorieChartData, Progress, WeightChartData},
            model::{CalorieTracker, WeightTracker},
        },
    },
};

use super::{
    calorie::{get_calorie_tracker_for_date_range, get_last_calorie_target},
    weight::{get_last_weight_target, get_weight_tracker_for_date_range},
};

/// load initial tracker progress with start and end date of the last valid calorie_target
#[command]
pub fn get_tracker_progress(date_str: String) -> Result<Progress, String> {
    log::info!(">>> get_tracker_progress date_str={:?}", date_str);

    match (get_last_calorie_target(), get_last_weight_target()) {
        (Ok(calorie_target), Ok(weight_target)) => {
            match (
                NaiveDate::parse_from_str(&calorie_target.start_date, "%Y-%m-%d"),
                NaiveDate::parse_from_str(&calorie_target.end_date, "%Y-%m-%d"),
            ) {
                (Ok(calorie_target_start_date), Ok(calorie_target_end_date)) => {
                    let today_date: NaiveDate =
                        NaiveDate::parse_from_str(&date_str, "%Y-%m-%d").unwrap();

                    let end_date: NaiveDate = if today_date < calorie_target_end_date {
                        today_date.checked_sub_days(Days::new(1)).unwrap()
                    } else {
                        calorie_target_end_date
                    };

                    let calorie_tracker: Vec<CalorieTracker> = get_calorie_tracker_for_date_range(
                        calorie_target.start_date.clone(),
                        end_date.format("%Y-%m-%d").to_string(),
                    )
                    .unwrap_or_default();

                    let weight_tracker: Vec<WeightTracker> = get_weight_tracker_for_date_range(
                        weight_target.start_date.clone(),
                        end_date.format("%Y-%m-%d").to_string(),
                    )
                    .unwrap_or_default();

                    let calorie_chart_data: CalorieChartData = process_calories(&calorie_tracker);

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
                _ => Err("Error parsing dates.".to_string()),
            }
        }
        _ => Err("No calorie and weight target found.".to_string()),
    }
}

/// process calorie_tracker to prepare client side graph rendering
fn process_calories(calorie_tracker: &[CalorieTracker]) -> CalorieChartData {
    if calorie_tracker.is_empty() {
        CalorieChartData {
            avg: 0.,
            min: 0,
            max: 0,
            legend: vec![],
            values: vec![],
            category_average: BTreeMap::new(),
            daily_average: 0.0,
        }
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

        let category_average: BTreeMap<String, f32> = distribution_map.into_iter().fold(
            BTreeMap::new(),
            |mut acc, (category, (sum, count))| {
                acc.insert(
                    food_category::get_food_category(category)
                        .unwrap()
                        .longvalue,
                    math_f32::floor_f32(sum / count as f32, 0),
                );

                acc
            },
        );

        CalorieChartData {
            avg: math_f32::floor_f32(sum as f32 / legend.len() as f32, 0),
            min: *sums.iter().min().unwrap_or(&0),
            max: *sums.iter().max().unwrap_or(&0),
            legend,
            values: sums,
            category_average,
            daily_average,
        }
    }
}

/// process weight_tracker to prepare client side graph rendering
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
