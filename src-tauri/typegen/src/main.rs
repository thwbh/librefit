//! Standalone TypeScript-binding generation, run before the frontend build:
//!
//! ```text
//! cargo run -p typegen
//! ```
//!
//! Wired into `beforeBuildCommand` in tauri.conf.json. It is its own crate,
//! depending only on `tauri-typegen`, so running it never compiles the librefit
//! app crate (and thus never needs `tauri`'s system libs — glib/webkit — which
//! the Android CI runner does not install).
//!
//! It calls the same entry point as `build.rs`
//! (`BuildSystem::generate_at_build_time`), so config discovery and output
//! resolution live in the crate and the two paths cannot diverge.

use std::path::Path;

fn main() {
    // This crate lives at `src-tauri/typegen`; its parent is `src-tauri`, where
    // build.rs runs. chdir there so project detection resolves the same way.
    let src_tauri = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("typegen must live under src-tauri/");
    std::env::set_current_dir(src_tauri).expect("failed to chdir to src-tauri");

    tauri_typegen::BuildSystem::generate_at_build_time().expect("tauri-typegen generation failed");
}
