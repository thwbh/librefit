use std::io::Write;
use tauri::{ipc::Channel, State};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::db::connection::DbPool;
use crate::service::intake::{FoodCategory, Intake, IntakeTarget};
use crate::service::weight::{WeightTarget, WeightTracker};

use super::{format_bytes, send_progress, ExportProgress, ExportResult, ExportStage};

/// Export database as CSV files in a ZIP archive
pub async fn export_csv(
    pool: State<'_, DbPool>,
    on_progress: Channel<ExportProgress>,
) -> Result<ExportResult, String> {
    log::debug!(">>> Starting CSV export...");

    // Stage 1: Initializing (0-5%)
    send_progress(
        &on_progress,
        ExportStage::Initializing,
        0.0,
        "Starting CSV export...",
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

    // Stage 2: Analyzing database (5-10%)
    send_progress(
        &on_progress,
        ExportStage::AnalyzingDatabase,
        5.0,
        "Counting records...",
        None,
        None,
    );

    // Count records for progress tracking
    let intake_count = Intake::all(&mut conn).map(|v| v.len()).unwrap_or(0);
    let weight_tracker_count = WeightTracker::all(&mut conn).map(|v| v.len()).unwrap_or(0);
    let intake_target_count = IntakeTarget::all(&mut conn).map(|v| v.len()).unwrap_or(0);
    let weight_target_count = WeightTarget::all(&mut conn).map(|v| v.len()).unwrap_or(0);

    let total_records =
        intake_count + weight_tracker_count + intake_target_count + weight_target_count;

    send_progress(
        &on_progress,
        ExportStage::AnalyzingDatabase,
        10.0,
        &format!("Found {} records to export", total_records),
        None,
        None,
    );

    // Stage 3: Creating CSV files (10-90%)
    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        10.0,
        "Creating CSV files...",
        None,
        None,
    );

    // Create ZIP in memory
    let mut zip_buffer = Vec::new();
    let mut zip = ZipWriter::new(std::io::Cursor::new(&mut zip_buffer));
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    let mut records_processed = 0;
    let total_tables = 5; // intake, weight_tracker, intake_target, weight_target, food_category

    // Export intake entries (calories)
    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        15.0,
        "Exporting calorie entries...",
        Some(records_processed),
        Some(total_records),
    );

    let intakes = Intake::all(&mut conn).map_err(|e| format!("Failed to load intake: {}", e))?;
    let intake_csv = create_intake_csv(&intakes)?;
    zip.start_file("calorie_entries.csv", options)
        .map_err(|e| format!("Failed to create intake CSV: {}", e))?;
    zip.write_all(intake_csv.as_bytes())
        .map_err(|e| format!("Failed to write intake CSV: {}", e))?;
    records_processed += intakes.len();

    // Export weight tracker
    let progress_percent = 15.0 + (75.0 * (1.0 / total_tables as f32));
    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        progress_percent,
        "Exporting weight history...",
        Some(records_processed),
        Some(total_records),
    );

    let weight_entries = WeightTracker::all(&mut conn)
        .map_err(|e| format!("Failed to load weight tracker: {}", e))?;
    let weight_csv = create_weight_tracker_csv(&weight_entries)?;
    zip.start_file("weight_history.csv", options)
        .map_err(|e| format!("Failed to create weight CSV: {}", e))?;
    zip.write_all(weight_csv.as_bytes())
        .map_err(|e| format!("Failed to write weight CSV: {}", e))?;
    records_processed += weight_entries.len();

    // Export intake targets
    let progress_percent = 15.0 + (75.0 * (2.0 / total_tables as f32));
    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        progress_percent,
        "Exporting calorie targets...",
        Some(records_processed),
        Some(total_records),
    );

    let intake_targets = IntakeTarget::all(&mut conn)
        .map_err(|e| format!("Failed to load intake targets: {}", e))?;
    let intake_target_csv = create_intake_target_csv(&intake_targets)?;
    zip.start_file("calorie_targets.csv", options)
        .map_err(|e| format!("Failed to create intake target CSV: {}", e))?;
    zip.write_all(intake_target_csv.as_bytes())
        .map_err(|e| format!("Failed to write intake target CSV: {}", e))?;
    records_processed += intake_targets.len();

    // Export weight targets
    let progress_percent = 15.0 + (75.0 * (3.0 / total_tables as f32));
    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        progress_percent,
        "Exporting weight targets...",
        Some(records_processed),
        Some(total_records),
    );

    let weight_targets = WeightTarget::all(&mut conn)
        .map_err(|e| format!("Failed to load weight targets: {}", e))?;
    let weight_target_csv = create_weight_target_csv(&weight_targets)?;
    zip.start_file("weight_targets.csv", options)
        .map_err(|e| format!("Failed to create weight target CSV: {}", e))?;
    zip.write_all(weight_target_csv.as_bytes())
        .map_err(|e| format!("Failed to write weight target CSV: {}", e))?;
    records_processed += weight_targets.len();

    // Export food categories (for reference)
    let progress_percent = 15.0 + (75.0 * (4.0 / total_tables as f32));
    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        progress_percent,
        "Exporting food categories...",
        Some(records_processed),
        Some(total_records),
    );

    let categories = FoodCategory::all(&mut conn)
        .map_err(|e| format!("Failed to load food categories: {}", e))?;
    let category_csv = create_food_category_csv(&categories)?;
    zip.start_file("food_categories.csv", options)
        .map_err(|e| format!("Failed to create category CSV: {}", e))?;
    zip.write_all(category_csv.as_bytes())
        .map_err(|e| format!("Failed to write category CSV: {}", e))?;

    // Finalize ZIP
    send_progress(
        &on_progress,
        ExportStage::Finalizing,
        90.0,
        "Finalizing archive...",
        Some(records_processed),
        Some(total_records),
    );

    let cursor = zip
        .finish()
        .map_err(|e| format!("Failed to finalize ZIP: {}", e))?;

    // Get the buffer back from the cursor
    let bytes = cursor.into_inner().to_vec();

    send_progress(
        &on_progress,
        ExportStage::Complete,
        100.0,
        &format!(
            "Export complete ({}, {} records)",
            format_bytes(bytes.len()),
            total_records
        ),
        Some(bytes.len()),
        Some(bytes.len()),
    );

    log::debug!(">>> CSV export finished. Size: {} bytes", bytes.len());

    Ok(ExportResult {
        bytes,
        file_path: format!(
            "librefit_export_{}.zip",
            chrono::Local::now().format("%Y-%m-%d")
        ),
    })
}

