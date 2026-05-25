## Purpose

Define consistent touch gesture conventions used across all interactive data entries in the app.

## Requirements

### Requirement: Long-press to edit

The system SHALL trigger edit mode when the user long-presses an entry card for 300ms. The long-press SHALL trigger haptic feedback (vibrate) before opening the edit modal.

#### Scenario: Long-press triggers edit

- **WHEN** the user presses and holds an entry card for 300ms
- **THEN** the device vibrates and the edit modal opens with the entry's data pre-filled

### Requirement: Swipe to edit

The system SHALL open the edit modal when the user swipes left on an entry card.

#### Scenario: Swipe left opens edit

- **WHEN** the user swipes left on an entry card
- **THEN** the edit modal opens with the entry's data pre-filled

### Requirement: Swipe to delete

The system SHALL open a delete confirmation dialog when the user swipes right on an entry card.

#### Scenario: Swipe right opens delete confirmation

- **WHEN** the user swipes right on an entry card
- **THEN** a delete confirmation dialog appears showing a read-only preview of the entry
