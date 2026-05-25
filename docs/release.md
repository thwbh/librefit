# Release Process

This document describes the automated CalVer release process for LibreFit.

## Version Format

LibreFit uses **Calendar Versioning (CalVer)** in the format: `YY.WW.MICRO`

- **YY**: Last 2 digits of the year (e.g., `25` for 2025)
- **WW**: Zero-padded ISO week number (e.g., `48` for week 48)
- **MICRO**: Incrementing counter for releases within the same week (starts at 0)

Examples:

- `25.48.0` - First release in week 48 of 2025
- `25.48.1` - Second release in week 48 of 2025
- `25.01.0` - First release in week 1 of 2025

## Android Version Code

For Android, the versionCode is calculated as: `YYWWMMMM`

- `YY`: Last 2 digits of year
- `WW`: Zero-padded week number
- `MMMM`: 4-digit zero-padded micro version

Examples:

- Version `25.48.0` → versionCode `25480000`
- Version `25.48.1` → versionCode `25480001`

## Automated Release Workflow

### Triggering a Release

Releases are triggered automatically by:

1. **Manual trigger**: Go to Actions → Release → Run workflow
2. **Push to main**: Any push to the `main` branch automatically creates a release

### What Happens During Release

The CD workflow (`.github/workflows/cd.yml`) performs these steps:

1. **Generate Version**

   - Calculates the CalVer version based on current date
   - Checks existing git tags to avoid conflicts
   - Increments MICRO version if a tag already exists for this week

2. **Update Version Files**

   - Updates `package.json`
   - Updates `src-tauri/Cargo.toml`
   - Updates `src-tauri/tauri.conf.json`
   - Creates `src-tauri/gen/android/app/tauri.properties` with versionCode and versionName

3. **Build Android APK**

   - Sets up Node.js, Rust, Java, and Android SDK
   - Installs dependencies
   - Builds the frontend
   - Compiles the Tauri Android APK (aarch64 target)

4. **Create GitHub Release**

   - Creates a git tag (e.g., `v25.48.0`)
   - Creates a GitHub release with the APK attached
   - Generates release notes automatically

5. **Commit Version Bump**
   - Commits the version changes back to the repository
   - Marked with `[skip ci]` to avoid triggering another build

## Version Display

The app version is displayed dynamically in the About page (`src/routes/(app)/about/+page.svelte`).

The version is injected at build time from `package.json` using Vite's `define` feature:

- Defined in `vite.config.ts` as `__APP_VERSION__`
- TypeScript types in `src/app.d.ts`
- Rendered in About page as: `Version {__APP_VERSION__} • Free & Open Source`

## Manual Version Bump (if needed)

If you need to manually set a specific version:

1. Update `package.json`:

   ```json
   "version": "25.48.0"
   ```

2. Update `src-tauri/Cargo.toml`:

   ```toml
   version = "25.48.0"
   ```

3. Update `src-tauri/tauri.conf.json`:

   ```json
   "version": "25.48.0"
   ```

4. Commit and push to trigger the build with your specified version

## F-Droid Publishing

For F-Droid submission, you'll need to:

1. Ensure all versions are synced (done automatically by CI)
2. Create proper git tags for each release (done automatically by CI)
3. Submit metadata to F-Droid repository (see main documentation for details)

F-Droid will build from source using the git tags created by the release workflow.

## Troubleshooting

### Build fails with "version conflict"

- Check that all version files are in sync
- Look at the CI logs to see which file has a mismatch

### Version not updating in app

- Clear the build cache: `rm -rf build .svelte-kit`
- Rebuild: `npm run build`

### Git tag already exists

- The CI will automatically increment the MICRO version
- If you need to re-release, delete the tag: `git tag -d v25.48.0 && git push origin :refs/tags/v25.48.0`

## Files Involved

- `.github/scripts/generate-version.sh` - Version generation script
- `.github/workflows/cd.yml` - Release workflow
- `vite.config.ts` - Injects version into build
- `src/app.d.ts` - TypeScript definition for **APP_VERSION**
- `src/routes/(app)/about/+page.svelte` - Displays version to user
- `package.json` - NPM package version
- `src-tauri/Cargo.toml` - Rust package version
- `src-tauri/tauri.conf.json` - Tauri app version
- `src-tauri/gen/android/app/tauri.properties` - Android version code/name

## Next Steps for F-Droid

Before submitting to F-Droid, review the main F-Droid requirements document and ensure:

- [ ] All dependencies are FOSS licensed
- [ ] No tracking or analytics code
- [ ] Reproducible builds
- [ ] Fastlane metadata created
- [ ] Screenshots added
- [ ] F-Droid metadata YAML prepared
