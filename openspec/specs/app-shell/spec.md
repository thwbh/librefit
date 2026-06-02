## Purpose

**ID prefix:** `AS`

Provide the app's navigation structure, settings access, informational pages, data-freshness contract, and error handling.

## Requirements

### Requirement: Bottom dock navigation

The system SHALL display a bottom dock on all app routes with four items: Home (/), Progress (/progress), History (/history), and Settings (modal). The active route SHALL be visually highlighted. Page transitions SHALL use fade animation (see `_conv-animations`).

#### Scenario: [AS-001] Navigate via dock

- **WHEN** the user taps Home, Progress, or History in the bottom dock
- **THEN** the app navigates to the corresponding route with a fade transition

#### Scenario: [AS-002] Settings opens modal

- **WHEN** the user taps Settings in the bottom dock
- **THEN** a floating settings menu appears instead of navigating to a route

### Requirement: Settings menu

The system SHALL display a floating settings menu with items: Profile (/profile), Export (/export), Import (/import), Wizard (/wizard), About (/about). The menu SHALL appear with a fly animation (see `_conv-animations`). Tapping the backdrop SHALL close the menu.

#### Scenario: [AS-003] Navigate from settings

- **WHEN** the user taps a settings menu item
- **THEN** the app navigates to the corresponding route and the menu closes

#### Scenario: [AS-004] Dismiss settings

- **WHEN** the user taps outside the settings menu
- **THEN** the menu closes

### Requirement: About page

The system SHALL display an informational about page with the app logo, tagline, feature highlights, privacy badge, and version number.

#### Scenario: [AS-005] View about

- **WHEN** the user navigates to /about
- **THEN** the page displays logo, features, privacy info, and version

### Requirement: Global error page

The system SHALL display an error page with the HTTP status code, error message, and a Back button that navigates to the home route when an unhandled error occurs.

#### Scenario: [AS-006] Unhandled error

- **WHEN** a navigation error occurs
- **THEN** the error page shows the status code and message with a Back button

### Requirement: Data freshness on navigation and after mutations

The system SHALL refresh the primary data of any app page when the user navigates to that page. After any user-initiated create, update, or delete operation, the affected page's relevant view SHALL refresh to reflect the change. Background refresh failures SHALL follow `_conv-user-errors`.

#### Scenario: [AS-007] Page navigation refreshes data

- **WHEN** the user navigates to any app page
- **THEN** that page's primary data is loaded fresh, not served from a stale cache

#### Scenario: [AS-008] CRUD triggers view refresh

- **WHEN** the user creates, updates, or deletes an entry on the current page
- **THEN** the relevant view updates to reflect the change without a manual reload

#### Scenario: [AS-009] Pull-to-refresh on dashboard

- **WHEN** the user performs the pull-to-refresh gesture on the home dashboard
- **THEN** the dashboard data is reloaded
