use crate::db::schema::app_config;

use diesel::prelude::*;
use serde::{Deserialize, Serialize};

// ============================================================================
// MODELS
// ============================================================================

/// A single key/value row in the generic application-settings store.
///
/// Values are stored as TEXT; typed interpretation lives in the helpers below.
/// Secrets are NEVER stored here — the AI-intake API key lives only in the OS
/// keystore (see the `SecretStore` abstraction).
#[derive(Insertable, Queryable, Selectable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = app_config)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct AppConfigEntry {
    pub key: String,
    pub value: String,
}

// Known config keys. Kept here so the whole app references one spelling.
pub const KEY_AI_ENABLED: &str = "ai_intake.enabled";
pub const KEY_AI_BASE_URL: &str = "ai_intake.base_url";
pub const KEY_AI_MODEL: &str = "ai_intake.model";
pub const KEY_AI_CONSENT_GRANTED: &str = "ai_intake.consent_granted";

/// The non-secret AI-intake configuration, as surfaced to the frontend.
///
/// The API key is intentionally absent: it is never read from or written to the
/// database. `configured` is derived in the command layer (needs the keystore).
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AiIntakeConfig {
    pub enabled: bool,
    pub base_url: Option<String>,
    pub model: Option<String>,
    pub consent_granted: bool,
}

// ============================================================================
// REPOSITORY
// ============================================================================

impl AppConfigEntry {
    /// Read a single value by key, if present.
    pub fn get(conn: &mut SqliteConnection, k: &str) -> QueryResult<Option<String>> {
        app_config::table
            .find(k)
            .select(app_config::value)
            .first::<String>(conn)
            .optional()
    }

    /// Insert or update a single key/value pair (upsert).
    pub fn set(conn: &mut SqliteConnection, k: &str, v: &str) -> QueryResult<()> {
        diesel::insert_into(app_config::table)
            .values((app_config::key.eq(k), app_config::value.eq(v)))
            .on_conflict(app_config::key)
            .do_update()
            .set(app_config::value.eq(v))
            .execute(conn)?;
        Ok(())
    }

    /// Remove a key if it exists.
    pub fn delete(conn: &mut SqliteConnection, k: &str) -> QueryResult<()> {
        diesel::delete(app_config::table.find(k)).execute(conn)?;
        Ok(())
    }

    /// Read every stored key/value pair. Used by JSON export; safe to include in
    /// a backup because secrets (the API key) never live in this table.
    pub fn all(conn: &mut SqliteConnection) -> QueryResult<Vec<Self>> {
        app_config::table.load::<Self>(conn)
    }
}

// ----------------------------------------------------------------------------
// Typed AI-intake accessors (the first consumer of app_config)
// ----------------------------------------------------------------------------

impl AiIntakeConfig {
    /// Assemble the non-secret AI-intake config from the store. Missing keys
    /// fall back to defaults (disabled, no provider, no consent).
    pub fn load(conn: &mut SqliteConnection) -> QueryResult<Self> {
        Ok(Self {
            enabled: AppConfigEntry::get(conn, KEY_AI_ENABLED)?
                .map(|v| v == "true")
                .unwrap_or(false),
            base_url: AppConfigEntry::get(conn, KEY_AI_BASE_URL)?.filter(|s| !s.is_empty()),
            model: AppConfigEntry::get(conn, KEY_AI_MODEL)?.filter(|s| !s.is_empty()),
            consent_granted: AppConfigEntry::get(conn, KEY_AI_CONSENT_GRANTED)?
                .map(|v| v == "true")
                .unwrap_or(false),
        })
    }

    /// Persist the non-secret AI-intake config. Never touches the API key.
    pub fn save(&self, conn: &mut SqliteConnection) -> QueryResult<()> {
        AppConfigEntry::set(
            conn,
            KEY_AI_ENABLED,
            if self.enabled { "true" } else { "false" },
        )?;
        AppConfigEntry::set(
            conn,
            KEY_AI_BASE_URL,
            self.base_url.as_deref().unwrap_or(""),
        )?;
        AppConfigEntry::set(conn, KEY_AI_MODEL, self.model.as_deref().unwrap_or(""))?;
        AppConfigEntry::set(
            conn,
            KEY_AI_CONSENT_GRANTED,
            if self.consent_granted {
                "true"
            } else {
                "false"
            },
        )?;
        Ok(())
    }

    /// Record one-time consent without touching the rest of the config.
    pub fn grant_consent(conn: &mut SqliteConnection) -> QueryResult<()> {
        AppConfigEntry::set(conn, KEY_AI_CONSENT_GRANTED, "true")
    }
}
