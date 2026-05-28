use std::collections::HashMap;

use chrono::{Days, NaiveDate};

use librefit_lib::scenario;
use librefit_lib::service::intake::{IntakeTarget, NewIntakeTarget};
use librefit_lib::service::weight::{
    NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker,
};
use librefit_lib::service::wizard::{
    wizard_calculate_for_target_date, wizard_calculate_for_target_weight, wizard_calculate_tdee,
    wizard_create_targets, BmiCategory, CalculationGoal, CalculationSex, Wizard, WizardInput,
    WizardResult, WizardTargetDateInput, WizardTargetWeightInput,
};
use tauri::Manager;
use validator::Validate;

use crate::helpers::setup_test_pool;

#[test]
fn weight_loss_calculation_for_men() {
    scenario!("[OB-009]", "[OB-013]");
    let input: WizardInput = WizardInput {
        age: 30,
        weight: 90.0,
        height: 180.0,
        sex: CalculationSex::MALE,
        activity_level: 1.5,
        weekly_difference: 5,
        calculation_goal: CalculationGoal::LOSS,
    };

    let cmd_result = wizard_calculate_tdee(input);

    assert_eq!(cmd_result.is_ok(), true);

    let result: WizardResult = cmd_result.unwrap();

    assert_eq!(1995.0, result.bmr);
    assert_eq!(500.0, result.deficit);
    assert_eq!(27.8, result.bmi);
    assert_eq!(2993.0, result.tdee);
    assert_eq!(BmiCategory::Overweight, result.bmi_category);
    assert_eq!(20, result.target_bmi_lower); // Fixed range for all ages
    assert_eq!(25, result.target_bmi_upper); // Fixed range for all ages
    assert_eq!(64.8, result.target_weight_lower);
    assert_eq!(81.0, result.target_weight_upper);
    assert_eq!(72.9, result.target_weight);
    assert_eq!(2493.0, result.target);
    assert_eq!(239, result.duration_days);
}

#[test]
fn weight_gain_for_women_in_hold_range() {
    scenario!("[OB-014]");
    let input = WizardInput {
        age: 25,
        weight: 52.0,
        height: 155.0,
        weekly_difference: 1,
        activity_level: 1.25,
        calculation_goal: CalculationGoal::GAIN,
        sex: CalculationSex::FEMALE,
    };

    let cmd_result = wizard_calculate_tdee(input);

    assert_eq!(cmd_result.is_ok(), true);

    let result: WizardResult = cmd_result.unwrap();

    assert_eq!(1316.0, result.bmr);
    assert_eq!(100.0, result.deficit);
    assert_eq!(21.6, result.bmi);
    assert_eq!(1645.0, result.tdee);
    assert_eq!(BmiCategory::StandardWeight, result.bmi_category);
    assert_eq!(20, result.target_bmi_lower); // Fixed range for all ages
    assert_eq!(25, result.target_bmi_upper); // Fixed range for all ages
    assert_eq!(22, result.target_bmi);
    assert_eq!(48.0, result.target_weight_lower);
    assert_eq!(60.1, result.target_weight_upper);
    assert_eq!(54.1, result.target_weight);
    assert_eq!(1745.0, result.target);
    assert_eq!(147, result.duration_days);
}

#[test]
fn underweight_classification_for_men() {
    scenario!("[OB-011]");
    let input_underweight = WizardInput {
        age: 25,
        weight: 59.7,
        height: 180.0,
        weekly_difference: 0,
        activity_level: 1.0,
        calculation_goal: CalculationGoal::LOSS,
        sex: CalculationSex::MALE,
    };

    let result_underweight = wizard_calculate_tdee(input_underweight).unwrap();

    assert_eq!(result_underweight.bmi, 18.4);
    assert_eq!(result_underweight.bmi_category, BmiCategory::Underweight);
}

