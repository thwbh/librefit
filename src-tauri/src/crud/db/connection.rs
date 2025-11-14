use diesel::r2d2::{self, ConnectionManager, Pool, PoolError};
use diesel::sqlite::SqliteConnection;

/// Type alias for the connection pool
pub type DbPool = Pool<ConnectionManager<SqliteConnection>>;

/// Type alias for a pooled connection
pub type PooledConnection = r2d2::PooledConnection<ConnectionManager<SqliteConnection>>;

/// Creates a new connection pool with the given database URL
///
/// This should be called once during app initialization and the pool
/// should be stored in Tauri's managed state.
///
/// Configuration is optimized for mobile (Android):
/// - Small pool size (3 connections max)
/// - WAL mode enabled for better concurrency
/// - Reduced cache size for memory efficiency
pub fn create_pool(database_url: &str) -> Result<DbPool, PoolError> {
    log::info!("Creating database connection pool for: {}", database_url);

    let manager = ConnectionManager::<SqliteConnection>::new(database_url);

    Pool::builder()
        .max_size(3) // 3 connections max (sufficient for mobile with background tasks)
        .min_idle(Some(1)) // Keep 1 connection ready
        .connection_timeout(std::time::Duration::from_secs(5))
        .connection_customizer(Box::new(ConnectionOptions))
        .build(manager)
}

/// Custom connection options to configure SQLite behavior for mobile
#[derive(Debug, Clone, Copy)]
struct ConnectionOptions;

impl r2d2::CustomizeConnection<SqliteConnection, r2d2::Error> for ConnectionOptions {
    fn on_acquire(&self, conn: &mut SqliteConnection) -> Result<(), r2d2::Error> {
        use diesel::RunQueryDsl;

        // Enable WAL mode for better concurrency
        // This allows reads and writes to happen concurrently, preventing
        // "database is locked" errors during normal app usage
        diesel::sql_query("PRAGMA journal_mode = WAL;")
            .execute(conn)
            .map_err(r2d2::Error::QueryError)?;

        // Enable foreign key constraints
        diesel::sql_query("PRAGMA foreign_keys = ON;")
            .execute(conn)
            .map_err(r2d2::Error::QueryError)?;

        // Set busy timeout to 3 seconds (mobile-friendly)
        // Fail faster on mobile rather than hanging indefinitely
        diesel::sql_query("PRAGMA busy_timeout = 3000;")
            .execute(conn)
            .map_err(r2d2::Error::QueryError)?;

        // Reduce page cache for memory efficiency on mobile
        // -2000 means 2MB cache (negative value = KB, positive = pages)
        diesel::sql_query("PRAGMA cache_size = -2000;")
            .execute(conn)
            .map_err(r2d2::Error::QueryError)?;

        Ok(())
    }
}
