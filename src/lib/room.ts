import { FILTER_PRESETS, type FilterKey } from "@/lib/filters";

export function sanitizeRoomName(room: string): string {
  return room
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

/** Short session id shared via the invite link — photos live only under this id. */
export function sanitizeSessionId(session: string): string {
  return session
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
}

export function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export type RoomSyncMessage =
  | { type: "photo_added"; url: string }
  | { type: "session_cleared" }
  | { type: "filter_changed"; filter: FilterKey };

function encodeJson(payload: RoomSyncMessage): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return new Uint8Array(encoded.buffer.slice(0));
}

export function encodePhotoMessage(url: string): Uint8Array<ArrayBuffer> {
  return encodeJson({ type: "photo_added", url });
}

export function encodeSessionClearedMessage(): Uint8Array<ArrayBuffer> {
  return encodeJson({ type: "session_cleared" });
}

export function encodeFilterMessage(filter: FilterKey): Uint8Array<ArrayBuffer> {
  return encodeJson({ type: "filter_changed", filter });
}

function isFilterKey(value: unknown): value is FilterKey {
  return typeof value === "string" && value in FILTER_PRESETS;
}

export function decodeRoomMessage(data: Uint8Array): RoomSyncMessage | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(data)) as RoomSyncMessage;
    if (parsed?.type === "photo_added" && typeof parsed.url === "string") {
      return parsed;
    }
    if (parsed?.type === "session_cleared") {
      return parsed;
    }
    if (parsed?.type === "filter_changed" && isFilterKey(parsed.filter)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** @deprecated use decodeRoomMessage */
export const decodePhotoMessage = decodeRoomMessage;