#[test]
fn obese_classification_for_men() {
    scenario!("[OB-009]");
    let input_obese = WizardInput {
        age: 25,
        weight: 125.0,
        height: 180.0,
        weekly_difference: 0,
        activity_level: 1.0,
        calculation_goal: CalculationGoal::LOSS,
        sex: CalculationSex::MALE,
    };

    let result_obese = wizard_calculate_tdee(input_obese).unwrap();

    assert_eq!(result_obese.bmi_category, BmiCategory::Obese);
    assert_eq!(result_obese.bmi, 38.6);
}

#[test]
fn severely_obese_classification_for_men() {
    scenario!("[OB-009]");
    let input_severely_obese = WizardInput {
        age: 45,
        weight: 150.0,
        height: 180.0,
        weekly_difference: 0,
        activity_level: 1.0,
        calculation_goal: CalculationGoal::LOSS,
        sex: CalculationSex::MALE,
    };

    let result_severely_obese = wizard_calculate_tdee(input_severely_obese).unwrap();

    assert_eq!(
        result_severely_obese.bmi_category,
        BmiCategory::SeverelyObese
    );
    assert_eq!(result_severely_obese.bmi, 46.3);
}

#[test]
fn obese_classification_for_women() {
    scenario!("[OB-009]");
    let input_obese = WizardInput {
        age: 30,
        weight: 80.0,
        height: 160.0,
        weekly_difference: 0,
        activity_level: 1.0,
        calculation_goal: CalculationGoal::LOSS,
        sex: CalculationSex::FEMALE,
    };

    let result_obese = wizard_calculate_tdee(input_obese).unwrap();

    assert_eq!(result_obese.bmi_category, BmiCategory::Obese);
    assert_eq!(result_obese.bmi, 31.2);
}

#[test]
fn underweight_classification_for_women() {
    scenario!("[OB-011]");
    let input_underweight = WizardInput {
        age: 18,
        weight: 40.0,
        height: 150.0,
        weekly_difference: 0,
        activity_level: 1.0,
        calculation_goal: CalculationGoal::LOSS,
        sex: CalculationSex::FEMALE,
    };

    let result_underweight = wizard_calculate_tdee(input_underweight).unwrap();

    assert_eq!(result_underweight.bmi_category, BmiCategory::Underweight);
    assert_eq!(result_underweight.bmi, 17.8);
}

#[test]
fn severely_obese_classification_for_women() {
    scenario!("[OB-009]");
    let input_severely_obese = WizardInput {
        age: 45,
        weight: 120.0,
        height: 165.0,
        weekly_difference: 0,
        activity_level: 1.0,
        calculation_goal: CalculationGoal::LOSS,
        sex: CalculationSex::FEMALE,
    };

    let result_severely_obese = wizard_calculate_tdee(input_severely_obese).unwrap();

    assert_eq!(
        result_severely_obese.bmi_category,
        BmiCategory::SeverelyObese
    );
    assert_eq!(result_severely_obese.bmi, 44.1);
}

/// Verify integrity of the calculation function that aims for a desired end date.
#[test]
fn caclulate_target_date_weight_loss() {
    let start_date_nd = NaiveDate::from_ymd_opt(2025, 01, 01).unwrap();
    let target_date_nd = start_date_nd.checked_add_days(Days::new(150)).unwrap();

    let input_target_date = WizardTargetDateInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 90.0,
        height: 180.0,
        calculation_goal: CalculationGoal::LOSS,
        start_date: start_date_nd.format("%Y-%m-%d").to_string(),
        target_date: target_date_nd.format("%Y-%m-%d").to_string(),
    };

    let result = wizard_calculate_for_target_date(input_target_date).unwrap();

    assert_ne!(result.bmi_by_rate.len(), 0);
    assert_ne!(result.weight_by_rate.len(), 0);

    // todo check rates on a granular level
}

