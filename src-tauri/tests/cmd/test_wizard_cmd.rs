use crate::helpers::setup_test_pool;
use librefit_lib::service::intake::{IntakeTarget, NewIntakeTarget};
use librefit_lib::service::weight::{
    NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker,
};
use librefit_lib::service::wizard::{
    wizard_calculate_for_target_date, wizard_calculate_for_target_weight, wizard_calculate_tdee,
    wizard_create_targets, CalculationGoal, CalculationSex, Wizard, WizardInput,
    WizardTargetDateInput, WizardTargetWeightInput,
};
use tauri::Manager;

// ============================================================================
// WIZARD CALCULATE TDEE TESTS
// ============================================================================

#[test]
fn test_wizard_calculate_tdee_success_male_weight_loss() {
    let input = WizardInput {
        age: 30,
        sex: CalculationSex::MALE,
        weight: 90.0,
        height: 180.0,
        activity_level: 1.5,  // Moderate activity
        weekly_difference: 1, // 1kg per week loss
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input);

    if result.is_err() {
        eprintln!("Error: {:?}", result.as_ref().unwrap_err());
    }
    assert!(result.is_ok());
    let wizard_result = result.unwrap();
    assert!(wizard_result.bmr > 0.0);
    assert!(wizard_result.tdee > 0.0);
    assert!(wizard_result.bmi > 0.0);
    assert!(wizard_result.target_weight > 0.0);
    assert!(wizard_result.duration_days > 0);
}

#[test]
fn test_wizard_calculate_tdee_success_female_weight_gain() {
    let input = WizardInput {
        age: 25,
        sex: CalculationSex::FEMALE,
        weight: 50.0,
        height: 165.0,
        activity_level: 1.25, // Light activity
        weekly_difference: 1, // 1kg per week gain
        calculation_goal: CalculationGoal::GAIN,
    };

    let result = wizard_calculate_tdee(input);

    assert!(result.is_ok());
    let wizard_result = result.unwrap();
    assert!(wizard_result.bmr > 0.0);
    assert!(wizard_result.tdee > 0.0);
    // For gain, target should be higher than TDEE
    assert!(wizard_result.target > wizard_result.tdee);
}

