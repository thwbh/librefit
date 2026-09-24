use crate::helpers::{create_future_test_dates, setup_test_pool};
use librefit_lib::scenario;
use librefit_lib::service::import::{
    import_data_from_string, ImportCancellation, ImportFormat, ImportProgress,
};
use librefit_lib::service::intake::{FoodCategory, Intake, IntakeTarget};
use librefit_lib::service::weight::{WeightTarget, WeightTracker};
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

/// A backup document exercising every supported table. Targets use future dates so they pass
/// the "end date in the future" validation. The intake entry carries extra `id`/`time` fields
/// to prove they are ignored on import.
fn sample_document() -> String {
    let (start, end) = create_future_test_dates();
    format!(
        r#"{{
            "schemaVersion": 1,
            "intake": [
                {{ "id": 99, "added": "2026-01-15", "amount": 500, "category": "b", "description": "Breakfast", "time": "08:00:00" }},
                {{ "added": "2026-01-16", "amount": 700, "category": "l", "description": null }},
                {{ "added": "2026-01-17", "amount": 600, "category": "d", "description": null }}
            ],
            "weightTracker": [
                {{ "added": "2026-01-15", "amount": 75.5 }},
                {{ "added": "2026-01-16", "amount": 75.2 }}
            ],
            "intakeTarget": [
                {{ "added": "{start}", "startDate": "{start}", "endDate": "{end}", "targetCalories": 2000, "maximumCalories": 2500 }}
            ],
            "weightTarget": [
                {{ "added": "{start}", "startDate": "{start}", "endDate": "{end}", "initialWeight": 80.0, "targetWeight": 75.0 }}
            ],
            "foodCategory": [
                {{ "shortvalue": "zzz", "longvalue": "Bogus category" }}
            ]
        }}"#
    )
}

// ============================================================================
// WHOLE-DOCUMENT IMPORT TESTS
// ============================================================================

#[test]
fn import_json_restores_all_tables() {
    scenario!("[IM-006]", "[STG-001]", "[STG-002]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ImportCancellation::new());

        let (channel, progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<ImportCancellation>().inner().clone(),
            sample_document(),
            ImportFormat::Json,
            channel,
        )
        .await;

        assert!(result.is_ok());
        let import_result = result.unwrap();
        assert_eq!(import_result.intake, 3);
        assert_eq!(import_result.weight_tracker, 2);
        assert_eq!(import_result.intake_target, 1);
        assert_eq!(import_result.weight_target, 1);
        assert_eq!(import_result.failed, 0);

        // Progress updates were sent
        assert!(
            progress_list.lock().unwrap().len() > 0,
            "Should have received progress updates"
        );

        // Data was actually inserted across every table
        let mut conn = pool.get().unwrap();
        assert_eq!(Intake::all(&mut conn).unwrap().len(), 3);
        assert_eq!(WeightTracker::all(&mut conn).unwrap().len(), 2);
        assert_eq!(IntakeTarget::all(&mut conn).unwrap().len(), 1);
        assert_eq!(WeightTarget::all(&mut conn).unwrap().len(), 1);
    });
}

#[test]
fn import_json_partial_with_invalid_entries() {
    scenario!("[IM-007]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ImportCancellation::new());

        // Middle intake entry is invalid (amount exceeds max of 10000)
        let json_data = r#"{
            "schemaVersion": 1,
            "intake": [
                { "added": "2026-01-15", "amount": 500, "category": "b", "description": "Valid" },
                { "added": "2026-01-16", "amount": 15000, "category": "l", "description": "Invalid" },
                { "added": "2026-01-17", "amount": 600, "category": "d", "description": "Valid" }
            ]
        }"#;

        let (channel, _progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<ImportCancellation>().inner().clone(),
            json_data.to_string(),
            ImportFormat::Json,
            channel,
        )
        .await;

        // Invalid entries are skipped and counted, not aborted
        assert!(result.is_ok());
        let import_result = result.unwrap();
        assert_eq!(import_result.intake, 2);
        assert_eq!(import_result.failed, 1);

        // Only the two valid rows landed
        let mut conn = pool.get().unwrap();
        assert_eq!(Intake::all(&mut conn).unwrap().len(), 2);
    });
}

#[test]
fn import_json_empty_document() {
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ImportCancellation::new());

        let json_data = r#"{ "schemaVersion": 1, "intake": [] }"#;

        let (channel, _progress_list) = create_test_channel();

        let result = import_data_from_string(
            app.state(),
            app.state::<ImportCancellation>().inner().clone(),
            json_data.to_string(),
            ImportFormat::Json,
            channel,
        )
        .await;

        assert!(result.is_ok());
        let import_result = result.unwrap();
        assert_eq!(import_result.intake, 0);
        assert_eq!(import_result.failed, 0);
    });
}

#[test]
fn import_json_does_not_restore_food_categories() {
    scenario!("[IM-010]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ImportCancellation::new());

        let before = {
            let mut conn = pool.get().unwrap();
            FoodCategory::all(&mut conn).unwrap().len()
        };

        let (channel, _progress_list) = create_test_channel();

        // sample_document() carries a bogus `zzz` food category that must not be written back
        let result = import_data_from_string(
            app.state(),
            app.state::<ImportCancellation>().inner().clone(),
            sample_document(),
            ImportFormat::Json,
            channel,
        )
        .await;

        assert!(result.is_ok());

        let mut conn = pool.get().unwrap();
        let categories = FoodCategory::all(&mut conn).unwrap();
        assert_eq!(
            categories.len(),
            before,
            "food categories should be unchanged (seed data, not restored)"
        );
        assert!(
            !categories.iter().any(|c| c.shortvalue == "zzz"),
            "bogus category from the backup must not be imported"
        );
    });
}

#[test]
fn import_json_appends_without_dedup() {
    scenario!("[IM-011]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());
        app.manage(ImportCancellation::new());

        for _ in 0..2 {
            let (channel, _progress_list) = create_test_channel();
            let result = import_data_from_string(
                app.state(),
                app.state::<ImportCancellation>().inner().clone(),
                sample_document(),
                ImportFormat::Json,
                channel,
            )
            .await;
            assert!(result.is_ok());
        }

        // Re-importing the same backup duplicates its entries (no deduplication)
        let mut conn = pool.get().unwrap();
        assert_eq!(Intake::all(&mut conn).unwrap().len(), 6);
        assert_eq!(WeightTracker::all(&mut conn).unwrap().len(), 4);
    });
}

// ============================================================================
// CANCELLATION TESTS
// ============================================================================

#[test]
fn import_cancellation() {
    scenario!("[IM-008]", "[STG-003]");
    tauri::async_runtime::block_on(async {
        let pool = setup_test_pool();
        let app = tauri::test::mock_app();
        app.manage(pool.clone());

        let cancellation = ImportCancellation::new();
        app.manage(cancellation.clone());

        // Build a large document to give time for cancellation
        let mut entries = String::new();
        for i in 1..=1000 {
            if i > 1 {
                entries.push(',');
            }
            entries.push_str(&format!(
                r#"{{ "added": "2026-01-{:02}", "amount": 500, "category": "b", "description": "Entry {}" }}"#,
                (i % 28) + 1,
                i
            ));
        }
        let json_data = format!(r#"{{ "schemaVersion": 1, "intake": [{}] }}"#, entries);

        let (channel, _progress_list) = create_test_channel();

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
                    json_data,
                    ImportFormat::Json,
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
