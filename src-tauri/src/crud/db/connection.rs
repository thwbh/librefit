use diesel::sqlite::SqliteConnection;
use diesel::Connection;
use dotenv::dotenv;
use std::env;

pub fn create_db_connection() -> SqliteConnection {
    dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    SqliteConnection::establish(&db_url)
        .unwrap_or_else(|_| panic!("Error connecting to database {}", db_url))
}

pub fn with_db_connection<F, R>(f: F) -> Result<R, diesel::result::Error>
where
    F: FnOnce(&mut SqliteConnection) -> Result<R, diesel::result::Error>,
{
    let conn = &mut create_db_connection();
    f(conn)
}