#[test]
fn test_wizard_calculate_tdee_validation_age_too_low() {
    let input = WizardInput {
        age: 15, // Below minimum
        sex: CalculationSex::MALE,
        weight: 70.0,
        height: 175.0,
        activity_level: 1.5,
        weekly_difference: 1,
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_tdee_validation_age_too_high() {
    let input = WizardInput {
        age: 100, // Above maximum
        sex: CalculationSex::MALE,
        weight: 70.0,
        height: 175.0,
        activity_level: 1.5,
        weekly_difference: 1,
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_tdee_validation_weight_too_low() {
    let input = WizardInput {
        age: 30,
        sex: CalculationSex::MALE,
        weight: 20.0, // Below minimum
        height: 175.0,
        activity_level: 1.5,
        weekly_difference: 1,
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_tdee_validation_weight_too_high() {
    let input = WizardInput {
        age: 30,
        sex: CalculationSex::MALE,
        weight: 350.0, // Above maximum
        height: 175.0,
        activity_level: 1.5,
        weekly_difference: 1,
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_tdee_validation_height_too_low() {
    let input = WizardInput {
        age: 30,
        sex: CalculationSex::MALE,
        weight: 70.0,
        height: 80.0, // Below minimum
        activity_level: 1.5,
        weekly_difference: 1,
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_tdee_validation_height_too_high() {
    let input = WizardInput {
        age: 30,
        sex: CalculationSex::MALE,
        weight: 70.0,
        height: 250.0, // Above maximum
        activity_level: 1.5,
        weekly_difference: 1,
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_tdee_validation_weekly_difference_too_high() {
    let input = WizardInput {
        age: 30,
        sex: CalculationSex::MALE,
        weight: 70.0,
        height: 175.0,
        activity_level: 1.5,
        weekly_difference: 10, // Above maximum
        calculation_goal: CalculationGoal::LOSS,
    };

    let result = wizard_calculate_tdee(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_tdee_different_activity_levels() {
    let activity_levels = vec![1.0, 1.25, 1.5, 1.75, 2.0];

    for level in activity_levels {
        let input = WizardInput {
            age: 30,
            sex: CalculationSex::MALE,
            weight: 70.0,
            height: 175.0,
            activity_level: level,
            weekly_difference: 1,
            calculation_goal: CalculationGoal::LOSS,
        };

        let result = wizard_calculate_tdee(input);
        assert!(result.is_ok());
    }
}

// ============================================================================
// WIZARD CREATE TARGETS TESTS
// ============================================================================

#[test]
fn test_wizard_create_targets_success() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool.clone());

    let wizard = Wizard {
        calorie_target: NewIntakeTarget {
            added: "2026-01-01".to_string(),
            start_date: "2026-01-01".to_string(),
            end_date: "2026-06-01".to_string(),
            target_calories: 2000,
            maximum_calories: 2500,
        },
        weight_target: NewWeightTarget {
            added: "2026-01-01".to_string(),
            start_date: "2026-01-01".to_string(),
            end_date: "2026-06-01".to_string(),
            initial_weight: 80.0,
            target_weight: 75.0,
        },
        weight_tracker: NewWeightTracker {
            added: "2026-01-01".to_string(),
            amount: 80.0,
        },
    };

    let result = wizard_create_targets(app.state(), wizard);

    assert!(result.is_ok());

    // Verify all targets were created
    let mut conn = pool.get().unwrap();
    assert!(IntakeTarget::find_last(&mut conn).is_ok());
    assert!(WeightTarget::find_last(&mut conn).is_ok());
    assert!(WeightTracker::all(&mut conn).unwrap().len() == 1);
}

#[test]
fn test_wizard_create_targets_creates_all_entries() {
    let pool = setup_test_pool();
    let app = tauri::test::mock_app();
    app.manage(pool.clone());

    let wizard = Wizard {
        calorie_target: NewIntakeTarget {
            added: "2026-01-01".to_string(),
            start_date: "2026-01-01".to_string(),
            end_date: "2026-06-01".to_string(),
            target_calories: 2000,
            maximum_calories: 2500,
        },
        weight_target: NewWeightTarget {
            added: "2026-01-01".to_string(),
            start_date: "2026-01-01".to_string(),
            end_date: "2026-06-01".to_string(),
            initial_weight: 80.0,
            target_weight: 75.0,
        },
        weight_tracker: NewWeightTracker {
            added: "2026-01-01".to_string(),
            amount: 80.0,
        },
    };

    let result = wizard_create_targets(app.state(), wizard);

    assert!(result.is_ok());

    // Verify all three entries were created
    let mut conn = pool.get().unwrap();
    let intake_target = IntakeTarget::find_last(&mut conn);
    let weight_target = WeightTarget::find_last(&mut conn);
    let weight_trackers = WeightTracker::all(&mut conn).unwrap();

    assert!(intake_target.is_ok());
    assert!(weight_target.is_ok());
    assert_eq!(weight_trackers.len(), 1);
    assert_eq!(weight_trackers[0].amount, 80.0);
}

// ============================================================================
// WIZARD CALCULATE FOR TARGET DATE TESTS
// ============================================================================

#[test]
fn test_wizard_calculate_for_target_date_success_weight_loss() {
    let input = WizardTargetDateInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 90.0,
        height: 180.0,
        calculation_goal: CalculationGoal::LOSS,
        target_date: "2026-06-01".to_string(),
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_date(input);

    assert!(result.is_ok());
    let wizard_result = result.unwrap();
    // Should have projections for different weekly rates
    assert!(wizard_result.weight_by_rate.len() > 0);
    assert!(wizard_result.bmi_by_rate.len() > 0);
}

#[test]
fn test_wizard_calculate_for_target_date_success_weight_gain() {
    let input = WizardTargetDateInput {
        age: 25,
        sex: CalculationSex::FEMALE,
        current_weight: 50.0,
        height: 165.0,
        calculation_goal: CalculationGoal::GAIN,
        target_date: "2026-06-01".to_string(),
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_date(input);

    assert!(result.is_ok());
    let wizard_result = result.unwrap();
    assert!(wizard_result.weight_by_rate.len() > 0);
    assert!(wizard_result.bmi_by_rate.len() > 0);
}

#[test]
fn test_wizard_calculate_for_target_date_validation_age_too_low() {
    let input = WizardTargetDateInput {
        age: 15,
        sex: CalculationSex::MALE,
        current_weight: 70.0,
        height: 175.0,
        calculation_goal: CalculationGoal::LOSS,
        target_date: "2026-06-01".to_string(),
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_date(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_for_target_date_validation_weight_invalid() {
    let input = WizardTargetDateInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 350.0, // Too high
        height: 175.0,
        calculation_goal: CalculationGoal::LOSS,
        target_date: "2026-06-01".to_string(),
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_date(input);

    assert!(result.is_err());
}

// ============================================================================
// WIZARD CALCULATE FOR TARGET WEIGHT TESTS
// ============================================================================

#[test]
fn test_wizard_calculate_for_target_weight_success_weight_loss() {
    let input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 90.0,
        height: 180.0,
        target_weight: 75.0,
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(input);

    assert!(result.is_ok());
    let wizard_result = result.unwrap();
    // Should have projected dates for different weekly rates
    assert!(wizard_result.date_by_rate.len() > 0);
    assert!(wizard_result.progress_by_rate.len() > 0);
}

#[test]
fn test_wizard_calculate_for_target_weight_success_weight_gain() {
    let input = WizardTargetWeightInput {
        age: 25,
        sex: CalculationSex::FEMALE,
        current_weight: 50.0,
        height: 165.0,
        target_weight: 60.0,
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(input);

    assert!(result.is_ok());
    let wizard_result = result.unwrap();
    assert!(wizard_result.date_by_rate.len() > 0);
    assert!(wizard_result.progress_by_rate.len() > 0);
}

#[test]
fn test_wizard_calculate_for_target_weight_validation_age_too_high() {
    let input = WizardTargetWeightInput {
        age: 100,
        sex: CalculationSex::MALE,
        current_weight: 80.0,
        height: 175.0,
        target_weight: 70.0,
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_for_target_weight_validation_current_weight_too_low() {
    let input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 20.0, // Too low
        height: 175.0,
        target_weight: 70.0,
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_for_target_weight_validation_target_weight_too_high() {
    let input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 80.0,
        height: 175.0,
        target_weight: 350.0, // Too high
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_for_target_weight_validation_height_invalid() {
    let input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 80.0,
        height: 250.0, // Too high
        target_weight: 70.0,
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(input);

    assert!(result.is_err());
}

#[test]
fn test_wizard_calculate_for_target_weight_same_as_current() {
    let input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 75.0,
        height: 180.0,
        target_weight: 75.0, // Same as current
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(input);

    assert!(result.is_ok());
    let _wizard_result = result.unwrap();
    // Should still provide data even if no change needed
}

#[test]
fn test_wizard_calculate_for_target_weight_underweight_target() {
    let input = WizardTargetWeightInput {
        age: 30,
        sex: CalculationSex::MALE,
        current_weight: 90.0,
        height: 180.0,
        target_weight: 50.0, // Very low target
        start_date: "2026-01-01".to_string(),
    };

    let result = wizard_calculate_for_target_weight(input);

    assert!(result.is_ok());
    let wizard_result = result.unwrap();
    // Should show warning for unhealthy target
    assert!(wizard_result.warning);
}
