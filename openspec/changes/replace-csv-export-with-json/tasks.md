## 1. Backend — JSON export

- [ ] 1.1 Define a camelCase export envelope struct in `src-tauri/src/service/export/json.rs` with one `Vec<T>` per table (`intake`, `weightTracker`, `intakeTarget`, `weightTarget`, `foodCategory`) plus a `schemaVersion` field
- [ ] 1.2 Implement `export_json` mirroring the progress-stage flow in the old `csv.rs` (initialize → analyze → build → finalize → complete), populating the envelope via the existing `*::all` reads and serializing with `serde_json::to_vec`
- [ ] 1.3 Rename `ExportFormat::Csv` → `Json` and update the dispatch arm in `export/mod.rs`; set the result `file_path` to a `.json` name
- [ ] 1.4 Delete `src-tauri/src/service/export/csv.rs` and its `pub mod csv;` declaration

## 2. Backend — JSON import (whole-document)

- [ ] 2.1 Add `ImportFormat::Json` (replacing `Csv`) and remove the `ImportTable` target enum from `import/mod.rs`
- [ ] 2.2 Reshape `ImportResult` to per-table counts and adjust `ImportProgress` to report progress across all tables
- [ ] 2.3 Implement `import_json` in `src-tauri/src/service/import/json.rs`: deserialize the envelope into `New*` structs, validate each entry, skip-and-count invalid entries, and insert valid entries within a single transaction with cancellation checks
- [ ] 2.4 Skip `foodCategory` on import (seed data) and report a zero/no count for it
- [ ] 2.5 Update `import_data_file` (and the `import_data_from_string` test helper) to read the file and dispatch to `import_json`; delete `import/csv.rs` and its module declaration

## 3. Dependencies & wiring

- [ ] 3.1 Grep the workspace for remaining `csv`/`zip` crate usage; remove those dependencies from `src-tauri/Cargo.toml` if unused
- [ ] 3.2 Regenerate the `$lib/api` TypeScript bindings from the changed command signatures

## 4. Frontend

- [ ] 4.1 Export page (`src/routes/(app)/export/+page.svelte`): swap the CSV option card for JSON, set the extension map entry to `json`, fix the save-dialog filter name, and update the format icon
- [ ] 4.2 Import page (`src/routes/(app)/import/+page.svelte`): remove the target-table selector, accept a single JSON file, render per-table imported counts, and keep the append/no-deduplication warning prominent

## 5. Tests & traceability

- [ ] 5.1 Update/add Rust integration tests for export (`EX-001`, `EX-008`) and import (`IM-006`, `IM-007`, `IM-008`, `IM-010`, `IM-011`) using the `scenario!` macro
- [ ] 5.2 Update Vitest tests for the export and import pages (colocated) to cite `IM-009` (file-not-selected disables Import) and the append-warning behavior
- [ ] 5.3 Run `npm run lint:traceability` and confirm every new/changed scenario is cited; run the Rust and Vitest suites green
