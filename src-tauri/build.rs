use std::env;

fn main() {
    setup_android_llvm();

    tauri_build::build()
}

fn setup_android_llvm() {
    let target_os = env::var("CARGO_CFG_TARGET_OS").expect("CARGO_CFG_TARGET_OS not set");
    let target_arch = env::var("CARGO_CFG_TARGET_ARCH").expect("CARGO_CFG_TARGET_ARCH not set");

    if target_arch == "x86_64" && target_os == "android" {
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

        let linker = format!(
            "{android_ndk_home}/toolchains/llvm/prebuilt/{build_os}-x86_64/lib/clang/{clang_version}/lib/linux/libclang_rt.builtins-x86_64-android.a");

        println!("cargo:rustc-link-arg={linker}");
    }
}
