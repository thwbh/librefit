## Context

Export today emits five CSV files zipped together (`src-tauri/src/service/export/csv.rs`, using the `csv` and `zip` crates), covering `intake`, `weight_tracker`, `intake_target`, `weight_target`, `food_category`. Import (`src-tauri/src/service/import/csv.rs`) is the mirror-image opposite in shape: it ingests **one** CSV into **one** table chosen by the user via `ImportTable`, appending rows and warning that no deduplication happens. Export is bulk/multi-table; import is single-table. They never round-tripped.

Both flows already share good infrastructure that we keep: a `Channel`-based progress stream following `_conv-progress-stages`, an `AtomicBool` cancellation flag, and per-entry validation via `validator::Validate`. The models carry `serde` derives and the wire convention is camelCase.

Raw SQLite export is a separate, untouched path.

## Goals / Non-Goals

**Goals:**

- Replace CSV export with a single JSON document keyed by table, carrying a `schemaVersion`.
- Make import consume that same document whole, restoring every covered table in one pass with per-table counts.
- Reuse existing model structs (`New*` for insert, read models for export) via their serde derives — no bespoke DTOs beyond a thin envelope.
- Preserve append semantics and the no-deduplication warning.

**Non-Goals:**

- Raw SQLite export behavior.
- Expanding the data set (profile, body*data, workout*\* stay out).
- Wipe-and-restore ("replace") import semantics.
- Backfilling a JSON schema migration/upgrade path beyond emitting `schemaVersion: 1`.

## Decisions

### Single document with a table-keyed envelope

One JSON object: `{ "schemaVersion": 1, "intake": [...], "weightTracker": [...], "intakeTarget": [...], "weightTarget": [...], "foodCategory": [...] }`. A dedicated `#[serde(rename_all = "camelCase")]` envelope struct holds one `Vec<T>` per table. Export serializes it with `serde_json::to_vec`; import deserializes the same struct.

- _Why not per-table files in a zip (CSV's shape)?_ The whole point of #206 is to drop the zip machinery; one document is the simpler artifact and the natural round-trip unit.
- _Why an explicit envelope over serializing a `HashMap`?_ Named fields give a typed, self-documenting schema and let export (read models with `id`) and import (`New*` insert models) use the right struct per direction.

### Export uses read models; import uses `New*` insert models

Export serializes the existing read structs (as CSV already sourced them via `Intake::all`, etc.). Import deserializes into the `New*` structs (`NewIntake`, `NewWeightTracker`, `NewIntakeTarget`, `NewWeightTarget`) so validation and `create` reuse the existing insert path. Extra fields present in the export document (e.g. `id`, `time` where not part of `New*`) are ignored by serde on the import side. This keeps import symmetric enough for round-trip while reusing the validated insert flow unchanged.

- _Why not import `id`s?_ Append semantics mean new autoincrement ids; carrying source ids would fight the insert path and risk collisions. Ignoring them is the least-surprising choice.

### Import becomes whole-document; drop `ImportTable`

`ImportFormat::Csv` → `Json`. The `ImportTable` target enum and its selection UI are removed. `import_data_file` reads the file, deserializes the envelope, and inserts each table's entries within the existing transaction. `ImportResult` changes from `{ imported_count, table }` to per-table counts (e.g. a struct with a count field per table, or a map); `ImportProgress` reports overall progress across all tables. Validation stays per-entry: invalid entries are **skipped and counted as failures** (aligning with spec IM-007 / `_conv-validation`), replacing today's abort-on-first-bad-row behavior in `csv.rs`.

### `food_category` is export-only

The export includes `foodCategory` for completeness/reference, but import does not write it back — it is seed/lookup data shipped with the app. Import ignores that array (or reports a zero count for it).

### Drop `csv` and `zip` crate dependencies

After deleting `export/csv.rs` and `import/csv.rs`, remove the `csv` and `zip` crates from `Cargo.toml` if nothing else references them (verify with a workspace grep before removing).

## Risks / Trade-offs

- [Append + "backup" framing invites double-imports] → Keep the no-deduplication warning prominent (IM-011); label the flow as import/append, not "restore".
- [Behavior change: partial-failure now skips instead of aborting] → This aligns implementation with the existing spec intent (IM-003 → IM-007). Covered by a dedicated scenario/test; call it out in the PR since it changes observable behavior.
- [Removing `csv`/`zip` crates could break an unrelated user] → Grep the workspace before removal; if referenced elsewhere, leave the dependency and only delete the export/import CSV modules.
- [`ImportResult` shape change breaks the generated TS bindings] → Regenerate `$lib/api` bindings and update the import page + its Vitest test in the same change.
- [Large exports build the whole document in memory] → Same footprint class as the current in-memory zip buffer; acceptable for this app's data volumes.

## Migration Plan

1. Land backend export (`json.rs`) + enum/dispatch change; delete `csv.rs`.
2. Land backend import (`json.rs`) + reshaped `ImportResult`/`ImportProgress`; delete `csv.rs`; remove `ImportTable`.
3. Regenerate API bindings; update export and import Svelte pages + colocated tests.
4. Update Rust integration tests and Vitest tests to cite the new/changed scenario IDs; confirm `npm run lint:traceability` passes.
5. Remove `csv`/`zip` crates if unused.

No runtime data migration is needed. Rollback is reverting the change; previously exported `.zip` CSV backups are no longer importable (documented in the REMOVED requirement's Migration note).

## Open Questions

- `ImportResult` per-table representation: a fixed struct with one count field per table vs. a `Vec<{ table, importedCount }>`. Fixed struct is simpler for the frontend to render; lean that way unless the summary UI wants to iterate generically.
