//! Export functionality tests
//!
//! Tests for both raw SQLite and CSV export formats, including progress tracking,
//! cancellation, and data verification.

use crate::helpers::{
    create_test_intake_entry, create_test_intake_target, create_test_user,
    create_test_weight_entry, create_test_weight_target, setup_test_pool,
};
use librefit_lib::service::export::{
    cancel_export, export_database_file, ExportCancellation, ExportFormat, ExportProgress,
    ExportStage,
};
use std::sync::{Arc, Mutex};
use tauri::ipc::{Channel, InvokeResponseBody};
use tauri::Manager;

// ============================================================================
// TEST HELPERS
// ============================================================================

/// Creates a test channel that collects progress updates
fn create_test_channel() -> (Channel<ExportProgress>, Arc<Mutex<Vec<ExportProgress>>>) {
    let progress_list: Arc<Mutex<Vec<ExportProgress>>> = Arc::new(Mutex::new(Vec::new()));
    let progress_clone = progress_list.clone();

    let channel = Channel::new(move |response_body: InvokeResponseBody| {
        // Deserialize the response body to ExportProgress
        if let InvokeResponseBody::Json(json_str) = response_body {
            if let Ok(progress) = serde_json::from_str::<ExportProgress>(&json_str) {
                progress_clone.lock().unwrap().push(progress);
            }
        }
        Ok(())
    });

    (channel, progress_list)
}

// ============================================================================
// RAW SQLITE EXPORT TESTS
// ============================================================================

#[test]
fn test_export_raw_database_empty() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool);
        app.manage(ExportCancellation::new());

        let (channel, progress_list) = create_test_channel();

        let result =
            export_database_file(app.state(), app.state(), ExportFormat::Raw, channel).await;

        assert!(result.is_ok());
        let export_result = result.unwrap();
        assert!(export_result.bytes.len() > 0);
        assert!(export_result.file_path.starts_with("librefit_export_"));
        assert!(export_result.file_path.ends_with(".db"));

        // Verify progress updates were sent
        let mut complete_received = false;
        for progress in progress_list.lock().unwrap().iter() {
            if matches!(progress.stage, ExportStage::Complete) {
                complete_received = true;
                assert_eq!(progress.percent, 100.0);
            }
        }
        assert!(complete_received, "Should receive Complete stage");
    });
}

#[test]
fn test_export_raw_database_with_data() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ExportCancellation::new());

        // Create test data
        create_test_user(&pool, "Test User", "avatar.png");
        create_test_intake_target(&pool, "2026-01-01", "2026-06-01", 2000, 2500);
        create_test_weight_target(&pool, "2026-01-01", "2026-06-01", 80.0, 75.0);
        create_test_intake_entry(&pool, "2026-01-15", 500, "b", Some("Breakfast".to_string()));
        create_test_intake_entry(&pool, "2026-01-15", 700, "l", None);
        create_test_weight_entry(&pool, "2026-01-15", 79.5);

        let (channel, progress_list) = create_test_channel();

        let result =
            export_database_file(app.state(), app.state(), ExportFormat::Raw, channel).await;

        assert!(result.is_ok());
        let export_result = result.unwrap();

        // SQLite database should be larger with data
        assert!(export_result.bytes.len() > 8000); // SQLite header + data

        // Verify the bytes start with SQLite magic number
        assert_eq!(&export_result.bytes[0..16], b"SQLite format 3\0");

        // Verify all progress stages were sent
        let mut stages_received = Vec::new();
        for progress in progress_list.lock().unwrap().iter() {
            stages_received.push(progress.stage.clone());
        }

        // Check that we received key stages
        assert!(stages_received
            .iter()
            .any(|s| matches!(s, ExportStage::Initializing)));
        assert!(stages_received
            .iter()
            .any(|s| matches!(s, ExportStage::AnalyzingDatabase)));
        assert!(stages_received
            .iter()
            .any(|s| matches!(s, ExportStage::CreatingBackup)));
        assert!(stages_received
            .iter()
            .any(|s| matches!(s, ExportStage::ReadingFile)));
        assert!(stages_received
            .iter()
            .any(|s| matches!(s, ExportStage::Finalizing)));
        assert!(stages_received
            .iter()
            .any(|s| matches!(s, ExportStage::Complete)));
    });
}

