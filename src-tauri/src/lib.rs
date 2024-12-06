use crate::crud::cmd::calorie::{
    create_calorie_tracker_entry, delete_calorie_tracker_entry, get_calorie_tracker_dates_in_range,
    get_calorie_tracker_for_date_range, update_calorie_tracker_entry,
};
use crate::crud::cmd::dashboard::daily_dashboard;
use crate::crud::cmd::weight::{
    create_weight_tracker_entry, delete_weight_tracker_entry, get_weight_tracker_for_date_range,
    update_weight_tracker_entry
};

pub mod crud;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
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
            get_weight_tracker_for_date_range
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
