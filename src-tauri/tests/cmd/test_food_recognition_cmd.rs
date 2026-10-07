//! Command-layer coverage for the food-recognition Tauri commands (FR).
//!
//! The commands guard the pipeline: consent (FR-014), enabled/configured
//! (FR-001/002/003), keystore-backed key handling (FR-007) — and the full
//! analyze round trip against a one-shot local provider server, so the glue
//! between config, image hygiene, adapter and mapping is exercised too.

use crate::helpers::{one_shot_server, setup_test_pool};
use librefit_lib::scenario;
use librefit_lib::secret::{InMemorySecretStore, ManagedSecretStore, AI_INTAKE_API_KEY};
use librefit_lib::service::app_config::AiIntakeConfig;
use librefit_lib::service::food_recognition::{
    analyze_meal_photo, clear_ai_intake_api_key, get_ai_intake_config, grant_ai_intake_consent,
    set_ai_intake_api_key, test_ai_intake_connection, update_ai_intake_config,
};
use tauri::Manager;

/// A mock app with the test pool and an in-memory keystore managed, mirroring
/// the production state setup.
fn app_with_state() -> tauri::App<tauri::test::MockRuntime> {
    let app = tauri::test::mock_app();
    app.manage(setup_test_pool());
    app.manage(ManagedSecretStore(Box::new(InMemorySecretStore::default())));
    app
}

fn store_key(app: &tauri::App<tauri::test::MockRuntime>, key: &str) {
    app.state::<ManagedSecretStore>()
        .store()
        .set(AI_INTAKE_API_KEY, key)
        .unwrap();
}

/// Minimal valid 1×1 PNG.
const TINY_PNG: &[u8] = &[
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82,
];

fn completion_body(content: &str) -> String {
    serde_json::json!({
        "id": "x",
        "choices": [{ "message": { "content": content } }]
    })
    .to_string()
}

/// Save a fully-configured, consented config pointing at `base_url`.
fn configure(app: &tauri::App<tauri::test::MockRuntime>, base_url: &str) {
    let pool_state: tauri::State<librefit_lib::db::connection::DbPool> = app.state();
    let mut conn = pool_state.get().unwrap();
    AiIntakeConfig {
        enabled: true,
        base_url: Some(base_url.to_string()),
        model: Some("pixtral-12b".to_string()),
        consent_granted: true,
    }
    .save(&mut conn)
    .unwrap();
}

/// Overwrite the persisted config with a custom one.
fn set_config(app: &tauri::App<tauri::test::MockRuntime>, config: AiIntakeConfig) {
    let pool_state: tauri::State<librefit_lib::db::connection::DbPool> = app.state();
    let mut conn = pool_state.get().unwrap();
    config.save(&mut conn).unwrap();
}

// ---------------------------------------------------------------------------
// Config commands
// ---------------------------------------------------------------------------

#[test]
fn get_config_reports_disabled_and_unconfigured_by_default() {
    scenario!("[FR-001]", "[FR-003]");
    let app = app_with_state();

    let status = get_ai_intake_config(app.state(), app.state()).unwrap();

    assert!(!status.config.enabled);
    assert!(!status.config.consent_granted);
    assert!(!status.configured);
    // The payload never contains an API key field at all.
    let json = serde_json::to_value(&status).unwrap();
    assert!(json.get("apiKey").is_none() && json.get("api_key").is_none());
}

#[test]
fn update_config_round_trips_and_preserves_consent() {
    scenario!("[FR-002]");
    let app = app_with_state();

    // Grant consent first; updating the config must not reset it.
    grant_ai_intake_consent(app.state()).unwrap();

    let status = update_ai_intake_config(
        app.state(),
        app.state(),
        true,
        Some("https://api.mistral.ai/v1".to_string()),
        Some("pixtral-12b".to_string()),
    )
    .unwrap();
    assert!(status.config.enabled);
    assert_eq!(
        status.config.base_url.as_deref(),
        Some("https://api.mistral.ai/v1")
    );
    assert!(status.config.consent_granted);
    // Without a stored key the feature still reports unconfigured.
    assert!(!status.configured);

    // Empty strings are normalized to None, not persisted as blank config.
    let status = update_ai_intake_config(
        app.state(),
        app.state(),
        true,
        Some("".to_string()),
        Some("   ".to_string()),
    )
    .unwrap();
    assert_eq!(status.config.base_url, None);
}

