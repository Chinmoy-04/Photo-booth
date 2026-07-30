"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import type { ReactNode } from "react";
import { antiqueEase } from "@/lib/motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticButton({
  children,
  className,
  strength = 28,
}: MagneticButtonProps) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18 });
  const springY = useSpring(y, { stiffness: 220, damping: 18 });

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    if (prefersReduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    x.set((offsetX / (rect.width / 2)) * strength);
    y.set((offsetY / (rect.height / 2)) * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: prefersReduced ? 0 : springX, y: prefersReduced ? 0 : springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      transition={{ ease: antiqueEase }}
    >
      {children}
    </motion.div>
  );
}

/** Soft gold bloom that follows the cursor across the whole page */
export function CursorBloom() {
  const prefersReduced = useReducedMotion();
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 22 });
  const background = useMotionTemplate`
    radial-gradient(
      440px circle at ${springX}px ${springY}px,
      rgba(161, 98, 7, 0.2),
      rgba(212, 165, 116, 0.08) 35%,
      transparent 60%
    )
  `;

  useEffect(() => {
    if (prefersReduced) return;

    function onMove(event: MouseEvent) {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [prefersReduced, mouseX, mouseY]);

  if (prefersReduced) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ background }}
    />
  );
}

/** Soft gold spotlight that follows the cursor over a card */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const background = useMotionTemplate`
    radial-gradient(
      280px circle at ${mouseX}px ${mouseY}px,
      rgba(161, 98, 7, 0.16),
      transparent 55%
    )
  `;

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    if (prefersReduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  return (
    <motion.div
      className={`relative overflow-hidden ${className ?? ""}`}
      onMouseMove={onMove}
    >
      <div className="relative z-[1]">{children}</div>
      {!prefersReduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{ background }}
        />
      )}
    </motion.div>
  );
}
