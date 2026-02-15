use crate::helpers::{
    create_test_intake_entry, create_test_intake_target, create_test_user,
    create_test_weight_entry, create_test_weight_target, setup_test_pool,
};
use librefit_lib::service::{dashboard::daily_dashboard, weight::create_weight_tracker_entry};
use tauri::Manager;

#[test]
fn test_daily_dashboard_success() {
    let pool = setup_test_pool();

    // Setup: Create user
    create_test_user(&pool, "Test User", "avatar.png");

    // Setup: Create targets
    create_test_intake_target(&pool, "2025-01-01", "2025-06-01", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-06-01", 85.0, 75.0);

    // Setup: Create some tracker entries
    create_test_intake_entry(&pool, "2025-01-15", 500, "b", Some("Breakfast".to_string()));
    create_test_intake_entry(&pool, "2025-01-15", 700, "l", Some("Lunch".to_string()));
    create_test_weight_entry(&pool, "2025-01-15", 83.0);
    create_test_weight_entry(&pool, "2025-01-15", 82.5);

    // Test command using mock app
    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-15".to_string());

    assert!(result.is_ok());
    let dashboard = result.unwrap();

    // Verify user data
    assert!(dashboard.user_data.is_some());
    let user = dashboard.user_data.unwrap();
    assert_eq!(user.name, "Test User");

    // Verify calorie target
    assert_eq!(dashboard.intake_target.target_calories, 2000);
    assert_eq!(dashboard.intake_target.maximum_calories, 2500);

    // Verify weight target
    assert_eq!(dashboard.weight_target.target_weight, 75.0);

    // Verify tracker entries
    assert_eq!(dashboard.intake_today_list.len(), 2);
    assert_eq!(dashboard.weight_today_list.len(), 2);

    // Verify current day calculation (Jan 15 is day 14 completed, so current_day = 14)
    assert_eq!(dashboard.current_day, 14);

    // Verify food categories are loaded
    assert!(dashboard.food_categories.len() > 0);
}

#[test]
fn test_daily_dashboard_first_day() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    create_test_intake_target(&pool, "2025-01-01", "2025-06-01", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-06-01", 85.0, 75.0);
    create_test_weight_entry(&pool, "2025-01-01", 85.0);

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-01".to_string());

    assert!(result.is_ok());
    let dashboard = result.unwrap();

    // First day should be day 0 (0 days completed on day 1)
    assert_eq!(dashboard.current_day, 0);
    assert_eq!(dashboard.intake_today_list.len(), 0);
    assert_eq!(dashboard.weight_today_list.len(), 1);
}

#[test]
fn test_daily_dashboard_last_day_of_target() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    create_test_intake_target(&pool, "2025-01-01", "2025-01-31", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-01-31", 85.0, 75.0);

    create_test_weight_entry(&pool, "2025-01-31", 75.0);

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-31".to_string());

    assert!(result.is_ok());
    let dashboard = result.unwrap();

    // Last day should be day 31 (when querying on the last day, it shows 31)
    assert_eq!(dashboard.current_day, 31);
}

#[test]
fn test_daily_dashboard_date_beyond_target() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    create_test_intake_target(&pool, "2025-01-01", "2025-01-31", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-01-31", 85.0, 75.0);

    // Add entries in the last week of the target period
    create_test_intake_entry(&pool, "2025-01-25", 2000, "l", None);
    create_test_intake_entry(&pool, "2025-01-26", 2000, "l", None);
    create_test_intake_entry(&pool, "2025-01-27", 2000, "l", None);
    create_test_intake_entry(&pool, "2025-01-31", 2000, "l", None);

    create_test_weight_entry(&pool, "2025-01-31", 85.0);

    let app = tauri::test::mock_app();
    app.manage(pool);

    // Query date after target end date
    let result = daily_dashboard(app.state(), "2025-02-15".to_string());

    assert!(result.is_ok());
    let dashboard = result.unwrap();

    // When querying beyond target, it should still return successfully
    // The current_day should be based on the end date, not the query date
    assert_eq!(dashboard.current_day, 31);
}

#[test]
fn test_daily_dashboard_with_week_data() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    create_test_intake_target(&pool, "2025-01-01", "2025-06-01", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-06-01", 85.0, 75.0);

    // Add entries over the past week
    for day in 8..=15 {
        create_test_intake_entry(&pool, &format!("2025-01-{:02}", day), 1800, "l", None);
        create_test_weight_entry(&pool, &format!("2025-01-{:02}", day), 85.4);
    }

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-15".to_string());

    assert!(result.is_ok());
    let dashboard = result.unwrap();

    // Should have 8 days of data (Jan 8-15)
    assert_eq!(dashboard.intake_week_list.len(), 8);
    assert_eq!(dashboard.weight_month_list.len(), 8);
}

#[test]
fn test_daily_dashboard_with_month_weight_data() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    create_test_intake_target(&pool, "2025-01-01", "2025-06-01", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-06-01", 85.0, 75.0);

    // Add weight entries over the past month (4 weeks)
    for day in 1..=28 {
        if day % 3 == 0 {
            // Every 3 days
            create_test_weight_entry(
                &pool,
                &format!("2025-01-{:02}", day),
                85.0 - (day as f32 * 0.1),
            );
        }
    }

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-28".to_string());

    assert!(result.is_ok());
    let dashboard = result.unwrap();

    // Should have weight data for the days we added
    assert!(dashboard.weight_month_list.len() > 0);
}

#[test]
fn test_daily_dashboard_invalid_date_format() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    create_test_intake_target(&pool, "2025-01-01", "2025-06-01", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-06-01", 85.0, 75.0);

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "invalid-date".to_string());

    assert!(result.is_err());
    assert_eq!(result.err().unwrap(), "Invalid date format.");
}