#[test]
fn set_api_key_rejects_empty_and_clears_cleanly() {
    scenario!("[FR-007]");
    let app = app_with_state();

    // An empty key is rejected outright — nothing is stored.
    assert!(set_ai_intake_api_key(app.state(), "   ".to_string()).is_err());
    assert!(app
        .state::<ManagedSecretStore>()
        .store()
        .get(AI_INTAKE_API_KEY)
        .unwrap()
        .is_none());

    // A real key lands in the keystore (trimmed) and clear removes it.
    set_ai_intake_api_key(app.state(), " sk-secret-value ".to_string()).unwrap();
    assert_eq!(
        app.state::<ManagedSecretStore>()
            .store()
            .get(AI_INTAKE_API_KEY)
            .unwrap()
            .as_deref(),
        Some("sk-secret-value")
    );
    clear_ai_intake_api_key(app.state()).unwrap();
    assert!(app
        .state::<ManagedSecretStore>()
        .store()
        .get(AI_INTAKE_API_KEY)
        .unwrap()
        .is_none());
}

#[test]
fn configured_only_with_base_url_model_and_key() {
    scenario!("[FR-003]");
    let app = app_with_state();

    let status = update_ai_intake_config(
        app.state(),
        app.state(),
        true,
        Some("https://api.mistral.ai/v1".to_string()),
        Some("pixtral-12b".to_string()),
    )
    .unwrap();
    // Config fields present, no key yet.
    assert!(!status.configured);

    store_key(&app, "sk-test");
    let status = get_ai_intake_config(app.state(), app.state()).unwrap();
    assert!(status.configured);
}

// ---------------------------------------------------------------------------
// Analyze pipeline guards
// ---------------------------------------------------------------------------

#[test]
fn analyze_refuses_without_recorded_consent() {
    scenario!("[FR-014]");
    let app = app_with_state();

    // Fully configured, but consent never granted.
    set_config(
        &app,
        AiIntakeConfig {
            consent_granted: false,
            ..configured_test_config("https://api.mistral.ai/v1")
        },
    );
    store_key(&app, "sk-test");

    let err = tauri::async_runtime::block_on(analyze_meal_photo(
        app.state(),
        app.state(),
        TINY_PNG.to_vec(),
        "image/png".to_string(),
        "en".to_string(),
    ))
    .unwrap_err();
    assert_eq!(err.code, "consent_required");
}

#[test]
fn analyze_refuses_when_disabled_or_unconfigured() {
    scenario!("[FR-003]", "[FR-011]");
    let app = app_with_state();
    grant_ai_intake_consent(app.state()).unwrap();
    store_key(&app, "sk-test");

    // Disabled flag off.
    set_config(
        &app,
        AiIntakeConfig {
            enabled: false,
            ..configured_test_config("https://api.mistral.ai/v1")
        },
    );
    let err = tauri::async_runtime::block_on(analyze_meal_photo(
        app.state(),
        app.state(),
        TINY_PNG.to_vec(),
        "image/png".to_string(),
        "en".to_string(),
    ))
    .unwrap_err();
    assert_eq!(err.code, "not_configured");

    // Enabled but missing base URL.
    let mut config = configured_test_config("https://api.mistral.ai/v1");
    config.base_url = None;
    set_config(&app, config);
    let err = tauri::async_runtime::block_on(analyze_meal_photo(
        app.state(),
        app.state(),
        TINY_PNG.to_vec(),
        "image/png".to_string(),
        "en".to_string(),
    ))
    .unwrap_err();
    assert_eq!(err.code, "not_configured");

    // Enabled but missing model.
    let mut config = configured_test_config("https://api.mistral.ai/v1");
    config.model = None;
    set_config(&app, config);
    let err = tauri::async_runtime::block_on(analyze_meal_photo(
        app.state(),
        app.state(),
        TINY_PNG.to_vec(),
        "image/png".to_string(),
        "en".to_string(),
    ))
    .unwrap_err();
    assert_eq!(err.code, "not_configured");
}

