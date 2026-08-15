import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sampleMessages } from "@/lib/sample-data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get("listingId") || "paddington-rose";
  if (!db) return NextResponse.json({ messages: sampleMessages.filter((m) => m.listingId === listingId) });
  try {
    const rows = await db`
      SELECT id, listing_id, sender_type, body, created_at
      FROM hearth_messages WHERE listing_id = ${listingId}
      ORDER BY created_at ASC
    `;
    return NextResponse.json({ messages: rows.map((row) => ({
      id: String(row.id), listingId: String(row.listing_id), senderType: row.sender_type,
      body: String(row.body), createdAt: new Date(String(row.created_at)).toISOString()
    })) });
  } catch {
    return NextResponse.json({ messages: sampleMessages.filter((m) => m.listingId === listingId) });
  }
}

export async function POST(request: NextRequest) {
  const { id, listingId, userId, body } = await request.json();
  if (!id || !listingId || !userId || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }
  if (db) {
    await db`
      INSERT INTO hearth_messages (id, listing_id, user_id, sender_type, body, created_at)
      VALUES (${id}, ${listingId}, ${userId}, 'user', ${body.trim()}, now())
    `;
  }
  return NextResponse.json({ ok: true, message: { id, listingId, senderType: "user", body: body.trim(), createdAt: new Date().toISOString() } });
}

