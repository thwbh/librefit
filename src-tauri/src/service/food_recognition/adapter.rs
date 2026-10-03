//! Provider adapter (add-food-recognition, FR).
//!
//! One Mistral/OpenAI-compatible adapter behind a trait (D1). The trait is both
//! the extension point for future providers and the test seam: `FakeProviderAdapter`
//! lets the parsing/retry/mapping/error scenarios run without network.

use std::collections::VecDeque;
use std::sync::Mutex;
use std::time::Duration;

use base64::Engine;
use serde_json::json;

use super::analysis::{parse_analysis, AnalysisError, AnalysisResult};

/// Everything a single analysis call needs. Image bytes stay in memory and are
/// never logged (FR-009/FR-010).
#[derive(Debug, Clone)]
pub struct AnalysisRequest {
    pub image: Vec<u8>,
    pub mime: String,
    pub locale: String,
}

/// A provider that can turn an image into a raw model completion and can be
/// health-checked. Implementations MUST NOT log image bytes or response content.
pub trait ProviderAdapter: Send + Sync {
    /// One completion call, returning the model's raw JSON string.
    fn complete(&self, request: &AnalysisRequest) -> Result<String, AnalysisError>;
    /// A cheap call used by "test connection" (FR-004/005/006).
    fn test_connection(&self) -> Result<(), AnalysisError>;
}

/// Run one analysis with exactly one retry on parse failure (FR-017/018/019).
pub fn analyze(
    adapter: &dyn ProviderAdapter,
    request: &AnalysisRequest,
) -> Result<AnalysisResult, AnalysisError> {
    let raw = adapter.complete(request)?;
    match parse_analysis(&raw) {
        Ok(result) => Ok(result),
        Err(AnalysisError::Parse) => {
            log::warn!("food_recognition: response failed validation, retrying once");
            let retry = adapter.complete(request)?;
            parse_analysis(&retry)
        }
        Err(e) => Err(e),
    }
}

// ============================================================================
// Mistral / OpenAI-compatible adapter
// ============================================================================

const REQUEST_TIMEOUT: Duration = Duration::from_secs(45);

pub struct MistralAdapter {
    base_url: String,
    model: String,
    api_key: String,
    client: reqwest::blocking::Client,
}

impl MistralAdapter {
    pub fn new(base_url: String, model: String, api_key: String) -> Result<Self, AnalysisError> {
        let client = reqwest::blocking::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .build()
            .map_err(|e| AnalysisError::Other(e.to_string()))?;
        Ok(Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            model,
            api_key,
            client,
        })
    }

    fn system_prompt(locale: &str) -> String {
        format!(
            "You identify foods in a meal photo and estimate calories. Respond ONLY with JSON \
             matching: {{\"items\":[{{\"name\":string,\"calorieEstimate\":integer}}],\"confidence\":number}}. \
             Estimate kcal per item. confidence is 0..1 for the overall estimate. Use food names in \
             the '{}' locale. Do not include any prose.",
            locale
        )
    }

    fn data_uri(image: &[u8], mime: &str) -> String {
        let b64 = base64::engine::general_purpose::STANDARD.encode(image);
        format!("data:{};base64,{}", mime, b64)
    }

    /// Map transport/HTTP failures to the error taxonomy. Never includes body.
    fn classify(err: &reqwest::Error) -> AnalysisError {
        if err.is_timeout() || err.is_connect() {
            AnalysisError::Timeout
        } else {
            AnalysisError::Other(err.to_string())
        }
    }

    fn classify_status(status: reqwest::StatusCode) -> AnalysisError {
        match status.as_u16() {
            401 | 403 => AnalysisError::BadKey,
            429 => AnalysisError::Quota,
            408 | 504 => AnalysisError::Timeout,
            _ => AnalysisError::Other(format!("provider returned status {}", status.as_u16())),
        }
    }
}

impl ProviderAdapter for MistralAdapter {
    fn complete(&self, request: &AnalysisRequest) -> Result<String, AnalysisError> {
        let body = json!({
            "model": self.model,
            "temperature": 0,
            "response_format": { "type": "json_object" },
            "messages": [
                { "role": "system", "content": Self::system_prompt(&request.locale) },
                { "role": "user", "content": [
                    { "type": "text", "text": "Identify the foods and estimate calories." },
                    { "type": "image_url", "image_url": {
                        "url": Self::data_uri(&request.image, &request.mime)
                    }}
                ]}
            ]
        });

        let resp = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .map_err(|e| Self::classify(&e))?;

        if !resp.status().is_success() {
            return Err(Self::classify_status(resp.status()));
        }

        let payload: serde_json::Value = resp.json().map_err(|_| AnalysisError::Parse)?;
        payload["choices"][0]["message"]["content"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or(AnalysisError::Parse)
    }

    fn test_connection(&self) -> Result<(), AnalysisError> {
        let resp = self
            .client
            .get(format!("{}/models", self.base_url))
            .bearer_auth(&self.api_key)
            .send()
            .map_err(|e| Self::classify(&e))?;

        if resp.status().is_success() {
            Ok(())
        } else {
            Err(Self::classify_status(resp.status()))
        }
    }
}

// ============================================================================
// Fake adapter (test seam — public so integration tests can use it)
// ============================================================================

/// A scripted `ProviderAdapter` for tests. `complete` pops the next queued
/// response per call, so a `[malformed, valid]` script exercises the retry path.
pub struct FakeProviderAdapter {
    responses: Mutex<VecDeque<Result<String, AnalysisError>>>,
    test_result: Mutex<Result<(), AnalysisError>>,
}

impl FakeProviderAdapter {
    /// Always return the given raw JSON for every `complete` call.
    pub fn with_response(raw: &str) -> Self {
        let mut q = VecDeque::new();
        // Enough entries to cover the initial call plus a retry.
        q.push_back(Ok(raw.to_string()));
        q.push_back(Ok(raw.to_string()));
        Self {
            responses: Mutex::new(q),
            test_result: Mutex::new(Ok(())),
        }
    }

    /// Script an exact sequence of raw responses (one popped per `complete`).
    pub fn with_script(responses: Vec<Result<String, AnalysisError>>) -> Self {
        Self {
            responses: Mutex::new(responses.into()),
            test_result: Mutex::new(Ok(())),
        }
    }

    /// Fail every `complete` call with the given error.
    pub fn failing(err: AnalysisError) -> Self {
        let mut q = VecDeque::new();
        q.push_back(Err(err.clone()));
        q.push_back(Err(err));
        Self {
            responses: Mutex::new(q),
            test_result: Mutex::new(Ok(())),
        }
    }

    /// Set the result returned by `test_connection`.
    pub fn with_test_result(self, result: Result<(), AnalysisError>) -> Self {
        *self.test_result.lock().unwrap() = result;
        self
    }
}

impl ProviderAdapter for FakeProviderAdapter {
    fn complete(&self, _request: &AnalysisRequest) -> Result<String, AnalysisError> {
        self.responses
            .lock()
            .unwrap()
            .pop_front()
            .unwrap_or(Err(AnalysisError::Other(
                "no scripted response".to_string(),
            )))
    }

    fn test_connection(&self) -> Result<(), AnalysisError> {
        self.test_result.lock().unwrap().clone()
    }
}