/// Verify integrity of the calculation function that aims for a desired target weight.
#[test]
fn calculate_target_weight_date() {
    let start_date_nd = NaiveDate::from_ymd_opt(2025, 01, 01).unwrap();

    let input_target_weight = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 90.0,
        height: 180.0,
        target_weight: 80.0,
        start_date: start_date_nd.format("%Y-%m-%d").to_string(),
    };

    let result = wizard_calculate_for_target_weight(input_target_weight).unwrap();

    assert_eq!(result.warning, false);
    assert_eq!(result.message, "".to_string());

    assert_eq!(
        result.date_by_rate[&700],
        NaiveDate::from_ymd_opt(2025, 04, 11)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string()
    );

    assert_eq!(
        result.date_by_rate[&600],
        NaiveDate::from_ymd_opt(2025, 04, 28)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string()
    );
    assert_eq!(
        result.date_by_rate[&500],
        NaiveDate::from_ymd_opt(2025, 05, 21)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string()
    );
    assert_eq!(
        result.date_by_rate[&400],
        NaiveDate::from_ymd_opt(2025, 06, 25)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string()
    );
    assert_eq!(
        result.date_by_rate[&300],
        NaiveDate::from_ymd_opt(2025, 08, 22)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string()
    );
    assert_eq!(
        result.date_by_rate[&200],
        NaiveDate::from_ymd_opt(2025, 12, 17)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string()
    );
    assert_eq!(
        result.date_by_rate[&100],
        NaiveDate::from_ymd_opt(2026, 12, 02)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string()
    );
}

/// Verfiy [WizardInput] validation and expected error codes.
#[test]
fn return_validation_errors() {
    let invalid_input = WizardInput {
        age: 13,
        weight: 20.0,
        height: 340.0,
        weekly_difference: 8,
        activity_level: 0.5,
        calculation_goal: CalculationGoal::LOSS,
        sex: CalculationSex::FEMALE,
    };

    let validation_errors = invalid_input.validate().unwrap_err();
    let age_error = validation_errors.field_errors().get("age").unwrap()[0]
        .code
        .clone();

    let weight_error = validation_errors.field_errors().get("weight").unwrap()[0]
        .code
        .clone();

    let height_error = validation_errors.field_errors().get("height").unwrap()[0]
        .code
        .clone();

    let weekly_difference_error = validation_errors
        .field_errors()
        .get("weekly_difference")
        .unwrap()[0]
        .code
        .clone();

    let activity_level_error = validation_errors
        .field_errors()
        .get("activity_level")
        .unwrap()[0]
        .code
        .clone();

    assert_eq!(age_error, "validation.wizard.age");
    assert_eq!(weight_error, "validation.wizard.weight");
    assert_eq!(height_error, "validation.wizard.height");
    assert_eq!(
        weekly_difference_error,
        "validation.wizard.weekly_difference"
    );
    assert_eq!(activity_level_error, "validation.wizard.activity_level");
}

/// Verify [WizardTargetDateInput] validation and expected error codes.
#[test]
fn return_target_date_validation_errors() {
    let invalid_target_date_input = WizardTargetDateInput {
        age: 100,
        sex: CalculationSex::FEMALE,
        current_weight: 29.9,
        height: 99.9,
        calculation_goal: CalculationGoal::GAIN,
        start_date: "2024-01-01".to_string(),
        target_date: "2024-06-01".to_string(),
    };

    let validation_errors = invalid_target_date_input.validate().unwrap_err();

    let age_error = validation_errors.field_errors().get("age").unwrap()[0]
        .code
        .clone();

    let current_weight_error = validation_errors
        .field_errors()
        .get("current_weight")
        .unwrap()[0]
        .code
        .clone();

    let height_error = validation_errors.field_errors().get("height").unwrap()[0]
        .code
        .clone();

    assert_eq!(age_error, "validation.wizard.age");
    assert_eq!(current_weight_error, "validation.wizard.weight");
    assert_eq!(height_error, "validation.wizard.height");
}