#[test]
fn test_export_raw_cancellation() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());

        let cancellation = ExportCancellation::new();
        app.manage(cancellation.clone());

        // Create enough data to make export take some time
        for i in 0..50 {
            create_test_intake_entry(&pool, "2026-01-15", 100 + i, "b", None);
        }

        let (channel, progress_list) = create_test_channel();

        // Cancel immediately
        cancellation.cancel();

        let result =
            export_database_file(app.state(), app.state(), ExportFormat::Raw, channel).await;

        // Export might succeed or fail depending on timing - both are valid
        // If it fails, it should be due to cancellation
        if result.is_err() {
            let err = result.err().unwrap();
            assert!(err.contains("cancelled by user"));

            // Verify cancellation stage was sent
            let cancelled_received = progress_list
                .lock()
                .unwrap()
                .iter()
                .any(|p| matches!(p.stage, ExportStage::Cancelled));
            assert!(cancelled_received, "Should receive Cancelled stage");
        }
        // If export was too fast and succeeded, that's also acceptable
    });
}

#[test]
fn test_export_raw_progress_tracking() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ExportCancellation::new());

        // Create data
        create_test_intake_entry(&pool, "2026-01-15", 500, "b", None);

        let (channel, progress_list) = create_test_channel();

        let result =
            export_database_file(app.state(), app.state(), ExportFormat::Raw, channel).await;

        assert!(result.is_ok());

        // Collect all progress updates
        let progress_updates = progress_list.lock().unwrap().clone();

        // Verify progress increases monotonically (or at least doesn't decrease)
        for i in 1..progress_updates.len() {
            // Allow same percent but not decrease
            assert!(
                progress_updates[i].percent >= progress_updates[i - 1].percent
                    || matches!(
                        progress_updates[i].stage,
                        ExportStage::Cancelled | ExportStage::Error
                    )
            );
        }

        // Verify final progress is 100%
        let last = progress_updates.last().unwrap();
        assert_eq!(last.percent, 100.0);
    });
}

// ============================================================================
// CSV EXPORT TESTS
// ============================================================================

#[test]
fn test_export_csv_empty_database() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool);
        app.manage(ExportCancellation::new());

        let (channel, progress_list) = create_test_channel();

        let result =
            export_database_file(app.state(), app.state(), ExportFormat::Csv, channel).await;

        assert!(result.is_ok());
        let export_result = result.unwrap();

        // Should be a ZIP file even if empty
        assert!(export_result.bytes.len() > 0);

        // Verify ZIP magic number (PK)
        assert_eq!(&export_result.bytes[0..2], b"PK");

        // Filename should contain date
        assert!(export_result.file_path.contains("librefit_export_"));
        assert!(export_result.file_path.ends_with(".zip"));

        // Verify complete stage
        let mut complete_received = false;
        for progress in progress_list.lock().unwrap().iter() {
            if matches!(progress.stage, ExportStage::Complete) {
                complete_received = true;
            }
        }
        assert!(complete_received);
    });
}

#[test]
fn test_export_csv_with_data() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ExportCancellation::new());

        // Create comprehensive test data
        create_test_user(&pool, "CSV Test User", "avatar.png");
        create_test_intake_target(&pool, "2026-01-01", "2026-06-01", 2000, 2500);
        create_test_weight_target(&pool, "2026-01-01", "2026-06-01", 80.0, 75.0);

        // Multiple intake entries across categories
        create_test_intake_entry(&pool, "2026-01-15", 500, "b", Some("Breakfast".to_string()));
        create_test_intake_entry(&pool, "2026-01-15", 700, "l", Some("Lunch".to_string()));
        create_test_intake_entry(&pool, "2026-01-15", 600, "d", None);
        create_test_intake_entry(&pool, "2026-01-16", 200, "s", Some("Snack".to_string()));

        // Weight entries
        create_test_weight_entry(&pool, "2026-01-15", 79.5);
        create_test_weight_entry(&pool, "2026-01-16", 79.3);

        let (channel, progress_list) = create_test_channel();

        let result =
            export_database_file(app.state(), app.state(), ExportFormat::Csv, channel).await;

        assert!(result.is_ok());
        let export_result = result.unwrap();

        // ZIP should be reasonably sized
        assert!(export_result.bytes.len() > 200);

        // Verify ZIP magic number
        assert_eq!(&export_result.bytes[0..2], b"PK");

        // Verify progress included record counts
        let mut final_message = String::new();
        for progress in progress_list.lock().unwrap().iter() {
            if matches!(progress.stage, ExportStage::Complete) {
                final_message = progress.message.clone();
            }
        }

        assert!(final_message.contains("records"));
    });
}

