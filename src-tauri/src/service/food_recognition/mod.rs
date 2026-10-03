//! Food recognition (add-food-recognition, FR).
//!
//! Opt-in, BYOK AI assistance that turns a meal photo into a single confirmable
//! intake candidate. All provider network calls originate here in the backend;
//! the webview only ever transports image bytes (FR-008). The API key lives only
//! in the `SecretStore` (FR-007), never in SQLite or an export.

pub mod adapter;
pub mod analysis;
pub mod image;
pub mod mapping;

use std::time::Instant;

use crate::db::{connection::DbPool, DbExecutor};
use crate::secret::{ManagedSecretStore, AI_INTAKE_API_KEY};
use crate::service::app_config::AiIntakeConfig;

use adapter::{analyze, AnalysisRequest, MistralAdapter, ProviderAdapter};
use analysis::AnalysisError;
use mapping::{to_candidate, IntakeCandidate};

use serde::Serialize;
use tauri::{command, State};

/// Serializable error carrying a stable `code` so the frontend can pick the
/// right localized message (FR-028/029/030). Never carries image or response
/// content (FR-010).
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FrError {
    pub code: String,
    pub message: String,
}

impl FrError {
    fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
        }
    }
}

impl From<AnalysisError> for FrError {
    fn from(e: AnalysisError) -> Self {
        FrError::new(e.code(), e.to_string())
    }
}

/// Non-secret config plus the derived `configured` flag. The API key is never
/// part of this payload.
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AiIntakeStatus {
    pub config: AiIntakeConfig,
    /// True only when base URL, model, and a stored API key are all present
    /// (FR-003).
    pub configured: bool,
}

impl AiIntakeStatus {
    fn build(config: AiIntakeConfig, has_key: bool) -> Self {
        let configured = is_configured(&config, has_key);
        Self { config, configured }
    }
}

/// The feature is configured only when base URL, model, and a stored API key are
/// all present (FR-003).
pub fn is_configured(config: &AiIntakeConfig, has_key: bool) -> bool {
    has_key
        && config.base_url.as_deref().is_some_and(|s| !s.is_empty())
        && config.model.as_deref().is_some_and(|s| !s.is_empty())
}

// ============================================================================
// COMMANDS (Tauri)
// ============================================================================

/// Read the non-secret AI-intake config and whether the feature is fully
/// configured. Never returns the key.
#[command]
pub fn get_ai_intake_config(
    pool: State<DbPool>,
    secret: State<ManagedSecretStore>,
) -> Result<AiIntakeStatus, String> {
    let config = pool.execute(AiIntakeConfig::load)?;
    let has_key = secret
        .store()
        .get(AI_INTAKE_API_KEY)
        .map_err(|e| e.to_string())?
        .is_some();
    Ok(AiIntakeStatus::build(config, has_key))
}

/// Persist the non-secret AI-intake config (enabled flag, base URL, model).
/// Never touches the API key.
#[command]
pub fn update_ai_intake_config(
    pool: State<DbPool>,
    secret: State<ManagedSecretStore>,
    enabled: bool,
    base_url: Option<String>,
    model: Option<String>,
) -> Result<AiIntakeStatus, String> {
    let config = AiIntakeConfig {
        enabled,
        base_url: base_url.filter(|s| !s.is_empty()),
        model: model.filter(|s| !s.is_empty()),
        // Preserve prior consent; it is only ever set via grant_ai_intake_consent.
        consent_granted: pool.execute(AiIntakeConfig::load)?.consent_granted,
    };
    pool.execute(|conn| config.save(conn))?;

    let has_key = secret
        .store()
        .get(AI_INTAKE_API_KEY)
        .map_err(|e| e.to_string())?
        .is_some();
    Ok(AiIntakeStatus::build(config, has_key))
}

