import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
export async function DELETE(_, { params }) {
  const { id } = await params;
  await db.from("members").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
