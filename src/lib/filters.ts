export const FILTER_PRESETS = {
  none: "none",
  vintage: "sepia(0.35) contrast(1.1) brightness(1.05) saturate(1.4)",
  blackAndWhite: "grayscale(1) contrast(1.15)",
  dreamy: "brightness(1.1) contrast(0.9) saturate(1.3) blur(0.3px)",
  warm: "sepia(0.2) saturate(1.5) hue-rotate(-10deg)",
} as const;

export type FilterKey = keyof typeof FILTER_PRESETS;

export const FILTER_LABELS: Record<FilterKey, string> = {
  none: "Original",
  vintage: "Vintage",
  blackAndWhite: "B&W",
  dreamy: "Dreamy",
  warm: "Warm",
};
