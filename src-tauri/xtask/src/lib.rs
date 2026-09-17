//! The project's typegen invocation — the single source of truth shared by
//! `build.rs` and the `cargo run -p xtask` bin, so the two can never diverge.
//!
//! This is the one place that decides *how* generation is configured. The
//! default reads the `plugins.typegen` block from `tauri.conf.json`; swap the
//! body for a custom config file or a fully programmatic `GenerateConfig`
//! (e.g. `tauri_typegen::generate_from_config(&cfg)`) and both callers follow.

pub fn generate() -> Result<(), Box<dyn std::error::Error>> {
    tauri_typegen::BuildSystem::generate_at_build_time()
}