/// Verfiy [WizardTargetWeightInput] validation and expected error codes.
#[test]
fn return_target_weight_validation_errors() {
    let invalid_target_weight_input = WizardTargetWeightInput {
        age: 100,
        sex: CalculationSex::MALE,
        height: 220.1,
        current_weight: 300.1,
        target_weight: 29.9,
        start_date: "2024-06-01".to_string(),
    };

    let validation_errors = invalid_target_weight_input.validate().unwrap_err();

    let age_error = validation_errors.field_errors().get("age").unwrap()[0]
        .code
        .clone();

    let current_weight_error = validation_errors
        .field_errors()
        .get("current_weight")
        .unwrap()[0]
        .code
        .clone();

    let height_error = validation_errors.field_errors().get("height").unwrap()[0]
        .code
        .clone();

    let target_weight_error = validation_errors
        .field_errors()
        .get("target_weight")
        .unwrap()[0]
        .code
        .clone();

    assert_eq!(age_error, "validation.wizard.age");
    assert_eq!(current_weight_error, "validation.wizard.weight");
    assert_eq!(height_error, "validation.wizard.height");
    assert_eq!(target_weight_error, "validation.wizard.weight");
}

/// Verify that input leads to 'underweight' BMI classification.
#[test]
fn return_underweight_classification() {
    let underweight_target_weight_input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 60.0,
        height: 170.0,
        target_weight: 50.0,
        start_date: "2025-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(underweight_target_weight_input).unwrap();

    assert_eq!(result.warning, true);
    assert_eq!(result.message, "wizard.classification.underweight");
}

/// Verify that input leads to 'obese' BMI classification.
#[test]
fn return_obese_classification() {
    let obese_target_weight_input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 60.0,
        height: 170.0,
        target_weight: 110.0,
        start_date: "2025-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(obese_target_weight_input).unwrap();

    assert_eq!(result.warning, true);
    assert_eq!(result.message, "wizard.classification.obese");
}

/// Verify that input leads to 'severely obese' BMI classification.
#[test]
fn return_severely_obese_classification() {
    let severely_obese_target_weight_input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 60.0,
        height: 170.0,
        target_weight: 150.0,
        start_date: "2025-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(severely_obese_target_weight_input).unwrap();

    assert_eq!(result.warning, true);
    assert_eq!(result.message, "wizard.classification.severely_obese");
}

#[test]
fn return_underweight_warning() {
    scenario!("[OB-012]");
    let underweight_target_weight_input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 50.0, // currently underweight
        height: 170.0,
        target_weight: 45.0, // desired weight even lower
        start_date: "2025-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(underweight_target_weight_input).unwrap();

    assert_eq!(result.warning, true);
    assert_eq!(result.message, "wizard.warning.underweight");
}

/// Verify that input leads to warning for already 'obese' classified BMI values.
#[test]
fn return_obese_warning() {
    let obese_target_weight_input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 100.0, // currently obese
        height: 170.0,
        target_weight: 110.0, // desired weight even higher
        start_date: "2025-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(obese_target_weight_input).unwrap();

    assert_eq!(result.warning, true);
    assert_eq!(result.message, "wizard.warning.obese");
}

/// Verify that input leads to warning for already 'severely_obese' classified BMI values.
#[test]
fn return_severely_obese_warning() {
    let severely_obese_target_weight_input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 150.0, // currently severely obese
        height: 170.0,
        target_weight: 160.0, // desired weight even higher
        start_date: "2025-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(severely_obese_target_weight_input).unwrap();

    assert_eq!(result.warning, true);
    assert_eq!(result.message, "wizard.warning.severely_obese");
}

#[test]
fn calculate_weight_loss_duration() {
    let expected: std::collections::HashMap<i32, i64> = vec![
        (100, 1190),
        (200, 595),
        (300, 397),
        (400, 298),
        (500, 238),
        (600, 198),
        (700, 170),
    ]
    .into_iter()
    .collect();

    let calculation_start_date_nd = NaiveDate::from_ymd_opt(2025, 01, 01).unwrap();

    let input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 100.0,
        height: 170.0,
        target_weight: 83.0,
        start_date: calculation_start_date_nd.format("%Y-%m-%d").to_string(),
    };

    let result = wizard_calculate_for_target_weight(input).unwrap();

    assert_eq!(result.target_classification, BmiCategory::Overweight);
    assert_eq!(result.warning, false);
    assert_eq!(result.message, "".to_string());

    for (rate, days) in expected {
        let expected_date = calculation_start_date_nd
            .clone()
            .checked_add_days(Days::new(days as u64))
            .unwrap();

        assert_eq!(
            result.date_by_rate.get(&rate).unwrap(),
            &expected_date.format("%Y-%m-%d").to_string()
        );
    }
}

