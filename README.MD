# librefit

![GitHub Release](https://img.shields.io/github/v/release/thwbh/librefit) ![Coverage](https://raw.githubusercontent.com/thwbh/librefit/badges/jacoco.svg)

LibreFit is my hobby project that allows you to calculate your TDEE (Total Daily Energy Expenditure) based on your body
metrics, create goals for weight loss or weight gain from that and encourages you to track your daily calorie intake.
Based in your input, you will see easy to understand charts to keep on track with your goal - all that with privacy
first in mind.

- [Issue Tracker](https://github.com/thwbh/librefit/issues)
- [Discussions](https://github.com/thwbh/librefit/discussions)

## Introduction

LibreFit was created after tracking my caloric intake with some Excel and Google Sheets over a year. Out of boredom I
decided to try a new stack I've never done anything productive with, I quite enjoyed the journey and thus this project
was born.

### Dependencies

- rust 1.77.2
- diesel 2.2.6
- tauro 2.0
- sqlite 3
- sveltekit 2.5.2
- skeleton 2.9.0

### Tools

- Android Studio

## Structure

The project follows the default [tauri setup](https://tauri.app/start/create-project/).

```
librefit
|- librefit-web
|- src-tauri
```

## setup

Navigate to src-tauri/ and issue

```shell
cargo build
```

## start

To start the development server, go to the project root and issue

```shell
cargo tauri dev
```

To start the android development server:

```shell
cargo tauri android dev
```

If you encounter an error like this:

`java.lang.UnsatisfiedLinkError: dlopen failed: cannot locate symbol "__floatunditf"`

The linker path found in `build.rs` does not match.

- Navigate to $NDK_HOME.
- Search for the x86_64-android libclang file. If you followed the steps in the tauri docs, the path should look like this:

`$NDK_HOME/toolchains/llvm/prebuild/<host>/<lib>/clang/<clang-version>/lib/<os>/libclang_rt.builtins-<guest>.a`

- <host>: Your system type, e.g. linux-x86_64
- <lib>: Either lib or lib64
- <os>: Your OS type, e.g. linux
- <guest>: Guest system type, e.g. x86_64-android

export that as env variable, e.g. `$LINKER`

Force cargo to use that linker with `RUSTFLAGS=-C link-arg=$LINKER`

Example command (works on my machine (tm)):

```shell
RUSTFLAGS="-C link-arg=$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/lib/clang/19/lib/linux/libclang_rt.builtins-x86_64-android.a" cargo tauri android dev
```

## Attribution

The avatars were created with hotpot: https://hotpot.ai/art-generator

## Contribute

If you have any suggestions, impediments or things that absolutely annoy you, please refer to the issue tracker linked
at the top of this document. When you are interested in participating in development, feel free to contact me.
