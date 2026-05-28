#!/usr/bin/env bash
# Check that every spec scenario ID is referenced by at least one test.
#
# Enforces the spec→test direction strictly: any scenario without a test
# reference fails the build. Tests without scenario references are permitted
# per _conv-e2e-tests requirement E2E-003.
#
# Usage: scripts/check-spec-traceability.sh
# Exit codes:
#   0  all scenarios covered
#   1  one or more orphan scenarios found
#   2  no specs found (configuration error)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_DIR="$REPO_ROOT/openspec/specs"
ID_PATTERN='\[[A-Z][A-Z0-9]*-[0-9]{3}\]'

# Search roots for test references (Rust + Vitest + Playwright)
TEST_ROOTS=(
	"$REPO_ROOT/src-tauri/tests"
	"$REPO_ROOT/src-tauri/src"
	"$REPO_ROOT/src"
	"$REPO_ROOT/tests"
	"$REPO_ROOT/e2e"
)

if [ ! -d "$SPEC_DIR" ]; then
	echo "::error::Spec directory not found: $SPEC_DIR"
	exit 2
fi

# Collect every ID declared in specs (from #### Scenario: [XX-NNN] lines).
spec_ids=$(grep -rhoE "$ID_PATTERN" "$SPEC_DIR"/*/spec.md 2>/dev/null | sort -u)

if [ -z "$spec_ids" ]; then
	echo "::error::No scenario IDs found in $SPEC_DIR"
	exit 2
fi

# Exclude meta-convention scenarios from the spec→test requirement.
# `_conv-test-traceability` (TRC-*) describes the traceability rule that THIS
# script enforces — requiring a test to "cite" the rule that governs test
# citation is circular. These conventions are enforced by tooling/review
# instead (see the `add-convention-lint-rules` change for lint-side checks).
META_PREFIXES='TRC'
spec_ids=$(echo "$spec_ids" | grep -vE "\[(${META_PREFIXES})-[0-9]{3}\]" || true)

# Collect every ID referenced from test sources (test names, comments, etc.).
test_ids=""
for root in "${TEST_ROOTS[@]}"; do
	if [ -d "$root" ]; then
		found=$(grep -rhoE "$ID_PATTERN" "$root" 2>/dev/null || true)
		if [ -n "$found" ]; then
			test_ids="$test_ids"$'\n'"$found"
		fi
	fi
done
test_ids=$(echo "$test_ids" | grep -E "$ID_PATTERN" | sort -u || true)

# Orphan scenarios = in specs but not referenced by any test.
orphans=$(comm -23 <(echo "$spec_ids") <(echo "$test_ids"))

total_specs=$(echo "$spec_ids" | wc -l | tr -d ' ')
total_orphans=$(echo "$orphans" | grep -c . || true)
covered=$((total_specs - total_orphans))

echo "Spec scenarios:   $total_specs"
echo "Covered by tests: $covered"
echo "Orphan scenarios: $total_orphans"

if [ "$total_orphans" -gt 0 ]; then
	echo ""
	echo "::error::The following spec scenarios have no test reference:"
	echo "$orphans" | sed 's/^/  /'
	echo ""
	echo "Each spec scenario MUST be referenced by at least one test"
	echo "(unit, integration, or e2e). Cite the ID in the test name or in"
	echo "a comment within 5 lines of the test declaration."
	echo ""
	echo "See _conv-e2e-tests for the full convention."
	exit 1
fi

echo ""
echo "All spec scenarios have test coverage. Traceability gate passed."
