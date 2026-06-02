## Purpose

**ID prefix:** `OB`

Guide new users through initial app setup — from welcome screen through a 5-step wizard that collects body data, calculates health metrics, and creates personalized weight and calorie targets.

## Requirements

### Requirement: Welcome screen for new users

The system SHALL display a welcome screen when no user profile exists. The welcome screen SHALL show the app logo, tagline, three feature highlights, a privacy badge, and the app version. The system SHALL provide a "Get Started" button that navigates to the setup wizard.

#### Scenario: [OB-001] First launch with no profile

- **WHEN** the app launches and no LibreUser record exists
- **THEN** the user is redirected to the welcome screen

#### Scenario: [OB-002] Get Started navigation

- **WHEN** the user clicks "Get Started" on the welcome screen
- **THEN** the app navigates to the setup wizard at /setup

### Requirement: Route guard for unauthenticated access

The system SHALL prevent access to all app routes when no user profile exists. The system SHALL redirect unauthenticated requests to the welcome screen with HTTP 307.

#### Scenario: [OB-003] Direct access to protected route

- **WHEN** a user without a profile attempts to access any route under the (app) group
- **THEN** the system redirects to /welcome with status 307

#### Scenario: [OB-004] Unprotected routes remain accessible

- **WHEN** a user without a profile accesses /welcome or /setup
- **THEN** the page loads normally without redirect

### Requirement: Setup wizard body information (Step 1)

The system SHALL collect the user's nickname, biological sex, age, height, weight, and an optional avatar. Biological sex SHALL have no default for first-time users; on wizard re-run, the previously-saved sex SHALL be preloaded. If no avatar is selected, the system SHALL use the user's name as the avatar seed. The wizard SHALL NOT advance from Step 1 until all required fields satisfy the backend validator. Per-field validity rules and bounds are owned by the backend struct annotations (`validator` crate) and surfaced to the client via the generated Zod schemas; see `_conv-validation` for the authoritative-bound principle.

#### Scenario: [OB-005] Valid body information advances wizard

- **WHEN** the user fills in all required fields with valid values and clicks Next
- **THEN** the wizard advances to Step 2

#### Scenario: [OB-006] Sex must be explicitly selected to advance

- **WHEN** the user has not selected a biological sex and clicks Next
- **THEN** the wizard does not advance from Step 1
- **AND WHEN** the user selects Male or Female and all other required fields are valid and clicks Next
- **THEN** the wizard advances to Step 2

#### Scenario: [OB-007] Avatar defaults to name seed

- **WHEN** the user does not select an avatar
- **THEN** the avatar is generated using the user's nickname as the seed

#### Scenario: [OB-018] Nickname shorter than minimum prevents advance

- **WHEN** the nickname is shorter than the backend-declared minimum length (including empty) and the user clicks Next
- **THEN** the wizard does not advance from Step 1

#### Scenario: [OB-019] Nickname within bounds permits advance

- **WHEN** the nickname length is within the backend-declared bounds
- **AND** all other required fields are valid (including sex selected)
- **AND** the user clicks Next
- **THEN** the wizard advances to Step 2

#### Scenario: [OB-020] Validation errors are deferred until the user attempts to advance

- **WHEN** the user opens Step 1 for the first time and has not yet clicked Next
- **THEN** no validation error message is shown under any required field
- **AND WHEN** the user clicks Next while one or more required fields are invalid
- **THEN** an error message is shown under each invalid field (one error per field)
- **AND WHEN** the user subsequently fixes a previously-invalid field
- **THEN** that field's error message disappears while errors on the remaining invalid fields stay visible

### Requirement: Setup wizard activity level (Step 2)

The system SHALL display five activity level options (Mostly Sedentary, Light Activity, Moderate Activity, Highly Active, Athlete), each with an icon, label, and description. The system SHALL allow exactly one selection at a time.

#### Scenario: [OB-008] Activity level selection

- **WHEN** the user selects an activity level and clicks Next
- **THEN** the wizard advances to Step 3 and the selected level is stored

### Requirement: Setup wizard results review (Step 3)

The system SHALL calculate and display BMI (with category badge), recommendation (LOSE/HOLD/GAIN), BMR, and TDEE. The system SHALL use Harris-Benedict formulas for BMR calculation. TDEE SHALL equal BMR multiplied by the activity level factor.

#### Scenario: [OB-009] Standard weight loss recommendation

- **WHEN** the user's BMI is above 25.0
- **THEN** the recommendation is LOSE

#### Scenario: [OB-010] Standard maintenance recommendation

- **WHEN** the user's BMI is between 20.0 and 25.0
- **THEN** the recommendation is HOLD

#### Scenario: [OB-011] Weight gain recommendation

- **WHEN** the user's BMI is below 20.0
- **THEN** the recommendation is GAIN

#### Scenario: [OB-012] Low-normal BMI alert

- **WHEN** the user's BMI is between 18.5 and 19.9
- **THEN** a special GAIN alert is displayed

### Requirement: Setup wizard pace selection (Step 4)

For LOSE/GAIN users, the system SHALL display a rate slider with 500 kcal/day highlighted as "Recommended". For HOLD users or low-normal BMI GAIN users, the system SHALL display a target weight selector instead. Slider ranges are defined by scenarios.

#### Scenario: [OB-013] Rate selection for weight loss

- **WHEN** the recommendation is LOSE and the user adjusts the rate slider
- **THEN** the option card updates with the selected rate, difficulty badge, weekly progress, and estimated target date

#### Scenario: [OB-014] Target weight selection for hold

- **WHEN** the recommendation is HOLD
- **THEN** the step title changes to "Select Your Target Weight" and a weight selector is shown

### Requirement: Setup wizard finish and save (Step 5)

The system SHALL display a summary of the user's profile, weight goals, calorie plan, and timeline. On confirmation, the system SHALL atomically create the user profile, body data, weight target, intake target, and initial weight tracker entry. If any operation fails, all changes SHALL roll back.

#### Scenario: [OB-015] Successful setup completion

- **WHEN** the user clicks Finish and all saves succeed
- **THEN** a welcome animation is shown, then the user is redirected to the home dashboard

#### Scenario: [OB-016] Setup failure with rollback

- **WHEN** any save operation fails during setup
- **THEN** an error state is shown with a retry button and no partial data is persisted

#### Scenario: [OB-017] Atomic target creation

- **WHEN** the wizard creates targets via the wizard target creation operation
- **THEN** the weight target, intake target, and weight tracker entry are created in a single database transaction
