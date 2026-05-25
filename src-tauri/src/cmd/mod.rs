//! Test-only Tauri commands. Gated behind the `e2e-seed` Cargo feature so
//! production builds never include them. See e2e/README.md.

#[cfg(feature = "e2e-seed")]
pub mod seed;
