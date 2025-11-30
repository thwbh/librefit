use diesel::r2d2::{ConnectionManager, Pool};
use diesel::sqlite::SqliteConnection;
use librefit_lib::db::migrations;
use librefit_lib::service::intake::{Intake, IntakeTarget, NewIntake, NewIntakeTarget};
use librefit_lib::service::user::LibreUser;
use librefit_lib::service::weight::{
    NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker,
};

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
    migrations::run(&mut conn).expect("Failed to run migrations");

    pool
}

/// Creates a test user in the database
pub fn create_test_user(pool: &TestPool, name: &str, avatar: &str) -> LibreUser {
    let mut conn = pool.get().expect("Failed to get connection");
    LibreUser::update(&mut conn, name, avatar).expect("Failed to create test user")
}

/// Creates a test intake target in the database
pub fn create_test_intake_target(
    pool: &TestPool,
    start_date: &str,
    end_date: &str,
    target_calories: i32,
    maximum_calories: i32,
) -> IntakeTarget {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_target = NewIntakeTarget {
        added: start_date.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        target_calories,
        maximum_calories,
    };
    IntakeTarget::create(&mut conn, &new_target).expect("Failed to create intake target")
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
    WeightTarget::create(&mut conn, &new_target).expect("Failed to create weight target")
}

/// Creates a test intake entry
pub fn create_test_intake_entry(
    pool: &TestPool,
    added: &str,
    amount: i32,
    category: &str,
    description: Option<String>,
) -> Intake {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_entry = NewIntake::new(added.to_string(), amount, category.to_string(), description);
    Intake::create(&mut conn, &new_entry).expect("Failed to create intake entry")
}

/// Creates a test weight tracker entry
pub fn create_test_weight_entry(pool: &TestPool, added: &str, amount: f32) -> WeightTracker {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_entry = NewWeightTracker::new(added.to_string(), amount);
    WeightTracker::create(&mut conn, &new_entry).expect("Failed to create weight entry")
}
