use std::env;
use tauri_typegen::BuildSystem;

fn main() {
    setup_android_llvm();

    // Generate TypeScript bindings from Tauri commands
    BuildSystem::generate_at_build_time().expect("Failed to generate TypeScript bindings");

    tauri_build::build()
}

fn setup_android_llvm() {
    let target_os = env::var("CARGO_CFG_TARGET_OS").expect("CARGO_CFG_TARGET_OS not set");
    let target_arch = env::var("CARGO_CFG_TARGET_ARCH").expect("CARGO_CFG_TARGET_ARCH not set");

    if target_os == "android" {
        let android_ndk_home = env::var("NDK_HOME").expect("NDK_HOME not set");
        let build_os = match env::consts::OS {
            "linux" => "linux",
            "macos" => "darwin",
            "windows" => "windows",
            _ => panic!(
                "Unsupported OS. You must use either Linux, MacOS or Windows to build the crate."
            ),
        };
        const DEFAULT_CLANG_VERSION: &str = "19";
        let clang_version =
            env::var("NDK_CLANG_VERSION").unwrap_or_else(|_| DEFAULT_CLANG_VERSION.to_owned());

        // Map Rust target arch to Android arch naming
        let android_arch = match target_arch.as_str() {
            "aarch64" => "aarch64",
            "arm" => "armv7a",
            "x86" => "i686",
            "x86_64" => "x86_64",
            _ => panic!("Unsupported Android architecture: {}", target_arch),
        };

        let linker = format!(
            "{android_ndk_home}/toolchains/llvm/prebuilt/{build_os}-x86_64/lib/clang/{clang_version}/lib/linux/libclang_rt.builtins-{android_arch}-android.a");

        println!("cargo:rustc-link-arg={linker}");
    }
}
