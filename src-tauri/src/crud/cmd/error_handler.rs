use diesel::result::Error;
use log::error;

/// Error handling function to map Diesel errors to user-friendly strings
pub fn handle_error(err: Error) -> String {
    error!("Database operation failed: {:?}", err);

    match err {
        Error::NotFound => "Record not found".to_string(),
        Error::InvalidCString(_) => "Invalid data format".to_string(),
        Error::DatabaseError(kind, info) => {
            error!("Database error kind: {:?}, info: {:?}", kind, info);
            "Database operation failed".to_string()
        }
        Error::QueryBuilderError(e) => {
            error!("Query builder error: {}", e);
            "Invalid query".to_string()
        }
        _ => "An unexpected error occurred".to_string(),
    }
}
