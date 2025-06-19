use crate::crud::db::model::{
    CalorieTarget, CalorieTracker, FoodCategory, LibreUser, WeightTarget, WeightTracker,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Dashboard {
    pub user_data: Option<LibreUser>,
    pub calorie_target: Option<CalorieTarget>,
    pub calories_today_list: Vec<CalorieTracker>,
    pub calories_week_list: Vec<CalorieTracker>,
    pub weight_target: Option<WeightTarget>,
    pub weight_today_list: Vec<WeightTracker>,
    pub weight_month_list: Vec<WeightTracker>,
    pub food_categories: Vec<FoodCategory>,
}
