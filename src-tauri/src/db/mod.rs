pub mod connection;
pub mod migrations;
pub mod schema;

use crate::db::connection::DbPool;
use diesel::SqliteConnection;
use tauri::State;

pub trait DbExecutor {
    fn execute<T, F>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&mut SqliteConnection) -> diesel::QueryResult<T>;
}

impl DbExecutor for State<'_, DbPool> {
    fn execute<T, F>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&mut SqliteConnection) -> diesel::QueryResult<T>,
    {
        let mut conn = self
            .get()
            .map_err(|e| format!("Failed to get connection: {}", e))?;
        f(&mut conn).map_err(crate::util::error_handler::handle_error)
    }
}
