## ADDED Requirements

### Requirement: Seed file contains 20+ Cornell/Ithaca venues
The `supabase/seed.ts` file SHALL contain at least 20 real Cornell campus and Ithaca venues with accurate lat/lng coordinates, replacing all NYC demo venues.

#### Scenario: Seed file has sufficient venue count
- **WHEN** the seed file is executed
- **THEN** at least 20 venues are inserted into the `venues` table

### Requirement: All five categories are represented
The seed venues SHALL cover all five categories: `eatdrink`, `happening`, `move`, `outside`, `focus`. Each category SHALL have at least 3 venues.

#### Scenario: Category distribution
- **WHEN** the seed file is executed
- **THEN** each of the 5 categories has at least 3 venues

### Requirement: Venues are geographically accurate
All seed venues SHALL use lat/lng coordinates within 5km of Cornell campus center (42.4534, -76.4735). Coordinates SHALL approximate the real-world location of each named venue.

#### Scenario: Venue coordinates are near Cornell
- **WHEN** any seed venue's coordinates are checked
- **THEN** the venue is within 5km of (42.4534, -76.4735)

### Requirement: Seed includes specific well-known Cornell venues
The seed data SHALL include at minimum: CTB (Collegetown Bagels), Chapter House, Libe Café, Mann Library, and Cornell Botanic Gardens.

#### Scenario: Key venues are present
- **WHEN** the seed file is executed
- **THEN** venues named "Collegetown Bagels", "Chapter House", "Libe Café", "Mann Library", and "Cornell Botanic Gardens" exist in the database

### Requirement: Seed includes mock checkins for demo
The seed file SHALL insert mock checkins at a subset of venues with varying `vibe` values and `activity_score` levels to demonstrate the heatmap and marker animations.

#### Scenario: Mock checkins create visible map activity
- **WHEN** the seed file is executed and the map loads
- **THEN** at least 5 venues show active markers with varying activity levels (1, 2, or 3 rings)

### Requirement: Seed venues include neighborhood labels
Each seed venue SHALL have a `neighborhood` value indicating its area (e.g., "Collegetown", "Downtown Ithaca", "Cornell Campus", "East Hill", "Ithaca Commons").

#### Scenario: Venues have neighborhood metadata
- **WHEN** any seed venue is queried
- **THEN** it has a non-empty `neighborhood` value
