use crate::i18n::localize;
use crate::service::intake::NewIntakeTarget;
use crate::service::weight::{NewWeightTarget, NewWeightTracker};
use chrono::{Duration, NaiveDate};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use validator::{Validate, ValidationError, ValidationErrors};

use super::math_f32::floor_f32;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Wizard {
    pub calorie_target: NewIntakeTarget,
    pub weight_target: NewWeightTarget,
    pub weight_tracker: NewWeightTracker,
}

#[derive(Validate, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WizardInput {
    #[validate(range(min = 18, max = 99, code = "validation.wizard.age"))]
    pub age: i32,
    pub sex: CalculationSex,
    #[validate(range(min = 30.0, max = 300.0, code = "validation.wizard.weight"))]
    pub weight: f32,
    #[validate(range(min = 100.0, max = 220.0, code = "validation.wizard.height"))]
    pub height: f32,
    #[validate(custom(
        function = "validate_activity_level",
        code = "validation.wizard.activity_level"
    ))]
    pub activity_level: f32,
    #[validate(range(min = 0, max = 7, code = "validation.wizard.weekly_difference"))]
    pub weekly_difference: i32,
    pub calculation_goal: CalculationGoal,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WizardResult {
    pub bmr: f32,
    pub tdee: f32,
    pub deficit: f32,
    pub target: f32,
    pub bmi: f32,
    pub bmi_category: BmiCategory,
    pub recommendation: WizardRecommendation,
    pub target_bmi: i32,
    pub target_bmi_upper: i32,
    pub target_bmi_lower: i32,
    pub target_weight: f32,
    pub target_weight_upper: f32,
    pub target_weight_lower: f32,
    pub duration_days: i32,
    pub duration_days_upper: i32,
    pub duration_days_lower: i32,
}

impl WizardResult {
    pub fn specific(bmi: &f32, bmi_category_clone: BmiCategory, target_weight: &f32) -> Self {
        WizardResult {
            bmr: 0.0,
            tdee: 0.0,
            deficit: 0.0,
            target: 0.0,
            bmi: floor_f32(*bmi, 1),
            bmi_category: bmi_category_clone,
            target_weight: floor_f32(*target_weight, 1),
            target_bmi: 0,
            target_bmi_upper: 0,
            target_bmi_lower: 0,
            target_weight_upper: 0.0,
            target_weight_lower: 0.0,
            duration_days: 0,
            duration_days_upper: 0,
            duration_days_lower: 0,
            recommendation: WizardRecommendation::HOLD,
        }
    }
}

#[derive(Validate, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WizardTargetWeightInput {
    #[validate(range(min = 18, max = 99, code = "validation.wizard.age"))]
    pub age: i32,
    pub sex: CalculationSex,
    #[validate(range(min = 30.0, max = 300.0, code = "validation.wizard.weight"))]
    pub current_weight: f32,
    #[validate(range(min = 100.0, max = 220.0, code = "validation.wizard.height"))]
    pub height: f32,
    #[validate(range(min = 30.0, max = 300.0, code = "validation.wizard.weight"))]
    pub target_weight: f32,
    pub start_date: String,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WizardTargetWeightResult {
    #[serde(deserialize_with = "crate::util::serde::date::deserialize")]
    pub date_by_rate: HashMap<i32, String>,
    pub progress_by_rate: HashMap<i32, f32>,
    pub target_classification: BmiCategory,
    pub warning: bool,
    pub message: String,
}

