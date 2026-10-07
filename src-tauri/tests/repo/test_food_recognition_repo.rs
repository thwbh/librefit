use crate::helpers::{one_shot_server, setup_test_pool};
use librefit_lib::scenario;
use librefit_lib::secret::{InMemorySecretStore, SecretStore, AI_INTAKE_API_KEY};
use librefit_lib::service::app_config::{AiIntakeConfig, AppConfigEntry, KEY_AI_BASE_URL};
use librefit_lib::service::food_recognition::adapter::{
    analyze, normalize_base_url, AnalysisRequest, FakeProviderAdapter, MistralAdapter,
    ProviderAdapter,
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
fn candidate_carries_numeric_confidence() {
    scenario!("[FR-034]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // The raw analysis confidence is surfaced on the candidate so the UI can
    // derive a low/medium/high badge (the bucketing itself is a frontend helper).
    let high = to_candidate(&mut conn, &parse_analysis(VALID_SINGLE).unwrap()).unwrap();
    assert_eq!(high.confidence, 0.9);

    let low = to_candidate(&mut conn, &parse_analysis(LOW_CONF).unwrap()).unwrap();
    assert_eq!(low.confidence, 0.2);
}

#[test]
fn confidence_below_threshold_also_flags_low() {
    scenario!("[FR-035]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // A sub-threshold confidence both carries the raw value and sets the
    // authoritative low-confidence warning flag, so badge and warning agree.
    let low = to_candidate(&mut conn, &parse_analysis(LOW_CONF).unwrap()).unwrap();
    assert!(low.confidence < 0.5);
    assert!(low.low_confidence);
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
fn errors_carry_no_response_content() {
    scenario!("[FR-010]");
    // Classified errors render as a stable code only — never image bytes or a
    // response body — so any log line built from them cannot leak content.
    assert_eq!(AnalysisError::BadKey.to_string(), "bad_key");
    assert_eq!(AnalysisError::Quota.to_string(), "quota");
    assert_eq!(AnalysisError::Timeout.to_string(), "timeout");
}

#[test]
fn successful_test_connection() {
    scenario!("[FR-004]");
    let adapter = FakeProviderAdapter::with_response(VALID_SINGLE).with_test_result(Ok(()));
    assert!(adapter.test_connection().is_ok());
}

#[test]
fn base_url_normalized_for_openai_compatible_root() {
    scenario!("[FR-004]");
    // A pasted full endpoint or trailing slash resolves to the same root the
    // adapter appends /chat/completions and /models to.
    assert_eq!(
        normalize_base_url("https://api.mistral.ai/v1"),
        "https://api.mistral.ai/v1"
    );
    assert_eq!(
        normalize_base_url("https://api.mistral.ai/v1/chat/completions"),
        "https://api.mistral.ai/v1"
    );
    assert_eq!(
        normalize_base_url("https://api.mistral.ai/v1/chat/completions/"),
        "https://api.mistral.ai/v1"
    );
    assert_eq!(
        normalize_base_url("http://localhost:11434/v1/"),
        "http://localhost:11434/v1"
    );
}

// ---------------------------------------------------------------------------
// Parsing edge cases
// ---------------------------------------------------------------------------

#[test]
fn absent_confidence_defaults_to_full_confidence() {
    scenario!("[FR-017]");
    // Some providers omit `confidence`; the candidate stays usable and is not
    // flagged low (the default sits above LOW_CONFIDENCE_THRESHOLD).
    let raw = r#"{"items":[{"name":"Apple","calorieEstimate":95}]}"#;
    let result = parse_analysis(raw).unwrap();
    assert_eq!(result.confidence, 1.0);
}

#[test]
fn empty_item_list_rejected() {
    scenario!("[FR-019]");
    // A "valid JSON, no food detected" answer must not become an empty intake.
    let err = parse_analysis(r#"{"items":[],"confidence":0.9}"#).unwrap_err();
    assert_eq!(err, AnalysisError::Parse);
}

#[test]
fn non_positive_calories_rejected() {
    scenario!("[FR-019]");
    // Zero/negative estimates are model noise; reject rather than map.
    let err =
        parse_analysis(r#"{"items":[{"name":"Ghost","calorieEstimate":0}],"confidence":0.9}"#)
            .unwrap_err();
    assert_eq!(err, AnalysisError::Parse);
}

#[test]
fn other_failure_carries_code_and_short_display() {
    scenario!("[FR-010]");
    // The `Other` class keeps the stable code and a short transport reason —
    // never response content.
    let err = AnalysisError::Other("provider returned status 500".to_string());
    assert_eq!(err.code(), "other");
    assert_eq!(err.to_string(), "other: provider returned status 500");
}

#[test]
fn typed_error_maps_to_coded_frontend_error() {
    scenario!("[FR-028]");
    // The `From<AnalysisError>` bridge is what the command layer uses; the
    // frontend picks its localized message off the stable `code`.
    let fr = librefit_lib::service::food_recognition::FrError::from(AnalysisError::BadKey);
    assert_eq!(fr.code, "bad_key");
    assert_eq!(fr.message, "bad_key");
}

// ---------------------------------------------------------------------------
// Mapping edge cases
// ---------------------------------------------------------------------------

#[test]
fn empty_item_names_are_skipped_in_the_description() {
    scenario!("[FR-021]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    let raw =
        r#"{"items":[{"name":"  ","calorieEstimate":100},{"name":"Apple","calorieEstimate":95}]}"#;
    let candidate = to_candidate(&mut conn, &parse_analysis(raw).unwrap()).unwrap();

    // The blank name dropped out of the joined description but its calories
    // still count toward the sum.
    assert_eq!(candidate.intake.description.as_deref(), Some("Apple"));
    assert_eq!(candidate.intake.amount, 195);
}

#[test]
fn description_is_truncated_to_the_column_bound() {
    scenario!("[FR-021]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // One item with a name far past the 500-char description bound.
    let long_name = "x".repeat(900);
    let raw = format!(
        r#"{{"items":[{{"name":"{}","calorieEstimate":42}}],"confidence":0.9}}"#,
        long_name
    );
    let candidate = to_candidate(&mut conn, &parse_analysis(&raw).unwrap()).unwrap();

    let description = candidate.intake.description.unwrap();
    assert_eq!(description.chars().count(), 500);
    assert!(description.chars().all(|c| c == 'x'));
}

#[test]
fn category_falls_back_when_the_time_of_day_row_is_missing() {
    scenario!("[FR-022]");
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Remove the category the current time of day would pick...
    use diesel::prelude::*;
    for shortvalue in ["b", "l", "d", "s"] {
        diesel::delete(librefit_lib::db::schema::food_category::table.find(shortvalue))
            .execute(&mut conn)
            .unwrap();
    }

    // ...the candidate still gets a valid local category (first row), never one
    // from the model.
    let candidate = to_candidate(&mut conn, &parse_analysis(VALID_SINGLE).unwrap()).unwrap();
    assert!(
        !candidate.intake.category.is_empty(),
        "fallback category must exist"
    );
    assert!(["t", "u"].contains(&candidate.intake.category.as_str()));
}

// ---------------------------------------------------------------------------
// Image hygiene edge cases
// ---------------------------------------------------------------------------

#[test]
fn heic_variants_are_supported_for_stripping() {
    scenario!("[FR-009]");
    // HEIC/HEIF (common iPhone captures) map to a little_exif type like the
    // other supported formats.
    assert!(file_extension_for("image/heic").is_some());
    assert!(file_extension_for("image/HEIF").is_some());
    assert!(file_extension_for("image/jpg").is_some());
}

// ---------------------------------------------------------------------------
// Live provider adapter (one-shot local HTTP server)
// ---------------------------------------------------------------------------

fn completion_body(content: &str) -> String {
    serde_json::json!({
        "id": "x",
        "choices": [{ "message": { "content": content } }]
    })
    .to_string()
}

#[test]
fn adapter_test_connection_hits_models_with_bearer_auth() {
    scenario!("[FR-004]");
    let (base, request_rx) = one_shot_server("200 OK", r#"{"data":[]}"#);

    let adapter =
        MistralAdapter::new(base, "pixtral-12b".to_string(), "sk-test".to_string()).unwrap();
    adapter.test_connection().unwrap();

    let request = request_rx
        .recv_timeout(std::time::Duration::from_secs(5))
        .unwrap();
    // Health check goes to /models and carries the key as a bearer token only.
    assert!(request.starts_with("GET /models "));
    assert!(request
        .to_ascii_lowercase()
        .contains("authorization: bearer sk-test"));
}

#[test]
fn adapter_test_connection_rejects_a_bad_key() {
    scenario!("[FR-005]", "[FR-028]");
    let (base, _request_rx) = one_shot_server("401 Unauthorized", r#"{"error":"bad key"}"#);

    let adapter =
        MistralAdapter::new(base, "pixtral-12b".to_string(), "sk-wrong".to_string()).unwrap();
    let err = adapter.test_connection().unwrap_err();
    assert_eq!(err, AnalysisError::BadKey);
}

#[test]
fn adapter_test_connection_reports_an_unreachable_provider() {
    scenario!("[FR-006]", "[FR-030]");
    // Nothing listens on this port: the connect failure is classified as a
    // timeout-class error so the user gets the "check connection" nudge.
    let adapter = MistralAdapter::new(
        "http://127.0.0.1:9".to_string(),
        "pixtral-12b".to_string(),
        "sk-test".to_string(),
    )
    .unwrap();
    let err = adapter.test_connection().unwrap_err();
    assert_eq!(err, AnalysisError::Timeout);
}

#[test]
fn adapter_completion_round_trips_through_chat_completions() {
    scenario!("[FR-032]");
    let content = r#"{"items":[{"name":"Apple","calorieEstimate":95}],"confidence":0.9}"#;
    let (base, request_rx) = one_shot_server("200 OK", &completion_body(content));

    let adapter =
        MistralAdapter::new(base, "pixtral-12b".to_string(), "sk-test".to_string()).unwrap();
    let result = analyze(&adapter, &req()).unwrap();
    assert_eq!(result.items[0].name, "Apple");

    let request = request_rx
        .recv_timeout(std::time::Duration::from_secs(5))
        .unwrap();
    assert!(request.starts_with("POST /chat/completions "));
    assert!(request
        .to_ascii_lowercase()
        .contains("authorization: bearer sk-test"));
    // Only image bytes cross the boundary, inlined as a data URI (FR-008);
    // the locale reaches the system prompt.
    assert!(request.contains("data:image/jpeg;base64,/9j/2Q=="));
    assert!(request.contains("Food names in the 'en' locale"));
}

#[test]
fn adapter_maps_quota_exhaustion() {
    scenario!("[FR-029]");
    let (base, _request_rx) = one_shot_server("429 Too Many Requests", r#"{"error":"quota"}"#);

    let adapter =
        MistralAdapter::new(base, "pixtral-12b".to_string(), "sk-test".to_string()).unwrap();
    let err = adapter.complete(&req()).unwrap_err();
    assert_eq!(err, AnalysisError::Quota);
}

#[test]
fn adapter_maps_gateway_timeout_status() {
    scenario!("[FR-030]");
    let (base, _request_rx) = one_shot_server("504 Gateway Timeout", r#"{"error":"slow"}"#);

    let adapter =
        MistralAdapter::new(base, "pixtral-12b".to_string(), "sk-test".to_string()).unwrap();
    let err = adapter.complete(&req()).unwrap_err();
    assert_eq!(err, AnalysisError::Timeout);
}

#[test]
fn adapter_maps_unexpected_status_to_other() {
    scenario!("[FR-028]");
    let (base, _request_rx) = one_shot_server("500 Internal Server Error", r#"{"error":"boom"}"#);

    let adapter =
        MistralAdapter::new(base, "pixtral-12b".to_string(), "sk-test".to_string()).unwrap();
    let err = adapter.complete(&req()).unwrap_err();
    assert_eq!(
        err,
        AnalysisError::Other("provider returned status 500".to_string())
    );
}

#[test]
fn adapter_reports_non_json_success_as_parse_failure() {
    scenario!("[FR-019]");
    // A 200 whose body is not the expected shape degrades to Parse — the
    // retry logic upstream treats it like any other unparseable answer.
    let (base, _request_rx) = one_shot_server("200 OK", r#"{"unexpected":true}"#);

    let adapter =
        MistralAdapter::new(base, "pixtral-12b".to_string(), "sk-test".to_string()).unwrap();
    let err = adapter.complete(&req()).unwrap_err();
    assert_eq!(err, AnalysisError::Parse);
}
