use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::crud::db::model::{IntakeTarget, WeightTarget};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalorieChartData {
    pub avg: f32,
    pub min: i32,
    pub max: i32,
    pub legend: Vec<String>,
    pub values: Vec<i32>,
    pub category_average: BTreeMap<String, f32>,
    pub daily_average: f32,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeightChartData {
    pub avg: f32,
    pub min: f32,
    pub max: f32,
    pub legend: Vec<String>,
    pub values: Vec<f32>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub calorie_target: IntakeTarget,
    pub weight_target: WeightTarget,
    pub days_passed: i32,
    pub days_total: i32,
    pub calorie_chart_data: CalorieChartData,
    pub weight_chart_data: WeightChartData,
}
