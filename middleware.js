import { NextResponse } from "next/server";
import { token } from "./lib/token";
export async function middleware(req) {
  const p = req.nextUrl.pathname;
  if (p.startsWith("/login") || p.startsWith("/api/login")) return NextResponse.next();
  if (req.cookies.get("s")?.value === (await token())) return NextResponse.next();
  if (p.startsWith("/api")) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}
export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
