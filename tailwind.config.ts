import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1C1917",
          foreground: "#FAF6F0",
          soft: "#E8E2D8",
        },
        secondary: {
          DEFAULT: "#A16207",
          soft: "#E8D5A8",
        },
        accent: {
          DEFAULT: "#8B6914",
          soft: "#F0E6C8",
        },
        surface: {
          DEFAULT: "#F5EFE4",
          muted: "#EDE6D9",
          border: "#D4C9B5",
        },
        ink: {
          DEFAULT: "#1C1917",
          muted: "#57534E",
          soft: "#78716C",
        },
        sepia: {
          DEFAULT: "#D4A574",
          deep: "#8B6914",
          faded: "#F5E6C8",
        },
        // Legacy aliases → antique palette (no pink)
        rose: {
          50: "#F5EFE4",
          100: "#EDE6D9",
          200: "#D4C9B5",
          300: "#D4A574",
          400: "#A16207",
          500: "#8B6914",
          600: "#1C1917",
          700: "#1C1917",
          800: "#1C1917",
          900: "#1C1917",
        },
        cream: "#F5EFE4",
        blush: "#EDE6D9",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-source)", "Source Sans 3", "system-ui", "sans-serif"],
        body: ["var(--font-source)", "Source Sans 3", "system-ui", "sans-serif"],
      },
      animation: {
        "countdown-pop": "countdown-pop 0.9s ease-out",
        "fade-up": "fade-up 0.8s ease-out both",
        "fade-up-delay": "fade-up 0.8s ease-out 0.12s both",
        "fade-up-late": "fade-up 0.8s ease-out 0.24s both",
        "grain-shift": "grain-shift 8s steps(10) infinite",
      },
      keyframes: {
        "countdown-pop": {
          "0%": { opacity: "0", transform: "scale(0.4)" },
          "20%": { opacity: "1", transform: "scale(1.15)" },
          "100%": { opacity: "0.85", transform: "scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "grain-shift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-2%, -1%)" },
          "30%": { transform: "translate(1%, 2%)" },
          "50%": { transform: "translate(-1%, 1%)" },
          "70%": { transform: "translate(2%, -2%)" },
          "90%": { transform: "translate(-1%, 0)" },
        },
      },
      transitionDuration: {
        DEFAULT: "220ms",
      },
    },
  },
  plugins: [],
};

export default config;
