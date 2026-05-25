# F-Droid Submission Guide

This document describes how to submit LibreFit to F-Droid.

## Prerequisites

✅ Already completed:

- Open source license (GPL-3.0)
- Source code on GitHub
- Git version tags (automated via CD workflow)
- No proprietary dependencies
- Fastlane metadata created

## Before Submission

### 1. Add Screenshots

Copy 2-8 screenshots to `fastlane/metadata/android/en-US/images/phoneScreenshots/`:

- Screenshot format: PNG or JPEG
- Recommended size: 1080x1920 (portrait) or your device resolution
- Show key features: dashboard, tracking, charts, etc.

### 2. Add App Icon

Copy your app icon to `fastlane/metadata/android/en-US/images/icon.png`:

- Size: 512x512px
- Format: PNG with transparency

### 3. Create a Release

Merge to `main` branch to trigger automatic release via GitHub Actions:

- Version will be auto-generated (CalVer: YY.WW.MICRO)
- Git tag will be created automatically
- GitHub release will be created

## Submission Process

### Step 1: Fork fdroiddata Repository

1. Create account on [GitLab](https://gitlab.com)
2. Fork the [fdroiddata repository](https://gitlab.com/fdroid/fdroiddata)

### Step 2: Create Metadata File

Create a new file in the forked repo:

```
metadata/io.tohowabohu.librefit.yml
```

Use this template:

```yaml
Categories:
  - Sports & Health

License: GPL-3.0-or-later

SourceCode: https://github.com/thwbh/librefit
IssueTracker: https://github.com/thwbh/librefit/issues
Changelog: https://github.com/thwbh/librefit/blob/main/CHANGELOG.md

AutoName: LibreFit
Summary: Privacy-focused calorie and weight tracker

Description: |-
  LibreFit is a free and open-source calorie and weight tracking app that
  respects your privacy. All data is stored locally on your device.

  Features:
  * Track calories across meal categories
  * Monitor weight with historical data
  * Set personalized targets
  * Export/import data (CSV and SQLite)
  * Offline-first architecture
  * No tracking, no ads

RepoType: git
Repo: https://github.com/thwbh/librefit.git

Builds:
  - versionName: 25.49.0
    versionCode: 254900
    commit: v25.49.0
    sudo:
      - apt-get update
      - apt-get install -y nodejs npm
    output: src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
    build:
      - npm install
      - npm run build
      - cd src-tauri
      - cargo install tauri-cli
      - cargo tauri android init
      - cargo tauri android build --apk
    ndk: r26b

AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: 25.49.0
CurrentVersionCode: 254900
```

### Step 3: Test Build Locally (Optional)

If you have F-Droid tools installed:

```bash
fdroid build io.tohowabohu.librefit
```

### Step 4: Submit Merge Request

1. Commit your metadata file
2. Push to your fork
3. Create a Merge Request to [fdroiddata](https://gitlab.com/fdroid/fdroiddata)
4. Title: "New app: LibreFit"
5. Description: Brief explanation of what the app does

### Step 5: Wait for Review

- F-Droid maintainers will review your submission
- They may request changes to the metadata
- Build will be tested on F-Droid infrastructure
- Average review time: 1-4 weeks

## After Acceptance

Once accepted, F-Droid will:

- Build from source for each release
- Sign with their own keys
- Automatically detect new releases via git tags
- Update the app on F-Droid

## Updating the App

After initial acceptance, updates are automatic:

1. Merge changes to `main` branch
2. CI creates new git tag
3. F-Droid detects the tag
4. F-Droid builds and publishes update

No manual intervention needed!

## Resources

- [F-Droid Submission Guide](https://f-droid.org/docs/Submitting_to_F-Droid_Quick_Start_Guide/)
- [Build Metadata Reference](https://f-droid.org/docs/Build_Metadata_Reference/)
- [fdroiddata Repository](https://gitlab.com/fdroid/fdroiddata)

## Troubleshooting

### Build Fails

Check the F-Droid build logs for specific errors. Common issues:

- Missing build dependencies
- Incorrect paths in metadata
- Version mismatch

### Tags Not Detected

Ensure your git tags follow the format `vX.Y.Z` (e.g., `v25.49.0`).

### Questions?

Ask on:

- [F-Droid Forum](https://forum.f-droid.org/)
- [#fdroid:f-droid.org on Matrix](https://matrix.to/#/#fdroid:f-droid.org)