// ============================================================================
// CSV CREATION HELPERS
// ============================================================================

fn create_intake_csv(intakes: &[Intake]) -> Result<String, String> {
    let mut wtr = csv::Writer::from_writer(vec![]);

    // Write header
    wtr.write_record(["Date", "Amount (kcal)", "Category", "Description"])
        .map_err(|e| format!("Failed to write CSV header: {}", e))?;

    // Write data
    for intake in intakes {
        wtr.write_record([
            &intake.added,
            &intake.amount.to_string(),
            &intake.category,
            intake.description.as_deref().unwrap_or(""),
        ])
        .map_err(|e| format!("Failed to write CSV record: {}", e))?;
    }

    let data = wtr
        .into_inner()
        .map_err(|e| format!("Failed to finalize CSV: {}", e))?;

    String::from_utf8(data).map_err(|e| format!("Invalid UTF-8 in CSV: {}", e))
}

fn create_weight_tracker_csv(entries: &[WeightTracker]) -> Result<String, String> {
    let mut wtr = csv::Writer::from_writer(vec![]);

    wtr.write_record(["Date", "Weight (kg)"])
        .map_err(|e| format!("Failed to write CSV header: {}", e))?;

    for entry in entries {
        wtr.write_record([&entry.added, &format!("{:.1}", entry.amount)])
            .map_err(|e| format!("Failed to write CSV record: {}", e))?;
    }

    let data = wtr
        .into_inner()
        .map_err(|e| format!("Failed to finalize CSV: {}", e))?;

    String::from_utf8(data).map_err(|e| format!("Invalid UTF-8 in CSV: {}", e))
}

fn create_intake_target_csv(targets: &[IntakeTarget]) -> Result<String, String> {
    let mut wtr = csv::Writer::from_writer(vec![]);

    wtr.write_record([
        "Created",
        "Start Date",
        "End Date",
        "Target Calories",
        "Maximum Calories",
    ])
    .map_err(|e| format!("Failed to write CSV header: {}", e))?;

    for target in targets {
        wtr.write_record([
            &target.added,
            &target.start_date,
            &target.end_date,
            &target.target_calories.to_string(),
            &target.maximum_calories.to_string(),
        ])
        .map_err(|e| format!("Failed to write CSV record: {}", e))?;
    }

    let data = wtr
        .into_inner()
        .map_err(|e| format!("Failed to finalize CSV: {}", e))?;

    String::from_utf8(data).map_err(|e| format!("Invalid UTF-8 in CSV: {}", e))
}

fn create_weight_target_csv(targets: &[WeightTarget]) -> Result<String, String> {
    let mut wtr = csv::Writer::from_writer(vec![]);

    wtr.write_record([
        "Created",
        "Start Date",
        "End Date",
        "Initial Weight (kg)",
        "Target Weight (kg)",
    ])
    .map_err(|e| format!("Failed to write CSV header: {}", e))?;

    for target in targets {
        wtr.write_record([
            &target.added,
            &target.start_date,
            &target.end_date,
            &format!("{:.1}", target.initial_weight),
            &format!("{:.1}", target.target_weight),
        ])
        .map_err(|e| format!("Failed to write CSV record: {}", e))?;
    }

    let data = wtr
        .into_inner()
        .map_err(|e| format!("Failed to finalize CSV: {}", e))?;

    String::from_utf8(data).map_err(|e| format!("Invalid UTF-8 in CSV: {}", e))
}

fn create_food_category_csv(categories: &[FoodCategory]) -> Result<String, String> {
    let mut wtr = csv::Writer::from_writer(vec![]);

    wtr.write_record(["Code", "Name"])
        .map_err(|e| format!("Failed to write CSV header: {}", e))?;

    for category in categories {
        wtr.write_record([&category.shortvalue, &category.longvalue])
            .map_err(|e| format!("Failed to write CSV record: {}", e))?;
    }

    let data = wtr
        .into_inner()
        .map_err(|e| format!("Failed to finalize CSV: {}", e))?;

    String::from_utf8(data).map_err(|e| format!("Invalid UTF-8 in CSV: {}", e))
}
