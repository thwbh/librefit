use csv::ReaderBuilder;
use diesel::Connection;
use tauri::{ipc::Channel, State};
use validator::Validate;

use crate::db::connection::DbPool;
use crate::db::DbExecutor;
use crate::service::intake::{Intake, IntakeTarget, NewIntake, NewIntakeTarget};
use crate::service::weight::{NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker};

use super::{
    send_progress, ImportCancellation, ImportProgress, ImportResult, ImportStage, ImportTable,
};

/// Import CSV data into the specified table with progress tracking
pub async fn import_csv(
    pool: State<'_, DbPool>,
    cancellation: ImportCancellation,
    csv_data: &str,
    target_table: ImportTable,
    on_progress: Channel<ImportProgress>,
) -> Result<ImportResult, String> {
    log::debug!(">>> Starting CSV import for table: {:?}", target_table);

    // Initializing
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

    // Validate file format
    send_progress(
        &on_progress,
        ImportStage::ValidatingFile,
        5.0,
        "Validating file format...",
        None,
        None,
        0,
        0,
    );

    let result = match target_table {
        ImportTable::Intake => import_intake_csv(pool, cancellation, &csv_data, on_progress).await,
        ImportTable::WeightTracker => {
            import_weight_tracker_csv(pool, cancellation, &csv_data, on_progress).await
        }
        ImportTable::IntakeTarget => {
            import_intake_target_csv(pool, cancellation, &csv_data, on_progress).await
        }
        ImportTable::WeightTarget => {
            import_weight_target_csv(pool, cancellation, &csv_data, on_progress).await
        }
    };

    result
}

// ============================================================================
// INTAKE IMPORT
// ============================================================================

