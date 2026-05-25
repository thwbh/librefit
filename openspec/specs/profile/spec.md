## Purpose

**ID prefix:** `PF`

Manage user identity (name, avatar) and view body metrics. Provide access to re-run the setup wizard for plan recalculation.

## Requirements

### Requirement: View profile

The system SHALL display the user's name, avatar, and body data (age, sex, height, weight, activity level) on the profile page. Body data SHALL be read-only. A "Re-run Setup Wizard" button SHALL be available.

#### Scenario: [PF-001] Profile page load

- **WHEN** the user navigates to /profile
- **THEN** their name, avatar, and body metrics are displayed

### Requirement: Edit profile name and avatar

The system SHALL allow editing the user's name and avatar following `_conv-gestures` and `_conv-modals`. The avatar picker SHALL offer 8 options (1 random + 7 presets) with swipe semantics defined separately.

#### Scenario: [PF-002] Swipe to edit

- **WHEN** the user swipes the profile header left
- **THEN** an edit modal opens with the current name and avatar

#### Scenario: [PF-003] Save profile changes

- **WHEN** the user modifies their nickname and/or avatar and clicks Save
- **THEN** the profile updates and changes are reflected immediately

#### Scenario: [PF-004] Cancel discards changes

- **WHEN** the user cancels the edit modal
- **THEN** no changes are persisted and temporary avatar state is discarded

### Requirement: Avatar picker semantics

The system SHALL provide an avatar picker offering eight options: one randomly-seeded avatar and seven preset avatars. Swiping left on the picker SHALL randomize the avatar seed. Swiping right SHALL reset the avatar to the username-based seed.

#### Scenario: [PF-005] Picker offers eight options

- **WHEN** the avatar picker opens
- **THEN** eight avatars are presented: one random and seven presets

#### Scenario: [PF-006] Swipe left randomizes avatar

- **WHEN** the user swipes left on the avatar picker
- **THEN** the avatar seed is randomized to a new value

#### Scenario: [PF-007] Swipe right resets avatar

- **WHEN** the user swipes right on the avatar picker
- **THEN** the avatar reverts to the username-based seed

### Requirement: Nickname bounds

The system SHALL accept nicknames whose length falls in the closed interval declared by these scenarios. The frontend constrains a tighter range than the backend; the backend remains authoritative per `_conv-validation`.

#### Scenario: [PF-008] Nickname at frontend lower bound accepted

- **WHEN** a nickname of 2 characters is entered
- **THEN** Save is enabled and the profile updates

#### Scenario: [PF-009] Nickname at frontend upper bound accepted

- **WHEN** a nickname of 40 characters is entered
- **THEN** Save is enabled and the profile updates

#### Scenario: [PF-010] Nickname below frontend lower bound rejected at UI

- **WHEN** the user enters a nickname of 1 character
- **THEN** a validation error is displayed and Save is blocked

#### Scenario: [PF-011] Nickname above frontend upper bound rejected at UI

- **WHEN** the user enters a nickname of 41 characters
- **THEN** a validation error is displayed and Save is blocked

#### Scenario: [PF-012] Nickname below backend lower bound rejected at server

- **WHEN** an empty nickname is submitted to the backend
- **THEN** the backend returns a validation error

#### Scenario: [PF-013] Nickname above backend upper bound rejected at server

- **WHEN** a nickname of 51 characters is submitted to the backend
- **THEN** the backend returns a validation error

### Requirement: Re-run setup wizard

The system SHALL allow re-running the setup wizard with current body data pre-populated. New targets SHALL be created (not updating old ones) based on recalculated values. Previous targets SHALL remain in the database as historical records.

#### Scenario: [PF-014] Wizard re-run

- **WHEN** the user navigates to /wizard from settings or profile
- **THEN** the 5-step wizard loads with fields pre-populated from current body data

#### Scenario: [PF-015] New targets after wizard

- **WHEN** the user completes the wizard re-run
- **THEN** new weight target and intake target records are created and the dashboard reflects the new plan
