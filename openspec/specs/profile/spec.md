## Purpose

Manage user identity (name, avatar) and view body metrics. Provide access to re-run the setup wizard for plan recalculation.

## Requirements

### Requirement: View profile

The system SHALL display the user's name, avatar, and body data (age, sex, height, weight, activity level) on the profile page. Body data SHALL be read-only. A "Re-run Setup Wizard" button SHALL be available.

#### Scenario: Profile page load

- **WHEN** the user navigates to /profile
- **THEN** their name, avatar, and body metrics are displayed

### Requirement: Edit profile name and avatar

The system SHALL allow editing the user's name and avatar following `_conv-gestures` (swipe left to edit) and `_conv-modals` (pre-filled edit modal, cancellation discards changes). The nickname SHALL validate at 2-40 characters. The avatar picker SHALL offer 8 options (1 random + 7 presets). Swiping left in the picker SHALL randomize the avatar seed, swiping right SHALL reset to name-based.

#### Scenario: Swipe to edit

- **WHEN** the user swipes the profile header left
- **THEN** an edit modal opens with the current name and avatar

#### Scenario: Save profile changes

- **WHEN** the user modifies their nickname and/or avatar and clicks Save
- **THEN** the profile updates via update_user and changes are reflected immediately

#### Scenario: Cancel discards changes

- **WHEN** the user cancels the edit modal
- **THEN** no changes are persisted and temporary avatar state is discarded

### Requirement: Re-run setup wizard

The system SHALL allow re-running the setup wizard with current body data pre-populated. New targets SHALL be created (not updating old ones) based on recalculated values. Previous targets SHALL remain in the database as historical records.

#### Scenario: Wizard re-run

- **WHEN** the user navigates to /wizard from settings or profile
- **THEN** the 5-step wizard loads with fields pre-populated from current body data

#### Scenario: New targets after wizard

- **WHEN** the user completes the wizard re-run
- **THEN** new weight target and intake target records are created and the dashboard reflects the new plan
