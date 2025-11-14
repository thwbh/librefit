use crate::crud::db::model::{Intake, IntakeTarget, NewIntake, NewIntakeTarget};
use crate::crud::db::schema::intake::dsl::intake;
use crate::crud::db::schema::intake_target::dsl::intake_target;
use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;

/// Create a new intake target
pub fn create_intake_target(
    conn: &mut SqliteConnection,
    new_target: &NewIntakeTarget,
) -> QueryResult<IntakeTarget> {
    diesel::insert_into(intake_target)
        .values(new_target)
        .returning(IntakeTarget::as_returning())
        .get_result(conn)
}

/// Retrieve all intake targets
pub fn get_intake_targets(conn: &mut SqliteConnection) -> QueryResult<Vec<IntakeTarget>> {
    intake_target.load::<IntakeTarget>(conn)
}

/// Update an intake target by ID
pub fn update_intake_target(
    conn: &mut SqliteConnection,
    target_id: i32,
    updated_target: NewIntakeTarget,
) -> QueryResult<IntakeTarget> {
    use crate::crud::db::schema::intake_target::dsl::id;

    diesel::update(intake_target.filter(id.eq(target_id)))
        .set(&updated_target)
        .returning(IntakeTarget::as_returning())
        .get_result(conn)
}

/// Delete an intake target by ID
pub fn delete_intake_target(conn: &mut SqliteConnection, target_id: i32) -> QueryResult<usize> {
    use crate::crud::db::schema::intake_target::dsl::id;

    diesel::delete(intake_target.filter(id.eq(target_id))).execute(conn)
}

pub fn find_last_intake_target(conn: &mut SqliteConnection) -> QueryResult<IntakeTarget> {
    use crate::crud::db::schema::intake_target::dsl::id;

    intake_target.order(id.desc()).first::<IntakeTarget>(conn)
}

/// Insert a new intake entry to the tracker
pub fn create_intake_entry(
    conn: &mut SqliteConnection,
    new_entry: &NewIntake,
) -> QueryResult<Intake> {
    diesel::insert_into(intake)
        .values(new_entry)
        .returning(Intake::as_returning())
        .get_result(conn)
}

/// Retrieve all intake entries
pub fn get_intake_entries(conn: &mut SqliteConnection) -> QueryResult<Vec<Intake>> {
    intake.load::<Intake>(conn)
}

/// Update an intake entry by ID
pub fn update_intake_entry(
    conn: &mut SqliteConnection,
    tracker_id: i32,
    updated_entry: &NewIntake,
) -> QueryResult<Intake> {
    use crate::crud::db::schema::intake::dsl::id;

    diesel::update(intake.filter(id.eq(tracker_id)))
        .set(updated_entry)
        .returning(Intake::as_returning())
        .get_result(conn)
}

/// Delete an intake entry by ID
pub fn delete_intake_entry(
    conn: &mut SqliteConnection,
    tracker_id: &i32,
) -> QueryResult<usize> {
    use crate::crud::db::schema::intake::dsl::id;

    diesel::delete(intake.filter(id.eq(tracker_id))).execute(conn)
}

pub fn find_intake_by_date(
    conn: &mut SqliteConnection,
    date: &String,
) -> QueryResult<Vec<Intake>> {
    use crate::crud::db::schema::intake::dsl::added;

    intake.filter(added.eq(date)).load::<Intake>(conn)
}

pub fn find_intake_by_date_range(
    conn: &mut SqliteConnection,
    date_from: &String,
    date_to: &String,
) -> QueryResult<Vec<Intake>> {
    use crate::crud::db::schema::intake::dsl::added;

    intake
        .filter(added.between(date_from, date_to))
        .order(added.desc())
        .load::<Intake>(conn)
}
