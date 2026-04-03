## ADDED Requirements

### Requirement: Server-side Cornell email enforcement
The system SHALL enforce that only `@cornell.edu` email addresses can complete signup. A Supabase Edge Function SHALL run as a database webhook on `auth.users` INSERT, check the email domain, and delete the auth user row if it does not end with `@cornell.edu`.

#### Scenario: Cornell email signup succeeds
- **WHEN** a user signs up with email `student@cornell.edu`
- **THEN** the auth user row persists and a profile is created

#### Scenario: Non-Cornell email signup is rejected
- **WHEN** a user signs up with email `user@gmail.com`
- **THEN** the Edge Function deletes the `auth.users` row and returns HTTP 403

#### Scenario: Cornell subdomain email is accepted
- **WHEN** a user signs up with email `student@cs.cornell.edu`
- **THEN** the signup is rejected (only exact `@cornell.edu` domain is accepted)

### Requirement: Edge Function is deployed as database webhook
The Edge Function SHALL be located at `supabase/functions/enforce-cornell-email/index.ts` and configured as a database webhook triggered on INSERT to `auth.users`.

#### Scenario: Edge Function file exists at correct path
- **WHEN** the project is deployed
- **THEN** `supabase/functions/enforce-cornell-email/index.ts` exists and is a valid Deno module

### Requirement: Client-side validation remains as first line of defense
The existing client-side `@cornell.edu` email check in `auth.tsx` SHALL remain in place. The server-side enforcement is a backup, not a replacement.

#### Scenario: Auth screen rejects non-Cornell email before network request
- **WHEN** a user types `user@gmail.com` in the auth screen
- **THEN** the client shows an error message without making a signup API call
