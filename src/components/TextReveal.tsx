"use client";

import { motion } from "framer-motion";
import { useMotionSafe } from "@/lib/motion";

interface TextRevealProps {
  text: string;
  className?: string;
}

export function TextReveal({ text, className }: TextRevealProps) {
  const { letterContainer, letterItem, prefersReduced } = useMotionSafe();
  const letters = text.split("");

  if (prefersReduced) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      className={`inline-flex ${className ?? ""}`}
      aria-label={text}
      variants={letterContainer}
      initial="hidden"
      animate="visible"
      style={{ perspective: 600 }}
    >
      {letters.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          variants={letterItem}
          className="inline-block origin-bottom"
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
