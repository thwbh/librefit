use diesel::result::Error;

/// Error handling function to map Diesel errors to strings
pub fn handle_error(err: Error) -> String {
    format!("Database error: {}", err)
}