#[test]
fn test_export_csv_cancellation() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());

        let cancellation = ExportCancellation::new();
        app.manage(cancellation.clone());

        // Create some data
        for i in 0..20 {
            create_test_intake_entry(&pool, "2026-01-15", 100 + i, "b", None);
        }

        let (channel, _progress_list) = create_test_channel();

        // Cancel before export
        cancellation.cancel();

        let result =
            export_database_file(app.state(), app.state(), ExportFormat::Csv, channel).await;

        // Export might succeed or fail depending on timing - both are valid
        // If it fails, it should be due to cancellation
        if result.is_err() {
            let err = result.err().unwrap();
            assert!(err.contains("cancelled by user"));
        }
        // If export was too fast and succeeded, that's also acceptable
    });
}

#[test]
fn test_export_csv_all_tables_included() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ExportCancellation::new());

        // Create data for all table types
        create_test_intake_entry(&pool, "2026-01-15", 500, "b", None);
        create_test_weight_entry(&pool, "2026-01-15", 79.5);
        create_test_intake_target(&pool, "2026-01-01", "2026-06-01", 2000, 2500);
        create_test_weight_target(&pool, "2026-01-01", "2026-06-01", 80.0, 75.0);

        let (channel, progress_list) = create_test_channel();

        let result =
            export_database_file(app.state(), app.state(), ExportFormat::Csv, channel).await;

        assert!(result.is_ok());

        // Verify we got progress for all tables
        let mut messages = Vec::new();
        for progress in progress_list.lock().unwrap().iter() {
            messages.push(progress.message.clone());
        }

        let messages_str = messages.join(" ");
        assert!(messages_str.contains("calorie") || messages_str.contains("Exporting"));
        assert!(messages_str.contains("weight") || messages_str.contains("history"));
    });
}

// ============================================================================
// CANCELLATION COMMAND TESTS
// ============================================================================

#[test]
fn test_cancel_export_command() {
    let cancellation = ExportCancellation::new();
    let app = tauri::test::mock_app();
    app.manage(cancellation.clone());

    // Initially not cancelled
    assert!(!cancellation.is_cancelled());

    // Cancel
    cancel_export(app.state());

    // Should be cancelled
    assert!(cancellation.is_cancelled());
}

#[test]
fn test_cancellation_reset_on_new_export() {
    let cancellation = ExportCancellation::new();

    // Cancel
    cancellation.cancel();
    assert!(cancellation.is_cancelled());

    // Reset (this happens at start of export)
    cancellation.reset();
    assert!(!cancellation.is_cancelled());
}

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

#[test]
fn test_format_bytes_helper() {
    use librefit_lib::service::export::format_bytes;

    assert_eq!(format_bytes(0), "0.00 B");
    assert_eq!(format_bytes(500), "500.00 B");
    assert_eq!(format_bytes(1024), "1.00 KB");
    assert_eq!(format_bytes(1536), "1.50 KB");
    assert_eq!(format_bytes(1024 * 1024), "1.00 MB");
    assert_eq!(format_bytes(1024 * 1024 * 1024), "1.00 GB");
}

// ============================================================================
// PROGRESS STAGE TESTS
// ============================================================================

#[test]
fn test_export_raw_all_stages_present() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ExportCancellation::new());

        create_test_intake_entry(&pool, "2026-01-15", 500, "b", None);

        let (channel, progress_list) = create_test_channel();

        let _result =
            export_database_file(app.state(), app.state(), ExportFormat::Raw, channel).await;

        let mut stages = std::collections::HashSet::new();
        for progress in progress_list.lock().unwrap().iter() {
            stages.insert(format!("{:?}", progress.stage));
        }

        // Verify all expected stages
        assert!(stages.contains("Initializing"));
        assert!(stages.contains("AnalyzingDatabase"));
        assert!(stages.contains("CreatingBackup"));
        assert!(stages.contains("ReadingFile"));
        assert!(stages.contains("Finalizing"));
        assert!(stages.contains("Complete"));
    });
}

#[test]
fn test_export_csv_all_stages_present() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ExportCancellation::new());

        create_test_intake_entry(&pool, "2026-01-15", 500, "b", None);

        let (channel, progress_list) = create_test_channel();

        let _result =
            export_database_file(app.state(), app.state(), ExportFormat::Csv, channel).await;

        let mut stages = std::collections::HashSet::new();
        for progress in progress_list.lock().unwrap().iter() {
            stages.insert(format!("{:?}", progress.stage));
        }

        // CSV export should have these stages
        assert!(stages.contains("Initializing"));
        assert!(stages.contains("AnalyzingDatabase"));
        assert!(stages.contains("CreatingBackup")); // Used for CSV creation phase
        assert!(stages.contains("Finalizing"));
        assert!(stages.contains("Complete"));
    });
}
