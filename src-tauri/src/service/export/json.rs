use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};

use crate::db::connection::DbPool;
use crate::service::intake::{FoodCategory, Intake, IntakeTarget};
use crate::service::weight::{WeightTarget, WeightTracker};

use super::{
    format_bytes, send_progress, ExportCancellation, ExportProgress, ExportResult, ExportStage,
};

/// Current version of the JSON export document schema. Bump when the shape changes.
const SCHEMA_VERSION: u32 = 1;

/// Self-describing backup document: one array per exported table plus a schema version.
/// `foodCategory` is included for reference; it is seed data and is not restored on import.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDocument {
    pub schema_version: u32,
    pub intake: Vec<Intake>,
    pub weight_tracker: Vec<WeightTracker>,
    pub intake_target: Vec<IntakeTarget>,
    pub weight_target: Vec<WeightTarget>,
    pub food_category: Vec<FoodCategory>,
}

/// Export all user data as a single JSON document.
pub async fn export_json(
    pool: State<'_, DbPool>,
    cancellation: ExportCancellation,
    on_progress: Channel<ExportProgress>,
) -> Result<ExportResult, String> {
    log::debug!(">>> Starting JSON export...");

    // Stage 1: Initializing
    send_progress(
        &on_progress,
        ExportStage::Initializing,
        0.0,
        "Starting JSON export...",
        None,
        None,
    );

    let mut conn = pool.get().map_err(|e| {
        let error_msg = format!("Failed to get database connection: {}", e);
        send_progress(
            &on_progress,
            ExportStage::Error,
            0.0,
            &error_msg,
            None,
            None,
        );
        error_msg
    })?;

    send_progress(
        &on_progress,
        ExportStage::Initializing,
        5.0,
        "Connected to database",
        None,
        None,
    );

    // Stage 2: Reading tables
    send_progress(
        &on_progress,
        ExportStage::AnalyzingDatabase,
        10.0,
        "Reading calorie entries...",
        None,
        None,
    );

    if cancellation.is_cancelled() {
        log::debug!(">>> JSON export cancelled by user");
        return Err("Export cancelled by user".to_string());
    }

    let intake = Intake::all(&mut conn).map_err(|e| format!("Failed to load intake: {}", e))?;

    send_progress(
        &on_progress,
        ExportStage::AnalyzingDatabase,
        25.0,
        "Reading weight history...",
        None,
        None,
    );

    let weight_tracker = WeightTracker::all(&mut conn)
        .map_err(|e| format!("Failed to load weight tracker: {}", e))?;

    send_progress(
        &on_progress,
        ExportStage::AnalyzingDatabase,
        40.0,
        "Reading calorie targets...",
        None,
        None,
    );

    let intake_target = IntakeTarget::all(&mut conn)
        .map_err(|e| format!("Failed to load intake targets: {}", e))?;

    send_progress(
        &on_progress,
        ExportStage::AnalyzingDatabase,
        55.0,
        "Reading weight targets...",
        None,
        None,
    );

    let weight_target = WeightTarget::all(&mut conn)
        .map_err(|e| format!("Failed to load weight targets: {}", e))?;

    send_progress(
        &on_progress,
        ExportStage::AnalyzingDatabase,
        70.0,
        "Reading food categories...",
        None,
        None,
    );

    let food_category = FoodCategory::all(&mut conn)
        .map_err(|e| format!("Failed to load food categories: {}", e))?;

    if cancellation.is_cancelled() {
        log::debug!(">>> JSON export cancelled by user");
        return Err("Export cancelled by user".to_string());
    }

    // Stage 3: Serializing
    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        80.0,
        "Serializing document...",
        None,
        None,
    );

    let document = ExportDocument {
        schema_version: SCHEMA_VERSION,
        intake,
        weight_tracker,
        intake_target,
        weight_target,
        food_category,
    };

    let bytes = serde_json::to_vec_pretty(&document)
        .map_err(|e| format!("Failed to serialize JSON: {}", e))?;

    send_progress(
        &on_progress,
        ExportStage::Finalizing,
        95.0,
        "Finalizing export...",
        Some(bytes.len()),
        Some(bytes.len()),
    );

    send_progress(
        &on_progress,
        ExportStage::Complete,
        100.0,
        &format!("Export complete ({})", format_bytes(bytes.len())),
        Some(bytes.len()),
        Some(bytes.len()),
    );

    log::debug!(">>> JSON export finished. Size: {} bytes", bytes.len());

    Ok(ExportResult {
        bytes,
        file_path: format!(
            "librefit_export_{}.json",
            chrono::Local::now().format("%Y-%m-%d_%H%M%S")
        ),
    })
}
