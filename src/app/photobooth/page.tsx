"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AmbientOrbs } from "@/components/AmbientOrbs";
import { CursorBloom } from "@/components/MagneticButton";
import { LogoutButton } from "@/components/LogoutButton";
import { RoomLobby } from "@/components/RoomLobby";
import { SharedPhotobooth } from "@/components/SharedPhotobooth";
import { sanitizeRoomName, sanitizeSessionId } from "@/lib/room";

type SessionState = {
  token: string;
  room: string;
  identity: string;
  session: string;
};

function PhotoboothContent() {
  const searchParams = useSearchParams();
  const initialRoom = sanitizeRoomName(
    searchParams.get("room") ?? "anniversary"
  );
  const initialSession = sanitizeSessionId(searchParams.get("session") ?? "");

  const [session, setSession] = useState<SessionState | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = useCallback(
    async (room: string, name: string, sessionId: string) => {
      setJoinError(null);
      setIsJoining(true);

      try {
        const params = new URLSearchParams({ room, name });
        const response = await fetch(`/api/livekit/token?${params.toString()}`);

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "Could not join the room.");
        }

        const data = (await response.json()) as Omit<SessionState, "session">;
        setSession({ ...data, session: sessionId });

        const url = new URL(window.location.href);
        url.searchParams.set("room", data.room);
        url.searchParams.set("session", sessionId);
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        setJoinError(
          error instanceof Error ? error.message : "Could not join the room."
        );
      } finally {
        setIsJoining(false);
      }
    },
    []
  );

  if (session) {
    return (
      <SharedPhotobooth
        token={session.token}
        room={session.room}
        identity={session.identity}
        sessionId={session.session}
        onLeave={() => setSession(null)}
      />
    );
  }

  return (
    <main className="antique-stage">
      <AmbientOrbs />
      <CursorBloom />

      <div className="relative z-[2]">
        <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-8 flex w-full max-w-lg items-center justify-between gap-4">
            <Link
              href="/home"
              className="cursor-pointer text-xs font-medium uppercase tracking-[0.2em] text-secondary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              ← Back home
            </Link>
            <LogoutButton />
          </div>

          {joinError && (
            <div
              role="alert"
              className="mb-6 w-full max-w-lg border border-surface-border bg-[#FAF6F0]/90 px-4 py-3 text-sm text-ink"
            >
              {joinError}
            </div>
          )}

          {isJoining ? (
            <p className="font-display text-ink-muted">Joining room…</p>
          ) : (
            <RoomLobby
              initialRoom={initialRoom}
              initialSession={initialSession || undefined}
              onJoin={handleJoin}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default function PhotoboothPage() {
  return (
    <Suspense
      fallback={
        <main className="antique-stage flex min-h-screen items-center justify-center text-ink-muted">
          Loading photobooth…
        </main>
      }
    >
      <PhotoboothContent />
    </Suspense>
  );
}
