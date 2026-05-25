## Purpose

Define consistent modal dialog conventions for creating, editing, and deleting data entries.

## Requirements

### Requirement: Edit modal pre-fill

The system SHALL pre-fill edit modals with the current entry data when opened for editing. Fields SHALL be editable unless explicitly marked read-only.

#### Scenario: Edit modal opens with data

- **WHEN** an edit modal opens for an existing entry
- **THEN** all editable fields are pre-filled with the entry's current values

### Requirement: Delete confirmation

The system SHALL require confirmation before deleting any entry. The confirmation dialog SHALL display a read-only preview of the entry to be deleted. The delete option SHALL only be available from edit mode, not from create mode.

#### Scenario: Confirm delete

- **WHEN** the user clicks the delete/trash action in edit mode and confirms
- **THEN** the entry is permanently removed

#### Scenario: Cancel delete

- **WHEN** the user cancels the delete confirmation
- **THEN** the entry remains unchanged and the edit modal stays open

### Requirement: Modal cancellation

The system SHALL discard all unsaved changes when a modal is cancelled or dismissed. Temporary state (e.g. avatar previews, form edits) SHALL NOT persist after cancellation.

#### Scenario: Cancel discards changes

- **WHEN** the user cancels or dismisses a create/edit modal
- **THEN** no changes are persisted and all temporary state is discarded
