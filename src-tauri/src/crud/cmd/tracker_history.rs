use crate::{
    calc::math_f32::floor_f32,
    crud::db::{
        comp::tracker_history::TrackerHistory,
        connection::create_db_connection,
        model::{CalorieTracker, WeightTracker},
        repo::{
            calories::find_calorie_tracker_by_date_range, weight::find_weight_tracker_by_date_range,
        },
    },
};
use chrono::{Duration, NaiveDate, ParseResult};
use std::collections::BTreeMap;
use tauri::command;

#[command()]
pub fn get_tracker_history(
    date_from_str: String,
    date_to_str: String,
) -> Result<TrackerHistory, String> {
    log::info!(
        ">>> date_from_str: {}, date_to_str: {}",
        date_from_str,
        date_to_str
    );

    let conn = &mut create_db_connection();

    let date_from_parse_result: ParseResult<NaiveDate> =
        NaiveDate::parse_from_str(&date_from_str, "%Y-%m-%d");
    let date_to_parse_result: ParseResult<NaiveDate> =
        NaiveDate::parse_from_str(&date_to_str, "%Y-%m-%d");

    match (date_from_parse_result, date_to_parse_result) {
        (Ok(date_from), Ok(date_to)) => {
            let calories_range =
                find_calorie_tracker_by_date_range(conn, &date_from_str, &date_to_str);

            let weight_range =
                find_weight_tracker_by_date_range(conn, &date_from_str, &date_to_str);

            match (calories_range, weight_range) {
                (Ok(calories_range), Ok(weight_range)) => {
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
                    })
                }
                _ => Err("Error".parse().unwrap()),
            }
        }
        _ => Err("Invalid date format".parse().unwrap()),
    }
}

fn interpolate_calories(db_result: Vec<CalorieTracker>) -> BTreeMap<String, Vec<CalorieTracker>> {
    let mut history_map: BTreeMap<String, Vec<CalorieTracker>> = BTreeMap::new();

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
    calorie_map: &mut BTreeMap<String, Vec<CalorieTracker>>,
    weight_map: &mut BTreeMap<String, Vec<WeightTracker>>,
) {
    let mut current_date = date_from;

    while current_date < date_to {
        let current_date_str = NaiveDate::format(&current_date, "%Y-%m-%d").to_string();

        calorie_map.entry(current_date_str.clone()).or_default();
        weight_map.entry(current_date_str.clone()).or_default();

        current_date += Duration::days(1);
    }
}
