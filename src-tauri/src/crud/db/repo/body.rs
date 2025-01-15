use diesel::{QueryResult, RunQueryDsl, SelectableHelper, SqliteConnection};

use crate::crud::db::model::BodyData;
use crate::crud::db::schema::body_data::dsl::body_data;

/// Return the initial values entered through the initial setup
pub fn get_body_data(conn: &mut SqliteConnection) -> QueryResult<BodyData> {
    body_data.first(conn)
}

pub fn update_body_data(
    conn: &mut SqliteConnection,
    age: &i32,
    height: &f32,
    weight: &f32,
    sex: &String,
) -> QueryResult<BodyData> {
    match body_data.first::<BodyData>(conn) {
        Ok(existing) => {
            let record = BodyData {
                id: existing.id,
                age: *age,
                height: *height,
                weight: *weight,
                sex: sex.clone(),
            };

            diesel::update(body_data)
                .set(&record)
                .returning(BodyData::as_returning())
                .get_result(conn)
        }
        Err(_) => create_body_data(conn, age, height, weight, sex),
    }
}

/// allowed to be called only once upon the first setup
fn create_body_data(
    conn: &mut SqliteConnection,
    age: &i32,
    height: &f32,
    weight: &f32,
    sex: &String,
) -> QueryResult<BodyData> {
    let new_body_data = BodyData {
        id: 1,
        age: *age,
        height: *height,
        weight: *weight,
        sex: sex.clone(),
    };

    diesel::insert_into(body_data)
        .values(&new_body_data)
        .returning(BodyData::as_returning())
        .get_result(conn)
}
