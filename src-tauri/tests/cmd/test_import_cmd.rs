use crate::helpers::setup_test_pool;
use librefit_lib::service::import::{
    import_data_from_string, ImportFormat, ImportProgress, ImportTable,
};
use librefit_lib::service::intake::Intake;
use librefit_lib::service::weight::WeightTracker;
use std::sync::{Arc, Mutex};
use tauri::ipc::{Channel, InvokeResponseBody};
use tauri::Manager;

// ============================================================================
// TEST HELPERS
// ============================================================================

fn create_test_channel() -> (Channel<ImportProgress>, Arc<Mutex<Vec<ImportProgress>>>) {
    let progress_list: Arc<Mutex<Vec<ImportProgress>>> = Arc::new(Mutex::new(Vec::new()));
    let progress_clone = progress_list.clone();

    let channel = Channel::new(move |response_body: InvokeResponseBody| {
        if let InvokeResponseBody::Json(json_str) = response_body {
            if let Ok(progress) = serde_json::from_str::<ImportProgress>(&json_str) {
                progress_clone.lock().unwrap().push(progress);
            }
        }
        Ok(())
    });

    (channel, progress_list)
}

// ============================================================================
// INTAKE IMPORT TESTS
// ============================================================================

#[test]
fn test_import_intake_csv_success() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(librefit_lib::service::import::ImportCancellation::new());

        let csv_data = "added,amount,category,description\n\
                        2026-01-15,500,b,Breakfast\n\
                        2026-01-16,700,l,Lunch\n\
                        2026-01-17,600,d,Dinner\n";

        let (channel, progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<librefit_lib::service::import::ImportCancellation>()
                .inner()
                .clone(),
            csv_data.to_string(),
            ImportFormat::Csv,
            ImportTable::Intake,
            channel,
        )
        .await;

        assert!(result.is_ok());
        let import_result = result.unwrap();
        assert_eq!(import_result.imported_count, 3);

        // Verify progress updates were sent
        let progress = progress_list.lock().unwrap();
        assert!(progress.len() > 0, "Should have received progress updates");

        // Verify data was actually inserted
        let mut conn = pool.get().unwrap();
        let all_intake = Intake::all(&mut conn).unwrap();
        assert_eq!(all_intake.len(), 3);
    });
}

#[test]
fn test_import_intake_csv_with_validation_errors() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(librefit_lib::service::import::ImportCancellation::new());

        // Invalid: amount exceeds max (10000)
        let csv_data = "added,amount,category,description\n\
                        2026-01-15,500,b,Valid entry\n\
                        2026-01-16,15000,l,Invalid amount\n\
                        2026-01-17,600,d,Valid entry\n";

        let (channel, _progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<librefit_lib::service::import::ImportCancellation>()
                .inner()
                .clone(),
            csv_data.to_string(),
            ImportFormat::Csv,
            ImportTable::Intake,
            channel,
        )
        .await;

        // With the new all-or-nothing approach, validation errors cause the entire import to fail
        assert!(result.is_err());
        let error_msg = result.unwrap_err();
        assert!(error_msg.contains("Row 3")); // Row 3 (index 1 + 2) has the validation error
        assert!(error_msg.contains("Validation failed"));

        // Verify NO data was inserted (rollback due to validation failure)
        let mut conn = pool.get().unwrap();
        let all_intake = Intake::all(&mut conn).unwrap();
        assert_eq!(all_intake.len(), 0);
    });
}

#[test]
fn test_import_intake_csv_with_parse_errors() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(librefit_lib::service::import::ImportCancellation::new());

        // Invalid amount value (not a number)
        let csv_data = "added,amount,category,description\n\
                        2026-01-15,500,b,Valid\n\
                        2026-01-16,invalid,l,Bad amount\n\
                        2026-01-17,600,d,Valid\n";

        let (channel, _progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<librefit_lib::service::import::ImportCancellation>()
                .inner()
                .clone(),
            csv_data.to_string(),
            ImportFormat::Csv,
            ImportTable::Intake,
            channel,
        )
        .await;

        // Parse errors also cause the entire import to fail
        assert!(result.is_err());
        let error_msg = result.unwrap_err();
        assert!(error_msg.contains("Row 3")); // Row 3 has the parse error
        assert!(error_msg.contains("Failed to parse CSV"));

        // Verify NO data was inserted
        let mut conn = pool.get().unwrap();
        let all_intake = Intake::all(&mut conn).unwrap();
        assert_eq!(all_intake.len(), 0);
    });
}