#[test]
fn calculate_weight_gain_duration() {
    let expected: HashMap<i32, i64> = vec![
        (100, 350),
        (200, 175),
        (300, 117),
        (400, 88),
        (500, 70),
        (600, 58),
        (700, 50),
    ]
    .into_iter()
    .collect();

    let calculation_start_date_nd = NaiveDate::from_ymd_opt(2025, 01, 01).unwrap();

    let input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::FEMALE,
        current_weight: 50.0,
        height: 155.0,
        target_weight: 45.0,
        start_date: calculation_start_date_nd.format("%Y-%m-%d").to_string(),
    };

    let result = wizard_calculate_for_target_weight(input).unwrap();

    assert_eq!(result.target_classification, BmiCategory::StandardWeight);
    assert_eq!(result.warning, false);
    assert_eq!(result.message, "".to_string());

    for (rate, days) in expected {
        let expected_date = calculation_start_date_nd
            .clone()
            .checked_add_days(Days::new(days as u64))
            .unwrap();

        assert_eq!(
            result.date_by_rate.get(&rate).unwrap(),
            &expected_date.format("%Y-%m-%d").to_string()
        );
    }
}

#[test]
fn calculate_target_weights_for_specific_weight_loss_goal() {
    let start_date_nd = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();
    let target_date_nd = start_date_nd.checked_add_days(Days::new(250)).unwrap();

    let expected_weight_by_rate: HashMap<i32, f32> = vec![
        (100, 81.4),
        (200, 77.9),
        (300, 74.3),
        (400, 70.7),
        (500, 67.1),
        (600, 63.6),
        (700, 60.0),
    ]
    .into_iter()
    .collect();

    let expected_bmi_by_rate: HashMap<i32, f32> = vec![
        (100, 28.2),
        (200, 26.9),
        (300, 25.7),
        (400, 24.5),
        (500, 23.2),
        (600, 22.0),
        (700, 20.8),
    ]
    .into_iter()
    .collect();

    let wizard_target_date_input = WizardTargetDateInput {
        age: 30,
        height: 170.0,
        current_weight: 85.0,
        sex: CalculationSex::MALE,
        start_date: start_date_nd.format("%Y-%m-%d").to_string(),
        target_date: target_date_nd.format("%Y-%m-%d").to_string(),
        calculation_goal: CalculationGoal::LOSS,
    };

    let wizard_result = wizard_calculate_for_target_date(wizard_target_date_input).unwrap();

    wizard_result.weight_by_rate.keys().for_each(|rate| {
        assert_eq!(
            *expected_weight_by_rate.get(&rate).unwrap(),
            *wizard_result.weight_by_rate.get(&rate).unwrap()
        );

        assert_eq!(
            *expected_bmi_by_rate.get(&rate).unwrap(),
            *wizard_result.bmi_by_rate.get(&rate).unwrap()
        );
    });
}

