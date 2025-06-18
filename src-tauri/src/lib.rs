#[macro_use]
extern crate rust_i18n;

i18n!("locales", fallback = "en");

use crate::crud::cmd::body::{get_body_data, update_body_data};
use crate::crud::cmd::calorie::{
    create_calorie_target, create_calorie_tracker_entry, delete_calorie_tracker_entry,
    get_calorie_tracker_dates_in_range, get_calorie_tracker_for_date_range,
    update_calorie_tracker_entry,
};
use crate::crud::cmd::dashboard::daily_dashboard;
use crate::crud::cmd::user::{get_user, update_user};
use crate::crud::cmd::weight::{
    create_weight_target, create_weight_tracker_entry, delete_weight_tracker_entry,
    get_weight_tracker_for_date_range, update_weight_tracker_entry,
};
use crate::crud::cmd::wizard::{
    wizard_calculate_for_target_date, wizard_calculate_for_target_weight, wizard_calculate_tdee,
    wizard_create_targets,
};

use crate::crud::db::connection;

use dotenv::dotenv;
use std::env;
use tauri::path::BaseDirectory;
use tauri::Manager;
use tauri_plugin_log::fern::colors::ColoredLevelConfig;

pub mod calc;
pub mod crud;
pub mod i18n;
pub mod init;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .with_colors(ColoredLevelConfig::default())
                        .build(),
                )?;
            }

            dotenv().ok();

            match env::var("DATABASE_URL") {
                Ok(_) => {}
                // hardwire db path. bundling resources does not work on android for some reason.
                Err(_) => env::set_var(
                    "DATABASE_URL",
                    app.path()
                        .resolve("tracker.db", BaseDirectory::AppData)
                        .unwrap()
                        .clone(),
                ),
            }

            let _ = init::db_setup::run_migrations(&mut connection::create_db_connection());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            daily_dashboard,
            create_calorie_tracker_entry,
            update_calorie_tracker_entry,
            delete_calorie_tracker_entry,
            get_calorie_tracker_for_date_range,
            get_calorie_tracker_dates_in_range,
            create_weight_tracker_entry,
            update_weight_tracker_entry,
            delete_weight_tracker_entry,
            get_weight_tracker_for_date_range,
            create_calorie_target,
            create_weight_target,
            get_user,
            update_user,
            wizard_calculate_tdee,
            wizard_create_targets,
            wizard_calculate_for_target_date,
            wizard_calculate_for_target_weight,
            get_body_data,
            update_body_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
