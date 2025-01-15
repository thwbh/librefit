use std::error::Error;

use diesel::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

// path configuration is in [diesel.toml]
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

pub fn run_migrations(
    connection: &mut SqliteConnection,
) -> Result<(), Box<dyn Error + Send + Sync + 'static>> {
    log::info!("Running migrations...");

    // This will run the necessary migrations.
    //
    // See the documentation for `MigrationHarness` for
    // all available methods.
    connection.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}
