use chrono::{Days, Local, NaiveDate};
use diesel::r2d2::{ConnectionManager, Pool};
use diesel::sqlite::SqliteConnection;
use librefit_lib::db::migrations;
use librefit_lib::service::intake::{Intake, IntakeTarget, NewIntake, NewIntakeTarget};
use librefit_lib::service::user::LibreUser;
use librefit_lib::service::weight::{
    NewWeightTarget, NewWeightTracker, WeightTarget, WeightTracker,
};

pub type TestPool = Pool<ConnectionManager<SqliteConnection>>;

/// Mirror the production pool's pragmas (see `db::connection`). Foreign keys are
/// the one that matters here: SQLite leaves them OFF by default, so without this
/// the suite happily accepts writes the app rejects on device (issue #418).
#[derive(Debug, Clone, Copy)]
struct TestConnectionOptions;

impl diesel::r2d2::CustomizeConnection<SqliteConnection, diesel::r2d2::Error>
    for TestConnectionOptions
{
    fn on_acquire(&self, conn: &mut SqliteConnection) -> Result<(), diesel::r2d2::Error> {
        use diesel::RunQueryDsl;
        diesel::sql_query("PRAGMA foreign_keys = ON;")
            .execute(conn)
            .map_err(diesel::r2d2::Error::QueryError)?;
        Ok(())
    }
}

/// Creates an in-memory SQLite database with all migrations applied.
/// Each test should call this to get a fresh, isolated database.
pub fn setup_test_pool() -> TestPool {
    let manager = ConnectionManager::<SqliteConnection>::new(":memory:");
    let pool = Pool::builder()
        .max_size(1)
        .connection_customizer(Box::new(TestConnectionOptions))
        .build(manager)
        .expect("Failed to create test pool");

    let mut conn = pool.get().expect("Failed to get connection");
    migrations::run(&mut conn).expect("Failed to run migrations");

    pool
}

/// Creates a test user in the database
pub fn create_test_user(pool: &TestPool, name: &str, avatar: &str) -> LibreUser {
    let mut conn = pool.get().expect("Failed to get connection");
    LibreUser::update(&mut conn, name, avatar).expect("Failed to create test user")
}

/// Creates a test intake target in the database
pub fn create_test_intake_target(
    pool: &TestPool,
    start_date: &str,
    end_date: &str,
    target_calories: i32,
    maximum_calories: i32,
) -> IntakeTarget {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_target = NewIntakeTarget {
        added: start_date.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        target_calories,
        maximum_calories,
    };
    IntakeTarget::create(&mut conn, &new_target).expect("Failed to create intake target")
}

/// Creates a test weight target in the database
pub fn create_test_weight_target(
    pool: &TestPool,
    start_date: &str,
    end_date: &str,
    initial_weight: f32,
    target_weight: f32,
) -> WeightTarget {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_target = NewWeightTarget {
        added: start_date.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        initial_weight,
        target_weight,
    };
    WeightTarget::create(&mut conn, &new_target).expect("Failed to create weight target")
}

/// Creates a test intake entry
pub fn create_test_intake_entry(
    pool: &TestPool,
    added: &str,
    amount: i32,
    category: &str,
    description: Option<String>,
) -> Intake {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_entry = NewIntake::new(added.to_string(), amount, category.to_string(), description);
    Intake::create(&mut conn, &new_entry).expect("Failed to create intake entry")
}

/// Creates a test weight tracker entry
pub fn create_test_weight_entry(pool: &TestPool, added: &str, amount: f32) -> WeightTracker {
    let mut conn = pool.get().expect("Failed to get connection");
    let new_entry = NewWeightTracker::new(added.to_string(), amount);
    WeightTracker::create(&mut conn, &new_entry).expect("Failed to create weight entry")
}

/// Creates test dates that lie ahead to avoid time-dependent validation errors
/// Returns (start_date, end_date) as formatted strings.
pub fn create_future_test_dates() -> (String, String) {
    let today: NaiveDate = Local::now().date_naive();
    let start = today.checked_add_days(Days::new(1)).unwrap();
    let end = today.checked_add_days(Days::new(180)).unwrap(); // 6 months in the future

    (
        start.format("%Y-%m-%d").to_string(),
        end.format("%Y-%m-%d").to_string(),
    )
}

/// Spin up a one-shot local HTTP server. Accepts a single request, captures the
/// raw bytes for assertions, and replies with `status` + `json_body`. Returns
/// the base URL to point the adapter at and the captured request.
pub fn one_shot_server(
    status: &str,
    json_body: &str,
) -> (String, std::sync::mpsc::Receiver<String>) {
    use std::io::{Read, Write};
    use std::net::TcpListener;

    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap();
    let (tx, rx) = std::sync::mpsc::channel::<String>();
    let status = status.to_string();
    let json_body = json_body.to_string();

    std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut buf: Vec<u8> = Vec::new();
        let mut chunk = [0u8; 8192];
        // Read until the full request (headers + Content-Length body) is in.
        loop {
            let n = stream.read(&mut chunk).unwrap();
            if n == 0 {
                break;
            }
            buf.extend_from_slice(&chunk[..n]);
            if let Some(pos) = buf.windows(4).position(|w| w == b"\r\n\r\n") {
                let headers = String::from_utf8_lossy(&buf[..pos]).to_string();
                let content_length = headers
                    .lines()
                    .find_map(|l| {
                        let lower = l.to_ascii_lowercase();
                        if lower.starts_with("content-length:") {
                            l.split(':')
                                .nth(1)
                                .and_then(|v| v.trim().parse::<usize>().ok())
                        } else {
                            None
                        }
                    })
                    .unwrap_or(0);
                if buf.len() >= pos + 4 + content_length {
                    break;
                }
            }
        }
        tx.send(String::from_utf8_lossy(&buf).into_owned()).unwrap();

        let response = format!(
            "HTTP/1.1 {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            status,
            json_body.len(),
            json_body
        );
        stream.write_all(response.as_bytes()).unwrap();
    });

    (format!("http://{}", addr), rx)
}