/// Store the API key in the OS keystore. The key never touches SQLite.
#[command]
pub fn set_ai_intake_api_key(
    secret: State<ManagedSecretStore>,
    api_key: String,
) -> Result<(), String> {
    if api_key.trim().is_empty() {
        return Err("API key must not be empty".to_string());
    }
    secret
        .store()
        .set(AI_INTAKE_API_KEY, &api_key)
        .map_err(|e| e.to_string())
}

/// Remove the stored API key.
#[command]
pub fn clear_ai_intake_api_key(secret: State<ManagedSecretStore>) -> Result<(), String> {
    secret
        .store()
        .delete(AI_INTAKE_API_KEY)
        .map_err(|e| e.to_string())
}

/// Record one-time consent (FR-014/FR-016).
#[command]
pub fn grant_ai_intake_consent(pool: State<DbPool>) -> Result<(), String> {
    pool.execute(AiIntakeConfig::grant_consent)
}

/// Resolve config + key into a ready adapter, enforcing enabled/configured.
fn build_adapter(
    pool: &State<DbPool>,
    secret: &State<ManagedSecretStore>,
) -> Result<MistralAdapter, FrError> {
    let config = pool
        .execute(AiIntakeConfig::load)
        .map_err(|e| FrError::new("other", e))?;

    if !config.enabled {
        return Err(FrError::new("not_configured", "AI intake is disabled"));
    }
    let base_url = config
        .base_url
        .filter(|s| !s.is_empty())
        .ok_or_else(|| FrError::new("not_configured", "missing provider base URL"))?;
    let model = config
        .model
        .filter(|s| !s.is_empty())
        .ok_or_else(|| FrError::new("not_configured", "missing model name"))?;
    let api_key = secret
        .store()
        .get(AI_INTAKE_API_KEY)
        .map_err(|e| FrError::new("other", e.to_string()))?
        .ok_or_else(|| FrError::new("not_configured", "missing API key"))?;

    MistralAdapter::new(base_url, model, api_key).map_err(FrError::from)
}

/// Analyze a meal photo and return a single confirmable intake candidate.
///
/// The webview passes only image bytes (FR-008); the key, endpoint, EXIF strip,
/// provider call, parsing, and mapping all happen here. Nothing logs image bytes
/// or response content — only status and timing (FR-010).
#[command]
pub fn analyze_meal_photo(
    pool: State<DbPool>,
    secret: State<ManagedSecretStore>,
    mut image: Vec<u8>,
    mime: String,
    locale: String,
) -> Result<IntakeCandidate, FrError> {
    // Defense in depth: never upload without recorded consent (FR-014).
    let config = pool
        .execute(AiIntakeConfig::load)
        .map_err(|e| FrError::new("other", e))?;
    if !config.consent_granted {
        return Err(FrError::new("consent_required", "consent not yet granted"));
    }

    let adapter = build_adapter(&pool, &secret)?;

    image::strip_exif(&mut image, &mime).map_err(FrError::from)?;

    let started = Instant::now();
    let request = AnalysisRequest {
        image,
        mime,
        locale,
    };
    let result = analyze(&adapter, &request);
    log::info!(
        "food_recognition: analyze completed in {}ms, outcome={}",
        started.elapsed().as_millis(),
        result.as_ref().map(|_| "ok").unwrap_or("err")
    );
    let result = result.map_err(FrError::from)?;

    pool.execute(|conn| to_candidate(conn, &result))
        .map_err(|e| FrError::new("other", e))
}

/// Run a single low-cost provider call to validate the current configuration
/// (FR-004/005/006).
#[command]
pub fn test_ai_intake_connection(
    pool: State<DbPool>,
    secret: State<ManagedSecretStore>,
) -> Result<(), FrError> {
    let adapter = build_adapter(&pool, &secret)?;
    let started = Instant::now();
    let outcome = adapter.test_connection();
    log::info!(
        "food_recognition: test_connection completed in {}ms, outcome={}",
        started.elapsed().as_millis(),
        outcome.as_ref().map(|_| "ok").unwrap_or("err")
    );
    outcome.map_err(FrError::from)
}