#[derive(Validate, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WizardTargetDateInput {
    #[validate(range(min = 18, max = 99, code = "validation.wizard.age"))]
    pub age: i32,
    pub sex: CalculationSex,
    #[validate(range(min = 30.0, max = 300.0, code = "validation.wizard.weight"))]
    pub current_weight: f32,
    #[validate(range(min = 100.0, max = 220.0, code = "validation.wizard.height"))]
    pub height: f32,
    pub calculation_goal: CalculationGoal,
    pub target_date: String,
    pub start_date: String,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WizardTargetDateResult {
    pub weight_by_rate: HashMap<i32, f32>,
    pub bmi_by_rate: HashMap<i32, f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum CalculationGoal {
    GAIN,
    LOSS,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum CalculationSex {
    MALE,
    FEMALE,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum BmiCategory {
    Underweight,
    StandardWeight,
    Overweight,
    Obese,
    SeverelyObese,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum WizardRecommendation {
    HOLD,
    LOSE,
    GAIN,
}

#[derive(Serialize, Deserialize)]
pub struct ErrorDescription {
    property_name: String,
    message: String,
}

fn validate(input: &dyn Validate) -> Result<(), ValidationErrors> {
    input.validate()
}

fn validate_activity_level(activity_level: f32) -> Result<(), ValidationError> {
    match activity_level {
        1f32 | 1.25f32 | 1.5f32 | 1.75f32 | 2f32 => Ok(()),
        _ => Err(ValidationError::new("Please enter a valid activity level.")),
    }
}

pub fn calculate(wizard_input: WizardInput) -> Result<WizardResult, ValidationErrors> {
    match validate(&wizard_input) {
        Err(e) => Err(localize::localize_validation_errors(&e)),
        Ok(_) => {
            let target_bmi_range = calculate_target_bmi(&wizard_input.age);

            let bmr = calculate_bmr(
                &wizard_input.sex,
                &wizard_input.weight,
                &wizard_input.height,
                &wizard_input.age,
            );

            let tdee = calculate_tdee(&wizard_input.activity_level, &bmr);
            let deficit = calculate_deficit(&wizard_input.weekly_difference);
            let target = calculate_target(&wizard_input.calculation_goal, &tdee, &deficit);

            let bmi = calculate_bmi(&wizard_input.weight, &wizard_input.height);
            let bmi_category = calculate_bmi_category(&bmi);

            let target_bmi_lower = *target_bmi_range.start();
            let target_bmi_upper = *target_bmi_range.end();
            let target_bmi = (target_bmi_upper + target_bmi_lower) / 2;

            let target_weight = calculate_target_weight(&target_bmi_range, &wizard_input.height);
            let target_weight_lower =
                calculate_target_weight_lower(&target_bmi_range, &wizard_input.height);
            let target_weight_upper =
                calculate_target_weight_upper(&target_bmi_range, &wizard_input.height);

            let recommendation = calculate_recommendation(&bmi);

            let mut wizard_result = WizardResult {
                bmr: floor_f32(bmr, 2),
                tdee: floor_f32(tdee, 0),
                deficit: floor_f32(deficit, 0),
                target: floor_f32(target, 0),
                bmi: floor_f32(bmi, 1),
                bmi_category,
                recommendation,
                target_bmi,
                target_bmi_upper,
                target_bmi_lower,
                target_weight: floor_f32(target_weight, 1),
                target_weight_upper: floor_f32(target_weight_upper, 1),
                target_weight_lower: floor_f32(target_weight_lower, 1),
                duration_days: 0,
                duration_days_upper: 0,
                duration_days_lower: 0,
            };

            calculate_duration_days_total(&wizard_input, &mut wizard_result);

            Ok(wizard_result)
        }
    }
}

pub fn calculate_for_target_date(
    input: &WizardTargetDateInput,
) -> Result<WizardTargetDateResult, ValidationErrors> {
    match input.validate() {
        Err(e) => Err(localize::localize_validation_errors(&e)),
        Ok(_) => {
            let start_naive_date =
                NaiveDate::parse_from_str(&input.start_date, "%Y-%m-%d").unwrap();
            let target_naive_date =
                NaiveDate::parse_from_str(&input.target_date, "%Y-%m-%d").unwrap();

            let days_between = (target_naive_date - start_naive_date).num_days() as i32;

            let current_bmi = calculate_bmi(&input.current_weight, &input.height);
            let current_classification = calculate_bmi_category(&current_bmi);

            let rates: Vec<i32> = vec![100, 200, 300, 400, 500, 600, 700];
            let multiplier = if matches!(input.calculation_goal, CalculationGoal::LOSS) {
                -1
            } else {
                1
            };

            let obese_classification = [BmiCategory::Obese, BmiCategory::SeverelyObese];

            let mut result_by_rate: HashMap<i32, WizardResult> = rates
                .into_iter()
                .filter_map(|rate| {
                    let weight =
                        input.current_weight + ((multiplier * days_between * rate) as f32) / 7000.0;

                    let result_bmi = calculate_bmi(&weight, &input.height);
                    let result_bmi_category = calculate_bmi_category(&result_bmi);

                    let result =
                        WizardResult::specific(&result_bmi, result_bmi_category.clone(), &weight);

                    match input.calculation_goal {
                        CalculationGoal::LOSS => {
                            if result_bmi_category != BmiCategory::Underweight {
                                Some((rate, result))
                            } else {
                                None
                            }
                        }
                        _ => {
                            if !obese_classification.contains(&result_bmi_category)
                                || obese_classification.contains(&current_classification)
                            {
                                Some((rate, result))
                            } else {
                                None
                            }
                        }
                    }
                })
                .collect();

            // calculate a custom rate to present at least one viable result
            if result_by_rate.is_empty() {
                let target_bmi = calculate_target_bmi(&input.age);
                let target_weight = calculate_target_weight(&target_bmi, &input.height);

                let difference = floor_f32(
                    match input.calculation_goal {
                        CalculationGoal::GAIN => target_weight - input.current_weight,
                        CalculationGoal::LOSS => input.current_weight - target_weight,
                    },
                    0,
                ) as i32;

                let rate = floor_f32(difference as f32 * 7000.0 / (days_between as f32), 0) as i32;

                let result_bmi = calculate_bmi(&target_weight, &input.height);
                let result_bmi_category = calculate_bmi_category(&result_bmi);

                let result = WizardResult::specific(
                    &result_bmi,
                    result_bmi_category.clone(),
                    &target_weight,
                );

                result_by_rate.insert(rate, result);
            }

            let mut weight_by_rate = HashMap::new();
            let mut bmi_by_rate = HashMap::new();

            result_by_rate.into_iter().for_each(|field| {
                weight_by_rate.insert(field.0, field.1.target_weight);
                bmi_by_rate.insert(field.0, field.1.bmi);
            });

            Ok(WizardTargetDateResult {
                weight_by_rate,
                bmi_by_rate,
            })
        }
    }
}

pub fn calculate_for_target_weight(
    input: &WizardTargetWeightInput,
) -> Result<WizardTargetWeightResult, ValidationErrors> {
    match input.validate() {
        Err(e) => Err(localize::localize_validation_errors(&e)),
        Ok(_) => {
            let current_bmi = calculate_bmi(&input.current_weight, &input.height);
            let target_bmi = calculate_bmi(&input.target_weight, &input.height);

            let current_classification = calculate_bmi_category(&current_bmi);
            let target_classification = calculate_bmi_category(&target_bmi);

            let difference = if input.target_weight > input.current_weight {
                input.target_weight - input.current_weight
            } else {
                input.current_weight - input.target_weight
            };

            let warning = matches!(
                target_classification,
                BmiCategory::Underweight | BmiCategory::Obese | BmiCategory::SeverelyObese
            );

            let mut message = String::new();

            if let BmiCategory::Underweight = target_classification {
                if input.target_weight < input.current_weight {
                    if current_classification == BmiCategory::Underweight {
                        message = "wizard.warning.underweight".to_string();
                    } else {
                        message = "wizard.classification.underweight".to_string();
                    }
                }
            } else if let BmiCategory::Obese = target_classification {
                if input.target_weight > input.current_weight {
                    if current_classification == BmiCategory::Obese {
                        message = "wizard.warning.obese".to_string();
                    } else {
                        message = "wizard.classification.obese".to_string();
                    }
                }
            } else if let BmiCategory::SeverelyObese = target_classification {
                if input.target_weight > input.current_weight {
                    if current_classification == BmiCategory::SeverelyObese {
                        message = "wizard.warning.severely_obese".to_string();
                    } else {
                        message = "wizard.classification.severely_obese".to_string();
                    }
                }
            }

            let mut date_by_rate = HashMap::new();
            let mut progress_by_rate = HashMap::new();

            if message.is_empty() {
                let rates = vec![100, 200, 300, 400, 500, 600, 700];

                for rate in rates {
                    let days = floor_f32(difference * 7000.0 / rate as f32, 0) as i64;

                    let progress = floor_f32(rate as f32 * 7.0 / 7000.0, 2);

                    let date = NaiveDate::parse_from_str(&input.start_date, "%Y-%m-%d").unwrap();

                    date_by_rate.insert(rate, (date + Duration::days(days)).to_string());
                    progress_by_rate.insert(rate, progress);
                }
            }

            Ok(WizardTargetWeightResult {
                date_by_rate,
                progress_by_rate,
                target_classification,
                warning,
                message,
            })
        }
    }
}

fn calculate_bmr(sex: &CalculationSex, weight: &f32, height: &f32, age: &i32) -> f32 {
    match sex {
        CalculationSex::MALE => (66.0 + 13.7 * weight + 5.0 * height - 6.8 * (*age as f32)).round(),
        CalculationSex::FEMALE => {
            (655.0 + 9.6 * weight + 1.8 * height - 4.7 * (*age as f32)).round()
        }
    }
}

fn calculate_tdee(activity_level: &f32, bmr: &f32) -> f32 {
    activity_level * bmr
}

fn calculate_deficit(weekly_difference: &i32) -> f32 {
    *weekly_difference as f32 / 10.0 * 7000.0 / 7.0
}

fn calculate_target(calculation_goal: &CalculationGoal, tdee: &f32, deficit: &f32) -> f32 {
    match calculation_goal {
        CalculationGoal::GAIN => tdee + deficit,
        CalculationGoal::LOSS => tdee - deficit,
    }
}

fn calculate_bmi(weight: &f32, height: &f32) -> f32 {
    weight / ((height / 100.0).powi(2))
}

fn calculate_bmi_category(bmi: &f32) -> BmiCategory {
    let bmi_rounded_1 = floor_f32(*bmi, 1);

    match bmi_rounded_1 {
        0.0..=18.4 => BmiCategory::Underweight,
        18.5..=24.9 => BmiCategory::StandardWeight,
        25.0..=29.9 => BmiCategory::Overweight,
        30.0..=40.0 => BmiCategory::Obese,
        _ => BmiCategory::SeverelyObese,
    }
}

/// Calculate target BMI range based on WHO/CDC standards.
/// Returns fixed range of 20-25 for all adults, representing optimal BMI for health and longevity.
/// This is based on mortality research showing lowest death rates at BMI 20-25.
fn calculate_target_bmi(_age: &i32) -> std::ops::RangeInclusive<i32> {
    20..=25
}

fn calculate_target_weight(target_bmi: &std::ops::RangeInclusive<i32>, height: &f32) -> f32 {
    ((target_bmi.start() + target_bmi.end()) as f32 / 2.0) * (height / 100.0).powi(2)
}

fn calculate_target_weight_lower(target_bmi: &std::ops::RangeInclusive<i32>, height: &f32) -> f32 {
    *(target_bmi.start()) as f32 * (height / 100.0).powi(2)
}

fn calculate_target_weight_upper(target_bmi: &std::ops::RangeInclusive<i32>, height: &f32) -> f32 {
    *(target_bmi.end()) as f32 * (height / 100.0).powi(2)
}

fn calculate_duration_days_total(wizard_input: &WizardInput, wizard_result: &mut WizardResult) {
    match wizard_input.calculation_goal {
        CalculationGoal::GAIN => {
            wizard_result.duration_days = calculate_duration_days(
                wizard_result.target_weight,
                wizard_input.weight,
                wizard_result.deficit,
            );
            wizard_result.duration_days_upper = calculate_duration_days(
                wizard_result.target_weight_upper,
                wizard_input.weight,
                wizard_result.deficit,
            );
            wizard_result.duration_days_lower = calculate_duration_days(
                wizard_result.target_weight_lower,
                wizard_input.weight,
                wizard_result.deficit,
            );
        }
        CalculationGoal::LOSS => {
            wizard_result.duration_days = calculate_duration_days(
                wizard_input.weight,
                wizard_result.target_weight,
                wizard_result.deficit,
            );
            wizard_result.duration_days_upper = calculate_duration_days(
                wizard_input.weight,
                wizard_result.target_weight_upper,
                wizard_result.deficit,
            );
            wizard_result.duration_days_lower = calculate_duration_days(
                wizard_input.weight,
                wizard_result.target_weight_lower,
                wizard_result.deficit,
            );
        }
    }
}

fn calculate_duration_days(weight: f32, target_weight: f32, deficit: f32) -> i32 {
    floor_f32((weight - target_weight) * 7000.0 / deficit, 0) as i32
}

/// Calculate recommendation based on WHO/CDC fixed BMI categories with optimal range consideration.
/// Uses standard thresholds: <18.5 (Underweight), 18.5-24.9 (Normal), 25-29.9 (Overweight), ≥30 (Obese)
/// Within "Normal" range, recommends GAIN if BMI < 20 (below optimal mortality range)
fn calculate_recommendation(bmi: &f32) -> WizardRecommendation {
    let bmi_rounded = floor_f32(*bmi, 1);

    if bmi_rounded < 18.5 {
        WizardRecommendation::GAIN
    } else if bmi_rounded < 20.0 {
        // Low-normal: In healthy range (18.5+) but below optimal (20-25)
        // Recommend gentle gain to reach optimal range
        WizardRecommendation::GAIN
    } else if bmi_rounded <= 25.0 {
        // Optimal range: maintain
        WizardRecommendation::HOLD
    } else {
        // Overweight or obese: lose weight
        WizardRecommendation::LOSE
    }
}
