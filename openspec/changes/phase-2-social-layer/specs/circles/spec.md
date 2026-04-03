## ADDED Requirements

### Requirement: Create circle from feed
The Feed header SHALL have a "+" button that opens a "New Circle" bottom sheet with: circle name input and member search (search profiles by display_name). On create: insert circle + circle_members rows (including creator as member).

#### Scenario: Create a circle with members
- **WHEN** the user enters "Study Crew" as circle name, adds 2 friends, and taps Create
- **THEN** a circles row is created, and 3 circle_members rows are inserted (creator + 2 friends)

#### Scenario: Creator is auto-added as member
- **WHEN** a circle is created
- **THEN** the creator is automatically added as a circle_member

### Requirement: Circle filter pills on feed
The Feed SHALL show circle filter pills at the top: "All" (default) plus one pill per circle the user belongs to. Selecting a circle filters the feed to only show broadcasts and activities from that circle's members.

#### Scenario: Filter by circle
- **WHEN** the user taps a circle pill
- **THEN** only broadcasts and activities from that circle's members appear in the feed

#### Scenario: All filter shows everything
- **WHEN** "All" is selected
- **THEN** broadcasts and activities from all circles appear

### Requirement: Circle streak tracking
The system SHALL track consecutive days of activity within a circle. A Postgres function `update_circle_streak(circle_id)` SHALL run on checkin INSERT. If any member checked in yesterday and any member checks in today, increment `streak_count`. Otherwise reset to 1.

#### Scenario: Streak increments on consecutive days
- **WHEN** a circle member checked in yesterday and another checks in today
- **THEN** the circle's streak_count increments by 1

#### Scenario: Streak resets on gap
- **WHEN** no circle member checked in yesterday but one checks in today
- **THEN** the circle's streak_count resets to 1

### Requirement: Streak display on circle pills
Circle filter pills SHALL show the streak count as a small flame icon + number when streak_count > 1.

#### Scenario: Streak badge on pill
- **WHEN** a circle has streak_count = 5
- **THEN** the pill shows a flame icon and "5"

#### Scenario: No streak badge for count 1
- **WHEN** a circle has streak_count = 1
- **THEN** no streak badge is shown

### Requirement: Member search for circle creation
The member search in the circle creation sheet SHALL search the `profiles` table by `display_name` (case-insensitive prefix match) and show matching profiles as tappable rows with avatar and name.

#### Scenario: Search returns matching profiles
- **WHEN** the user types "Jan" in the member search
- **THEN** profiles with display_name starting with "Jan" appear as results
