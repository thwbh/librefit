#[macro_use]
extern crate rust_i18n;

i18n!("locales", fallback = "en");

use crate::crud::cmd::body::{get_body_data, update_body_data};
use crate::crud::cmd::calorie::{
    create_calorie_target, create_calorie_tracker_entry, delete_calorie_tracker_entry,
    get_calorie_tracker_dates_in_range, get_calorie_tracker_for_date_range,
    get_last_calorie_target, update_calorie_tracker_entry,
};
use crate::crud::cmd::dashboard::daily_dashboard;
use crate::crud::cmd::food_category::get_food_categories;
use crate::crud::cmd::progress::get_tracker_progress;
use crate::crud::cmd::tracker_history::get_tracker_history;
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
use tauri::{App, Manager};
use tauri_plugin_log::fern::colors::ColoredLevelConfig;

pub mod calc;
pub mod crud;
pub mod i18n;
pub mod init;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .with_colors(ColoredLevelConfig::default())
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("app.log".to_string()),
                    },
                ))
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .build(),
        )
        .plugin(tauri_plugin_haptics::init())
        .setup(setup_db)
        .invoke_handler(tauri::generate_handler![
            daily_dashboard,
            get_tracker_progress,
            get_tracker_history,
            get_food_categories,
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
            get_last_calorie_target,
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

fn setup_db(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Only load .env in development
    #[cfg(debug_assertions)]
    {
        dotenv().ok();
        log::info!("Development mode: loaded .env file");
    }

    let db_path = match env::var("DATABASE_URL") {
        Ok(url) => {
            log::info!("DATABASE_URL found in environment: {}", url);
            url
        }
        Err(_) => {
            let path = app
                .path()
                .resolve("tracker.db", BaseDirectory::AppData)
                .unwrap();

            let path_str = path.to_string_lossy().to_string();

            log::info!("DATABASE_URL not found, using app data path: {}", path_str);

            path_str
        }
    };

    env::set_var("DATABASE_URL", &db_path);
    log::info!("DATABASE_URL set to: {}", db_path);

    // Ensure the database directory exists
    if let Ok(url) = env::var("DATABASE_URL") {
        if let Some(parent) = std::path::Path::new(&url).parent() {
            if !parent.exists() {
                log::info!("Creating database directory: {:?}", parent);
                std::fs::create_dir_all(parent).unwrap_or_else(|e| {
                    log::error!("Failed to create database directory: {}", e);
                });
            }
        }
    }

    match init::db_setup::run_migrations(&mut connection::create_db_connection()) {
        Ok(_) => log::info!("Database migrations completed successfully"),
        Err(e) => log::error!("Database migrations failed: {}", e),
    }

    Ok(())
}
