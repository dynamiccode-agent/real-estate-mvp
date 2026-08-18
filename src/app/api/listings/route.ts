import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapListing } from "@/lib/listing-mapper";
import { propertyListings } from "@/lib/property-data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  const transparentOnly = request.nextUrl.searchParams.get("transparent") === "true";
  try {
    if (!db) throw new Error("Database is not configured");
    const rows = await db`
      SELECT * FROM hearth_listings
      WHERE (${query || null}::text IS NULL OR lower(suburb || ' ' || address || ' ' || postcode) LIKE ${`%${query}%`})
        AND (${transparentOnly}::boolean = false OR price_confidence <> 'hidden')
        AND status = 'active'
      ORDER BY listed_at DESC
    `;
    return NextResponse.json({ listings: rows.map((row) => mapListing(row)), source: "neon" });
  } catch {
    const listings = propertyListings.filter((item) => {
      const matches = !query || `${item.suburb} ${item.address} ${item.postcode}`.toLowerCase().includes(query);
      return matches && (!transparentOnly || item.priceConfidence !== "hidden");
    });
    return NextResponse.json({ listings, source: "local" });
  }
}
