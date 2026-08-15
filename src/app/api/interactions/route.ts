import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { userId, listingId, action } = await request.json();
  if (!userId || !listingId || !["save", "dismiss", "view", "inspection"].includes(action)) {
    return NextResponse.json({ error: "Invalid interaction" }, { status: 400 });
  }
  if (db) {
    await db`
      INSERT INTO hearth_interactions (user_id, listing_id, action, created_at)
      VALUES (${userId}, ${listingId}, ${action}, now())
      ON CONFLICT (user_id, listing_id, action) DO UPDATE SET created_at = now()
    `;
  }
  return NextResponse.json({ ok: true });
}

