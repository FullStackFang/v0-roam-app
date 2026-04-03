## ADDED Requirements

### Requirement: Posture picker bottom sheet
When joining an activity, the system SHALL present a posture picker with three options: "Definitely in" (green, checkmark), "Down if others are" (amber, people icon), "Sell me on it" (muted, question mark). Selecting one inserts into `activity_interest`.

#### Scenario: User picks definitely_in
- **WHEN** the user selects "Definitely in" for an activity
- **THEN** an activity_interest row is inserted with posture="definitely_in" and confirmed_at=now()

#### Scenario: User picks down_if_others
- **WHEN** the user selects "Down if others are"
- **THEN** an activity_interest row is inserted with posture="down_if_others" and confirmed_at=null

#### Scenario: User picks sell_me
- **WHEN** the user selects "Sell me on it"
- **THEN** an activity_interest row is inserted with posture="sell_me" and confirmed_at=null

### Requirement: Posture display on activity cards
Activity cards SHALL show avatar stacks grouped by posture. Confirmed users (definitely_in + auto-converted) appear together, deciding users (down_if_others + sell_me) appear separately.

#### Scenario: Mixed postures displayed
- **WHEN** an activity has 2 definitely_in, 1 down_if_others, 1 sell_me
- **THEN** the card shows "2 confirmed" avatar stack and "2 deciding" avatar stack

### Requirement: Auto-conversion of down_if_others posture
When an activity reaches 2+ "definitely_in" responses, the system SHALL auto-convert all "down_if_others" users to confirmed by setting their `confirmed_at` to now(). This is implemented as a Postgres function on activity_interest INSERT/UPDATE.

#### Scenario: Threshold triggers auto-conversion
- **WHEN** a 2nd user selects "definitely_in" for an activity that has 1 "down_if_others" user
- **THEN** the down_if_others user's confirmed_at is set to now()

#### Scenario: Below threshold no conversion
- **WHEN** an activity has 1 definitely_in and 1 down_if_others
- **THEN** the down_if_others user remains unconfirmed

### Requirement: Confirmation nudge on approaching activity
When an activity's `starts_at` is within 2 hours, the activity card SHALL show a banner: "Still in for tonight?" with one-tap confirm/cancel buttons.

#### Scenario: Activity approaching shows nudge
- **WHEN** an activity starts in 90 minutes and the user has expressed interest
- **THEN** the card shows "Still in for tonight?" with confirm/cancel buttons

#### Scenario: User confirms via nudge
- **WHEN** the user taps "Confirm" on the nudge banner
- **THEN** their confirmed_at is set to now() and the nudge disappears
