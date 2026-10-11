import { NextResponse } from "next/server";
import { token } from "../../../lib/token";
export async function POST(req) {
  const { password } = await req.json();
  if (password !== process.env.APP_PASSWORD) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("s", await token(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
