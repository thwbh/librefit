use crate::crud::db::comp::dashboard::Dashboard;
use crate::crud::db::connection::create_db_connection;
use crate::crud::db::repo::calories::{
    find_calorie_tracker_by_date, find_calorie_tracker_by_date_range, find_last_calorie_target,
};
use crate::crud::db::repo::food_category::get_food_categories;
use crate::crud::db::repo::user::get_user;
use crate::crud::db::repo::weight::{
    find_last_weight_target, find_weight_tracker_by_date, find_weight_tracker_by_date_range,
};
use chrono::{NaiveDate, ParseResult, TimeDelta};
use std::ops::Sub;
use tauri::command;

#[command]
pub fn daily_dashboard(date_str: String) -> Result<Dashboard, String> {
    log::info!(">>> date_str: {}", date_str);

    let conn = &mut create_db_connection();

    let parse_result: ParseResult<NaiveDate> = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d");

    match parse_result {
        Ok(date) => {
            let week_start_str = get_date_range_begin(&date, chrono::Duration::days(7));
            let month_start_str = get_date_range_begin(&date, chrono::Duration::weeks(4));

            let user = get_user(conn).expect("Failed to get user data.");

            let calorie_target_opt = find_last_calorie_target(conn).ok();
            let calories_today_vec =
                find_calorie_tracker_by_date(conn, &date_str).unwrap_or_else(|_| vec![]);
            let calories_week_vec =
                find_calorie_tracker_by_date_range(conn, &week_start_str, &date_str)
                    .unwrap_or_else(|_| vec![]);

            let weight_target_opt = find_last_weight_target(conn).ok();
            let weight_today_vec =
                find_weight_tracker_by_date(conn, &date_str).unwrap_or_else(|_| vec![]);
            let weight_month_vec =
                find_weight_tracker_by_date_range(conn, &month_start_str, &date_str)
                    .unwrap_or_else(|_| vec![]);

            let food_categories_vec = get_food_categories(conn).unwrap_or_else(|_| vec![]);

            Ok(Dashboard {
                user_data: user,
                calorie_target: calorie_target_opt,
                calories_today_list: calories_today_vec,
                calories_week_list: calories_week_vec,
                weight_target: weight_target_opt,
                weight_today_list: weight_today_vec,
                weight_month_list: weight_month_vec,
                food_categories: food_categories_vec,
            })
        }
        _ => Err("Invalid date format.".parse().unwrap()),
    }
}

fn get_date_range_begin(date: &NaiveDate, delta: TimeDelta) -> String {
    date.sub(delta).format("%Y-%m-%d").to_string()
}
