/**
 * Seed script for Bonfire — run with ts-node or tsx:
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

// ── Cornell / Ithaca Venues ──────────────────────────────────

const venues = [
  // ── Eat & Drink ──
  {
    name: "Collegetown Bagels",
    neighborhood: "Collegetown",
    category: "eatdrink",
    lat: 42.4422,
    lng: -76.4857,
  },
  {
    name: "Chapter House",
    neighborhood: "Collegetown",
    category: "eatdrink",
    lat: 42.4419,
    lng: -76.4851,
  },
  {
    name: "Rulloff's",
    neighborhood: "Collegetown",
    category: "eatdrink",
    lat: 42.4415,
    lng: -76.4847,
  },
  {
    name: "Level B",
    neighborhood: "Collegetown",
    category: "eatdrink",
    lat: 42.4418,
    lng: -76.4853,
  },
  {
    name: "Plum Tree",
    neighborhood: "Collegetown",
    category: "eatdrink",
    lat: 42.4424,
    lng: -76.4844,
  },
  {
    name: "Hai Hong",
    neighborhood: "Collegetown",
    category: "eatdrink",
    lat: 42.4421,
    lng: -76.4839,
  },
  {
    name: "Moosewood",
    neighborhood: "Downtown Ithaca",
    category: "eatdrink",
    lat: 42.4405,
    lng: -76.4967,
  },
  {
    name: "Ithaca Bakery",
    neighborhood: "East Hill",
    category: "eatdrink",
    lat: 42.4445,
    lng: -76.4888,
  },

  // ── Happening ──
  {
    name: "The Nines",
    neighborhood: "Collegetown",
    category: "happening",
    lat: 42.4413,
    lng: -76.4849,
  },
  {
    name: "The Range",
    neighborhood: "Downtown Ithaca",
    category: "happening",
    lat: 42.4400,
    lng: -76.4970,
  },
  {
    name: "Silky Jones",
    neighborhood: "Collegetown",
    category: "happening",
    lat: 42.4416,
    lng: -76.4855,
  },
  {
    name: "The Haunt",
    neighborhood: "Downtown Ithaca",
    category: "happening",
    lat: 42.4392,
    lng: -76.4971,
  },

  // ── Move ──
  {
    name: "Helen Newman Hall",
    neighborhood: "Cornell Campus",
    category: "move",
    lat: 42.4531,
    lng: -76.4779,
  },
  {
    name: "Noyes Fitness Center",
    neighborhood: "Cornell Campus",
    category: "move",
    lat: 42.4468,
    lng: -76.4865,
  },
  {
    name: "Teagle Hall",
    neighborhood: "Cornell Campus",
    category: "move",
    lat: 42.4497,
    lng: -76.4786,
  },

  // ── Outside ──
  {
    name: "Cornell Botanic Gardens",
    neighborhood: "Cornell Campus",
    category: "outside",
    lat: 42.4520,
    lng: -76.4708,
  },
  {
    name: "Cascadilla Gorge",
    neighborhood: "Collegetown",
    category: "outside",
    lat: 42.4445,
    lng: -76.4865,
  },
  {
    name: "Stewart Park",
    neighborhood: "Ithaca Waterfront",
    category: "outside",
    lat: 42.4583,
    lng: -76.5142,
  },
  {
    name: "Ithaca Falls",
    neighborhood: "Fall Creek",
    category: "outside",
    lat: 42.4530,
    lng: -76.4940,
  },

  // ── Focus ──
  {
    name: "Libe Café",
    neighborhood: "Cornell Campus",
    category: "focus",
    lat: 42.4479,
    lng: -76.4843,
  },
  {
    name: "Mann Library",
    neighborhood: "Cornell Campus",
    category: "focus",
    lat: 42.4487,
    lng: -76.4761,
  },
  {
    name: "Olin Library",
    neighborhood: "Cornell Campus",
    category: "focus",
    lat: 42.4477,
    lng: -76.4841,
  },
  {
    name: "Temple of Zeus",
    neighborhood: "Cornell Campus",
    category: "focus",
    lat: 42.4498,
    lng: -76.4826,
  },
];

// ── Seed Logic ───────────────────────────────────────────────

async function seed() {
  console.log("Seeding Cornell/Ithaca venues...\n");

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
      console.error(`  ✗ ${v.name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${v.name} (${v.category})`);
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

  // ── Mock Checkins ────────────────────────────────────────
  console.log("\nSeeding mock checkins...\n");

  // Demo user ID — in production these come from real auth.users
  const demoUserId = "00000000-0000-0000-0000-000000000001";

  const highActivity = ["Chapter House", "The Nines", "Collegetown Bagels"];
  const medActivity = ["Rulloff's", "Libe Café", "Cascadilla Gorge", "Level B"];
  const lowActivity = ["Olin Library", "Mann Library"];

  for (const venue of insertedVenues) {
    let checkinCount = 0;
    let vibe: "buzzing" | "quiet" | "skip" = "quiet";
    let baseScore = 0.2;

    if (highActivity.includes(venue.name)) {
      checkinCount = 5;
      vibe = "buzzing";
      baseScore = 0.8;
    } else if (medActivity.includes(venue.name)) {
      checkinCount = 3;
      vibe = "buzzing";
      baseScore = 0.5;
    } else if (lowActivity.includes(venue.name)) {
      checkinCount = 2;
      vibe = "quiet";
      baseScore = 0.25;
    } else {
      // Skip remaining venues — no checkins, they'll appear as inactive markers
      continue;
    }

    for (let i = 0; i < checkinCount; i++) {
      const { error } = await supabase.from("checkins").insert({
        user_id: demoUserId,
        venue_id: venue.id,
        vibe,
        activity_score: baseScore + Math.random() * 0.15,
        expires_at: new Date(
          Date.now() + 2 * 60 * 60 * 1000 - i * 15 * 60 * 1000
        ).toISOString(),
      });

      if (error) {
        console.error(`  ✗ ${venue.name} checkin: ${error.message}`);
      }
    }
    console.log(`  ✓ ${venue.name} — ${checkinCount}× ${vibe} (score ~${baseScore.toFixed(1)})`);
  }

  console.log("\nDone! Seeded " + venues.length + " venues.");
}

seed().catch(console.error);
