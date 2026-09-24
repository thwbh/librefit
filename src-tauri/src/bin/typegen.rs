//! Standalone TypeScript-binding generation, run before the frontend build:
//!
//! ```text
//! cargo run --bin typegen
//! ```
//!
//! Wired into `beforeBuildCommand` in tauri.conf.json. It calls the same
//! tauri-typegen entry point as `build.rs` (`BuildSystem::generate_at_build_time`),
//! so the two can't diverge — config discovery and output resolution live in the
//! crate. As a package bin, `CARGO_MANIFEST_DIR` is `src-tauri`, so we run from
//! there and project detection resolves regardless of the invoking CWD.

fn main() {
    std::env::set_current_dir(env!("CARGO_MANIFEST_DIR"))
        .expect("failed to chdir to the crate root");

    tauri_typegen::BuildSystem::generate_at_build_time().expect("tauri-typegen generation failed");
}