#[test]
fn calculate_target_weights_for_specific_weight_gain_goal() {
    let start_date_nd = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();
    let target_date_nd = start_date_nd.checked_add_days(Days::new(150)).unwrap();

    let expected_weight_by_rate: HashMap<i32, f32> = vec![
        (100, 47.1),
        (200, 49.3),
        (300, 51.4),
        (400, 53.6),
        (500, 55.7),
        (600, 57.9),
        (700, 60.0),
    ]
    .into_iter()
    .collect();

    let expected_bmi_by_rate: HashMap<i32, f32> = vec![
        (100, 19.6),
        (200, 20.5),
        (300, 21.4),
        (400, 22.3),
        (500, 23.2),
        (600, 24.1),
        (700, 25.0),
    ]
    .into_iter()
    .collect();

    let wizard_target_date_input = WizardTargetDateInput {
        age: 30,
        height: 155.0,
        current_weight: 45.0,
        sex: CalculationSex::FEMALE,
        start_date: start_date_nd.format("%Y-%m-%d").to_string(),
        target_date: target_date_nd.format("%Y-%m-%d").to_string(),
        calculation_goal: CalculationGoal::GAIN,
    };

    let wizard_result = wizard_calculate_for_target_date(wizard_target_date_input).unwrap();

    wizard_result.weight_by_rate.keys().for_each(|rate| {
        assert_eq!(
            *expected_weight_by_rate.get(&rate).unwrap(),
            *wizard_result.weight_by_rate.get(&rate).unwrap()
        );

        assert_eq!(
            *expected_bmi_by_rate.get(&rate).unwrap(),
            *wizard_result.bmi_by_rate.get(&rate).unwrap()
        );
    });
}

#[test]
fn wizard_create_targets_persists_all_three_records() {
    scenario!("[OB-017]");
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool.clone());

    let input = Wizard {
        intake_target: NewIntakeTarget {
            added: "2026-01-01".to_string(),
            start_date: "2026-01-01".to_string(),
            end_date: "2026-04-01".to_string(),
            target_calories: 2000,
            maximum_calories: 2500,
        },
        weight_target: NewWeightTarget {
            added: "2026-01-01".to_string(),
            start_date: "2026-01-01".to_string(),
            end_date: "2026-04-01".to_string(),
            initial_weight: 75.0,
            target_weight: 70.0,
        },
        weight_tracker: NewWeightTracker::new("2026-01-01".to_string(), 75.0),
    };

    let result = wizard_create_targets(app.state(), input);
    assert!(
        result.is_ok(),
        "happy-path create should succeed: {:?}",
        result
    );

    // All three rows now exist.
    let mut conn = pool.get().unwrap();
    assert_eq!(WeightTarget::all(&mut conn).unwrap().len(), 1);
    assert_eq!(IntakeTarget::all(&mut conn).unwrap().len(), 1);
    assert_eq!(WeightTracker::all(&mut conn).unwrap().len(), 1);
}

/// The frontend derives the HOLD/LOSE/GAIN recommendation from
/// `result.bmi_category`. StandardWeight maps to HOLD.
#[test]
fn bmi_in_hold_range_yields_standard_weight() {
    scenario!("[OB-010]");
    let input = WizardInput {
        age: 30,
        weight: 70.0, // BMI = 70 / 1.75^2 ≈ 22.86 → StandardWeight
        height: 175.0,
        sex: CalculationSex::MALE,
        activity_level: 1.5,
        weekly_difference: 0,
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input).unwrap();

    assert_eq!(BmiCategory::StandardWeight, result.bmi_category);
    assert!(
        result.bmi >= 20.0 && result.bmi <= 25.0,
        "BMI {} should fall in the HOLD range 20.0..=25.0",
        result.bmi
    );
}

/// Enum-constrained fields reach the backend as JSON strings that Tauri
/// deserializes into the Rust enum. The allowed set is enforced at that
/// deserialization boundary — a value in the set decodes successfully.
#[test]
fn enum_value_within_allowed_set_accepted() {
    scenario!("[VAL-009]");

    assert!(matches!(
        serde_json::from_str::<CalculationSex>("\"MALE\""),
        Ok(CalculationSex::MALE)
    ));
    assert!(matches!(
        serde_json::from_str::<CalculationGoal>("\"LOSS\""),
        Ok(CalculationGoal::LOSS)
    ));
}

/// A value outside the allowed set is rejected at the same deserialization
/// boundary, before any handler logic runs.
#[test]
fn enum_value_outside_allowed_set_rejected() {
    scenario!("[VAL-010]");

    assert!(serde_json::from_str::<CalculationSex>("\"ROBOT\"").is_err());
    assert!(serde_json::from_str::<CalculationGoal>("\"MAINTAIN\"").is_err());
}
