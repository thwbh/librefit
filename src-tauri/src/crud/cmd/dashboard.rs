use crate::crud::cmd::calorie::get_last_calorie_target;
use crate::crud::cmd::weight::get_last_weight_target;
use crate::crud::db::comp::dashboard::Dashboard;
use crate::crud::db::connection::with_db_connection;
use crate::crud::db::repo::calories::{
    find_calorie_tracker_by_date, find_calorie_tracker_by_date_range,
};
use crate::crud::db::repo::food_category::get_food_categories;
use crate::crud::db::repo::user::get_user;
use crate::crud::db::repo::weight::{
    find_weight_tracker_by_date, find_weight_tracker_by_date_range,
};

use chrono::{Days, NaiveDate, ParseResult, TimeDelta};
use std::ops::Sub;
use tauri::command;

#[command]
pub fn daily_dashboard(date_str: String) -> Result<Dashboard, String> {
    log::info!(">>> date_str: {}", date_str);

    let parse_result: ParseResult<NaiveDate> = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d");

    match parse_result {
        Ok(date) => match (get_last_calorie_target(), get_last_weight_target()) {
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

                        let week_start_str = get_date_range_begin(&date, chrono::Duration::days(7));
                        let month_start_str =
                            get_date_range_begin(&date, chrono::Duration::weeks(4));

                        with_db_connection(|conn| {
                            let user = get_user(conn).expect("Failed to get user data.");

                            let calories_today_vec = find_calorie_tracker_by_date(conn, &date_str)
                                .unwrap_or_else(|_| vec![]);
                            let calories_week_vec =
                                find_calorie_tracker_by_date_range(conn, &week_start_str, &date_str)
                                    .unwrap_or_else(|_| vec![]);

                            let weight_today_vec =
                                find_weight_tracker_by_date(conn, &date_str).unwrap_or_else(|_| vec![]);
                            let weight_month_vec =
                                find_weight_tracker_by_date_range(conn, &month_start_str, &date_str)
                                    .unwrap_or_else(|_| vec![]);

                            let food_categories_vec =
                                get_food_categories(conn).unwrap_or_else(|_| vec![]);

                            let current_day: i32 = end_date
                                .signed_duration_since(calorie_target_start_date)
                                .num_days() as i32;

                            Ok(Dashboard {
                                user_data: user,
                                calorie_target,
                                calories_today_list: calories_today_vec,
                                calories_week_list: calories_week_vec,
                                weight_target,
                                weight_today_list: weight_today_vec,
                                weight_month_list: weight_month_vec,
                                food_categories: food_categories_vec,
                                current_day,
                            })
                        })
                        .map_err(|_| "Failed to fetch dashboard data".to_string())
                    }
                    _ => Err("Invalid date format".to_string()),
                }
            }
            _ => Err("No targets found.".to_string()),
        },
        _ => Err("Invalid date format.".to_string()),
    }
}

fn get_date_range_begin(date: &NaiveDate, delta: TimeDelta) -> String {
    date.sub(delta).format("%Y-%m-%d").to_string()
}
