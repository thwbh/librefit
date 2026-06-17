//! Build automation: generate TypeScript bindings from the Tauri commands.
//!
//! Run from the workspace (`src-tauri`):
//!
//! ```text
//! cargo run -p xtask -- generate
//! ```
//!
//! This invokes tauri-typegen through the Cargo dependency graph (the version pinned
//! in `[workspace.dependencies]`), so no separate `cargo install` is needed and there
//! is a single source of truth for the typegen version.
//!
//! NOTE: this scaffold is not yet wired into `beforeBuildCommand` / `build.rs` — those
//! stay as-is until the test pipeline is checked.

use std::path::Path;

use tauri_typegen::{generate_from_config, GenerateConfig};

fn main() {
    // This crate lives at `src-tauri/xtask`, so its parent is `src-tauri`. Run from there
    // so the relative `projectPath`/`outputPath` in tauri.conf.json resolve exactly the
    // way the `cargo tauri-typegen generate` CLI resolves them (it runs from src-tauri).
    let src_tauri = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("xtask must live under src-tauri/");
    std::env::set_current_dir(src_tauri).expect("failed to chdir to src-tauri");

    // Single source of config: read the existing `plugins.typegen` block from tauri.conf.json.
    let config = GenerateConfig::from_tauri_config("tauri.conf.json")
        .expect("failed to read tauri.conf.json")
        .expect("no `plugins.typegen` configuration found in tauri.conf.json");

    generate_from_config(&config).expect("tauri-typegen generation failed");
    eprintln!(
        "tauri-typegen: bindings generated into {}",
        config.output_path
    );
}