async fn import_intake_csv(
    pool: State<'_, DbPool>,
    cancellation: ImportCancellation,
    csv_data: &str,
    on_progress: Channel<ImportProgress>,
) -> Result<ImportResult, String> {
    send_progress(
        &on_progress,
        ImportStage::ParsingData,
        10.0,
        "Parsing CSV data...",
        None,
        None,
        0,
        0,
    );

    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(csv_data.as_bytes());

    // Collect all records first to know total count
    let records: Vec<_> = reader.deserialize::<NewIntake>().collect();
    let total_rows = records.len();

    send_progress(
        &on_progress,
        ImportStage::ValidatingEntries,
        15.0,
        &format!("Found {} entries to import", total_rows),
        Some(total_rows),
        Some(0),
        0,
        0,
    );

    // Parse and validate all entries first
    let mut validated_entries = Vec::new();
    for (index, result) in records.into_iter().enumerate() {
        // Check for cancellation
        if cancellation.is_cancelled() {
            return Err("Import cancelled by user".to_string());
        }

        let row_num = index + 2; // +2 because: +1 for 1-indexed, +1 for header row
        let percent = 15.0 + (index as f32 / total_rows as f32 * 30.0);

        send_progress(
            &on_progress,
            ImportStage::ValidatingEntries,
            percent,
            &format!("Validating row {}/{}", index + 1, total_rows),
            Some(total_rows),
            Some(index + 1),
            0,
            0,
        );

        match result {
            Ok(new_entry) => {
                // Validate entry
                if let Err(e) = new_entry.validate() {
                    log::warn!("Row {}: Validation failed: {:?}", row_num, e);
                    return Err(format!(
                        "Row {}: Validation failed - {}",
                        row_num,
                        format_validation_error(&e)
                    ));
                }
                validated_entries.push(new_entry);
            }
            Err(e) => {
                log::warn!("Row {}: Parse error: {}", row_num, e);
                return Err(format!("Row {}: Failed to parse CSV - {}", row_num, e));
            }
        }
    }

    // All entries validated successfully, now insert in a transaction
    send_progress(
        &on_progress,
        ImportStage::InsertingData,
        50.0,
        "Starting transaction...",
        Some(total_rows),
        Some(total_rows),
        0,
        0,
    );

    let imported_count = pool
        .execute(|conn| {
            conn.transaction::<_, diesel::result::Error, _>(|conn| {
                let mut count = 0;
                for (index, entry) in validated_entries.iter().enumerate() {
                    // Check for cancellation even during transaction
                    if cancellation.is_cancelled() {
                        return Err(diesel::result::Error::RollbackTransaction);
                    }

                    let percent = 50.0 + (index as f32 / total_rows as f32 * 45.0);
                    send_progress(
                        &on_progress,
                        ImportStage::InsertingData,
                        percent,
                        &format!("Importing row {}/{}", index + 1, total_rows),
                        Some(total_rows),
                        Some(index + 1),
                        0,
                        0,
                    );

                    Intake::create(conn, entry)?;
                    count += 1;
                }
                Ok(count)
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

    send_progress(
        &on_progress,
        ImportStage::Complete,
        100.0,
        &format!("Successfully imported all {} rows", imported_count),
        Some(total_rows),
        Some(total_rows),
        imported_count,
        0,
    );

    Ok(ImportResult {
        imported_count,
        table: ImportTable::Intake,
    })
}

fn format_validation_error(errors: &validator::ValidationErrors) -> String {
    errors
        .field_errors()
        .iter()
        .map(|(field, errs)| {
            let messages: Vec<String> = errs
                .iter()
                .filter_map(|e| e.message.as_ref().map(|m| m.to_string()))
                .collect();
            if messages.is_empty() {
                format!("{} is invalid", field)
            } else {
                messages.join(", ")
            }
        })
        .collect::<Vec<_>>()
        .join("; ")
}

// ============================================================================
// WEIGHT TRACKER IMPORT
// ============================================================================

async fn import_weight_tracker_csv(
    pool: State<'_, DbPool>,
    cancellation: ImportCancellation,
    csv_data: &str,
    on_progress: Channel<ImportProgress>,
) -> Result<ImportResult, String> {
    send_progress(
        &on_progress,
        ImportStage::ParsingData,
        10.0,
        "Parsing CSV data...",
        None,
        None,
        0,
        0,
    );

    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(csv_data.as_bytes());

    // Collect all records first to know total count
    let records: Vec<_> = reader.deserialize::<NewWeightTracker>().collect();
    let total_rows = records.len();

    send_progress(
        &on_progress,
        ImportStage::ValidatingEntries,
        15.0,
        &format!("Found {} entries to import", total_rows),
        Some(total_rows),
        Some(0),
        0,
        0,
    );

    // Parse and validate all entries first
    let mut validated_entries = Vec::new();
    for (index, result) in records.into_iter().enumerate() {
        // Check for cancellation
        if cancellation.is_cancelled() {
            return Err("Import cancelled by user".to_string());
        }

        let row_num = index + 2; // +2 because: +1 for 1-indexed, +1 for header row
        let percent = 15.0 + (index as f32 / total_rows as f32 * 30.0);

        send_progress(
            &on_progress,
            ImportStage::ValidatingEntries,
            percent,
            &format!("Validating row {}/{}", index + 1, total_rows),
            Some(total_rows),
            Some(index + 1),
            0,
            0,
        );

        match result {
            Ok(new_entry) => {
                // Validate entry
                if let Err(e) = new_entry.validate() {
                    log::warn!("Row {}: Validation failed: {:?}", row_num, e);
                    return Err(format!(
                        "Row {}: Validation failed - {}",
                        row_num,
                        format_validation_error(&e)
                    ));
                }
                validated_entries.push(new_entry);
            }
            Err(e) => {
                log::warn!("Row {}: Parse error: {}", row_num, e);
                return Err(format!("Row {}: Failed to parse CSV - {}", row_num, e));
            }
        }
    }

    // All entries validated successfully, now insert in a transaction
    send_progress(
        &on_progress,
        ImportStage::InsertingData,
        50.0,
        "Starting transaction...",
        Some(total_rows),
        Some(total_rows),
        0,
        0,
    );

    let imported_count = pool
        .execute(|conn| {
            conn.transaction::<_, diesel::result::Error, _>(|conn| {
                let mut count = 0;
                for (index, entry) in validated_entries.iter().enumerate() {
                    // Check for cancellation even during transaction
                    if cancellation.is_cancelled() {
                        return Err(diesel::result::Error::RollbackTransaction);
                    }

                    let percent = 50.0 + (index as f32 / total_rows as f32 * 45.0);
                    send_progress(
                        &on_progress,
                        ImportStage::InsertingData,
                        percent,
                        &format!("Importing row {}/{}", index + 1, total_rows),
                        Some(total_rows),
                        Some(index + 1),
                        0,
                        0,
                    );

                    WeightTracker::create(conn, entry)?;
                    count += 1;
                }
                Ok(count)
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

    send_progress(
        &on_progress,
        ImportStage::Complete,
        100.0,
        &format!("Successfully imported all {} rows", imported_count),
        Some(total_rows),
        Some(total_rows),
        imported_count,
        0,
    );

    Ok(ImportResult {
        imported_count,
        table: ImportTable::WeightTracker,
    })
}

// ============================================================================
// INTAKE TARGET IMPORT
// ============================================================================

async fn import_intake_target_csv(
    pool: State<'_, DbPool>,
    cancellation: ImportCancellation,
    csv_data: &str,
    on_progress: Channel<ImportProgress>,
) -> Result<ImportResult, String> {
    send_progress(
        &on_progress,
        ImportStage::ParsingData,
        10.0,
        "Parsing CSV data...",
        None,
        None,
        0,
        0,
    );

    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(csv_data.as_bytes());

    // Collect all records first to know total count
    let records: Vec<_> = reader.deserialize::<NewIntakeTarget>().collect();
    let total_rows = records.len();

    send_progress(
        &on_progress,
        ImportStage::ValidatingEntries,
        15.0,
        &format!("Found {} entries to import", total_rows),
        Some(total_rows),
        Some(0),
        0,
        0,
    );

    // Parse and validate all entries first
    let mut validated_entries = Vec::new();
    for (index, result) in records.into_iter().enumerate() {
        // Check for cancellation
        if cancellation.is_cancelled() {
            return Err("Import cancelled by user".to_string());
        }

        let row_num = index + 2; // +2 because: +1 for 1-indexed, +1 for header row
        let percent = 15.0 + (index as f32 / total_rows as f32 * 30.0);

        send_progress(
            &on_progress,
            ImportStage::ValidatingEntries,
            percent,
            &format!("Validating row {}/{}", index + 1, total_rows),
            Some(total_rows),
            Some(index + 1),
            0,
            0,
        );

        match result {
            Ok(new_entry) => {
                // Validate entry
                if let Err(e) = new_entry.validate() {
                    log::warn!("Row {}: Validation failed: {:?}", row_num, e);
                    return Err(format!(
                        "Row {}: Validation failed - {}",
                        row_num,
                        format_validation_error(&e)
                    ));
                }
                validated_entries.push(new_entry);
            }
            Err(e) => {
                log::warn!("Row {}: Parse error: {}", row_num, e);
                return Err(format!("Row {}: Failed to parse CSV - {}", row_num, e));
            }
        }
    }

    // All entries validated successfully, now insert in a transaction
    send_progress(
        &on_progress,
        ImportStage::InsertingData,
        50.0,
        "Starting transaction...",
        Some(total_rows),
        Some(total_rows),
        0,
        0,
    );

    let imported_count = pool
        .execute(|conn| {
            conn.transaction::<_, diesel::result::Error, _>(|conn| {
                let mut count = 0;
                for (index, entry) in validated_entries.iter().enumerate() {
                    // Check for cancellation even during transaction
                    if cancellation.is_cancelled() {
                        return Err(diesel::result::Error::RollbackTransaction);
                    }

                    let percent = 50.0 + (index as f32 / total_rows as f32 * 45.0);
                    send_progress(
                        &on_progress,
                        ImportStage::InsertingData,
                        percent,
                        &format!("Importing row {}/{}", index + 1, total_rows),
                        Some(total_rows),
                        Some(index + 1),
                        0,
                        0,
                    );

                    IntakeTarget::create(conn, entry)?;
                    count += 1;
                }
                Ok(count)
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

    send_progress(
        &on_progress,
        ImportStage::Complete,
        100.0,
        &format!("Successfully imported all {} rows", imported_count),
        Some(total_rows),
        Some(total_rows),
        imported_count,
        0,
    );

    Ok(ImportResult {
        imported_count,
        table: ImportTable::IntakeTarget,
    })
}

// ============================================================================
// WEIGHT TARGET IMPORT
// ============================================================================

async fn import_weight_target_csv(
    pool: State<'_, DbPool>,
    cancellation: ImportCancellation,
    csv_data: &str,
    on_progress: Channel<ImportProgress>,
) -> Result<ImportResult, String> {
    send_progress(
        &on_progress,
        ImportStage::ParsingData,
        10.0,
        "Parsing CSV data...",
        None,
        None,
        0,
        0,
    );

    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(csv_data.as_bytes());

    // Collect all records first to know total count
    let records: Vec<_> = reader.deserialize::<NewWeightTarget>().collect();
    let total_rows = records.len();

    send_progress(
        &on_progress,
        ImportStage::ValidatingEntries,
        15.0,
        &format!("Found {} entries to import", total_rows),
        Some(total_rows),
        Some(0),
        0,
        0,
    );

    // Parse and validate all entries first
    let mut validated_entries = Vec::new();
    for (index, result) in records.into_iter().enumerate() {
        // Check for cancellation
        if cancellation.is_cancelled() {
            return Err("Import cancelled by user".to_string());
        }

        let row_num = index + 2; // +2 because: +1 for 1-indexed, +1 for header row
        let percent = 15.0 + (index as f32 / total_rows as f32 * 30.0);

        send_progress(
            &on_progress,
            ImportStage::ValidatingEntries,
            percent,
            &format!("Validating row {}/{}", index + 1, total_rows),
            Some(total_rows),
            Some(index + 1),
            0,
            0,
        );

        match result {
            Ok(new_entry) => {
                // Validate entry
                if let Err(e) = new_entry.validate() {
                    log::warn!("Row {}: Validation failed: {:?}", row_num, e);
                    return Err(format!(
                        "Row {}: Validation failed - {}",
                        row_num,
                        format_validation_error(&e)
                    ));
                }
                validated_entries.push(new_entry);
            }
            Err(e) => {
                log::warn!("Row {}: Parse error: {}", row_num, e);
                return Err(format!("Row {}: Failed to parse CSV - {}", row_num, e));
            }
        }
    }

    // All entries validated successfully, now insert in a transaction
    send_progress(
        &on_progress,
        ImportStage::InsertingData,
        50.0,
        "Starting transaction...",
        Some(total_rows),
        Some(total_rows),
        0,
        0,
    );

    let imported_count = pool
        .execute(|conn| {
            conn.transaction::<_, diesel::result::Error, _>(|conn| {
                let mut count = 0;
                for (index, entry) in validated_entries.iter().enumerate() {
                    // Check for cancellation even during transaction
                    if cancellation.is_cancelled() {
                        return Err(diesel::result::Error::RollbackTransaction);
                    }

                    let percent = 50.0 + (index as f32 / total_rows as f32 * 45.0);
                    send_progress(
                        &on_progress,
                        ImportStage::InsertingData,
                        percent,
                        &format!("Importing row {}/{}", index + 1, total_rows),
                        Some(total_rows),
                        Some(index + 1),
                        0,
                        0,
                    );

                    WeightTarget::create(conn, entry)?;
                    count += 1;
                }
                Ok(count)
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

    send_progress(
        &on_progress,
        ImportStage::Complete,
        100.0,
        &format!("Successfully imported all {} rows", imported_count),
        Some(total_rows),
        Some(total_rows),
        imported_count,
        0,
    );

    Ok(ImportResult {
        imported_count,
        table: ImportTable::WeightTarget,
    })
}