#[test]
fn test_daily_dashboard_no_intake_target() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    // Only create weight target, no intake target
    create_test_weight_target(&pool, "2025-01-01", "2025-06-01", 85.0, 75.0);

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-15".to_string());

    assert!(result.is_err());
    assert_eq!(result.err().unwrap(), "No calorie target found");
}

#[test]
fn test_daily_dashboard_no_weight_target() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    // Only create intake target, no weight target
    create_test_intake_target(&pool, "2025-01-01", "2025-06-01", 2000, 2500);

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-15".to_string());

    assert!(result.is_err());
    assert_eq!(result.err().unwrap(), "No weight target found");
}

#[test]
fn test_daily_dashboard_empty_trackers() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    create_test_intake_target(&pool, "2025-01-01", "2025-06-01", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-06-01", 85.0, 75.0);

    // No tracker entries

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-15".to_string());

    assert!(result.is_err());
}

#[test]
fn test_daily_dashboard_multiple_categories() {
    let pool = setup_test_pool();

    create_test_user(&pool, "User", "avatar.png");
    create_test_intake_target(&pool, "2025-01-01", "2025-06-01", 2000, 2500);
    create_test_weight_target(&pool, "2025-01-01", "2025-06-01", 85.0, 75.0);

    // Add entries with different categories
    create_test_intake_entry(&pool, "2025-01-15", 400, "b", Some("Breakfast".to_string()));
    create_test_intake_entry(&pool, "2025-01-15", 600, "l", Some("Lunch".to_string()));
    create_test_intake_entry(&pool, "2025-01-15", 700, "d", Some("Dinner".to_string()));
    create_test_intake_entry(&pool, "2025-01-15", 200, "s", Some("Snack".to_string()));
    create_test_intake_entry(&pool, "2025-01-15", 100, "t", Some("Treat".to_string()));

    create_test_weight_entry(&pool, "2025-01-15", 85.0);

    let app = tauri::test::mock_app();
    app.manage(pool);

    let result = daily_dashboard(app.state(), "2025-01-15".to_string());

    assert!(result.is_ok());
    let dashboard = result.unwrap();

    assert_eq!(dashboard.intake_today_list.len(), 5);

    // Verify all categories are represented
    let categories: Vec<String> = dashboard
        .intake_today_list
        .iter()
        .map(|e| e.category.clone())
        .collect();
    assert!(categories.contains(&"b".to_string()));
    assert!(categories.contains(&"l".to_string()));
    assert!(categories.contains(&"d".to_string()));
    assert!(categories.contains(&"s".to_string()));
    assert!(categories.contains(&"t".to_string()));
}
