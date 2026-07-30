"use client";

import { useReducedMotion, type Transition, type Variants } from "framer-motion";

export const antiqueEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const fancySpring = { type: "spring" as const, stiffness: 280, damping: 22 };
export const softSpring = { type: "spring" as const, stiffness: 120, damping: 18 };

export function useMotionSafe() {
  const prefersReduced = useReducedMotion();

  const transition = (duration = 0.55, delay = 0): Transition =>
    prefersReduced
      ? { duration: 0 }
      : { duration, delay, ease: antiqueEase };

  const heroContainer: Variants = {
    hidden: {},
    visible: {
      transition: prefersReduced
        ? { staggerChildren: 0 }
        : { staggerChildren: 0.14, delayChildren: 0.15 },
    },
  };

  const fadeUp: Variants = {
    hidden: prefersReduced
      ? { opacity: 1, y: 0, filter: "blur(0px)" }
      : { opacity: 0, y: 28, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: prefersReduced
        ? { duration: 0 }
        : { duration: 0.75, ease: antiqueEase },
    },
  };

  const frameReveal: Variants = {
    hidden: prefersReduced
      ? { opacity: 1, scale: 1, rotateX: 0 }
      : { opacity: 0, scale: 0.92, rotateX: 8 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: prefersReduced
        ? { duration: 0 }
        : { ...softSpring, duration: 1 },
    },
  };

  const drawLine: Variants = {
    hidden: prefersReduced
      ? { scaleX: 1, opacity: 1 }
      : { scaleX: 0, opacity: 0.3 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: prefersReduced
        ? { duration: 0 }
        : { duration: 0.9, ease: antiqueEase, delay: 0.1 },
    },
  };

  const letterContainer: Variants = {
    hidden: {},
    visible: {
      transition: prefersReduced
        ? { staggerChildren: 0 }
        : { staggerChildren: 0.06, delayChildren: 0.2 },
    },
  };

  const letterItem: Variants = {
    hidden: prefersReduced
      ? { opacity: 1, y: 0, rotateX: 0 }
      : { opacity: 0, y: 40, rotateX: 70 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: prefersReduced
        ? { duration: 0 }
        : { duration: 0.55, ease: antiqueEase },
    },
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: {
      transition: prefersReduced
        ? { staggerChildren: 0 }
        : { staggerChildren: 0.16, delayChildren: 0.1 },
    },
  };

  const staggerItem: Variants = {
    hidden: prefersReduced
      ? { opacity: 1, y: 0, scale: 1 }
      : { opacity: 0, y: 36, scale: 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: prefersReduced
        ? { duration: 0 }
        : { duration: 0.65, ease: antiqueEase },
    },
  };

  const buttonHover = prefersReduced
    ? undefined
    : {
        scale: 1.04,
        y: -3,
        boxShadow: "0 12px 28px rgba(161, 98, 7, 0.28)",
      };

  const buttonTap = prefersReduced
    ? undefined
    : { scale: 0.96, y: 0 };

  return {
    prefersReduced,
    heroContainer,
    fadeUp,
    frameReveal,
    drawLine,
    letterContainer,
    letterItem,
    staggerContainer,
    staggerItem,
    buttonHover,
    buttonTap,
    transition,
    fancySpring,
    softSpring,
  };
}
