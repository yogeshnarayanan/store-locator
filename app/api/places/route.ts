import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Place } from "@/lib/db/models/place";
import { upsertPlaceSchema } from "@/lib/validation/place";

export async function POST(req: NextRequest) {
  await dbConnect();
  const json = await req.json();
  const parsed = upsertPlaceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, address, city, state, lat, lng } = parsed.data;
  const doc = await Place.create({
    name, address, city, state, lat, lng,
    location: { type: "Point", coordinates: [lng, lat] },
  });
  return NextResponse.json(doc, { status: 201 });
}
