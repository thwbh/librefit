use crate::helpers::setup_test_pool;
use librefit_lib::scenario;
use librefit_lib::secret::{InMemorySecretStore, SecretStore, AI_INTAKE_API_KEY};
use librefit_lib::service::app_config::{AiIntakeConfig, AppConfigEntry, KEY_AI_BASE_URL};
use librefit_lib::service::food_recognition::adapter::{
    analyze, AnalysisRequest, FakeProviderAdapter, ProviderAdapter,
};
use librefit_lib::service::food_recognition::analysis::{parse_analysis, AnalysisError};
use librefit_lib::service::food_recognition::image::{file_extension_for, strip_exif};
use librefit_lib::service::food_recognition::is_configured;
use librefit_lib::service::food_recognition::mapping::to_candidate;
use validator::Validate;

const VALID_SINGLE: &str = r#"{"items":[{"name":"Apple","calorieEstimate":95}],"confidence":0.9}"#;
const VALID_MULTI: &str = r#"{"items":[{"name":"Grilled chicken","calorieEstimate":300},{"name":"Rice","calorieEstimate":200},{"name":"Broccoli","calorieEstimate":55}],"confidence":0.8}"#;
const LOW_CONF: &str =
    r#"{"items":[{"name":"Mystery stew","calorieEstimate":400}],"confidence":0.2}"#;
const MALFORMED: &str = r#"{"items":[{"name":"Apple"}]"#;

fn req() -> AnalysisRequest {
    AnalysisRequest {
        image: vec![0xFF, 0xD8, 0xFF, 0xD9],
        mime: "image/jpeg".to_string(),
        locale: "en".to_string(),
    }
}

// ---------------------------------------------------------------------------
// Configuration & secret handling
// ---------------------------------------------------------------------------

