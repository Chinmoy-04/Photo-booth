import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { sanitizeRoomName } from "@/lib/room";

export async function GET(request: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit is not configured on the server." },
      { status: 503 }
    );
  }

  const room =
    sanitizeRoomName(request.nextUrl.searchParams.get("room") ?? "anniversary") ||
    "anniversary";
  const identity =
    request.nextUrl.searchParams.get("name")?.trim().slice(0, 32) ||
    `guest-${Math.random().toString(36).slice(2, 8)}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: "2h",
  });

  token.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({
    token: await token.toJwt(),
    room,
    identity,
  });
}
