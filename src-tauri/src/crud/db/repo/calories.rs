use crate::crud::db::model::{CalorieTarget, CalorieTracker, NewCalorieTarget, NewCalorieTracker};
use crate::crud::db::schema::calorie_target::dsl::calorie_target;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;

/// Create a new calorie target
pub fn create_calorie_target(
    conn: &mut SqliteConnection,
    new_target: NewCalorieTarget,
) -> QueryResult<CalorieTarget> {
    diesel::insert_into(calorie_target)
        .values(&new_target)
        .returning(CalorieTarget::as_returning())
        .get_result(conn)
}

/// Retrieve all calorie targets
pub fn get_calorie_targets(conn: &mut SqliteConnection) -> QueryResult<Vec<CalorieTarget>> {
    calorie_target.load::<CalorieTarget>(conn)
}

/// Update a calorie target by ID
pub fn update_calorie_target(
    conn: &mut SqliteConnection,
    target_id: i32,
    updated_target: NewCalorieTarget,
) -> QueryResult<CalorieTarget> {
    use crate::crud::db::schema::calorie_target::dsl::*;

    diesel::update(calorie_target.filter(id.eq(target_id)))
        .set(&updated_target)
        .returning(CalorieTarget::as_returning())
        .get_result(conn)
}

/// Delete a calorie target by ID
pub fn delete_calorie_target(conn: &mut SqliteConnection, target_id: i32) -> QueryResult<usize> {
    use crate::crud::db::schema::calorie_target::dsl::*;

    diesel::delete(calorie_target.filter(id.eq(target_id))).execute(conn)
}

/// Insert a new calorie entry to the tracker
pub fn create_calorie_tracker_entry(
    conn: &mut SqliteConnection,
    new_entry: NewCalorieTracker,
) -> QueryResult<CalorieTracker> {
    use crate::crud::db::schema::calorie_tracker::dsl::*;

    diesel::insert_into(calorie_tracker)
        .values(&new_entry)
        .returning(CalorieTracker::as_returning())
        .get_result(conn)
}

/// Retrieve all calorie tracker entries
pub fn get_calorie_tracker_entries(
    conn: &mut SqliteConnection,
) -> QueryResult<Vec<CalorieTracker>> {
    use crate::crud::db::schema::calorie_tracker::dsl::*;

    calorie_tracker.load::<CalorieTracker>(conn)
}

/// Update a calorie tracker entry by ID
pub fn update_calorie_tracker_entry(
    conn: &mut SqliteConnection,
    tracker_id: i32,
    updated_entry: NewCalorieTracker,
) -> QueryResult<CalorieTracker> {
    use crate::crud::db::schema::calorie_tracker::dsl::*;

    diesel::update(calorie_tracker.filter(id.eq(tracker_id)))
        .set(&updated_entry)
        .returning(CalorieTracker::as_returning())
        .get_result(conn)
}

/// Delete a calorie tracker entry by ID
pub fn delete_calorie_tracker_entry(
    conn: &mut SqliteConnection,
    tracker_id: i32,
) -> QueryResult<usize> {
    use crate::crud::db::schema::calorie_tracker::dsl::*;

    diesel::delete(calorie_tracker.filter(id.eq(tracker_id))).execute(conn)
}
