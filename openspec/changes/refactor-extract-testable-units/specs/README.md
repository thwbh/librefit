# Spec deltas — none

This change is a behavior-preserving frontend refactor. No requirement, scenario, or SHALL in any spec under `openspec/specs/` is added, modified, removed, or renamed.

The proposal lists zero entries under both _New Capabilities_ and _Modified Capabilities_. The intent of the change is purely structural: extract testable units from large route files so previously-SKIP'd scenario citations become reachable.

When this change is archived, pass `--skip-specs` to `openspec archive` (the same flag used by `backfill-test-citations` and `conv-e2e-tests`, both of which similarly carried no spec deltas).
