"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

const ORBS = [
  { className: "left-[-10%] top-[8%] h-72 w-72 bg-secondary/25" },
  { className: "right-[-8%] top-[35%] h-96 w-96 bg-sepia/30" },
  { className: "left-[20%] bottom-[-5%] h-80 w-80 bg-accent/20" },
];

export function AmbientOrbs() {
  const prefersReduced = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (prefersReduced) return;

    function onMove(event: MouseEvent) {
      const { innerWidth, innerHeight } = window;
      mouseX.set((event.clientX / innerWidth - 0.5) * 40);
      mouseY.set((event.clientY / innerHeight - 0.5) * 30);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [prefersReduced, mouseX, mouseY]);

  if (prefersReduced) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {ORBS.map((orb, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-3xl ${orb.className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          style={{ x: springX, y: springY }}
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.45, 0.7, 0.45],
          }}
          transition={{
            duration: 8 + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
}
