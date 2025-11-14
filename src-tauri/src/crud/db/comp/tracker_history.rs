use std::collections::BTreeMap;

use crate::crud::db::model::{Intake, WeightTracker};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackerHistory {
    pub calories_history: BTreeMap<String, Vec<Intake>>,
    pub calories_average: f32,
    pub weight_history: BTreeMap<String, Vec<WeightTracker>>,
    pub date_last_str: String,
}
