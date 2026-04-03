## ADDED Requirements

### Requirement: FAB button on map screen
The system SHALL display a floating action button (FAB) on the map screen, positioned bottom-right above the SpotCard area. Tapping it opens the broadcast sheet.

#### Scenario: FAB is visible on map
- **WHEN** the user is on the map tab
- **THEN** a FAB button is visible in the bottom-right corner

#### Scenario: FAB opens broadcast sheet
- **WHEN** the user taps the FAB
- **THEN** a bottom sheet slides up with broadcast options

### Requirement: Broadcast sheet with preset statuses
The broadcast sheet SHALL display preset status pills: "Out now", "Up for drinks", "Up for dinner", "Grabbing coffee". The user can also enter custom text. A duration selector offers "1 hour", "Until 2am", "24 hours".

#### Scenario: Select preset status and broadcast
- **WHEN** the user taps "Up for drinks" and selects "1 hour" duration, then taps "Broadcast"
- **THEN** a status_broadcasts row is inserted with status_type="up_for_drinks", duration="1h", expires_at=now()+1h

#### Scenario: Custom status broadcast
- **WHEN** the user types "Studying at Libe" and selects "Until 2am"
- **THEN** a status_broadcasts row is inserted with status_type="custom", custom_text="Studying at Libe", duration="until_2am"

### Requirement: Broadcast auto-expiry
Broadcasts SHALL automatically expire based on the selected duration. The `expires_at` field is computed at insert time. Expired broadcasts do not appear in queries.

#### Scenario: 1-hour broadcast expires
- **WHEN** a broadcast with duration "1h" was created 61 minutes ago
- **THEN** it no longer appears in active broadcast queries

### Requirement: Broadcast avatars on map
Active broadcasts from circle members SHALL appear on the map as avatar circles with a subtle glow ring at the broadcaster's location (or last known location if no broadcast location).

#### Scenario: Friend broadcasts and appears on map
- **WHEN** a circle member broadcasts "Out now" with a location
- **THEN** their avatar appears on the map at that location with a glow effect

### Requirement: Maximum active broadcasts
A user SHALL have at most 3 active (non-expired) broadcasts at any time. Attempting to create a 4th fails with an error.

#### Scenario: Exceed broadcast limit
- **WHEN** a user with 3 active broadcasts tries to create another
- **THEN** the broadcast sheet shows an error "You have 3 active broadcasts — wait for one to expire"

### Requirement: Broadcast sheet animation
The broadcast sheet SHALL use spring animation for open/close, matching the SpotCard animation pattern.

#### Scenario: Sheet animates smoothly
- **WHEN** the user taps the FAB
- **THEN** the sheet slides up with a spring animation (damping, stiffness consistent with SpotCard)
