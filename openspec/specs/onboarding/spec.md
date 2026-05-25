## Purpose

Guide new users through initial app setup — from welcome screen through a 5-step wizard that collects body data, calculates health metrics, and creates personalized weight and calorie targets.

## Requirements

### Requirement: Welcome screen for new users

The system SHALL display a welcome screen when no user profile exists. The welcome screen SHALL show the app logo, tagline, three feature highlights, a privacy badge, and the app version. The system SHALL provide a "Get Started" button that navigates to the setup wizard.

#### Scenario: First launch with no profile

- **WHEN** the app launches and no LibreUser record exists
- **THEN** the user is redirected to the welcome screen

#### Scenario: Get Started navigation

- **WHEN** the user clicks "Get Started" on the welcome screen
- **THEN** the app navigates to the setup wizard at /setup

### Requirement: Route guard for unauthenticated access

The system SHALL prevent access to all app routes when no user profile exists. The system SHALL redirect unauthenticated requests to the welcome screen with HTTP 307.

#### Scenario: Direct access to protected route

- **WHEN** a user without a profile attempts to access any route under the (app) group
- **THEN** the system redirects to /welcome with status 307

#### Scenario: Unprotected routes remain accessible

- **WHEN** a user without a profile accesses /welcome or /setup
- **THEN** the page loads normally without redirect

### Requirement: Setup wizard body information (Step 1)

The system SHALL collect the user's nickname (2-40 characters, required), biological sex (Male/Female), age (18-99 via slider), height (100-220 cm via slider), and weight (30-300 kg via slider). The system SHALL allow optional avatar selection. If no avatar is selected, the system SHALL use the user's name as the avatar seed.

#### Scenario: Valid body information entry

- **WHEN** the user fills in all required fields with valid values and clicks Next
- **THEN** the wizard advances to Step 2

#### Scenario: Nickname validation failure

- **WHEN** the user enters a nickname shorter than 2 or longer than 40 characters
- **THEN** a validation error is displayed and Next is blocked

### Requirement: Setup wizard activity level (Step 2)

The system SHALL display five activity level options (Mostly Sedentary, Light Activity, Moderate Activity, Highly Active, Athlete), each with an icon, label, and description. The system SHALL allow exactly one selection at a time.

#### Scenario: Activity level selection

- **WHEN** the user selects an activity level and clicks Next
- **THEN** the wizard advances to Step 3 and the selected level is stored

### Requirement: Setup wizard results review (Step 3)

The system SHALL calculate and display BMI (with category badge), recommendation (LOSE/HOLD/GAIN), BMR, and TDEE. The system SHALL use Harris-Benedict formulas for BMR calculation. TDEE SHALL equal BMR multiplied by the activity level factor.

#### Scenario: Standard weight loss recommendation

- **WHEN** the user's BMI is above 25.0
- **THEN** the recommendation is LOSE

#### Scenario: Standard maintenance recommendation

- **WHEN** the user's BMI is between 20.0 and 25.0
- **THEN** the recommendation is HOLD

#### Scenario: Weight gain recommendation

- **WHEN** the user's BMI is below 20.0
- **THEN** the recommendation is GAIN

#### Scenario: Low-normal BMI alert

- **WHEN** the user's BMI is between 18.5 and 19.9
- **THEN** a special GAIN alert is displayed

### Requirement: Setup wizard pace selection (Step 4)

For LOSE/GAIN users, the system SHALL display a rate slider (100-700 kcal/day, step 100) with 500 kcal highlighted as "Recommended". For HOLD users or low-normal BMI GAIN users, the system SHALL display a target weight selector (step 0.5 kg) instead.

#### Scenario: Rate selection for weight loss

- **WHEN** the recommendation is LOSE and the user adjusts the rate slider
- **THEN** the option card updates with the selected rate, difficulty badge, weekly progress, and estimated target date

#### Scenario: Target weight selection for hold

- **WHEN** the recommendation is HOLD
- **THEN** the step title changes to "Select Your Target Weight" and a weight selector is shown

### Requirement: Setup wizard finish and save (Step 5)

The system SHALL display a summary of the user's profile, weight goals, calorie plan, and timeline. On confirmation, the system SHALL atomically create the user profile, body data, weight target, intake target, and initial weight tracker entry. If any operation fails, all changes SHALL roll back.

#### Scenario: Successful setup completion

- **WHEN** the user clicks Finish and all saves succeed
- **THEN** a welcome animation is shown, then the user is redirected to the home dashboard

#### Scenario: Setup failure with rollback

- **WHEN** any save operation fails during setup
- **THEN** an error state is shown with a retry button and no partial data is persisted

#### Scenario: Atomic target creation

- **WHEN** the wizard creates targets via wizard_create_targets
- **THEN** the weight target, intake target, and weight tracker entry are created in a single database transaction
