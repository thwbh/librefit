#!/bin/bash
set -e

# Android Template Setup Script
# This script applies custom configuration templates to the generated Android project
# Run this after 'cargo tauri android init' or when Android files are regenerated

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$SCRIPT_DIR/../gen/android"

echo "🤖 Setting up Android project with custom templates..."

# Check if Android project exists
if [ ! -d "$ANDROID_DIR" ]; then
    echo "❌ Error: Android directory not found at $ANDROID_DIR"
    echo "   Run 'cargo tauri android init' first"
    exit 1
fi

# 1. Apply custom activity_main.xml
if [ -f "$SCRIPT_DIR/activity_main.xml" ]; then
    echo "📝 Applying custom activity_main.xml..."
    cp "$SCRIPT_DIR/activity_main.xml" "$ANDROID_DIR/app/src/main/res/layout/activity_main.xml"
    echo "   ✅ activity_main.xml applied"
else
    echo "   ⚠️  activity_main.xml template not found"
fi

# 2. Set up keystore.properties
echo "🔑 Setting up keystore.properties..."

# Check if we're in CI/CD (environment variables set) or local development
if [ -n "$KEYSTORE_FILE" ] && [ -n "$KEYSTORE_PASSWORD" ] && [ -n "$KEY_ALIAS" ] && [ -n "$KEY_PASSWORD" ]; then
    echo "   Using environment variables for keystore configuration"

    # Always create keystore.properties from environment variables
    cat > "$ANDROID_DIR/keystore.properties" <<EOF
storeFile=$KEYSTORE_FILE
storePassword=$KEYSTORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASSWORD
EOF
    echo "   ✅ keystore.properties created from environment variables"

else
    echo "   ⚠️  No keystore environment variables found"
    echo "   For local development: Create keystore.properties manually"
    echo "   For CI/CD: Set KEYSTORE_FILE, KEYSTORE_PASSWORD, KEY_ALIAS, and KEY_PASSWORD environment variables"

    # Create example file for local development
    if [ -f "$SCRIPT_DIR/keystore.properties.template" ]; then
        cp "$SCRIPT_DIR/keystore.properties.template" "$ANDROID_DIR/keystore.properties.example"
        echo "   📄 Created keystore.properties.example from template"
    fi
fi

# 3. Apply custom build.gradle.kts (for keystore signing configuration)
if [ -f "$SCRIPT_DIR/build.gradle.kts" ]; then
    echo "🔧 Applying custom build.gradle.kts..."
    cp "$SCRIPT_DIR/build.gradle.kts" "$ANDROID_DIR/app/build.gradle.kts"
    echo "   ✅ build.gradle.kts applied (includes keystore signing)"
else
    echo "   ⚠️  build.gradle.kts template not found"
    echo "   See: https://v2.tauri.app/distribute/sign/android/"
fi

# 4. Apply custom AndroidManifest.xml (for permissions and other customizations)
if [ -f "$SCRIPT_DIR/AndroidManifest.xml" ]; then
    echo "📱 Applying custom AndroidManifest.xml..."
    cp "$SCRIPT_DIR/AndroidManifest.xml" "$ANDROID_DIR/app/src/main/AndroidManifest.xml"
    echo "   ✅ AndroidManifest.xml applied (includes storage permissions)"
else
    echo "   ⚠️  AndroidManifest.xml template not found"
fi

# 5. Apply custom MainActivity.kt (edge-to-edge + overscroll fix)
if [ -f "$SCRIPT_DIR/MainActivity.kt" ]; then
    echo "📱 Applying custom MainActivity.kt..."
    MAIN_ACTIVITY_DIR="$ANDROID_DIR/app/src/main/java/io/tohowabohu/librefit"
    cp "$SCRIPT_DIR/MainActivity.kt" "$MAIN_ACTIVITY_DIR/MainActivity.kt"
    echo "   ✅ MainActivity.kt applied (edge-to-edge + overscroll disabled)"
else
    echo "   ⚠️  MainActivity.kt template not found"
fi

# 6. Apply custom themes.xml (window background + transparent system bars)
if [ -f "$SCRIPT_DIR/themes.xml" ]; then
    echo "🎨 Applying custom themes.xml..."
    cp "$SCRIPT_DIR/themes.xml" "$ANDROID_DIR/app/src/main/res/values/themes.xml"
    # Also apply to night theme
    NIGHT_DIR="$ANDROID_DIR/app/src/main/res/values-night"
    if [ -d "$NIGHT_DIR" ]; then
        cp "$SCRIPT_DIR/themes.xml" "$NIGHT_DIR/themes.xml"
    fi
    echo "   ✅ themes.xml applied (primary window background)"
else
    echo "   ⚠️  themes.xml template not found"
fi

# 7. Apply custom colors.xml (app color definitions)
if [ -f "$SCRIPT_DIR/colors.xml" ]; then
    echo "🎨 Applying custom colors.xml..."
    cp "$SCRIPT_DIR/colors.xml" "$ANDROID_DIR/app/src/main/res/values/colors.xml"
    echo "   ✅ colors.xml applied (includes primary color)"
else
    echo "   ⚠️  colors.xml template not found"
fi

# 8. Force correct NDK path and version in local.properties and build.gradle.kts
if [ -n "$NDK_PATH" ]; then
    echo "🔧 Setting NDK path in local.properties..."

    # Create or update local.properties with correct NDK path
    LOCAL_PROPS="$ANDROID_DIR/local.properties"

    # Remove existing ndk.dir line if present
    if [ -f "$LOCAL_PROPS" ]; then
        sed -i.bak '/^ndk\.dir=/d' "$LOCAL_PROPS" && rm -f "$LOCAL_PROPS.bak"
    fi

    # Add correct ndk.dir
    echo "ndk.dir=$NDK_PATH" >> "$LOCAL_PROPS"
    echo "   ✅ NDK path set to: $NDK_PATH"

    # Also set ndkVersion in build.gradle.kts if NDK_VERSION is provided
    if [ -n "$NDK_VERSION" ]; then
        echo "🔧 Setting ndkVersion in build.gradle.kts..."
        BUILD_GRADLE="$ANDROID_DIR/app/build.gradle.kts"

        # Check if ndkVersion line already exists
        if grep -q "ndkVersion" "$BUILD_GRADLE"; then
            # Replace existing ndkVersion
            sed -i.bak "s/ndkVersion = \".*\"/ndkVersion = \"$NDK_VERSION\"/" "$BUILD_GRADLE" && rm -f "$BUILD_GRADLE.bak"
        else
            # Add ndkVersion after compileSdk line
            sed -i.bak "/compileSdk = /a\\
    ndkVersion = \"$NDK_VERSION\"" "$BUILD_GRADLE" && rm -f "$BUILD_GRADLE.bak"
        fi
        echo "   ✅ NDK version set to: $NDK_VERSION"
    fi
else
    echo "   ⚠️  NDK_PATH environment variable not set, skipping NDK configuration"
fi

echo ""
echo "✨ Android setup complete!"
echo ""
echo "Next steps:"
echo "  1. If local development: Fill in keystore.properties with your signing credentials"
echo "  2. Build your app: cargo tauri android build"
echo ""
