pub mod csv;
pub mod raw;

use serde::{Deserialize, Serialize};
use tauri::{command, ipc::Channel, State};

use crate::db::connection::DbPool;

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
// MAIN COMMAND
// ============================================================================

/// Export database file with granular progress tracking
#[command]
pub async fn export_database_file(
    pool: State<'_, DbPool>,
    export_format: ExportFormat,
    on_progress: Channel<ExportProgress>,
) -> Result<ExportResult, String> {
    match export_format {
        ExportFormat::Raw => raw::export_raw(pool, on_progress).await,
        ExportFormat::Csv => csv::export_csv(pool, on_progress).await,
    }
}