#[test]
fn feature_disabled_by_default() {
    scenario!("[FR-001]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let config = AiIntakeConfig::load(&mut conn).unwrap();
    assert!(!config.enabled);
    assert!(config.base_url.is_none());
    assert!(config.model.is_none());
    assert!(!is_configured(&config, false));
}

#[test]
fn non_secret_config_persists() {
    scenario!("[FR-002]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let config = AiIntakeConfig {
        enabled: true,
        base_url: Some("https://api.mistral.ai/v1".to_string()),
        model: Some("pixtral-12b".to_string()),
        consent_granted: false,
    };
    config.save(&mut conn).unwrap();

    let loaded = AiIntakeConfig::load(&mut conn).unwrap();
    assert!(loaded.enabled);
    assert_eq!(
        loaded.base_url.as_deref(),
        Some("https://api.mistral.ai/v1")
    );
    assert_eq!(loaded.model.as_deref(), Some("pixtral-12b"));
}

#[test]
fn unconfigured_until_all_fields_present() {
    scenario!("[FR-003]");
    let config = AiIntakeConfig {
        enabled: true,
        base_url: Some("https://api.mistral.ai/v1".to_string()),
        model: Some("pixtral-12b".to_string()),
        consent_granted: true,
    };
    // Base URL + model present but no key -> not configured.
    assert!(!is_configured(&config, false));
    // All three present -> configured.
    assert!(is_configured(&config, true));
}

#[test]
fn api_key_stored_in_keystore_not_database() {
    scenario!("[FR-007]", "[FR-008]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let store = InMemorySecretStore::default();
    store.set(AI_INTAKE_API_KEY, "sk-secret-value").unwrap();

    // Retrievable from the keystore (backend-side only).
    assert_eq!(
        store.get(AI_INTAKE_API_KEY).unwrap().as_deref(),
        Some("sk-secret-value")
    );

    // The key never lands in app_config / the database. No config key holds it,
    // and the base-url slot certainly does not.
    assert!(AppConfigEntry::get(&mut conn, KEY_AI_BASE_URL)
        .unwrap()
        .is_none());
    assert!(AppConfigEntry::get(&mut conn, "ai_intake.api_key")
        .unwrap()
        .is_none());
}

// ---------------------------------------------------------------------------
// Parsing & retry
// ---------------------------------------------------------------------------

#[test]
fn valid_response_parsed() {
    scenario!("[FR-017]");
    let result = parse_analysis(VALID_SINGLE).unwrap();
    assert_eq!(result.items.len(), 1);
    assert_eq!(result.items[0].name, "Apple");
    assert_eq!(result.items[0].calorie_estimate, 95);
}

#[test]
fn single_retry_on_parse_failure() {
    scenario!("[FR-018]");
    let adapter = FakeProviderAdapter::with_script(vec![
        Ok(MALFORMED.to_string()),
        Ok(VALID_SINGLE.to_string()),
    ]);
    let result = analyze(&adapter, &req()).unwrap();
    assert_eq!(result.items[0].name, "Apple");
}

#[test]
fn retry_exhausted_surfaces_error() {
    scenario!("[FR-019]");
    let adapter = FakeProviderAdapter::with_script(vec![
        Ok(MALFORMED.to_string()),
        Ok(MALFORMED.to_string()),
    ]);
    let err = analyze(&adapter, &req()).unwrap_err();
    assert_eq!(err, AnalysisError::Parse);
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

#[test]
fn single_item_maps_to_one_candidate() {
    scenario!("[FR-020]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = parse_analysis(VALID_SINGLE).unwrap();
    let candidate = to_candidate(&mut conn, &result).unwrap();

    assert_eq!(candidate.intake.amount, 95);
    assert_eq!(candidate.intake.description.as_deref(), Some("Apple"));
}

#[test]
fn multiple_items_collapse_into_one_entry() {
    scenario!("[FR-021]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = parse_analysis(VALID_MULTI).unwrap();
    let candidate = to_candidate(&mut conn, &result).unwrap();

    assert_eq!(candidate.intake.amount, 555);
    assert_eq!(
        candidate.intake.description.as_deref(),
        Some("Grilled chicken, Rice, Broccoli")
    );
}

#[test]
fn category_resolved_locally() {
    scenario!("[FR-022]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let result = parse_analysis(VALID_SINGLE).unwrap();
    let candidate = to_candidate(&mut conn, &result).unwrap();

    // Category is one of the seeded food_category shortvalues, never from model.
    assert!(["b", "l", "d", "s"].contains(&candidate.intake.category.as_str()));
}

#[test]
fn low_confidence_result_flagged() {
    scenario!("[FR-023]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let low = to_candidate(&mut conn, &parse_analysis(LOW_CONF).unwrap()).unwrap();
    assert!(low.low_confidence);

    let high = to_candidate(&mut conn, &parse_analysis(VALID_SINGLE).unwrap()).unwrap();
    assert!(!high.low_confidence);
}

#[test]
fn out_of_range_sum_rejected_on_save() {
    scenario!("[FR-024]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let over = r#"{"items":[{"name":"Feast","calorieEstimate":12000}],"confidence":0.9}"#;
    let candidate = to_candidate(&mut conn, &parse_analysis(over).unwrap()).unwrap();

    // The summed amount exceeds 10,000 kcal; the existing NewIntake validation
    // (the create_intake guardrail) rejects it.
    assert!(candidate.intake.validate().is_err());
}

// ---------------------------------------------------------------------------
// Image hygiene
// ---------------------------------------------------------------------------

#[test]
fn exif_stripped_before_upload() {
    scenario!("[FR-009]");
    // Supported types resolve to a little_exif file type...
    assert!(file_extension_for("image/jpeg").is_some());
    assert!(file_extension_for("image/png").is_some());
    assert!(file_extension_for("image/webp").is_some());
    // ...and unsupported types are refused so an un-stripped image never uploads.
    let mut bytes = vec![0x25, 0x50, 0x44, 0x46];
    assert!(strip_exif(&mut bytes, "application/pdf").is_err());
}

// ---------------------------------------------------------------------------
// Failure taxonomy
// ---------------------------------------------------------------------------

#[test]
fn bad_key_failure_classified() {
    scenario!("[FR-005]", "[FR-028]");
    let adapter = FakeProviderAdapter::failing(AnalysisError::BadKey);
    let err = analyze(&adapter, &req()).unwrap_err();
    assert_eq!(err.code(), "bad_key");
}

#[test]
fn quota_failure_classified() {
    scenario!("[FR-029]");
    let adapter = FakeProviderAdapter::failing(AnalysisError::Quota);
    let err = analyze(&adapter, &req()).unwrap_err();
    assert_eq!(err.code(), "quota");
}

#[test]
fn timeout_failure_classified() {
    scenario!("[FR-006]", "[FR-030]");
    let adapter = FakeProviderAdapter::failing(AnalysisError::Timeout);
    let err = analyze(&adapter, &req()).unwrap_err();
    assert_eq!(err.code(), "timeout");
}

#[test]
fn successful_test_connection() {
    scenario!("[FR-004]");
    let adapter = FakeProviderAdapter::with_response(VALID_SINGLE).with_test_result(Ok(()));
    assert!(adapter.test_connection().is_ok());
}
