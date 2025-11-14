use crate::db::schema::body_data;
use crate::db::{connection::DbPool, DbExecutor};

use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use validator::Validate;

// ============================================================================
// MODELS
// ============================================================================

/// Represents the body data upon profile creation.
#[derive(
    Insertable, Queryable, Selectable, AsChangeset, Serialize, Deserialize, Debug, Validate,
)]
#[diesel(table_name = body_data)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct BodyData {
    pub id: i32,
    #[validate(range(min = 18, max = 99, message = "Age must be between 18 and 99 years."))]
    pub age: i32,
    #[validate(range(
        min = 100.0,
        max = 220.0,
        message = "Height must be between 100 and 220cm."
    ))]
    pub height: f32,
    #[validate(range(
        min = 30.0,
        max = 330.0,
        message = "Weight must be btween 30 and 330kg."
    ))]
    pub weight: f32,
    pub sex: String,
}

// ============================================================================
// REPOSITORY
// ============================================================================

impl BodyData {
    /// Return the body data (there can only be one)
    pub fn get(conn: &mut SqliteConnection) -> QueryResult<Self> {
        body_data::table.first(conn)
    }

    /// Update body data, or create if it doesn't exist
    pub fn update(
        conn: &mut SqliteConnection,
        age: &i32,
        height: &f32,
        weight: &f32,
        sex: &str,
    ) -> QueryResult<Self> {
        match body_data::table.first::<Self>(conn) {
            Ok(existing) => {
                let record = Self {
                    id: existing.id,
                    age: *age,
                    height: *height,
                    weight: *weight,
                    sex: sex.to_owned(),
                };

                diesel::update(body_data::table)
                    .set(&record)
                    .returning(Self::as_returning())
                    .get_result(conn)
            }
            Err(_) => Self::create(conn, age, height, weight, sex),
        }
    }

    /// Create body data (allowed to be called only once upon the first setup)
    fn create(
        conn: &mut SqliteConnection,
        age: &i32,
        height: &f32,
        weight: &f32,
        sex: &str,
    ) -> QueryResult<Self> {
        let new_body_data = Self {
            id: 1,
            age: *age,
            height: *height,
            weight: *weight,
            sex: sex.to_owned(),
        };

        diesel::insert_into(body_data::table)
            .values(&new_body_data)
            .returning(Self::as_returning())
            .get_result(conn)
    }
}

// ============================================================================
// COMMANDS (Tauri)
// ============================================================================

#[command]
pub fn get_body_data(pool: State<DbPool>) -> Result<BodyData, String> {
    pool.execute(BodyData::get)
}

#[command]
pub fn update_body_data(
    pool: State<DbPool>,
    age: i32,
    height: f32,
    weight: f32,
    sex: String,
) -> Result<BodyData, String> {
    log::info!(
        ">>> update_body_data: age={:?} height={:?} weight={:?} sex={:?}",
        age,
        height,
        weight,
        sex
    );

    let body_data = BodyData {
        id: 0,
        age,
        height,
        weight,
        sex: sex.clone(),
    };

    if let Err(validation_errors) = body_data.validate() {
        return Err(format!("Validation failed: {:?}", validation_errors));
    }

    pool.execute(|conn| BodyData::update(conn, &age, &height, &weight, &sex))
}
