"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/MagneticButton";
import { useMotionSafe, softSpring } from "@/lib/motion";
import {
  createSessionId,
  sanitizeRoomName,
  sanitizeSessionId,
} from "@/lib/room";

interface RoomLobbyProps {
  initialRoom?: string;
  initialSession?: string;
  onJoin: (room: string, name: string, session: string) => void;
}

export function RoomLobby({
  initialRoom = "anniversary",
  initialSession,
  onJoin,
}: RoomLobbyProps) {
  const { prefersReduced, heroContainer, fadeUp, frameReveal } = useMotionSafe();
  const [room, setRoom] = useState(initialRoom);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessionId] = useState(
    () => sanitizeSessionId(initialSession ?? "") || createSessionId()
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const safeRoom = sanitizeRoomName(room) || "anniversary";
    const params = new URLSearchParams({
      room: safeRoom,
      session: sessionId,
    });
    return `${window.location.origin}/photobooth?${params.toString()}`;
  }, [room, sessionId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const safeRoom = sanitizeRoomName(room) || "anniversary";
    const displayName = name.trim() || "Guest";
    onJoin(safeRoom, displayName, sessionId);
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SpotlightCard className="mx-auto w-full max-w-lg">
      <motion.div
        className="antique-frame w-full px-8 py-10 sm:px-10 sm:py-12"
        variants={frameReveal}
        initial="hidden"
        animate="visible"
        whileHover={
          prefersReduced
            ? undefined
            : {
                boxShadow:
                  "inset 0 0 0 1px rgba(161, 98, 7, 0.5), inset 0 0 0 8px rgba(250, 246, 240, 0.98), inset 0 0 0 9px rgba(161, 98, 7, 0.55), 0 22px 56px rgba(28, 25, 23, 0.14)",
              }
        }
        transition={softSpring}
      >
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.p
            className="font-display text-sm uppercase tracking-[0.3em] text-secondary"
            variants={fadeUp}
          >
            Shared atelier
          </motion.p>
          <motion.h2
            className="mt-3 font-display text-3xl text-ink"
            variants={fadeUp}
          >
            Join the photobooth
          </motion.h2>
          <motion.div
            aria-hidden
            className="mx-auto mt-4 h-px w-12 bg-secondary/50"
            variants={fadeUp}
          />
          <motion.p
            className="mt-4 text-sm leading-relaxed text-ink-muted"
            variants={fadeUp}
          >
            Copy the share link below so you both join the same session. Photos
            from this session are cleared when the last person leaves.
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 text-left"
            variants={fadeUp}
          >
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
                Your name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. You"
                className="field-input"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
                Room name
              </span>
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="anniversary"
                required
                className="field-input"
              />
            </label>

            <button type="submit" className="btn-primary w-full">
              Enter photobooth
            </button>
          </motion.form>

          <motion.div
            className="mt-6 border border-dashed border-surface-border bg-surface-muted/60 p-4 text-left"
            variants={fadeUp}
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
              Share with your partner
            </p>
            <p className="mt-2 break-all text-sm text-ink-muted">{shareUrl}</p>
            <p className="mt-2 text-xs text-ink-soft">
              Session {sessionId.slice(0, 8)}… · photos only for this meet-up
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-3 cursor-pointer text-sm font-medium text-secondary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </SpotlightCard>
  );
}
