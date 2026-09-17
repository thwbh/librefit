use std::env;

fn main() {
    setup_android_llvm();

    // Generate TypeScript bindings — shared logic with the xtask bin.
    xtask::generate().expect("Failed to generate TypeScript bindings");

    tauri_build::build()
}

fn setup_android_llvm() {
    let target_os = env::var("CARGO_CFG_TARGET_OS").expect("CARGO_CFG_TARGET_OS not set");

    env::var("CARGO_CFG_TARGET_ARCH").expect("CARGO_CFG_TARGET_ARCH not set");

    if target_os == "android" {
        env::var("NDK_HOME").expect("NDK_HOME not set");
        match env::consts::OS {
            "linux" => "linux",
            "macos" => "darwin",
            "windows" => "windows",
            _ => panic!(
                "Unsupported OS. You must use either Linux, MacOS or Windows to build the crate."
            ),
        };
    }
}
