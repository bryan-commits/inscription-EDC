import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
export async function POST(req) {
  const { member_id, amount } = await req.json();
  const { data: m } = await db.from("members").select("fee, payments(amount)").eq("id", member_id).single();
  if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });
  const rest = m.fee - m.payments.reduce((a, p) => a + p.amount, 0);
  const a = Math.min(Number(amount) || 0, rest);
  if (a <= 0) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data } = await db.from("payments").insert({ member_id, amount: a }).select().single();
  return NextResponse.json(data);
}
export async function DELETE(req) {
  await db.from("payments").delete().eq("id", new URL(req.url).searchParams.get("id"));
  return NextResponse.json({ ok: true });
}
