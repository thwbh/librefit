//! The fixed analysis schema and failure taxonomy (add-food-recognition, FR).

use serde::{Deserialize, Serialize};

/// One food item detected in a photo. The model is asked to itemize (more
/// accurate than a single blended total); the mapping layer collapses items into
/// one intake entry (FR-021).
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisItem {
    pub name: String,
    /// Estimated calories for this item, in kcal.
    pub calorie_estimate: i32,
}

/// The validated result of one analysis call. `confidence` is 0.0–1.0; the
/// mapping layer flags low-confidence results to the user (FR-023).
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisResult {
    pub items: Vec<AnalysisItem>,
    #[serde(default = "default_confidence")]
    pub confidence: f32,
}

fn default_confidence() -> f32 {
    // Absent confidence is treated as "unknown but usable"; not low enough to
    // trip the warning on its own.
    1.0
}

/// Classified analysis failures (FR-005/006, FR-019, FR-028/029/030). Each maps
/// to a distinct user-facing error that nudges to manual entry.
#[derive(Debug, Clone, PartialEq)]
pub enum AnalysisError {
    /// Provider rejected the credentials.
    BadKey,
    /// Provider quota or rate limit exceeded.
    Quota,
    /// Network failure or request did not complete before timeout.
    Timeout,
    /// Response could not be parsed into `AnalysisResult`, even after one retry.
    Parse,
    /// Any other provider/transport failure.
    Other(String),
}

impl AnalysisError {
    /// Stable machine code so the frontend can pick the right localized message.
    pub fn code(&self) -> &'static str {
        match self {
            AnalysisError::BadKey => "bad_key",
            AnalysisError::Quota => "quota",
            AnalysisError::Timeout => "timeout",
            AnalysisError::Parse => "parse",
            AnalysisError::Other(_) => "other",
        }
    }
}

impl std::fmt::Display for AnalysisError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        // Never includes image bytes or raw response content (FR-010).
        match self {
            AnalysisError::Other(msg) => write!(f, "{}: {}", self.code(), msg),
            _ => write!(f, "{}", self.code()),
        }
    }
}

impl std::error::Error for AnalysisError {}

/// Parse and validate a raw provider JSON string into an `AnalysisResult`.
/// Rejects empty item lists and non-positive calorie values so the mapping layer
/// always receives something meaningful.
pub fn parse_analysis(raw: &str) -> Result<AnalysisResult, AnalysisError> {
    let result: AnalysisResult = serde_json::from_str(raw).map_err(|_| AnalysisError::Parse)?;
    if result.items.is_empty() {
        return Err(AnalysisError::Parse);
    }
    if result.items.iter().any(|i| i.calorie_estimate <= 0) {
        return Err(AnalysisError::Parse);
    }
    Ok(result)
}
