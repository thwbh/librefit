pub mod csv;

use crate::db::connection::DbPool;
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{command, ipc::Channel, State};

// ============================================================================
// CANCELLATION STATE
// ============================================================================

/// Global cancellation flag for imports
#[derive(Clone)]
pub struct ImportCancellation {
    pub cancelled: Arc<AtomicBool>,
}

impl ImportCancellation {
    pub fn new() -> Self {
        Self {
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::Relaxed);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::Relaxed)
    }

    pub fn reset(&self) {
        self.cancelled.store(false, Ordering::Relaxed);
    }
}

// ============================================================================
// SHARED TYPES
// ============================================================================

/// Import result
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported_count: usize,
    pub table: ImportTable,
}

/// Progress tracking
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ImportProgress {
    pub stage: ImportStage,
    pub percent: f32, // 0.0 to 100.0
    pub message: String,
    pub total_rows: Option<usize>,
    pub rows_processed: Option<usize>,
    pub successful_imports: usize,
    pub failed_imports: usize,
}

/// Progress stage
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ImportStage {
    Initializing,
    ValidatingFile,
    ParsingData,
    ValidatingEntries,
    InsertingData,
    Complete,
    Cancelled,
    Error,
}

/// Target table for import
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ImportTable {
    Intake,
    WeightTracker,
    IntakeTarget,
    WeightTarget,
}

/// User selected import format
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ImportFormat {
    Csv,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Helper function to send progress updates
pub fn send_progress(
    channel: &Channel<ImportProgress>,
    stage: ImportStage,
    percent: f32,
    message: &str,
    total_rows: Option<usize>,
    rows_processed: Option<usize>,
    successful_imports: usize,
    failed_imports: usize,
) {
    let _ = channel.send(ImportProgress {
        stage,
        percent,
        message: message.to_string(),
        total_rows,
        rows_processed,
        successful_imports,
        failed_imports,
    });
}

// ============================================================================
// COMMANDS
// ============================================================================

/// Import data file with granular progress tracking
#[command]
pub async fn import_data_file(
    pool: State<'_, DbPool>,
    cancellation: State<'_, ImportCancellation>,
    path: String,
    import_format: ImportFormat,
    target_table: ImportTable,
    on_progress: Channel<ImportProgress>,
) -> Result<ImportResult, String> {
    // Reset cancellation flag at the start
    cancellation.reset();

    let data_file: String = fs::read_to_string(path).map_err(|e| e.to_string())?;

    let result = match import_format {
        ImportFormat::Csv => {
            csv::import_csv(
                pool,
                cancellation.inner().clone(),
                &data_file,
                target_table,
                on_progress.clone(),
            )
            .await
        }
    };

    // Handle cancellation
    if let Err(ref e) = result {
        if e.contains("cancelled by user") {
            log::debug!(">>> Sending cancellation progress update");
            send_progress(
                &on_progress,
                ImportStage::Cancelled,
                0.0,
                "Import cancelled by user",
                None,
                None,
                0,
                0,
            );
        }
    }

    // Reset cancellation flag after completion
    cancellation.reset();

    result
}

/// Cancel the current import operation
#[command]
pub fn cancel_import(cancellation: State<'_, ImportCancellation>) {
    log::debug!(">>> Import cancellation requested");
    cancellation.cancel();
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/// Test-only helper to import data directly from a string instead of a file path
/// This is primarily used in integration tests
pub async fn import_data_from_string(
    pool: State<'_, DbPool>,
    cancellation: ImportCancellation,
    csv_data: String,
    import_format: ImportFormat,
    target_table: ImportTable,
    on_progress: Channel<ImportProgress>,
) -> Result<ImportResult, String> {
    // Reset cancellation flag at the start
    cancellation.reset();

    let result = match import_format {
        ImportFormat::Csv => {
            csv::import_csv(
                pool,
                cancellation.clone(),
                &csv_data,
                target_table,
                on_progress.clone(),
            )
            .await
        }
    };

    // Handle cancellation
    if let Err(ref e) = result {
        if e.contains("cancelled by user") {
            log::debug!(">>> Sending cancellation progress update");
            send_progress(
                &on_progress,
                ImportStage::Cancelled,
                0.0,
                "Import cancelled by user",
                None,
                None,
                0,
                0,
            );
        }
    }

    // Reset cancellation flag after completion
    cancellation.reset();

    result
}
