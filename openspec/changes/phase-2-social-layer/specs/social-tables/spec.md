## ADDED Requirements

### Requirement: status_broadcasts table
The system SHALL have a `status_broadcasts` table with columns: `id` (uuid PK), `user_id` (FK profiles), `status_type` (text, CHECK: out_now/up_for_drinks/up_for_dinner/grabbing_coffee/custom), `custom_text` (text nullable), `duration` (text, CHECK: 1h/until_2am/24h), `expires_at` (timestamptz), `location` (geography Point nullable), `created_at` (timestamptz default now()).

#### Scenario: Table schema is correct
- **WHEN** the migration is applied
- **THEN** the `status_broadcasts` table exists with all required columns, types, and constraints

### Requirement: status_broadcasts RLS
The system SHALL enforce RLS on `status_broadcasts`: all authenticated users can SELECT active (non-expired) broadcasts, users can INSERT their own, users can DELETE their own.

#### Scenario: Read active broadcasts
- **WHEN** an authenticated user queries status_broadcasts
- **THEN** they see only broadcasts where expires_at > now()

#### Scenario: User inserts own broadcast
- **WHEN** a user inserts a broadcast with their user_id
- **THEN** the insert succeeds

### Requirement: status_broadcasts realtime
The system SHALL enable Supabase Realtime on the `status_broadcasts` table.

#### Scenario: Broadcast appears in realtime
- **WHEN** a user inserts a new broadcast
- **THEN** subscribed clients receive the change event

### Requirement: circles table
The system SHALL have a `circles` table with columns: `id` (uuid PK), `name` (text NOT NULL), `created_by` (FK profiles), `streak_count` (int default 0), `last_active_at` (timestamptz), `created_at` (timestamptz default now()).

#### Scenario: Table schema is correct
- **WHEN** the migration is applied
- **THEN** the `circles` table exists with all required columns

### Requirement: circle_members table
The system SHALL have a `circle_members` table with columns: `id` (uuid PK), `circle_id` (FK circles), `user_id` (FK profiles), `joined_at` (timestamptz default now()). UNIQUE constraint on (circle_id, user_id).

#### Scenario: No duplicate memberships
- **WHEN** a user is already a member of a circle
- **THEN** inserting a duplicate membership fails

### Requirement: circles RLS
The system SHALL enforce RLS on `circles` and `circle_members`: members can read their circles and memberships, circle creator can insert members.

#### Scenario: Member reads own circles
- **WHEN** a user queries circles they belong to
- **THEN** they see those circles

#### Scenario: Non-member cannot see circle
- **WHEN** a user queries a circle they don't belong to
- **THEN** the query returns no rows

### Requirement: activities table
The system SHALL have an `activities` table with columns: `id` (uuid PK), `created_by` (FK profiles), `circle_id` (FK circles nullable), `title` (text NOT NULL), `venue_id` (FK venues nullable), `starts_at` (timestamptz), `created_at` (timestamptz default now()).

#### Scenario: Activity with venue and circle
- **WHEN** an activity is inserted with valid circle_id and venue_id
- **THEN** the insert succeeds with both foreign keys resolved

### Requirement: activity_interest table
The system SHALL have an `activity_interest` table with columns: `id` (uuid PK), `user_id` (FK profiles), `activity_id` (FK activities), `posture` (text, CHECK: definitely_in/down_if_others/sell_me), `confirmed_at` (timestamptz nullable), `created_at` (timestamptz default now()). UNIQUE constraint on (user_id, activity_id).

#### Scenario: User expresses interest in activity
- **WHEN** a user inserts an activity_interest row with posture "definitely_in"
- **THEN** the row is created with confirmed_at set to now()

#### Scenario: User cannot double-express interest
- **WHEN** a user already has interest in an activity
- **THEN** inserting a second interest row fails (unique constraint)

### Requirement: activities RLS
The system SHALL enforce RLS on `activities` and `activity_interest`: all authenticated users can SELECT, users can INSERT their own rows, users can UPDATE their own activity_interest.

#### Scenario: Authenticated user reads activities
- **WHEN** an authenticated user queries activities
- **THEN** they can see all activities

### Requirement: TypeScript types for all social tables
The system SHALL export TypeScript interfaces from `types/index.ts` for: `StatusBroadcast`, `Circle`, `CircleMember`, `Activity`, `ActivityInterest`.

#### Scenario: Types are importable
- **WHEN** a component imports `StatusBroadcast` from types
- **THEN** it compiles without error and includes all table columns
