use diesel::r2d2::{ConnectionManager, Pool};
use diesel::sqlite::SqliteConnection;
use librefit_lib::crud::db::model::*;
use librefit_lib::crud::db::repo::*;
use librefit_lib::init::db_setup;

pub type TestPool = Pool<ConnectionManager<SqliteConnection>>;

/// Creates an in-memory SQLite database with all migrations applied.
/// Each test should call this to get a fresh, isolated database.
pub fn setup_test_pool() -> TestPool {
    let manager = ConnectionManager::<SqliteConnection>::new(":memory:");
    let pool = Pool::builder()
        .max_size(1)
        .build(manager)
        .expect("Failed to create test pool");

    let mut conn = pool.get().expect("Failed to get connection");
    db_setup::run_migrations(&mut conn).expect("Failed to run migrations");

    pool
}

/// Creates a test user in the database
pub fn create_test_user(pool: &TestPool, name: &str, avatar: &str) -> LibreUser {
    let mut conn = pool.get().expect("Failed to get connection");
    user::update_user(&mut conn, name, avatar).expect("Failed to create test user")
}

/// Creates a test calorie target in the database
pub fn create_test_calorie_target(
    pool: &TestPool,
    start_date: &str,
    end_date: &str,
    target_calories: i32,
    maximum_calories: i32,
) -> CalorieTarget {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_target = NewCalorieTarget {
        added: start_date.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        target_calories,
        maximum_calories,
    };
    calories::create_calorie_target(&mut conn, &new_target)
        .expect("Failed to create calorie target")
}

/// Creates a test weight target in the database
pub fn create_test_weight_target(
    pool: &TestPool,
    start_date: &str,
    end_date: &str,
    initial_weight: f32,
    target_weight: f32,
) -> WeightTarget {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_target = NewWeightTarget {
        added: start_date.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        initial_weight,
        target_weight,
    };
    weight::create_weight_target(&mut conn, &new_target).expect("Failed to create weight target")
}

/// Creates a test calorie tracker entry
pub fn create_test_calorie_entry(
    pool: &TestPool,
    added: &str,
    amount: i32,
    category: &str,
    description: Option<String>,
) -> CalorieTracker {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_entry = NewCalorieTracker {
        added: added.to_string(),
        amount,
        category: category.to_string(),
        description,
    };
    calories::create_calorie_tracker_entry(&mut conn, &new_entry)
        .expect("Failed to create calorie entry")
}

/// Creates a test weight tracker entry
pub fn create_test_weight_entry(pool: &TestPool, added: &str, amount: f32) -> WeightTracker {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_entry = NewWeightTracker {
        added: added.to_string(),
        amount,
    };
    weight::create_weight_tracker_entry(&mut conn, &new_entry)
        .expect("Failed to create weight entry")
}
