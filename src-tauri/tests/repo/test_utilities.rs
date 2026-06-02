//! Utility function tests — low-hanging coverage fruits.
//! These tests improve coverage for utility modules that have simple,
//! pure functions that were previously untouched.

use chrono::NaiveDate;
use diesel::result::Error;
use librefit_lib::util::{
    date_serde::{deserialize as date_deserialize, serialize as date_serialize},
    error_handler::handle_error,
};
use serde_json::json;

#[test]
fn date_serialize_converts_naive_date_to_rfc3339() {
    let date = NaiveDate::from_ymd_opt(2023, 5, 15).unwrap();
    let serialized = date_serialize(&date, serde_json::value::Serializer).unwrap();

    // Should be in RFC3339 format: YYYY-MM-DDTHH:MM:SS+00:00
    assert_eq!(serialized, json!("2023-05-15T00:00:00+00:00"));
}

#[test]
fn date_deserialize_parses_rfc3339_date() {
    let input = json!("2023-05-15 12:34:56");
    let deserialized: NaiveDate = date_deserialize(input).unwrap();

    assert_eq!(deserialized, NaiveDate::from_ymd_opt(2023, 5, 15).unwrap());
}

#[test]
fn date_deserialize_rejects_invalid_format() {
    let input = json!("invalid-date");
    let result: Result<NaiveDate, _> = date_deserialize(input);

    assert!(result.is_err());
}

#[test]
fn handle_error_maps_not_found() {
    let error = Error::NotFound;
    let result = handle_error(error);

    assert_eq!(result, "Record not found");
}

#[test]
fn handle_error_maps_rollback_transaction() {
    let error = Error::RollbackTransaction;
    let result = handle_error(error);

    assert_eq!(result, "An unexpected error occurred");
}
