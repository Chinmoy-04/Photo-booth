"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AmbientOrbs } from "@/components/AmbientOrbs";
import { CursorBloom, SpotlightCard } from "@/components/MagneticButton";
import { useMotionSafe, softSpring } from "@/lib/motion";

export default function GateHomePage() {
  const router = useRouter();
  const { prefersReduced, heroContainer, fadeUp, frameReveal } = useMotionSafe();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });

      if (response.ok) {
        router.push("/home");
        router.refresh();
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Incorrect passphrase. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="antique-stage">
      <AmbientOrbs />
      <CursorBloom />

      <div className="relative z-[2]">
        <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
          <SpotlightCard className="w-full max-w-md">
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
              >
                <motion.p
                  className="font-display text-sm uppercase tracking-[0.3em] text-secondary"
                  variants={fadeUp}
                >
                  Private
                </motion.p>
                <motion.h1
                  className="mt-3 font-display text-3xl text-ink"
                  variants={fadeUp}
                >
                  Ours
                </motion.h1>
                <motion.div
                  aria-hidden
                  className="mt-4 h-px w-12 bg-secondary/50"
                  variants={fadeUp}
                />
                <motion.p
                  className="mt-4 text-sm leading-relaxed text-ink-muted"
                  variants={fadeUp}
                >
                  Enter the passphrase to continue.
                </motion.p>

                <motion.form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-4"
                  variants={fadeUp}
                >
                  <label className="block">
                    <span className="sr-only">Passphrase</span>
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Passphrase"
                      autoComplete="current-password"
                      required
                      className="field-input"
                    />
                  </label>

                  {error && (
                    <p role="alert" className="text-sm text-red-900">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !passphrase}
                    className="btn-primary w-full"
                  >
                    {isSubmitting ? "Checking…" : "Enter"}
                  </button>
                </motion.form>
              </motion.div>
            </motion.div>
          </SpotlightCard>
        </section>
      </div>
    </main>
  );
}
