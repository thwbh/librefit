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
use crate::service::export::{cancel_export, export_database_file, ExportCancellation};
use crate::service::food_recognition::{
    analyze_meal_photo, clear_ai_intake_api_key, get_ai_intake_config, grant_ai_intake_consent,
    set_ai_intake_api_key, test_ai_intake_connection, update_ai_intake_config,
};
use crate::service::import::{cancel_import, import_data_file, ImportCancellation};
use crate::service::intake::{
    create_intake, create_intake_target, delete_intake, get_food_categories,
    get_intake_dates_in_range, get_intake_for_date_range, get_last_intake_target, update_intake,
};
use crate::service::user::{get_user, update_user};
use crate::service::weight::{
    create_weight_target, create_weight_tracker_entry, delete_weight_tracker_entry,
    get_last_weight_target, get_last_weight_tracker, get_weight_tracker_for_date_range,
    update_weight_tracker_entry,
};
use crate::service::workout::{
    add_workout_set, batch_tag_exercises, clone_workout_template, create_exercise,
    create_workout_for_date, create_workout_template, delete_exercise, delete_workout,
    delete_workout_set, delete_workout_template, discard_workout_session, end_workout_session,
    get_active_workout, get_exercise_library, list_exercise_categories, list_muscles,
    list_unverified_exercises, list_workout_templates, list_workouts, log_workout_set,
    pause_workout_session, quick_add_exercise, resume_workout_session, start_workout_from_template,
    start_workout_session, swap_template_exercise, undo_batch_tag, unverified_exercise_summary,
    update_exercise, update_workout_set, update_workout_template,
};

use crate::db::{connection, migrations};

use dotenv::dotenv;
use std::env;
use tauri::path::BaseDirectory;
use tauri::{App, Manager};
use tauri_plugin_log::fern::colors::ColoredLevelConfig;

pub mod db;
pub mod i18n;
pub mod secret;
pub mod service;
pub mod test_support;
pub mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Debug)
                .with_colors(ColoredLevelConfig::default())
                // Stdout so logs (incl. frontend logs via tauri-plugin-log) surface in
                // the terminal in dev and prod; LogDir keeps a rotating file copy.
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("app.log".to_string()),
                    },
                ))
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .build(),
        )
        .plugin(tauri_plugin_haptics::init())
        .plugin(tauri_plugin_dialog::init());

    // Camera plugin is mobile-only — it opens the OS camera for AI meal-photo
    // capture (FR) and returns base64 to the webview, which feeds the existing
    // analyze_meal_photo. The crate only compiles on mobile; desktop falls back
    // to the file picker in IntakeCaptureButton.
    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_camera::init());

    builder
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
            get_last_weight_tracker,
            create_intake_target,
            create_weight_target,
            get_last_intake_target,
            get_last_weight_target,
            get_user,
            update_user,
            wizard_calculate_tdee,
            wizard_create_targets,
            wizard_calculate_for_target_date,
            wizard_calculate_for_target_weight,
            get_body_data,
            update_body_data,
            export_database_file,
            cancel_export,
            import_data_file,
            cancel_import,
            start_workout_session,
            log_workout_set,
            update_workout_set,
            delete_workout_set,
            pause_workout_session,
            resume_workout_session,
            end_workout_session,
            discard_workout_session,
            get_active_workout,
            get_exercise_library,
            list_workouts,
            delete_workout,
            create_workout_for_date,
            add_workout_set,
            create_exercise,
            quick_add_exercise,
            update_exercise,
            delete_exercise,
            list_unverified_exercises,
            unverified_exercise_summary,
            batch_tag_exercises,
            undo_batch_tag,
            list_exercise_categories,
            list_muscles,
            list_workout_templates,
            create_workout_template,
            update_workout_template,
            delete_workout_template,
            clone_workout_template,
            swap_template_exercise,
            start_workout_from_template,
            get_ai_intake_config,
            update_ai_intake_config,
            set_ai_intake_api_key,
            clear_ai_intake_api_key,
            grant_ai_intake_consent,
            analyze_meal_photo,
            test_ai_intake_connection
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

    // Store the pool and cancellation states in Tauri's managed state
    app.manage(pool);
    app.manage(ExportCancellation::new());
    app.manage(ImportCancellation::new());

    // Secret storage for the AI-intake API key: the OS credential store via
    // keyring-core (macOS Keychain, Windows Credential Manager, Linux Secret
    // Service, Android Keystore). The key never touches SQLite or an export. The
    // platform default store is registered lazily on first use (on Android it must
    // wait until MainActivity.onCreate has initialized ndk-context).
    app.manage(crate::secret::ManagedSecretStore(Box::new(
        crate::secret::KeyringSecretStore::new(crate::secret::KEYRING_SERVICE),
    )));

    Ok(())
}

/// Initialize `ndk-context` with the Android application context so the keyring
/// Android Keystore backend can resolve it (add-food-recognition, FR / task 1.3).
///
/// Tauri does not initialize `ndk-context`, so `MainActivity.onCreate` calls this
/// JNI function (`external fun initNdkContext(context)`) once the native library is
/// loaded. Idempotent. (TLS needs no init — the provider call uses bundled webpki
/// roots, see `food_recognition::adapter::tls_config`.)
#[cfg(target_os = "android")]
#[allow(non_snake_case)]
#[no_mangle]
pub extern "system" fn Java_io_tohowabohu_librefit_MainActivity_initNdkContext(
    env: jni::JNIEnv,
    _this: jni::objects::JObject,
    context: jni::objects::JObject,
) {
    use jni::objects::GlobalRef;
    use std::ffi::c_void;
    use std::sync::OnceLock;

    // Keep the context global ref alive for the process; `ndk-context` holds a raw
    // pointer to it.
    static NDK_CTX: OnceLock<GlobalRef> = OnceLock::new();
    if NDK_CTX.get().is_some() {
        return;
    }
    if let (Ok(ctx_ref), Ok(vm)) = (env.new_global_ref(&context), env.get_java_vm()) {
        let vm_ptr = vm.get_java_vm_pointer() as *mut c_void;
        let ctx_ptr = ctx_ref.as_obj().as_raw() as *mut c_void;
        unsafe { ndk_context::initialize_android_context(vm_ptr, ctx_ptr) };
        let _ = NDK_CTX.set(ctx_ref);
        log::debug!("ndk-context initialized for keyring Android Keystore");
    } else {
        log::error!("failed to init ndk-context for keyring");
    }
}
