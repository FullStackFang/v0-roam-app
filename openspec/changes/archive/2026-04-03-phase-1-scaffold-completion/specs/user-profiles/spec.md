## ADDED Requirements

### Requirement: Profiles table exists with required columns
The system SHALL have a `profiles` table with columns: `id` (uuid, PK, references auth.users), `display_name` (text, NOT NULL), `avatar_url` (text, nullable), `university_email` (text, NOT NULL), `created_at` (timestamptz, default now()).

#### Scenario: Profiles table schema is correct
- **WHEN** the database schema is applied
- **THEN** the `profiles` table exists with all required columns and correct types

### Requirement: Profile auto-creation on signup
The system SHALL automatically create a `profiles` row when a new user signs up via Supabase Auth. The `display_name` SHALL be derived from the email prefix (before `@`), with dots and underscores replaced by spaces and title-cased. The `university_email` SHALL be set to the user's email.

#### Scenario: New user signs up with cornell email
- **WHEN** a user signs up with email `jane.doe@cornell.edu`
- **THEN** a `profiles` row is created with `id` matching the auth user's UUID, `display_name` = "Jane Doe", `university_email` = "jane.doe@cornell.edu"

#### Scenario: Display name from underscore email
- **WHEN** a user signs up with email `john_smith@cornell.edu`
- **THEN** the `display_name` is set to "John Smith"

### Requirement: Profiles RLS policies
The system SHALL enforce row-level security on `profiles`: all authenticated users can SELECT all profiles, users can UPDATE only their own row. No DELETE policy (profiles persist with the auth user).

#### Scenario: Authenticated user reads any profile
- **WHEN** an authenticated user queries `profiles`
- **THEN** they can read all profile rows

#### Scenario: User updates own profile
- **WHEN** a user updates the `profiles` row matching their auth UID
- **THEN** the update succeeds

#### Scenario: User cannot update another user's profile
- **WHEN** a user attempts to update a `profiles` row that does not match their auth UID
- **THEN** the update is rejected

### Requirement: Profile TypeScript type and query functions
The system SHALL export a `Profile` TypeScript type from `types/index.ts` and `fetchProfile(userId)` and `upsertProfile(updates)` functions from `lib/queries.ts`.

#### Scenario: Fetch profile for authenticated user
- **WHEN** `fetchProfile(userId)` is called with a valid user ID
- **THEN** it returns the user's profile data including display_name, avatar_url, and university_email

#### Scenario: Upsert profile display name
- **WHEN** `upsertProfile({ display_name: "New Name" })` is called by an authenticated user
- **THEN** the user's profile display_name is updated to "New Name"

### Requirement: Venues table has loyalty_score column
The `venues` table SHALL have a `loyalty_score` column of type `float8` with a default value of `0`. This column is a placeholder for Phase 3 loyalty computation.

#### Scenario: Venue loyalty_score defaults to zero
- **WHEN** a new venue is inserted without specifying `loyalty_score`
- **THEN** the `loyalty_score` is `0`
