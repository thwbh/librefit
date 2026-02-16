#!/bin/bash
set -e

# Generate CalVer version in YY.WW.MICRO format (always 3 segments for Rust/Tauri)
# Example: 25.48.0 (initial), 25.48.1 (first patch), 25.48.2 (second patch)
#
# Patch mode: when merging a patch/* branch into main, bump the latest tag's
# micro version instead of generating a new CalVer based on today's date.

PATCH_MODE=false

# Detect patch mode from merge commit message
# GitHub merge commits look like: "Merge pull request #N from user/patch/..."
# or "Merge branch 'patch/...'"
if [ -n "$COMMIT_MESSAGE" ]; then
    if echo "$COMMIT_MESSAGE" | grep -qiE "(from [^ ]+/patch/|Merge branch 'patch/)"; then
        PATCH_MODE=true
        echo "Patch mode detected from merge commit"
    fi
fi

if [ "$PATCH_MODE" = true ]; then
    # Find the latest existing tag (by version, not date)
    LATEST_TAG=$(git tag -l --sort=-v:refname | grep -E '^[0-9]{2}\.[0-9]{1,2}(\.[0-9]+)?$' | head -1)

    if [ -z "$LATEST_TAG" ]; then
        echo "Error: No existing CalVer tags found for patching"
        exit 1
    fi

    echo "Patching from latest tag: ${LATEST_TAG}"

    # Parse the latest tag: could be YY.WW or YY.WW.MICRO
    YEAR=$(echo "$LATEST_TAG" | cut -d. -f1)
    WEEK=$(echo "$LATEST_TAG" | cut -d. -f2)
    CURRENT_MICRO=$(echo "$LATEST_TAG" | cut -d. -f3)

    # If no micro segment (bare YY.WW tag), treat as .0
    if [ -z "$CURRENT_MICRO" ]; then
        CURRENT_MICRO=0
    fi

    MICRO=$((CURRENT_MICRO + 1))
    WEEK_NO_PAD=$((10#$WEEK))
    VERSION="${YEAR}.${WEEK}.${MICRO}"
    SEMVER="${YEAR}.${WEEK_NO_PAD}.${MICRO}"

    echo "Patch version: ${VERSION} (semver: ${SEMVER})"
else
    # Standard CalVer: generate from current date
    YEAR=$(date +%y)
    WEEK=$(date +%V)
    WEEK_NO_PAD=$((10#$WEEK))
    BASE_VERSION="${YEAR}.${WEEK}"

    echo "Base version: ${BASE_VERSION}"

    # Find all tags matching this week's base version (both YY.WW and YY.WW.MICRO)
    EXISTING_TAGS=$(git tag -l "${BASE_VERSION}" "${BASE_VERSION}.*" 2>/dev/null || echo "")

    if [ -z "$EXISTING_TAGS" ]; then
        # No tags exist for this week, start with .0
        MICRO=0
    else
        # Find the highest micro version
        MICRO_TAGS=$(echo "$EXISTING_TAGS" | grep -E "^${BASE_VERSION}\.[0-9]+$" || echo "")

        if [ -z "$MICRO_TAGS" ]; then
            # Only base version exists (YY.WW), start patches at .1
            MICRO=1
        else
            # Find highest existing micro version
            HIGHEST_MICRO=$(echo "$MICRO_TAGS" | sed "s/${BASE_VERSION}\\.//g" | sort -n | tail -1)
            MICRO=$((HIGHEST_MICRO + 1))
        fi
    fi

    VERSION="${BASE_VERSION}.${MICRO}"
    SEMVER="${YEAR}.${WEEK_NO_PAD}.${MICRO}"

    echo "Generated version: ${VERSION} (semver: ${SEMVER})"
fi

echo "VERSION=${VERSION}" >> $GITHUB_OUTPUT
echo "SEMVER=${SEMVER}" >> $GITHUB_OUTPUT
echo "TAG=${VERSION}" >> $GITHUB_OUTPUT

# Also calculate versionCode (YYWWMMMM format for Android)
VERSION_CODE=$(printf "%02d%02d%04d" $YEAR $WEEK $MICRO)
echo "VERSION_CODE=${VERSION_CODE}" >> $GITHUB_OUTPUT
