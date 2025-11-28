use crate::db::connection::DbPool;
use crate::service::intake::{FoodCategory, Intake, IntakeTarget};
use crate::service::user::LibreUser;
use crate::service::weight::{WeightTarget, WeightTracker};
use chrono::{Days, NaiveDate, TimeDelta};
use diesel::SqliteConnection;
use serde::{Deserialize, Serialize};
use std::ops::Sub;
use tauri::{command, State};

// ============================================================================
// COMPOSITION MODEL
// ============================================================================

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Dashboard {
    pub user_data: Option<LibreUser>,
    pub intake_target: IntakeTarget,
    pub intake_today_list: Vec<Intake>,
    pub intake_week_list: Vec<Intake>,
    pub weight_target: WeightTarget,
    pub weight_today_list: Vec<WeightTracker>,
    pub weight_month_list: Vec<WeightTracker>,
    pub food_categories: Vec<FoodCategory>,
    pub current_day: i32,
}

// ============================================================================
// COMPOSITION LOGIC
// ============================================================================

impl Dashboard {
    /// Build a dashboard for a specific date
    pub fn build_for_date(conn: &mut SqliteConnection, date_str: &str) -> Result<Self, String> {
        let date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
            .map_err(|_| "Invalid date format.".to_string())?;

        // Get targets
        let intake_target =
            IntakeTarget::find_last(conn).map_err(|_| "No calorie target found".to_string())?;

        let weight_target =
            WeightTarget::find_last(conn).map_err(|_| "No weight target found".to_string())?;

        // Parse calorie target dates
        let intake_target_start_date =
            NaiveDate::parse_from_str(&intake_target.start_date, "%Y-%m-%d")
                .map_err(|_| "Invalid date format".to_string())?;
        let intake_target_end_date = NaiveDate::parse_from_str(&intake_target.end_date, "%Y-%m-%d")
            .map_err(|_| "Invalid date format".to_string())?;

        // Calculate end_date for current_day calculation
        let today_date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d").unwrap();
        let end_date: NaiveDate = if today_date < intake_target_end_date {
            today_date.checked_sub_days(Days::new(1)).unwrap()
        } else {
            intake_target_end_date
        };

        // Calculate date ranges
        let week_start_str = get_date_range_begin(&date, chrono::Duration::days(7));
        let month_start_str = get_date_range_begin(&date, chrono::Duration::weeks(4));

        // Fetch user data
        let user_data = LibreUser::get(conn).unwrap_or(None);

        // Fetch calorie data
        let intake_today_list =
            Intake::find_by_date(conn, &date_str.to_string()).unwrap_or_else(|_| vec![]);
        let intake_week_list =
            Intake::find_by_date_range(conn, &week_start_str, &date_str.to_string())
                .unwrap_or_else(|_| vec![]);

        // Fetch weight data
        let weight_today_list =
            WeightTracker::find_by_date(conn, &date_str.to_string()).unwrap_or_else(|_| vec![]);
        let weight_month_list =
            WeightTracker::find_by_date_range(conn, &month_start_str, &date_str.to_string())
                .unwrap_or_else(|_| vec![]);

        // Fetch food categories
        let food_categories = FoodCategory::all(conn).unwrap_or_else(|_| vec![]);

        // Calculate current day
        let day_count: i32 = end_date
            .signed_duration_since(intake_target_start_date)
            .num_days() as i32;
        let current_day: i32 = day_count + 1; // Day count will be zero at the first day

        Ok(Self {
            user_data,
            intake_target,
            intake_today_list,
            intake_week_list,
            weight_target,
            weight_today_list,
            weight_month_list,
            food_categories,
            current_day,
        })
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn get_date_range_begin(date: &NaiveDate, delta: TimeDelta) -> String {
    date.sub(delta).format("%Y-%m-%d").to_string()
}

// ============================================================================
// COMMANDS (Tauri)
// ============================================================================

#[command]
pub fn daily_dashboard(pool: State<DbPool>, date_str: String) -> Result<Dashboard, String> {
    log::debug!(">>> date_str: {}", date_str);

    let mut conn = pool
        .get()
        .map_err(|e| format!("Failed to get connection: {}", e))?;

    Dashboard::build_for_date(&mut conn, &date_str)
}
