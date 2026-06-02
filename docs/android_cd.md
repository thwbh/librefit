# Android CD Pipeline Setup

This document explains how to set up the Android Continuous Deployment pipeline for LibreFit.

## Overview

The Android CD pipeline uses GitHub Actions to build signed APK and AAB files. It handles:

- Tauri Android project initialization
- Application of custom templates (bugfixes, configurations)
- Keystore management via secrets
- Building both APK (for direct distribution) and AAB (for Google Play)

## Architecture

### Template System

The `src-tauri/android-templates/` directory contains:

- **setup-android.sh**: Script that applies templates after Tauri generates Android files
- **activity_main.xml**: Custom activity layout with bugfixes
- **keystore.properties.template**: Template for signing configuration
- **README.md**: Documentation

This solves the problem that Tauri's `gen/android` directory is regenerated and would lose manual changes.

### Workflow

`.github/workflows/android-release.yml` handles the build process:

1. Sets up Node.js, Rust, Java, and Android SDK
2. Initializes Tauri Android project
3. Applies custom templates via `setup-android.sh`
4. Builds APK/AAB with signing
5. Uploads artifacts and creates GitHub release

## Setup Instructions

### 1. Generate Android Keystore

First, create a keystore for signing your app:

```bash
keytool -genkey -v -keystore upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload
```

Answer the prompts:

- Keystore password: Choose a strong password
- Key password: Can be same as keystore password
- Your name, organization, etc.

**Important**: Keep this keystore file secure! You'll need it for all future releases.

### 2. Convert Keystore to Base64

GitHub Actions needs the keystore as a base64-encoded secret:

```bash
base64 -i upload-keystore.jks -o keystore-base64.txt
```

On Linux:

```bash
base64 -w 0 upload-keystore.jks > keystore-base64.txt
```

### 3. Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name                 | Description                  | Example Value                    |
| --------------------------- | ---------------------------- | -------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Base64-encoded keystore file | (content of keystore-base64.txt) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password            | `your-keystore-password`         |
| `ANDROID_KEY_ALIAS`         | Key alias from keytool       | `upload`                         |
| `ANDROID_KEY_PASSWORD`      | Key password                 | `your-key-password`              |

### 4. Test the Workflow

1. Go to Actions → Android Release → Run workflow
2. Choose release type (APK, AAB, or both)
3. Click "Run workflow"

The workflow will:

- Build your app
- Sign it with your keystore
- Upload artifacts
- Create a draft GitHub release

## Local Development

### Setup

1. Copy the keystore template:

   ```bash
   cd src-tauri
   cp android-templates/keystore.properties.template gen/android/keystore.properties
   ```

2. Edit `gen/android/keystore.properties` with your local keystore path and credentials

3. Run the setup script manually:
   ```bash
   cd src-tauri
   ./android-templates/setup-android.sh
   ```

### Building Locally

```bash
# Initialize Android project (if not done)
cd src-tauri
cargo tauri android init

# Apply templates
./android-templates/setup-android.sh

# Build APK
cargo tauri android build --apk

# Build AAB (for Play Store)
cargo tauri android build --aab
```

## Adding Custom Android Files

If you need to add more custom files to the Android project:

1. **Create template file**: Add it to `src-tauri/android-templates/`

2. **Update setup script**: Edit `setup-android.sh` to copy your file:

   ```bash
   if [ -f "$SCRIPT_DIR/your-file.xml" ]; then
       cp "$SCRIPT_DIR/your-file.xml" "$ANDROID_DIR/path/to/destination/"
       echo "   ✅ your-file.xml applied"
   fi
   ```

3. **Document it**: Update `android-templates/README.md`

4. **Test**: Run the setup script locally to verify

## Troubleshooting

### Build fails with "keystore not found"

- Check that secrets are set correctly in GitHub
- Verify the base64 encoding is correct
- Ensure no line breaks in the base64 string

### Template files not applied

- Check that `setup-android.sh` has execute permissions
- Verify the file paths in the setup script
- Check workflow logs for error messages

### Signing errors

- Verify keystore password and key password are correct
- Check that the key alias matches your keystore
- Ensure keystore file was decoded correctly from base64

### "gen/android directory not found"

- Make sure `cargo tauri android init` runs before `setup-android.sh`
- Check that the Android NDK is installed correctly

## Security Notes

1. **Never commit keystore files** to git

   - The `.gitignore` excludes `keystore.properties` and `*.jks`
   - Keep your keystore file backed up securely offline

2. **Rotate secrets if compromised**

   - Generate new keystore
   - Update all GitHub secrets
   - Users will need to uninstall and reinstall (different signing key)

3. **Use different keystores for debug/release**
   - Debug: Auto-generated keystore (already in Android SDK)
   - Release: Your production keystore (never share)

## References

- [Tauri Android Guide](https://v2.tauri.app/develop/android/)
- [Tauri Android Signing](https://v2.tauri.app/distribute/sign/android/)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [GitHub Actions](https://docs.github.com/en/actions)
