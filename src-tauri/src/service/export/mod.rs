pub mod csv;
pub mod raw;

use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{command, ipc::Channel, State};

use crate::db::connection::DbPool;

// ============================================================================
// CANCELLATION STATE
// ============================================================================

/// Global cancellation flag for exports
#[derive(Clone)]
pub struct ExportCancellation {
    pub cancelled: Arc<AtomicBool>,
}

impl ExportCancellation {
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

/// Export result
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub bytes: Vec<u8>,
    pub file_path: String,
}

/// Progress tracking
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ExportProgress {
    pub stage: ExportStage,
    pub percent: f32, // 0.0 to 100.0
    pub message: String,
    pub bytes_processed: Option<usize>,
    pub total_bytes: Option<usize>,
}

/// Progress stage
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ExportStage {
    Initializing,
    AnalyzingDatabase,
    CreatingBackup,
    ReadingFile,
    Finalizing,
    Complete,
    Cancelled,
    Error,
}

/// User selected export format
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ExportFormat {
    Raw,
    Csv,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Helper function to send progress updates
pub fn send_progress(
    channel: &Channel<ExportProgress>,
    stage: ExportStage,
    percent: f32,
    message: &str,
    bytes_processed: Option<usize>,
    total_bytes: Option<usize>,
) {
    let _ = channel.send(ExportProgress {
        stage,
        percent,
        message: message.to_string(),
        bytes_processed,
        total_bytes,
    });
}

/// Helper to format bytes
pub fn format_bytes(bytes: usize) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    format!("{:.2} {}", size, UNITS[unit_index])
}

// ============================================================================
// COMMANDS
// ============================================================================

/// Export database file with granular progress tracking
#[command]
pub async fn export_database_file(
    pool: State<'_, DbPool>,
    cancellation: State<'_, ExportCancellation>,
    export_format: ExportFormat,
    on_progress: Channel<ExportProgress>,
) -> Result<ExportResult, String> {
    // Reset cancellation flag at the start
    cancellation.reset();

    let result = match export_format {
        ExportFormat::Raw => {
            raw::export_raw(pool, cancellation.inner().clone(), on_progress.clone()).await
        }
        ExportFormat::Csv => {
            csv::export_csv(pool, cancellation.inner().clone(), on_progress.clone()).await
        }
    };

    // Handle cancellation
    if let Err(ref e) = result {
        if e.contains("cancelled by user") {
            log::debug!(">>> Sending cancellation progress update");
            send_progress(
                &on_progress,
                ExportStage::Cancelled,
                0.0,
                "Export cancelled by user",
                None,
                None,
            );
        }
    }

    // Reset cancellation flag after completion
    cancellation.reset();

    result
}

/// Cancel the current export operation
#[command]
pub fn cancel_export(cancellation: State<'_, ExportCancellation>) {
    log::debug!(">>> Export cancellation requested");
    cancellation.cancel();
}
