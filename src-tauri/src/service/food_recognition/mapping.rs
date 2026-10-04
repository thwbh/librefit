//! Deterministic mapping from an analysis result to a single intake candidate
//! (add-food-recognition, FR).

use chrono::{Local, Timelike};
use diesel::prelude::*;
use serde::Serialize;

use crate::db::schema::food_category;
use crate::service::intake::NewIntake;

use super::analysis::AnalysisResult;

/// Below this overall confidence the candidate is flagged for extra scrutiny
/// (FR-023).
const LOW_CONFIDENCE_THRESHOLD: f32 = 0.5;

/// Intake `description` column bound (mirrors the `NewIntake` validation).
const MAX_DESCRIPTION_LEN: usize = 500;

/// A single confirmable candidate pre-filling the intake mask.
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct IntakeCandidate {
    pub intake: NewIntake,
    pub low_confidence: bool,
}

/// Collapse an analysis result into one `NewIntake` (FR-020/021/022/023):
/// concatenated item names, summed calorie estimates, locally-resolved category.
pub fn to_candidate(
    conn: &mut SqliteConnection,
    result: &AnalysisResult,
) -> QueryResult<IntakeCandidate> {
    let mut description = result
        .items
        .iter()
        .map(|i| i.name.trim())
        .filter(|n| !n.is_empty())
        .collect::<Vec<_>>()
        .join(", ");
    if description.chars().count() > MAX_DESCRIPTION_LEN {
        description = description.chars().take(MAX_DESCRIPTION_LEN).collect();
    }

    let amount: i32 = result.items.iter().map(|i| i.calorie_estimate).sum();
    let category = resolve_default_category(conn)?;
    let today = Local::now().format("%Y-%m-%d").to_string();

    Ok(IntakeCandidate {
        intake: NewIntake::new(today, amount, category, Some(description)),
        low_confidence: result.confidence < LOW_CONFIDENCE_THRESHOLD,
    })
}

/// The category is resolved locally — never taken from the model (FR-022). Use
/// the same time-of-day windows the manual-entry flow defaults to, falling back
/// to whatever category exists if the expected one is missing.
fn resolve_default_category(conn: &mut SqliteConnection) -> QueryResult<String> {
    let desired = time_of_day_shortvalue();
    let found = food_category::table
        .find(desired)
        .select(food_category::shortvalue)
        .first::<String>(conn)
        .optional()?;
    match found {
        Some(s) => Ok(s),
        None => food_category::table
            .select(food_category::shortvalue)
            .first::<String>(conn),
    }
}

fn time_of_day_shortvalue() -> &'static str {
    match Local::now().hour() {
        5..=10 => "b",
        11..=14 => "l",
        15..=20 => "d",
        _ => "s",
    }
}
