use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::crud::db::model::{CalorieTarget, CalorieTracker, WeightTarget, WeightTracker};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub average_calories: f32,
    pub min_calories: i32,
    pub max_calories: i32,
    pub average_weight: f32,
    pub max_weight: f32,
    pub min_weight: f32,
    pub days_tracked_calories: usize,
    pub days_tracked_weight: usize,
    pub days_passed: i32,
    pub days_total: i32,
    pub calorie_tracker: Vec<CalorieTracker>,
    pub weight_tracker: Vec<WeightTracker>,
    pub calories_legend: Vec<String>,
    pub calories_values: Vec<i32>,
    pub calories_category_average: BTreeMap<String, f32>,
    pub calories_daily_average: f32,
    pub weight_legend: Vec<String>,
    pub weight_values: Vec<f32>,
    pub calorie_target: CalorieTarget,
    pub weight_target: WeightTarget,
}
