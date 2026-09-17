//! Standalone entry point: `cargo run -p xtask -- generate`.
//!
//! Calls the same `xtask::generate()` that `build.rs` calls. `build.rs` runs
//! from `src-tauri`; this crate lives at `src-tauri/xtask`, so we step up into
//! `src-tauri` first to give the crate the same project context — then the
//! generation logic itself lives entirely in `xtask::generate()`.

use std::path::Path;

fn main() {
    let src_tauri = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("xtask must live under src-tauri/");
    std::env::set_current_dir(src_tauri).expect("failed to chdir to src-tauri");

    xtask::generate().expect("tauri-typegen generation failed");
}
