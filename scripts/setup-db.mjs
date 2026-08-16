import { neon } from "@neondatabase/serverless";
import propertyListings from "../src/lib/property-listings.json" with { type: "json" };

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Add it to .env.local.");
const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS hearth_listings (
    id text PRIMARY KEY,
    title text NOT NULL,
    address text NOT NULL,
    suburb text NOT NULL,
    state text NOT NULL,
    postcode text NOT NULL,
    price_label text NOT NULL,
    price_min integer,
    price_max integer,
    price_confidence text NOT NULL CHECK (price_confidence IN ('high', 'medium', 'hidden')),
    beds smallint NOT NULL,
    baths smallint NOT NULL,
    parking smallint NOT NULL,
    land_size integer,
    property_type text NOT NULL,
    description text NOT NULL,
    images jsonb NOT NULL DEFAULT '[]',
    agent_name text NOT NULL,
    agency_name text NOT NULL,
    agent_initials text NOT NULL,
    inspection_at timestamptz,
    listed_at timestamptz NOT NULL DEFAULT now(),
    disclosure_score smallint NOT NULL DEFAULT 0,
    strata_fees integer,
    council_rates integer,
    features jsonb NOT NULL DEFAULT '[]',
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    status text NOT NULL DEFAULT 'active'
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS hearth_interactions (
    user_id text NOT NULL,
    listing_id text NOT NULL REFERENCES hearth_listings(id) ON DELETE CASCADE,
    action text NOT NULL CHECK (action IN ('save', 'dismiss', 'view', 'inspection')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id, action)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS hearth_messages (
    id text PRIMARY KEY,
    listing_id text NOT NULL REFERENCES hearth_listings(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    sender_type text NOT NULL CHECK (sender_type IN ('user', 'agent')),
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

for (const item of propertyListings) {
  await sql`
    INSERT INTO hearth_listings (
      id, title, address, suburb, state, postcode, price_label, price_min, price_max,
      price_confidence, beds, baths, parking, land_size, property_type, description,
      images, agent_name, agency_name, agent_initials, inspection_at, listed_at,
      disclosure_score, strata_fees, council_rates, features, latitude, longitude
    ) VALUES (
      ${item.id}, ${item.title}, ${item.address}, ${item.suburb}, ${item.state}, ${item.postcode},
      ${item.priceLabel}, ${item.priceMin}, ${item.priceMax}, ${item.priceConfidence},
      ${item.beds}, ${item.baths}, ${item.parking}, ${item.landSize}, ${item.propertyType},
      ${item.description}, ${JSON.stringify(item.images)}, ${item.agentName}, ${item.agencyName},
      ${item.agentInitials}, ${item.inspectionAt}, ${item.listedAt}, ${item.disclosureScore},
      ${item.strataFees}, ${item.councilRates}, ${JSON.stringify(item.features)},
      ${item.latitude}, ${item.longitude}
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      address = EXCLUDED.address,
      suburb = EXCLUDED.suburb,
      state = EXCLUDED.state,
      postcode = EXCLUDED.postcode,
      price_label = EXCLUDED.price_label,
      price_min = EXCLUDED.price_min,
      price_max = EXCLUDED.price_max,
      price_confidence = EXCLUDED.price_confidence,
      beds = EXCLUDED.beds,
      baths = EXCLUDED.baths,
      parking = EXCLUDED.parking,
      land_size = EXCLUDED.land_size,
      property_type = EXCLUDED.property_type,
      description = EXCLUDED.description,
      images = EXCLUDED.images,
      agent_name = EXCLUDED.agent_name,
      agency_name = EXCLUDED.agency_name,
      agent_initials = EXCLUDED.agent_initials,
      inspection_at = EXCLUDED.inspection_at,
      listed_at = EXCLUDED.listed_at,
      disclosure_score = EXCLUDED.disclosure_score,
      strata_fees = EXCLUDED.strata_fees,
      council_rates = EXCLUDED.council_rates,
      features = EXCLUDED.features,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      status = 'active'
  `;
}

const imported = await sql`SELECT count(*)::int AS count FROM hearth_listings WHERE id LIKE 'rea-%' AND status = 'active'`;
if (imported[0].count !== propertyListings.length) throw new Error(`Expected ${propertyListings.length} imported listings, found ${imported[0].count}. Demo inventory was not removed.`);

const removed = await sql`DELETE FROM hearth_listings WHERE agency_name = 'PropertySearch Demo' RETURNING id`;
const finalInventory = await sql`SELECT count(*)::int AS count FROM hearth_listings WHERE status = 'active'`;
if (finalInventory[0].count !== propertyListings.length) throw new Error(`Expected exactly ${propertyListings.length} active listings after import, found ${finalInventory[0].count}.`);

console.log(`PropertySearch database ready: ${propertyListings.length} supplied listings active, ${removed.length} demo listings removed.`);
