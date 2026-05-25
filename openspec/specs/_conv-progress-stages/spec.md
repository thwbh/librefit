## Purpose

Define the consistent multi-stage progress tracking pattern used for long-running operations.

## Requirements

### Requirement: Streamed progress updates

The system SHALL stream real-time progress updates for long-running operations. Progress SHALL advance through named stages in a defined order. The UI SHALL display the current stage name and overall progress.

#### Scenario: Progress stages advance

- **WHEN** a long-running operation is in progress
- **THEN** the UI shows the current stage and updates in real-time

#### Scenario: Operation completes

- **WHEN** the final stage (Complete) is reached
- **THEN** a success message is displayed and the Close/Done action becomes available

### Requirement: Operation cancellation

The system SHALL allow cancelling a long-running operation while it is in progress. Cancellation SHALL stop the operation and return the UI to its initial state.

#### Scenario: Cancel during operation

- **WHEN** the user clicks Cancel during an active operation
- **THEN** the operation stops and the UI resets