#[test]
fn test_import_intake_csv_empty_file() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(librefit_lib::service::import::ImportCancellation::new());

        let csv_data = "added,amount,category,description\n";

        let (channel, _progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<librefit_lib::service::import::ImportCancellation>()
                .inner()
                .clone(),
            csv_data.to_string(),
            ImportFormat::Csv,
            ImportTable::Intake,
            channel,
        )
        .await;

        assert!(result.is_ok());
        let import_result = result.unwrap();
        assert_eq!(import_result.imported_count, 0);
    });
}

// ============================================================================
// WEIGHT TRACKER IMPORT TESTS
// ============================================================================

#[test]
fn test_import_weight_tracker_csv_success() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(librefit_lib::service::import::ImportCancellation::new());

        let csv_data = "added,amount\n\
                        2026-01-15,75.5\n\
                        2026-01-16,75.2\n\
                        2026-01-17,75.0\n";

        let (channel, _progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<librefit_lib::service::import::ImportCancellation>()
                .inner()
                .clone(),
            csv_data.to_string(),
            ImportFormat::Csv,
            ImportTable::WeightTracker,
            channel,
        )
        .await;

        assert!(result.is_ok());
        let import_result = result.unwrap();
        assert_eq!(import_result.imported_count, 3);

        // Verify data was actually inserted
        let mut conn = pool.get().unwrap();
        let all_weight = WeightTracker::all(&mut conn).unwrap();
        assert_eq!(all_weight.len(), 3);
    });
}

#[test]
fn test_import_weight_tracker_csv_with_validation_errors() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(librefit_lib::service::import::ImportCancellation::new());

        // Invalid: amount below min (30.0)
        let csv_data = "added,amount\n\
                    2026-01-15,75.5\n\
                    2026-01-16,25.0\n\
                    2026-01-17,75.0\n";

        let (channel, _progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<librefit_lib::service::import::ImportCancellation>()
                .inner()
                .clone(),
            csv_data.to_string(),
            ImportFormat::Csv,
            ImportTable::WeightTracker,
            channel,
        )
        .await;

        // With the new all-or-nothing approach, validation errors cause the entire import to fail
        assert!(result.is_err());
        let error_msg = result.unwrap_err();
        assert!(error_msg.contains("Row 3")); // Row 3 has the validation error
        assert!(error_msg.contains("Validation failed"));

        // Verify NO data was inserted
        let mut conn = pool.get().unwrap();
        let all_weight = WeightTracker::all(&mut conn).unwrap();
        assert_eq!(all_weight.len(), 0);
    });
}

// ============================================================================
// CANCELLATION TESTS
// ============================================================================

#[test]
fn test_import_cancellation() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());

        let cancellation = librefit_lib::service::import::ImportCancellation::new();
        app.manage(cancellation.clone());

        // Create a large CSV to give time for cancellation
        let mut csv_data = String::from("added,amount,category,description\n");
        for i in 1..=1000 {
            csv_data.push_str(&format!("2026-01-{:02},500,b,Entry {}\n", (i % 28) + 1, i));
        }

        let (channel, _progress_list) = create_test_channel();

        // Spawn import task in a separate async task
        let pool_clone = pool.clone();
        let cancel_flag = cancellation.clone();
        let import_handle = std::thread::spawn(move || {
            tauri::async_runtime::block_on(async move {
                let app_test = tauri::test::mock_app();
                app_test.manage(pool_clone);
                app_test.manage(cancel_flag.clone());

                import_data_from_string(
                    app_test.state(),
                    cancel_flag.clone(),
                    csv_data,
                    ImportFormat::Csv,
                    ImportTable::Intake,
                    channel,
                )
                .await
            })
        });

        // Give it a moment to start, then cancel
        std::thread::sleep(std::time::Duration::from_millis(10));
        cancellation.cancel();

        let result = import_handle.join().unwrap();

        // Should return error due to cancellation
        assert!(result.is_err());
        let error_msg = result.unwrap_err();
        assert!(
            error_msg.contains("cancelled by user") || error_msg.contains("rolled back"),
            "Expected cancellation error, got: {}",
            error_msg
        );
    });
}
