# Android Templates

This directory contains template files for Android-specific configurations that need to be applied after Tauri generates the Android project files.

## Purpose

Tauri's `gen/android` directory contains generated files that get recreated when you run `tauri android init` or similar commands. Any manual changes to these files would be lost. This templates directory preserves those custom changes.

## Files

### keystore.properties.template

Template for Android app signing configuration. Contains placeholders for environment variables.

**Usage:**

- Local development: Copy to `gen/android/keystore.properties` and fill in your values
- CI/CD: The setup script will replace placeholders with environment variables

### activity_main.xml

Custom activity layout with bugfixes applied.

**Usage:**

- Copied to `gen/android/app/src/main/res/layout/activity_main.xml` after Tauri generation

### AndroidManifest.xml

Custom Android manifest with required permissions for file access.

**Permissions included:**

- `READ_EXTERNAL_STORAGE` - For importing CSV files (Android 12 and below)
- `WRITE_EXTERNAL_STORAGE` - For exporting database and CSV files (Android 12 and below)

**Usage:**

- Copied to `gen/android/app/src/main/AndroidManifest.xml` after Tauri generation

## Scripts

### setup-android.sh

Bash script that:

1. Applies template files to the generated Android project
2. Replaces environment variable placeholders
3. Ensures the Android project is ready for building

## CI/CD Integration

In your GitHub Actions workflow, run `./android-templates/setup-android.sh` after Tauri Android initialization to apply these templates.

Example:

```yaml
- name: Initialize Tauri Android
  run: cd src-tauri && cargo tauri android init

- name: Apply Android templates
  run: cd src-tauri && ./android-templates/setup-android.sh
  env:
    KEYSTORE_FILE: ${{ secrets.ANDROID_KEYSTORE_FILE }}
    KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
    KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
```

## Adding New Templates

To add a new template:

1. Create the template file in this directory
2. Update `setup-android.sh` to copy it to the appropriate location
3. Document it in this README
