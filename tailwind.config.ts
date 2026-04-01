import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF7",
        ink: {
          DEFAULT: "#1A1A18",
          muted: "#6B6B68",
          faint: "#9B9B98",
        },
        border: {
          DEFAULT: "#E2DFD8",
          warm: "#E8E6DF",
        },
        sage: {
          DEFAULT: "#6B8F71",
          light: "#EEF3EE",
          dark: "#4D6E53",
        },
        danger: {
          DEFAULT: "#C0392B",
          light: "#FDECEA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "3px",
        md: "6px",
        lg: "10px",
        full: "9999px",
      },
      boxShadow: {
        none: "none",
      },
      spacing: {
        "panel": "24px",
      },
      backgroundImage: {
        "grid-paper": `
          linear-gradient(rgba(107, 143, 113, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(107, 143, 113, 0.04) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        "grid-paper": "24px 24px",
      },
      keyframes: {
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        spin: "spin 0.8s linear infinite",
        fadeIn: "fadeIn 0.2s ease-out",
        slideUp: "slideUp 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
