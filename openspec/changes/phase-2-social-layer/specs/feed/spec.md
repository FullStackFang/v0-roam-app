## ADDED Requirements

### Requirement: Tab navigation with Map and Feed
The system SHALL use Expo Router tab navigation with two tabs: Map (map-pin icon) and Feed (list icon). The tab bar SHALL be minimal — icons only, no labels, accent color when active, muted when inactive.

#### Scenario: Two tabs are visible
- **WHEN** the user is authenticated
- **THEN** a bottom tab bar shows Map and Feed icons

#### Scenario: Tab switching preserves state
- **WHEN** the user switches from Map to Feed and back
- **THEN** the map retains its position and filter state

### Requirement: Feed screen with unified card stream
The Feed screen SHALL display a FlatList of cards sorted by recency. Cards are fetched from: active status_broadcasts, upcoming activities, and venue signals (venues with recent friend activity or high loyalty).

#### Scenario: Feed shows mixed content
- **WHEN** the feed loads with broadcasts and activities
- **THEN** cards appear interleaved by recency, newest first

### Requirement: Status broadcast card type
Broadcast cards SHALL show: friend avatar, display_name, status text, time window remaining, and distance from user (if location available).

#### Scenario: Broadcast card displays correctly
- **WHEN** a friend broadcasts "Up for drinks" with 45 minutes remaining
- **THEN** the card shows their avatar, name, "Up for drinks", and "45 min left"

### Requirement: Activity card type
Activity cards SHALL show: title, venue name (if set), starts_at time, and commitment posture avatar stacks grouped by posture. Text like "3 confirmed, 1 deciding" below the avatars.

#### Scenario: Activity card shows posture breakdown
- **WHEN** an activity has 3 definitely_in and 1 down_if_others
- **THEN** the card shows "3 confirmed, 1 deciding" with grouped avatar stacks

### Requirement: Venue signal card type
Venue cards SHALL show: venue name, category icon, loyalty score indicator, and "X friends have been here" with avatar stack.

#### Scenario: Venue card with friend activity
- **WHEN** 2 friends have checked in at a venue in the last 24h
- **THEN** the venue card shows their avatars and "2 friends here recently"

### Requirement: Swipeable card interactions
Feed cards SHALL be swipeable: swipe right = interested/yes, swipe left = dismiss. For broadcast cards, swipe right creates a "I'm down" response. For activity cards, swipe right opens the posture picker.

#### Scenario: Swipe right on broadcast card
- **WHEN** the user swipes right on a broadcast card
- **THEN** a visual "I'm down" confirmation appears and the response is recorded

#### Scenario: Swipe right on activity card
- **WHEN** the user swipes right on an activity card
- **THEN** the posture picker bottom sheet opens

### Requirement: Social proof on every card
Every feed card SHALL show avatar stacks of people involved. Names for friends (from circles), counts for extended network. Principle: "people over percentages."

#### Scenario: Card shows named friends
- **WHEN** a card involves 2 friends and 5 others
- **THEN** it shows friend avatars with names + "+5 others"

### Requirement: Pull-to-refresh on feed
The Feed SHALL support pull-to-refresh to reload all data.

#### Scenario: Pull to refresh reloads data
- **WHEN** the user pulls down on the feed
- **THEN** all feed data is re-fetched and cards update
