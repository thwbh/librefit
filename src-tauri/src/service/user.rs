use crate::db::connection::DbPool;
use crate::db::schema::libre_user;
use crate::db::DbExecutor;
use diesel::prelude::*;
use diesel::OptionalExtension;
use serde::{Deserialize, Serialize};
use tauri::{command, State};

// ============================================================================
// MODELS
// ============================================================================

/// Represents a user profile. There may be only one.
#[derive(Queryable, Selectable, Insertable, AsChangeset, Serialize, Deserialize, Debug)]
#[diesel(table_name = libre_user)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct LibreUser {
    pub id: i32,
    pub avatar: String,
    pub name: String,
}

// ============================================================================
// REPOSITORY
// ============================================================================

impl LibreUser {
    /// Get the user profile (there can only be one)
    pub fn get(conn: &mut SqliteConnection) -> QueryResult<Option<Self>> {
        libre_user::table.first(conn).optional()
    }

    /// Update the user profile, or create one if it doesn't exist
    pub fn update(
        conn: &mut SqliteConnection,
        user_name: &str,
        user_avatar: &str,
    ) -> QueryResult<Self> {
        libre_user::table
            .first(conn)
            .optional()
            .map(|result: Option<Self>| match result {
                Some(mut user) => {
                    user.name = user_name.to_owned();
                    user.avatar = user_avatar.to_owned();

                    diesel::update(libre_user::table)
                        .set(&user)
                        .returning(Self::as_returning())
                        .get_result(conn)
                }
                None => diesel::insert_into(libre_user::table)
                    .values(Self {
                        id: 1,
                        name: user_name.to_owned(),
                        avatar: user_avatar.to_owned(),
                    })
                    .returning(Self::as_returning())
                    .get_result(conn),
            })?
    }
}

// ============================================================================
// COMMANDS (Tauri)
// ============================================================================

/// Update the user's avatar and nickname
#[command]
pub fn update_user(
    pool: State<DbPool>,
    user_name: String,
    user_avatar: String,
) -> Result<LibreUser, String> {
    // Validate username (reasonable length limits)
    if user_name.trim().is_empty() {
        return Err("Username cannot be empty".to_string());
    }
    if user_name.len() > 50 {
        return Err("Username must be less than 50 characters".to_string());
    }

    // Validate avatar (optional field, but if provided should be reasonable length)
    if user_avatar.len() > 500 {
        return Err("Avatar path must be less than 500 characters".to_string());
    }

    log::debug!(
        ">>> update_user: user_name={}, user_avatar={}",
        user_name,
        user_avatar
    );

    pool.execute(|conn| LibreUser::update(conn, &user_name, &user_avatar))
}

/// Return user data to determine if its a first time setup
#[command]
pub fn get_user(pool: State<DbPool>) -> Result<Option<LibreUser>, String> {
    log::debug!(">>> get_user");

    pool.execute(LibreUser::get)
}
