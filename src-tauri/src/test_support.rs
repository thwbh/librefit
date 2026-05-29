/// Cite the spec scenario(s) a test exercises. Place as the first line of the test body.
///
/// Each argument is a bracketed scenario ID literal, e.g. `"[IT-025]"`. The macro prints
/// `scenarios: [ID1] [ID2] ...` to stdout, which `cargo test` / `cargo nextest` capture
/// per-test and surface in failure output. The bracketed form is what the traceability
/// gate (`scripts/check-spec-traceability.mjs`) greps for.
///
/// # Example
/// ```ignore
/// #[test]
/// fn create_intake_entry_with_explicit_date() {
///     scenario!("[IT-025]", "[HI-009]", "[VAL-001]");
///     // assertions...
/// }
/// ```
#[macro_export]
macro_rules! scenario {
    ($($id:literal),+ $(,)?) => {{
        let ids: &[&str] = &[$($id),+];
        println!("scenarios: {}", ids.join(" "));
    }};
}
