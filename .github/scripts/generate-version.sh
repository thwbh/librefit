#!/bin/bash
set -e

# Generate CalVer version in YY.0W.MICRO format
# Example: 25.48.0, 25.48.1, 25.48.2

# Get current year (last 2 digits) and week number (zero-padded)
YEAR=$(date +%y)
WEEK=$(date +%V)
BASE_VERSION="${YEAR}.${WEEK}"

echo "Base version: ${BASE_VERSION}"

# Find all tags matching this week's base version
EXISTING_TAGS=$(git tag -l "v${BASE_VERSION}.*" 2>/dev/null || echo "")

if [ -z "$EXISTING_TAGS" ]; then
    # No tags exist for this week, start with .0
    MICRO=0
else
    # Find the highest micro version
    HIGHEST_MICRO=$(echo "$EXISTING_TAGS" | sed "s/v${BASE_VERSION}\.//" | sort -n | tail -1)
    MICRO=$((HIGHEST_MICRO + 1))
fi

VERSION="${BASE_VERSION}.${MICRO}"

echo "Generated version: ${VERSION}"
echo "VERSION=${VERSION}" >> $GITHUB_OUTPUT
echo "TAG=v${VERSION}" >> $GITHUB_OUTPUT

# Also calculate versionCode (YYWWMMMM format for Android)
# Example: 25480000, 25480001, 25480002
VERSION_CODE=$(printf "%02d%02d%04d" $YEAR $WEEK $MICRO)
echo "VERSION_CODE=${VERSION_CODE}" >> $GITHUB_OUTPUT
