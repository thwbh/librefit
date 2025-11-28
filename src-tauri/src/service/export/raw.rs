use diesel::prelude::QueryableByName;
use std::io::Read;
use tauri::{ipc::Channel, State};

use crate::db::connection::DbPool;

use super::{
    format_bytes, send_progress, ExportCancellation, ExportProgress, ExportResult, ExportStage,
};

// Query result structs for PRAGMA queries
#[derive(QueryableByName)]
struct PageCount {
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    page_count: i64,
}

#[derive(QueryableByName)]
struct PageSize {
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    page_size: i64,
}

/// Export database as raw SQLite file
pub async fn export_raw(
    pool: State<'_, DbPool>,
    cancellation: ExportCancellation,
    on_progress: Channel<ExportProgress>,
) -> Result<ExportResult, String> {
    use diesel::RunQueryDsl;
    use std::fs::{metadata, File};
    use std::io::BufReader;

    log::debug!(">>> Starting raw database export...");

    // Stage 1: Initializing (0-5%)
    send_progress(
        &on_progress,
        ExportStage::Initializing,
        0.0,
        "Starting export...",
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

    log::debug!(">>> Opened connection...");

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
        "Analyzing database size...",
        None,
        None,
    );

    // Check for cancellation
    if cancellation.is_cancelled() {
        log::debug!(">>> Export cancelled by user at analysis stage");
        return Err("Export cancelled by user".to_string());
    }

    // Get database page count and size for progress estimation
    let page_count: i64 = diesel::sql_query("PRAGMA page_count")
        .load::<PageCount>(&mut conn)
        .map_err(|e| format!("Failed to get page count: {}", e))?
        .first()
        .map(|p| p.page_count)
        .unwrap_or(0);

    let page_size: i64 = diesel::sql_query("PRAGMA page_size")
        .load::<PageSize>(&mut conn)
        .map_err(|e| format!("Failed to get page size: {}", e))?
        .first()
        .map(|p| p.page_size)
        .unwrap_or(4096);

    let estimated_db_size = (page_count * page_size) as usize;

    log::debug!(
        ">>> page_count={:?} page_size={:?} estimated_db_size={:?}",
        page_count,
        page_size,
        estimated_db_size
    );

    send_progress(
        &on_progress,
        ExportStage::AnalyzingDatabase,
        10.0,
        &format!(
            "Database size: {} pages (~{})",
            page_count,
            format_bytes(estimated_db_size)
        ),
        None,
        Some(estimated_db_size),
    );

    log::debug!(">>> creating backup file...");

    // Stage 3: Creating backup (10-60%)
    let file_dir = std::env::temp_dir();

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);

    let file_path = file_dir.join(format!("librefit_backup_{}.db", timestamp));
    let file_path_str = file_path
        .to_str()
        .ok_or_else(|| "Invalid temp path".to_string())?;

    log::debug!(">>> backup created path={:?}", file_path);

    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        10.0,
        "Creating backup...",
        None,
        Some(estimated_db_size),
    );

    log::debug!(">>> Starting replication...");

    // Since VACUUM is a single operation, we'll simulate progress based on typical timing
    // Spawn a progress updater thread
    let progress_clone = on_progress.clone();
    let vacuum_progress = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
    let vacuum_progress_clone = vacuum_progress.clone();

    // Progress simulation thread (since VACUUM doesn't provide callbacks)
    let cancellation_clone = cancellation.cancelled.clone();
    let progress_handle = std::thread::spawn(move || {
        let start_percent = 10.0;
        let end_percent = 60.0;
        let duration_estimate_ms = (estimated_db_size / 1024 / 10).max(500); // Rough estimate: 10KB/ms
        let steps = 50;
        let sleep_ms = duration_estimate_ms / steps;

        for i in 0..steps {
            if vacuum_progress_clone.load(std::sync::atomic::Ordering::Relaxed)
                || cancellation_clone.load(std::sync::atomic::Ordering::Relaxed)
            {
                break;
            }

            let percent = start_percent + (end_percent - start_percent) * (i as f32 / steps as f32);
            let pages_processed = (page_count as f32 * (i as f32 / steps as f32)) as i64;

            send_progress(
                &progress_clone,
                ExportStage::CreatingBackup,
                percent,
                &format!(
                    "Compacting database... ({}/{}  pages)",
                    pages_processed, page_count
                ),
                Some((pages_processed * page_size) as usize),
                Some(estimated_db_size),
            );

            std::thread::sleep(std::time::Duration::from_millis(sleep_ms as u64));
        }
    });

    // Execute VACUUM INTO
    diesel::sql_query(format!("VACUUM INTO '{}'", file_path_str))
        .execute(&mut conn)
        .map_err(|e| {
            vacuum_progress.store(true, std::sync::atomic::Ordering::Relaxed);
            let error_msg = format!("Failed to create backup: {}", e);
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

    // Signal vacuum is complete
    vacuum_progress.store(true, std::sync::atomic::Ordering::Relaxed);
    let _ = progress_handle.join();

    // Check if cancelled during VACUUM
    if cancellation.is_cancelled() {
        log::debug!(">>> Export cancelled during VACUUM");
        // Clean up temp file
        let _ = std::fs::remove_file(&file_path);
        return Err("Export cancelled by user".to_string());
    }

    log::debug!(">>> Replication finished.");

    send_progress(
        &on_progress,
        ExportStage::CreatingBackup,
        60.0,
        "Backup created",
        Some(estimated_db_size),
        Some(estimated_db_size),
    );

    log::debug!(">>> Reading backup file...");

    // Stage 4: Reading file with chunked progress (60-95%)
    send_progress(
        &on_progress,
        ExportStage::ReadingFile,
        60.0,
        "Reading backup file...",
        None,
        None,
    );

    let file_metadata =
        metadata(&file_path).map_err(|e| format!("Failed to read backup metadata: {}", e))?;
    let total_bytes = file_metadata.len() as usize;

    let file = File::open(&file_path).map_err(|e| format!("Failed to open backup file: {}", e))?;

    log::debug!(">>> file_metadata={:?}", file_metadata);

    let mut reader = BufReader::new(file);
    let mut bytes = Vec::with_capacity(total_bytes);

    // Read in 64KB chunks for smooth progress
    const CHUNK_SIZE: usize = 64 * 1024;
    let mut buffer = vec![0u8; CHUNK_SIZE];
    let mut bytes_read_total = 0;

    log::debug!(">>> reading in chunk_size={:?}", CHUNK_SIZE);

    loop {
        // Check for cancellation during file read
        if cancellation.is_cancelled() {
            log::debug!(">>> Export cancelled during file read");
            let _ = std::fs::remove_file(&file_path);
            return Err("Export cancelled by user".to_string());
        }

        let n = reader.read(&mut buffer).map_err(|e| {
            log::error!(">>> error reading backup. Error={:?}", e);
            format!("Failed to read backup: {}", e)
        })?;

        if n == 0 {
            break;
        }

        bytes.extend_from_slice(&buffer[..n]);
        bytes_read_total += n;

        let percent = 60.0 + (35.0 * (bytes_read_total as f32 / total_bytes as f32));

        log::debug!(
            ">>> read bytes_read_total={:?} of total_bytes={:?}",
            bytes_read_total,
            total_bytes
        );

        send_progress(
            &on_progress,
            ExportStage::ReadingFile,
            percent,
            &format!(
                "Reading: {}/{}",
                format_bytes(bytes_read_total),
                format_bytes(total_bytes)
            ),
            Some(bytes_read_total),
            Some(total_bytes),
        );
    }

    log::debug!(">>> Finished reading backup.");

    send_progress(
        &on_progress,
        ExportStage::ReadingFile,
        95.0,
        "File read complete",
        Some(total_bytes),
        Some(total_bytes),
    );

    // Stage 5: Finalizing (95-100%)
    send_progress(
        &on_progress,
        ExportStage::Finalizing,
        95.0,
        "Cleaning up...",
        None,
        None,
    );

    log::debug!(">>> Cleaning up...");

    if let Err(e) = std::fs::remove_file(&file_path) {
        log::warn!("Failed to remove temporary backup file: {}", e);
    }

    send_progress(
        &on_progress,
        ExportStage::Finalizing,
        98.0,
        "Cleanup complete",
        None,
        None,
    );

    // Complete
    send_progress(
        &on_progress,
        ExportStage::Complete,
        100.0,
        &format!("Export complete ({})", format_bytes(bytes.len())),
        Some(bytes.len()),
        Some(bytes.len()),
    );

    log::debug!(">>> Finished.");

    // Return a suggested filename (not the temp path)
    let suggested_filename = format!(
        "librefit_export_{}.db",
        chrono::Local::now().format("%Y-%m-%d_%H%M%S")
    );

    Ok(ExportResult {
        bytes,
        file_path: suggested_filename,
    })
}
