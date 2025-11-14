use crate::crud::db::model::{
    IntakeTarget, Intake, FoodCategory, LibreUser, WeightTarget, WeightTracker,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Dashboard {
    pub user_data: Option<LibreUser>,
    pub calorie_target: IntakeTarget,
    pub calories_today_list: Vec<Intake>,
    pub calories_week_list: Vec<Intake>,
    pub weight_target: WeightTarget,
    pub weight_today_list: Vec<WeightTracker>,
    pub weight_month_list: Vec<WeightTracker>,
    pub food_categories: Vec<FoodCategory>,
    pub current_day: i32,
}
