## Why

CSV export produces a zip of five separate CSV files that no longer round-trips with import (import is single-table, CSV-only) and whose per-file, zip-building machinery is heavy for what it delivers. JSON is Tauri's native format and every model already carries `serde` derives, so a single self-describing document is simpler to produce, simpler to consume, and lets export and import finally pair up. This addresses issue #206.

## What Changes

- **BREAKING**: Replace the CSV export format with JSON. `ExportFormat::Csv` becomes `ExportFormat::Json`; the export emits a single `.json` document (one array per table, top-level `schemaVersion`) instead of a zipped set of CSV files. The zip/CSV-building machinery is removed.
- **BREAKING**: Import switches from single-table CSV to whole-document JSON. The user no longer picks a target table; import ingests the full export document and restores every covered table in one operation, reporting per-table counts.
- Import retains **append** semantics (no wipe, no automatic deduplication) — the existing "no deduplication" warning stays prominent so JSON import is not mistaken for a clean restore.
- `food_category` is included in the export document for reference but is **not** written back on import (it is seed/lookup data the app already ships).
- The Raw SQLite export is **unchanged** and remains available.
- Frontend: the export page swaps its CSV option for JSON (`.json` extension, corrected save-dialog filter name); the import page drops the target-table selector in favor of a single file picker.

### Non-goals

- No change to the Raw SQLite export.
- No expansion of the exported data set beyond the five tables CSV already covered (`intake`, `weight_tracker`, `intake_target`, `weight_target`, `food_category`) — profile, body data, and workout tables are out of scope.
- No "replace/restore" (wipe-and-insert) import mode; append semantics are retained.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `data-export`: The exportable format `CSV` is replaced by `JSON`; the CSV/zip scenario (EX-001) is rewritten for a single JSON document. Raw scenarios are unaffected.
- `data-import`: Import pivots from single-table CSV selection to whole-document JSON ingestion; the target-table selection behavior is removed, partial-failure handling and the no-deduplication warning are retained.

## Impact

- **Rust** (`src-tauri/src/service/export/`): `ExportFormat` enum + dispatch in `mod.rs`; new `json.rs`; delete `csv.rs`. Drop the `csv` and `zip` crate dependencies if unused elsewhere.
- **Rust** (`src-tauri/src/service/import/`): `ImportFormat` enum + dispatch in `mod.rs`; new `json.rs`; delete `csv.rs`; `ImportResult`/`ImportProgress` reshaped for multi-table results; `ImportTable` selection removed.
- **Frontend**: `src/routes/(app)/export/+page.svelte` and `src/routes/(app)/import/+page.svelte` (+ colocated tests); generated `$lib/api` bindings regenerate from the changed command signatures.
- **Specs/tests**: `data-export` and `data-import` spec deltas; Rust integration tests and Vitest tests updated to cite the new/changed scenario IDs (traceability gate).