#[test]
fn analyze_refuses_without_a_stored_key() {
    scenario!("[FR-003]", "[FR-012]");
    let app = app_with_state();
    grant_ai_intake_consent(app.state()).unwrap();
    configure(&app, "https://api.mistral.ai/v1");
    // No key stored.

    let err = tauri::async_runtime::block_on(analyze_meal_photo(
        app.state(),
        app.state(),
        TINY_PNG.to_vec(),
        "image/png".to_string(),
        "en".to_string(),
    ))
    .unwrap_err();
    assert_eq!(err.code, "not_configured");
}

#[test]
fn analyze_round_trips_against_a_local_provider() {
    scenario!("[FR-032]", "[FR-025]");
    let content = r#"{"items":[{"name":"Apple","calorieEstimate":95}],"confidence":0.9}"#;
    let (base, _request_rx) = one_shot_server("200 OK", &completion_body(content));

    let app = app_with_state();
    grant_ai_intake_consent(app.state()).unwrap();
    configure(&app, &base);
    store_key(&app, "sk-test");

    let candidate = tauri::async_runtime::block_on(analyze_meal_photo(
        app.state(),
        app.state(),
        TINY_PNG.to_vec(),
        "image/png".to_string(),
        "en".to_string(),
    ))
    .unwrap();

    // The candidate comes back pre-filled for the intake mask (FR-025).
    assert_eq!(candidate.intake.amount, 95);
    assert_eq!(candidate.intake.description.as_deref(), Some("Apple"));
    assert!((candidate.confidence - 0.9).abs() < f32::EPSILON);
    assert!(!candidate.low_confidence);
    assert!(["b", "l", "d", "s", "t", "u"].contains(&candidate.intake.category.as_str()));
}

#[test]
fn analyze_maps_provider_failure_classes_through_the_command() {
    scenario!("[FR-005]", "[FR-028]");
    let (base, _request_rx) = one_shot_server("401 Unauthorized", r#"{"error":"no"}"#);

    let app = app_with_state();
    grant_ai_intake_consent(app.state()).unwrap();
    configure(&app, &base);
    store_key(&app, "sk-wrong");

    let err = tauri::async_runtime::block_on(analyze_meal_photo(
        app.state(),
        app.state(),
        TINY_PNG.to_vec(),
        "image/png".to_string(),
        "en".to_string(),
    ))
    .unwrap_err();
    assert_eq!(err.code, "bad_key");
}

#[test]
fn test_connection_command_checks_the_provider() {
    scenario!("[FR-004]");
    let (base, _request_rx) = one_shot_server("200 OK", r#"{"data":[]}"#);

    let app = app_with_state();
    configure(&app, &base);
    store_key(&app, "sk-test");

    tauri::async_runtime::block_on(test_ai_intake_connection(app.state(), app.state())).unwrap();
}

#[test]
fn test_connection_command_reports_unconfigured_state() {
    scenario!("[FR-006]");
    // Nothing listens here; an unconfigured feature fails before any network
    // leg anyway, so this doubles as the disabled-path guard.
    let app = app_with_state();
    set_config(&app, configured_test_config("http://127.0.0.1:9"));

    let err = tauri::async_runtime::block_on(test_ai_intake_connection(app.state(), app.state()))
        .unwrap_err();
    assert_eq!(err.code, "not_configured");
}

/// Convenience: the standard fully-configured config for a given base URL.
fn configured_test_config(base_url: &str) -> AiIntakeConfig {
    AiIntakeConfig {
        enabled: true,
        base_url: Some(base_url.to_string()),
        model: Some("pixtral-12b".to_string()),
        consent_granted: true,
    }
}
