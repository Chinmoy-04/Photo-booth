import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  getSitePassphrase,
  verifyAccessToken,
} from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/api/gate"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export async function middleware(request: NextRequest) {
  const passphrase = getSitePassphrase();
  const cookieSecret = process.env.SITE_COOKIE_SECRET?.trim();
  const { pathname } = request.nextUrl;

  // Old /gate URL → root gate
  if (pathname === "/gate" || pathname.startsWith("/gate/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    !passphrase ||
    !cookieSecret ||
    cookieSecret === "change-me-to-a-long-random-string"
  ) {
    return NextResponse.next();
  }

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const isAuthed = await verifyAccessToken(token);

  // Already unlocked: skip the gate and go to the landing
  if (pathname === "/" && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isAuthed) {
    return NextResponse.next();
  }

  const gateUrl = request.nextUrl.clone();
  gateUrl.pathname = "/";
  gateUrl.search = "";
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
