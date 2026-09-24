use diesel::Connection;
use serde::Deserialize;
use tauri::{ipc::Channel, State};
use validator::Validate;

use crate::db::connection::DbPool;
use crate::db::DbExecutor;
use crate::service::intake::{Intake, IntakeTarget, NewIntake, NewIntakeTarget};
use crate::service::weight::{NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker};

use super::{send_progress, ImportCancellation, ImportProgress, ImportResult, ImportStage};

/// Whole-document backup produced by the JSON export. Unknown fields (e.g. `schemaVersion`,
/// `foodCategory`, or record `id`s) are ignored: `foodCategory` is seed data that is not
/// restored, and `id`s are re-assigned on insert. Missing arrays default to empty so a
/// partial document still imports what it does contain.
#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct ImportDocument {
    intake: Vec<NewIntake>,
    weight_tracker: Vec<NewWeightTracker>,
    intake_target: Vec<NewIntakeTarget>,
    weight_target: Vec<NewWeightTarget>,
}

/// Import a JSON backup document, restoring every supported table in a single transaction.
///
/// Entries are appended (no rows are deleted and no deduplication is performed). Entries that
/// fail validation are skipped and counted rather than aborting the import.
pub async fn import_json(
    pool: State<'_, DbPool>,
    cancellation: ImportCancellation,
    json_data: &str,
    on_progress: Channel<ImportProgress>,
) -> Result<ImportResult, String> {
    log::debug!(">>> Starting JSON import...");

    send_progress(
        &on_progress,
        ImportStage::Initializing,
        0.0,
        "Initializing import...",
        None,
        None,
        0,
        0,
    );

    // Parse the document
    send_progress(
        &on_progress,
        ImportStage::ValidatingFile,
        5.0,
        "Reading backup document...",
        None,
        None,
        0,
        0,
    );

    let document: ImportDocument = serde_json::from_str(json_data)
        .map_err(|e| format!("Failed to parse JSON backup: {}", e))?;

    let total_rows = document.intake.len()
        + document.weight_tracker.len()
        + document.intake_target.len()
        + document.weight_target.len();

    send_progress(
        &on_progress,
        ImportStage::ParsingData,
        10.0,
        &format!("Found {} entries to import", total_rows),
        Some(total_rows),
        Some(0),
        0,
        0,
    );

    // Insert everything within one transaction so a database error rolls the whole import back.
    let result = pool
        .execute(|conn| {
            conn.transaction::<_, diesel::result::Error, _>(|conn| {
                let mut result = ImportResult::default();
                let mut processed = 0usize;

                macro_rules! import_table {
                    ($entries:expr, $count:expr, $create:expr) => {
                        for entry in &$entries {
                            if cancellation.is_cancelled() {
                                return Err(diesel::result::Error::RollbackTransaction);
                            }

                            processed += 1;
                            let percent =
                                10.0 + (processed as f32 / total_rows.max(1) as f32 * 85.0);
                            let imported_so_far = result.intake
                                + result.weight_tracker
                                + result.intake_target
                                + result.weight_target;
                            send_progress(
                                &on_progress,
                                ImportStage::InsertingData,
                                percent,
                                &format!("Importing entry {}/{}", processed, total_rows),
                                Some(total_rows),
                                Some(processed),
                                imported_so_far,
                                result.failed,
                            );

                            if entry.validate().is_err() {
                                result.failed += 1;
                                continue;
                            }

                            $create(conn, entry)?;
                            $count += 1;
                        }
                    };
                }

                import_table!(document.intake, result.intake, Intake::create);
                import_table!(
                    document.weight_tracker,
                    result.weight_tracker,
                    WeightTracker::create
                );
                import_table!(
                    document.intake_target,
                    result.intake_target,
                    IntakeTarget::create
                );
                import_table!(
                    document.weight_target,
                    result.weight_target,
                    WeightTarget::create
                );

                Ok(result)
            })
        })
        .map_err(|e| {
            if cancellation.is_cancelled() {
                "Import cancelled by user - all changes rolled back".to_string()
            } else {
                format!(
                    "Database error during import: {} - all changes rolled back",
                    e
                )
            }
        })?;

    let imported =
        result.intake + result.weight_tracker + result.intake_target + result.weight_target;

    send_progress(
        &on_progress,
        ImportStage::Complete,
        100.0,
        &format!("Imported {} entries ({} skipped)", imported, result.failed),
        Some(total_rows),
        Some(total_rows),
        imported,
        result.failed,
    );

    log::debug!(
        ">>> JSON import finished. Imported: {}, skipped: {}",
        imported,
        result.failed
    );

    Ok(result)
}
