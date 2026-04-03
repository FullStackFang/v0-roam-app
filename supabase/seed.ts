/**
 * Seed script for Roam — run with ts-node or tsx:
 *   npx tsx supabase/seed.ts
 *
 * Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 * (or a service-role key) in your environment.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const venues = [
  {
    name: "Employees Only",
    neighborhood: "West Village",
    category: "eatdrink",
    lat: 40.7331,
    lng: -74.0059,
  },
  {
    name: "Russ & Daughters Café",
    neighborhood: "Lower East Side",
    category: "eatdrink",
    lat: 40.7219,
    lng: -73.9878,
  },
  {
    name: "Dimes Square",
    neighborhood: "Chinatown",
    category: "happening",
    lat: 40.7155,
    lng: -73.9891,
  },
  {
    name: "Haymaker Bar",
    neighborhood: "Chelsea",
    category: "eatdrink",
    lat: 40.7465,
    lng: -74.0014,
  },
  {
    name: "Roberta's",
    neighborhood: "Bushwick",
    category: "eatdrink",
    lat: 40.7051,
    lng: -73.9284,
  },
  {
    name: "McNally Jackson",
    neighborhood: "Nolita",
    category: "focus",
    lat: 40.7234,
    lng: -73.9963,
  },
  {
    name: "Overstory",
    neighborhood: "Financial District",
    category: "outside",
    lat: 40.7076,
    lng: -74.0134,
  },
  {
    name: "The Flower Shop",
    neighborhood: "Lower East Side",
    category: "happening",
    lat: 40.7196,
    lng: -73.986,
  },
];

async function seed() {
  console.log("Seeding venues...");

  // Insert venues with PostGIS location
  for (const v of venues) {
    const { error } = await supabase.from("venues").upsert(
      {
        name: v.name,
        neighborhood: v.neighborhood,
        category: v.category,
        lat: v.lat,
        lng: v.lng,
        location: `SRID=4326;POINT(${v.lng} ${v.lat})`,
      },
      { onConflict: "name" }
    );
    if (error) {
      console.error(`Error inserting ${v.name}:`, error.message);
    } else {
      console.log(`  ✓ ${v.name}`);
    }
  }

  // Fetch inserted venue IDs
  const { data: insertedVenues } = await supabase
    .from("venues")
    .select("id, name");

  if (!insertedVenues) {
    console.error("Could not fetch venues");
    return;
  }

  // Create a demo user for mock checkins
  // (In production these come from real auth.users)
  console.log("\nSeeding mock checkins...");

  const highActivityVenues = ["Dimes Square", "Employees Only", "Roberta's"];
  const mediumActivityVenues = [
    "Russ & Daughters Café",
    "The Flower Shop",
    "Overstory",
  ];

  // We need a demo user ID — in dev, create a test user or use an existing one
  const demoUserId = "00000000-0000-0000-0000-000000000001";

  for (const venue of insertedVenues) {
    let checkinCount = 0;
    let vibe: "buzzing" | "quiet" | "skip" = "quiet";

    if (highActivityVenues.includes(venue.name)) {
      checkinCount = 5;
      vibe = "buzzing";
    } else if (mediumActivityVenues.includes(venue.name)) {
      checkinCount = 3;
      vibe = "buzzing";
    } else {
      checkinCount = 1;
      vibe = "quiet";
    }

    for (let i = 0; i < checkinCount; i++) {
      const { error } = await supabase.from("checkins").insert({
        user_id: demoUserId,
        venue_id: venue.id,
        vibe,
        activity_score: highActivityVenues.includes(venue.name)
          ? 0.8 + Math.random() * 0.2
          : mediumActivityVenues.includes(venue.name)
            ? 0.5 + Math.random() * 0.2
            : 0.1 + Math.random() * 0.2,
        expires_at: new Date(
          Date.now() + 2 * 60 * 60 * 1000 - i * 15 * 60 * 1000
        ).toISOString(),
      });

      if (error) {
        console.error(`  Error seeding checkin for ${venue.name}:`, error.message);
      }
    }
    console.log(`  ✓ ${venue.name} — ${checkinCount} checkins (${vibe})`);
  }

  console.log("\nDone!");
}

seed().catch(console.error);
