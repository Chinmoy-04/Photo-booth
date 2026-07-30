import { NextRequest, NextResponse } from "next/server";
import { del, list, put } from "@vercel/blob";
import { sanitizeSessionId } from "@/lib/room";

function getBlobToken(): string {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (!raw) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }
  return raw.trim().replace(/^["']|["']$/g, "");
}

function sessionPrefix(session: string): string {
  const id = sanitizeSessionId(session);
  if (!id) {
    throw new Error("Missing session id.");
  }
  return `sessions/${id}/`;
}

export async function GET(request: NextRequest) {
  try {
    const session = request.nextUrl.searchParams.get("session") ?? "";
    const prefix = sessionPrefix(session);

    const { blobs } = await list({
      prefix,
      token: getBlobToken(),
    });

    const photos = blobs
      .map((blob) => blob.url)
      .sort((a, b) => b.localeCompare(a));

    return NextResponse.json({ photos });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Photo storage is not configured.";
    console.error("[api/photos GET]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const session = sanitizeSessionId(
      (formData.get("session") as string | null) ?? ""
    );

    if (!session) {
      return NextResponse.json({ error: "Missing session id." }, { status: 400 });
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing photo file." }, { status: 400 });
    }

    const blob = await put(`sessions/${session}/${Date.now()}.png`, file, {
      access: "public",
      token: getBlobToken(),
      contentType: "image/png",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload photo.";
    console.error("[api/photos POST]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

/** Delete every photo for this session (called when the last person leaves). */
export async function DELETE(request: NextRequest) {
  try {
    const session = request.nextUrl.searchParams.get("session") ?? "";
    const prefix = sessionPrefix(session);
    const token = getBlobToken();

    const { blobs } = await list({ prefix, token });
    if (blobs.length > 0) {
      await del(
        blobs.map((b) => b.url),
        { token }
      );
    }

    return NextResponse.json({ deleted: blobs.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to clear session photos.";
    console.error("[api/photos DELETE]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
