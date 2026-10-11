import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { STS } from "../../../lib/config";
export const dynamic = "force-dynamic";
export async function GET() {
  const { data, error } = await db.from("members").select("*, payments(*)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
export async function POST(req) {
  const { name, tel, st, amount } = await req.json();
  const fee = STS[st]?.fee;
  if (!name?.trim() || fee == null) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data: m, error } = await db.from("members").insert({ name: name.trim(), tel: tel || null, st, fee }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let p = null;
  const a = Math.min(Number(amount) || 0, fee);
  if (a > 0) ({ data: p } = await db.from("payments").insert({ member_id: m.id, amount: a }).select().single());
  return NextResponse.json({ member: m, payment: p });
}
