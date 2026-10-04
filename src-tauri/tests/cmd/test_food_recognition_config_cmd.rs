//! Export/import coverage for non-secret AI-intake settings (add-food-recognition).
//!
//! The API key lives only in the OS keystore and is never part of a backup, so
//! these tests assert the non-secret settings round-trip while the key never does.

use crate::helpers::setup_test_pool;
use librefit_lib::scenario;
use librefit_lib::service::app_config::AiIntakeConfig;
use librefit_lib::service::export::json::ExportDocument;
use librefit_lib::service::export::{
    export_database_file, ExportCancellation, ExportFormat, ExportProgress,
};
use librefit_lib::service::import::{
    import_data_from_string, ImportCancellation, ImportFormat, ImportProgress,
};
use std::sync::{Arc, Mutex};
use tauri::ipc::{Channel, InvokeResponseBody};
use tauri::Manager;

fn export_channel() -> Channel<ExportProgress> {
    let sink: Arc<Mutex<Vec<ExportProgress>>> = Arc::new(Mutex::new(Vec::new()));
    Channel::new(move |body: InvokeResponseBody| {
        if let InvokeResponseBody::Json(s) = body {
            if let Ok(p) = serde_json::from_str::<ExportProgress>(&s) {
                sink.lock().unwrap().push(p);
            }
        }
        Ok(())
    })
}

fn import_channel() -> Channel<ImportProgress> {
    let sink: Arc<Mutex<Vec<ImportProgress>>> = Arc::new(Mutex::new(Vec::new()));
    Channel::new(move |body: InvokeResponseBody| {
        if let InvokeResponseBody::Json(s) = body {
            if let Ok(p) = serde_json::from_str::<ImportProgress>(&s) {
                sink.lock().unwrap().push(p);
            }
        }
        Ok(())
    })
}

#[test]
fn non_secret_settings_included_in_export() {
    scenario!("[EX-009]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        {
            let mut conn = pool.get().unwrap();
            AiIntakeConfig {
                enabled: true,
                base_url: Some("https://api.mistral.ai/v1".to_string()),
                model: Some("pixtral-12b".to_string()),
                consent_granted: true,
            }
            .save(&mut conn)
            .unwrap();
        }

        let app = tauri::test::mock_app();
        app.manage(pool);
        app.manage(ExportCancellation::new());

        let result = export_database_file(
            app.state(),
            app.state(),
            ExportFormat::Json,
            export_channel(),
        )
        .await
        .unwrap();

        let doc: ExportDocument = serde_json::from_slice(&result.bytes).unwrap();
        let find = |k: &str| {
            doc.app_config
                .iter()
                .find(|e| e.key == k)
                .map(|e| e.value.clone())
        };
        assert_eq!(find("ai_intake.enabled").as_deref(), Some("true"));
        assert_eq!(
            find("ai_intake.base_url").as_deref(),
            Some("https://api.mistral.ai/v1")
        );
        assert_eq!(find("ai_intake.model").as_deref(), Some("pixtral-12b"));
    });
}

#[test]
fn api_key_never_exported() {
    scenario!("[EX-010]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        {
            let mut conn = pool.get().unwrap();
            AiIntakeConfig {
                enabled: true,
                base_url: Some("https://api.mistral.ai/v1".to_string()),
                model: Some("pixtral-12b".to_string()),
                consent_granted: true,
            }
            .save(&mut conn)
            .unwrap();
        }

        let app = tauri::test::mock_app();
        app.manage(pool);
        app.manage(ExportCancellation::new());

        let result = export_database_file(
            app.state(),
            app.state(),
            ExportFormat::Json,
            export_channel(),
        )
        .await
        .unwrap();

        // The key is never stored in app_config, so it can never surface in the
        // serialized backup — assert on the raw bytes to be sure.
        let raw = String::from_utf8(result.bytes).unwrap();
        assert!(!raw.contains("ai_intake.api_key"));
    });
}

#[test]
fn non_secret_settings_restored_from_backup() {
    scenario!("[IM-012]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool);
        app.manage(ImportCancellation::new());

        let doc = r#"{
            "schemaVersion": 2,
            "appConfig": [
                { "key": "ai_intake.enabled", "value": "true" },
                { "key": "ai_intake.base_url", "value": "https://api.mistral.ai/v1" },
                { "key": "ai_intake.model", "value": "pixtral-12b" }
            ]
        }"#;

        import_data_from_string(
            app.state(),
            ImportCancellation::new(),
            doc.to_string(),
            ImportFormat::Json,
            import_channel(),
        )
        .await
        .unwrap();

        let pool_state: tauri::State<librefit_lib::db::connection::DbPool> = app.state();
        let mut conn = pool_state.get().unwrap();
        let config = AiIntakeConfig::load(&mut conn).unwrap();
        assert!(config.enabled);
        assert_eq!(
            config.base_url.as_deref(),
            Some("https://api.mistral.ai/v1")
        );
        assert_eq!(config.model.as_deref(), Some("pixtral-12b"));
    });
}

#[test]
fn imported_config_stays_unconfigured_without_key() {
    scenario!("[IM-013]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool);
        app.manage(ImportCancellation::new());

        // A tampered backup even tries to smuggle in the key — it must be ignored.
        let doc = r#"{
            "schemaVersion": 2,
            "appConfig": [
                { "key": "ai_intake.enabled", "value": "true" },
                { "key": "ai_intake.base_url", "value": "https://api.mistral.ai/v1" },
                { "key": "ai_intake.model", "value": "pixtral-12b" },
                { "key": "ai_intake.api_key", "value": "sk-should-be-dropped" }
            ]
        }"#;

        import_data_from_string(
            app.state(),
            ImportCancellation::new(),
            doc.to_string(),
            ImportFormat::Json,
            import_channel(),
        )
        .await
        .unwrap();

        let pool_state: tauri::State<librefit_lib::db::connection::DbPool> = app.state();
        let mut conn = pool_state.get().unwrap();

        // The smuggled key was not restored into app_config.
        assert!(librefit_lib::service::app_config::AppConfigEntry::get(
            &mut conn,
            "ai_intake.api_key"
        )
        .unwrap()
        .is_none());

        // With no key in the keystore, the feature is not configured.
        let config = AiIntakeConfig::load(&mut conn).unwrap();
        assert!(!librefit_lib::service::food_recognition::is_configured(
            &config, false
        ));
    });
}
