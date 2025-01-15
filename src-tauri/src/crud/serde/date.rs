use chrono::{DateTime, NaiveDate, NaiveDateTime, Utc};
use serde::{de::Error, Deserialize, Deserializer, Serialize, Serializer};

fn date_to_json(t: NaiveDate) -> String {
    DateTime::<Utc>::from_naive_utc_and_offset(NaiveDateTime::from(t), Utc).to_rfc3339()
}

pub fn serialize<S: Serializer>(date: &NaiveDate, serializer: S) -> Result<S::Ok, S::Error> {
    date_to_json(date.clone()).serialize(serializer)
}

pub fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<NaiveDate, D::Error> {
    let date: String = Deserialize::deserialize(deserializer)?;
    Ok(NaiveDate::parse_from_str(&date, "%Y-%m-%d %H:%M:%S").map_err(Error::custom)?)
}
