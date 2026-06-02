//! Metric-payload mechanism tests (infra, not behavioral scenarios — see
//! `_conv-test-traceability`: internal-correctness tests MAY omit a scenario citation).
//!
//! These verify the two building blocks the schema-evolution path rests on:
//!   1. lenient read (serde ignores unknown keys; unknown version rejected), and
//!   2. the JSON1 SQL migration transform, run against the real bundled SQLite.

use crate::helpers::setup_test_pool;
use diesel::prelude::*;
use diesel::sql_query;
use librefit_lib::db::schema::workout_set;
use librefit_lib::service::workout::{
    LiftingSetMetrics, WorkoutExercise, WorkoutSession, WorkoutSet, WL_PAYLOAD_VER,
};

#[test]
fn from_stored_ignores_unknown_keys() {
    // "permissive on parse" — an extra/future key (e.g. rpe) does not break a v1 read.
    let m = LiftingSetMetrics::from_stored(1, r#"{"reps":10,"weightKg":80.0,"rpe":8}"#).unwrap();
    assert_eq!(m.reps, 10);
    assert_eq!(m.weight_kg, 80.0);
}

#[test]
fn from_stored_rejects_unknown_payload_version() {
    assert!(LiftingSetMetrics::from_stored(2, r#"{"reps":10,"weightKg":80.0}"#).is_err());
}

#[test]
fn json1_structural_migration_transforms_stored_payload() {
    let pool = setup_test_pool();
    let mut conn = pool.get().unwrap();

    // Persist a real v1 set through the repo (FK chain: session -> exercise -> set).
    let session = WorkoutSession::start(&mut conn, "wl", None).unwrap();
    let we = WorkoutExercise::add_or_get(&mut conn, session.id, 1).unwrap();
    let metrics = serde_json::to_string(&LiftingSetMetrics {
        reps: 10,
        weight_kg: 80.0,
    })
    .unwrap();
    let set = WorkoutSet::log(
        &mut conn,
        we.id,
        metrics,
        WL_PAYLOAD_VER,
        "2026-05-31T18:00:00.000Z".to_string(),
    )
    .unwrap();

    // The documented JSON1 migration path for a structural change, expressed as the SQL
    // a future Diesel migration would run: rename weightKg -> loadKg, add rpe, bump version.
    let affected = sql_query(
        "UPDATE workout_set \
         SET metrics = json_set( \
                          json_remove( \
                             json_set(metrics, '$.loadKg', json_extract(metrics, '$.weightKg')), \
                             '$.weightKg'), \
                          '$.rpe', 8), \
             payload_ver = 2 \
         WHERE payload_ver = 1",
    )
    .execute(&mut conn)
    .unwrap();
    assert_eq!(affected, 1);

    // The blob transformed and the version bumped.
    let (ver, blob): (i32, String) = workout_set::table
        .select((workout_set::payload_ver, workout_set::metrics))
        .filter(workout_set::id.eq(set.id))
        .first(&mut conn)
        .unwrap();
    assert_eq!(ver, 2);
    let v: serde_json::Value = serde_json::from_str(&blob).unwrap();
    assert_eq!(v["loadKg"], 80.0);
    assert_eq!(v["rpe"], 8);
    assert!(v.get("weightKg").is_none());

    // The queryability win: `payload_ver` makes un-migrated rows findable — none remain.
    let unmigrated: i64 = workout_set::table
        .filter(workout_set::payload_ver.lt(2))
        .count()
        .get_result(&mut conn)
        .unwrap();
    assert_eq!(unmigrated, 0);
}
