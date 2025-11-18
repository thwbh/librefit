#[macro_use]
extern crate rust_i18n;

i18n!("locales", fallback = "en");

// Composite service commands (composition of multiple models)
use crate::service::dashboard::daily_dashboard;
use crate::service::progress::get_tracker_progress;
use crate::service::tracker_history::get_tracker_history;
use crate::service::wizard::{
    wizard_calculate_for_target_date, wizard_calculate_for_target_weight, wizard_calculate_tdee,
    wizard_create_targets,
};

// Individual model commands
use crate::service::body::{get_body_data, update_body_data};
use crate::service::export::export_database_file;
use crate::service::intake::{
    create_intake, create_intake_target, delete_intake, get_food_categories,
    get_intake_dates_in_range, get_intake_for_date_range, get_last_intake_target, update_intake,
};
use crate::service::user::{get_user, update_user};
use crate::service::weight::{
    create_weight_target, create_weight_tracker_entry, delete_weight_tracker_entry,
    get_weight_tracker_for_date_range, update_weight_tracker_entry,
};

use crate::db::{connection, migrations};

use dotenv::dotenv;
use std::env;
use tauri::path::BaseDirectory;
use tauri::{App, Manager};
use tauri_plugin_log::fern::colors::ColoredLevelConfig;

pub mod db;
pub mod i18n;
pub mod service;
pub mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Debug)
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
        .plugin(tauri_plugin_dialog::init())
        .setup(setup_db)
        .invoke_handler(tauri::generate_handler![
            daily_dashboard,
            get_tracker_progress,
            get_tracker_history,
            get_food_categories,
            create_intake,
            update_intake,
            delete_intake,
            get_intake_for_date_range,
            get_intake_dates_in_range,
            create_weight_tracker_entry,
            update_weight_tracker_entry,
            delete_weight_tracker_entry,
            get_weight_tracker_for_date_range,
            create_intake_target,
            create_weight_target,
            get_last_intake_target,
            get_user,
            update_user,
            wizard_calculate_tdee,
            wizard_create_targets,
            wizard_calculate_for_target_date,
            wizard_calculate_for_target_weight,
            get_body_data,
            update_body_data,
            export_database_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_db(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Only load .env in development
    #[cfg(debug_assertions)]
    {
        dotenv().ok();
        log::debug!("Development mode: loaded .env file");
    }

    let db_path = match env::var("DATABASE_URL") {
        Ok(url) => {
            log::debug!("DATABASE_URL found in environment: {}", url);
            url
        }
        Err(_) => {
            let path = app
                .path()
                .resolve("tracker.db", BaseDirectory::AppData)
                .unwrap();

            let path_str = path.to_string_lossy().to_string();

            log::debug!("DATABASE_URL not found, using app data path: {}", path_str);

            path_str
        }
    };

    env::set_var("DATABASE_URL", &db_path);
    log::debug!("DATABASE_URL set to: {}", db_path);

    // Ensure the database directory exists
    if let Ok(url) = env::var("DATABASE_URL") {
        if let Some(parent) = std::path::Path::new(&url).parent() {
            if !parent.exists() {
                log::debug!("Creating database directory: {:?}", parent);
                std::fs::create_dir_all(parent).unwrap_or_else(|e| {
                    log::error!("Failed to create database directory: {}", e);
                });
            }
        }
    }

    // Create connection pool for the application
    let pool = connection::create_pool(&db_path).map_err(|e| {
        log::error!("Failed to create connection pool: {}", e);
        Box::new(std::io::Error::other(format!(
            "Failed to create connection pool: {}",
            e
        )))
    })?;

    log::debug!("Database connection pool created successfully");

    // Run migrations using a connection from the pool
    let mut conn = pool.get().map_err(|e| {
        log::error!("Failed to get connection from pool for migrations: {}", e);
        Box::new(std::io::Error::other(format!(
            "Failed to get connection from pool: {}",
            e
        )))
    })?;

    match migrations::run(&mut conn) {
        Ok(_) => log::debug!("Database migrations completed successfully"),
        Err(e) => {
            log::error!("Database migrations failed: {}", e);
            return Err(Box::new(std::io::Error::other(format!(
                "Migration failed: {}",
                e
            ))));
        }
    }

    // Store the pool in Tauri's managed state
    app.manage(pool);

    Ok(())
}
