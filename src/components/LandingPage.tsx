"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AmbientOrbs } from "@/components/AmbientOrbs";
import { LogoutButton } from "@/components/LogoutButton";
import { CursorBloom, SpotlightCard } from "@/components/MagneticButton";
import { TextReveal } from "@/components/TextReveal";
import { useMotionSafe, softSpring } from "@/lib/motion";

const MotionLink = motion(Link);

export function LandingPage() {
  const {
    prefersReduced,
    heroContainer,
    fadeUp,
    frameReveal,
    drawLine,
  } = useMotionSafe();

  return (
    <main className="antique-stage">
      <AmbientOrbs />
      <CursorBloom />

      {!prefersReduced && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-secondary/40"
              style={{
                left: `${8 + ((i * 17) % 84)}%`,
                top: `${10 + ((i * 23) % 80)}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.15, 0.55, 0.15],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 5 + (i % 4),
                repeat: Infinity,
                delay: i * 0.35,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-[2]">
        <div className="absolute right-6 top-6 z-10 sm:right-8 sm:top-8">
          <LogoutButton />
        </div>
        <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
          <SpotlightCard className="w-full max-w-xl">
            <motion.div
              className="antique-frame w-full px-8 py-14 sm:px-12 sm:py-16"
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
              >
                <motion.p
                  className="font-display text-sm uppercase tracking-[0.35em] text-secondary"
                  variants={fadeUp}
                >
                  Est. for us
                </motion.p>

                <motion.div variants={fadeUp} className="mt-6">
                  <TextReveal
                    text="Ours"
                    className="font-display text-5xl font-medium leading-none text-ink sm:text-6xl md:text-7xl"
                  />
                </motion.div>

                <motion.div
                  aria-hidden
                  className="relative mx-auto mt-6 h-px w-20 origin-center overflow-hidden"
                  variants={drawLine}
                >
                  <span className="absolute inset-0 bg-secondary/80" />
                  {!prefersReduced && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-transparent via-[#FAF6F0] to-transparent"
                      animate={{ x: ["-100%", "280%"] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        repeatDelay: 1.8,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>

                <motion.h1
                  className="mx-auto mt-6 max-w-md text-balance font-display text-2xl font-normal italic leading-snug text-ink-muted sm:text-3xl"
                  variants={fadeUp}
                >
                  A little photobooth.
                </motion.h1>

                <motion.p
                  className="mx-auto mt-5 max-w-sm text-balance text-sm leading-relaxed tracking-wide text-ink-soft sm:text-base"
                  variants={fadeUp}
                >
                  Because we never got to use one
                </motion.p>

                <motion.div
                  className="mt-10 flex flex-col items-center gap-4"
                  variants={fadeUp}
                >
                  <MotionLink
                    href="/photobooth"
                    className="btn-primary"
                    whileHover={
                      prefersReduced
                        ? undefined
                        : {
                            backgroundColor: "#A16207",
                            borderColor: "#A16207",
                          }
                    }
                    whileTap={prefersReduced ? undefined : { scale: 0.985 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    Open the photobooth
                  </MotionLink>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
                    Camera access MANDATORY
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </SpotlightCard>
        </section>
      </div>
    </main>
  );
}
