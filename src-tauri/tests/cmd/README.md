# Command Layer Tests

This directory contains integration tests for the Tauri command layer.

## Running Tests

### With cargo test

```bash
# All tests
cargo test --test test_cmd

# Export tests
cargo test --test test_cmd test_export

# Individual test modules
cargo test --test test_cmd test_intake
cargo test --test test_cmd test_weight
```

### With nextest (recommended)

```bash
# All tests
cargo nextest run --test test_cmd

# Export tests
cargo nextest run --test test_cmd test_export

# With coverage (CI setup)
cargo llvm-cov nextest --profile ci --test test_cmd
```

## Export Tests

The export test module (`test_export_cmd.rs`) contains **13 tests** covering:

- **Raw SQLite Export** (6 tests)

  - Empty database export
  - Export with data + SQLite magic number verification
  - Cancellation mechanism
  - Progress tracking (monotonicity check)
  - All progress stages verification

- **CSV ZIP Export** (5 tests)

  - Empty database export
  - Export with comprehensive data across all tables
  - Cancellation
  - All tables included verification
  - Progress stages

- **Helper Functions** (2 tests)
  - Byte formatting utility
  - Cancellation state management

All tests run safely in parallel - the raw export uses unique timestamped temp files
to avoid conflicts.

## Test Coverage

These tests significantly improve coverage for:

- `src/service/export/raw.rs` (was ~10% → now well-covered)
- `src/service/export/csv.rs` (was ~10% → now well-covered)
- `src/service/export/mod.rs` (was ~10% → now well-covered)
