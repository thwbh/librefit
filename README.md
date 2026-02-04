![librefit logo](/src/lib/assets/logo/librefit-app-logo@256x256.png)

# LibreFit

![GitHub Release](https://img.shields.io/github/v/release/thwbh/librefit)
[![codecov](https://codecov.io/github/thwbh/librefit/graph/badge.svg?token=0WEOJOI3IJ)](https://codecov.io/github/thwbh/librefit)
![License](https://img.shields.io/github/license/thwbh/librefit)

**Your free and open-source calorie tracker for privacy-focused health monitoring.**

LibreFit is a cross-platform app built with Tauri that helps you track your caloric intake and monitor your weight progress with complete privacy. Calculate your TDEE (Total Daily Energy Expenditure), set personalized goals, and visualize your progress with beautiful charts - all without sacrificing your privacy.

## Features

- 📊 **Science-based TDEE calculator** - Get personalized calorie recommendations based on your body metrics and activity level
- 🎯 **Goal-oriented tracking** - Set weight loss or gain targets with customizable timelines
- 📱 **Simple daily logging** - Track your meals and weight in seconds
- 📈 **Visual progress charts** - Monitor your journey with intuitive graphs and insights
- 🔒 **Privacy-first** - All data stays on your device, no cloud sync, no tracking, no ads
- 🎨 **Clean, modern UI** - Built with Svelte 5 and Tauri for a smooth, near-native experience
- 📤 **Data export** - Export your data as CSV or complete database backups
- 🔧 **Cross-platform** - Currently targeting Android, with broader support possible in the future

## Links

- [Issue Tracker](https://github.com/thwbh/librefit/issues)
- [Discussions](https://github.com/thwbh/librefit/discussions)

## Tech Stack

- **Backend**: Rust 1.84.0 + Tauri 2.2
- **Database**: SQLite 3 with Diesel ORM 2.2.6
- **Frontend**: SvelteKit 2 + Svelte 5
- **UI**: Tailwind CSS 4 + DaisyUI 5
- **Build**: Vite 6

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) 1.84.0 or higher
- [Node.js](https://nodejs.org/) 20.x or higher
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Android NDK](https://developer.android.com/ndk) (for Android builds)

## Project Structure

```
librefit/
├── src/                    # SvelteKit frontend
│   ├── lib/               # Reusable components and utilities
│   └── routes/            # App pages and layouts
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   ├── migrations/        # Database migrations
│   └── gen/android/       # Generated Android project
├── .github/
│   ├── workflows/         # CI/CD pipelines
│   └── scripts/           # Build scripts
└── tests/                 # Frontend tests
```

## Development Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/thwbh/librefit.git
cd librefit
npm install
```

### 2. Build Rust Backend

```bash
cd src-tauri
cargo build
cd ..
```

### 3. Start Development Server

**Desktop development:**

```bash
cargo tauri dev
```

**Android development:**

```bash
cargo tauri android dev
```

### Android NDK Linker Issues

If you encounter this error:

```
java.lang.UnsatisfiedLinkError: dlopen failed: cannot locate symbol "__floatunditf"
```

The linker path in `build.rs` doesn't match your system. Fix it by:

1. Locate your NDK linker library:

   ```
   $NDK_HOME/toolchains/llvm/prebuilt/<host>/lib/clang/<version>/lib/<os>/libclang_rt.builtins-<guest>.a
   ```

2. Run with explicit linker:
   ```bash
   RUSTFLAGS="-C link-arg=$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/lib/clang/19/lib/linux/libclang_rt.builtins-x86_64-android.a" cargo tauri android dev
   ```

## Testing

This project uses [nextest](https://nexte.st/) for Rust and [vitest](https://vitest.dev) for frontend tests.

**Run frontend tests:**

```bash
npm run test
```

**Run backend tests:**

```bash
cd src-tauri
cargo nextest run
```

**Run with coverage:**

```bash
npm run test:ci              # Frontend with coverage
cargo llvm-cov nextest       # Backend with coverage
```

## Contributing

Contributions are welcome! Here's how you can help:

- **Report bugs**: Use the [Issue Tracker](https://github.com/thwbh/librefit/issues) to report bugs or request features
- **Discuss ideas**: Join the [Discussions](https://github.com/thwbh/librefit/discussions) to share ideas or ask questions
- **Submit PRs**: Fork the repo, make your changes, and submit a pull request
- **Improve documentation**: Help make the docs clearer and more comprehensive

Please review any open issues before starting work to avoid duplicated efforts.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.
