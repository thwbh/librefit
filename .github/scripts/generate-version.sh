#!/bin/bash
set -e

# Generate CalVer version in YY.WW.MICRO format (always 3 segments for Rust/Tauri)
# Example: 25.48.0 (initial), 25.48.1 (first patch), 25.48.2 (second patch)

# Get current year (last 2 digits) and week number (zero-padded)
YEAR=$(date +%y)
WEEK=$(date +%V)
WEEK_NO_PAD=$((10#$WEEK))  # Remove leading zero for semver compliance
BASE_VERSION="${YEAR}.${WEEK}"

echo "Base version: ${BASE_VERSION}"

# Find all tags matching this week's base version (both YY.WW and YY.WW.MICRO)
EXISTING_TAGS=$(git tag -l "${BASE_VERSION}" "${BASE_VERSION}.*" 2>/dev/null || echo "")

if [ -z "$EXISTING_TAGS" ]; then
    # No tags exist for this week, start with .0
    VERSION="${BASE_VERSION}.0"
    MICRO=0
else
    # Find the highest micro version
    # Filter out the base version and extract micro numbers
    MICRO_TAGS=$(echo "$EXISTING_TAGS" | grep -E "^${BASE_VERSION}\.[0-9]+$" || echo "")

    if [ -z "$MICRO_TAGS" ]; then
        # Only base version exists (YY.WW), start patches at .1
        MICRO=1
    else
        # Find highest existing micro version
        HIGHEST_MICRO=$(echo "$MICRO_TAGS" | sed "s/${BASE_VERSION}\\.//g" | sort -n | tail -1)
        MICRO=$((HIGHEST_MICRO + 1))
    fi

    VERSION="${BASE_VERSION}.${MICRO}"
fi

# Semver version without leading zeros (for Cargo.toml, tauri.conf.json, package.json)
SEMVER="${YEAR}.${WEEK_NO_PAD}.${MICRO}"

echo "Generated version: ${VERSION} (semver: ${SEMVER})"
echo "VERSION=${VERSION}" >> $GITHUB_OUTPUT
echo "SEMVER=${SEMVER}" >> $GITHUB_OUTPUT
echo "TAG=${VERSION}" >> $GITHUB_OUTPUT

# Also calculate versionCode (YYWWMMMM format for Android)
# Example: 25480000 (25.48), 25480001 (25.48.1), 25480002 (25.48.2)
VERSION_CODE=$(printf "%02d%02d%04d" $YEAR $WEEK $MICRO)
echo "VERSION_CODE=${VERSION_CODE}" >> $GITHUB_OUTPUT
