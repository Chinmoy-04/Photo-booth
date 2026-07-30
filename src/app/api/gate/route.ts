import { NextRequest, NextResponse } from "next/server";
import {
  buildAccessCookieHeader,
  buildClearAccessCookieHeader,
  isPassphraseValid,
  signAccessToken,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { passphrase?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const passphrase = body.passphrase?.trim();
  if (!passphrase) {
    return NextResponse.json(
      { error: "Passphrase is required." },
      { status: 400 }
    );
  }

  if (!process.env.SITE_PASSPHRASE || !process.env.SITE_COOKIE_SECRET) {
    return NextResponse.json(
      { error: "Site access is not configured." },
      { status: 503 }
    );
  }

  if (!isPassphraseValid(passphrase)) {
    return NextResponse.json(
      { error: "Incorrect passphrase." },
      { status: 401 }
    );
  }

  const token = await signAccessToken();
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildAccessCookieHeader(token));
  return response;
}

/** Clear the access cookie and send the visitor back to the gate. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildClearAccessCookieHeader());
  return response;
}
