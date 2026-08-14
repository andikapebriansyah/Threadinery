import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Threadinery Design Tokens ──────────────────
        // Light mode
        bg: {
          DEFAULT: "#FDF9F3",
          dark: "#2A2420",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#332C26",
        },
        ink: {
          DEFAULT: "#3D3226",
          dark: "#EDE6DA",
        },
        "ink-muted": {
          DEFAULT: "#7A6F60",
          dark: "#B0A493",
        },
        accent: {
          DEFAULT: "#C97B4A",
          dark: "#E0935F",
          soft: "#F0DDCB",
          "soft-dark": "#463427",
        },
        sage: {
          DEFAULT: "#8A9A7B",
          dark: "#A3B594",
          soft: "#E3E9DD",
          "soft-dark": "#3A3E32",
        },
        rose: {
          DEFAULT: "#C97C7C",
          dark: "#D99696",
          soft: "#F3E1E1",
          "soft-dark": "#4A3535",
        },
        border: {
          DEFAULT: "#E8DCC8",
          dark: "#4A4038",
        },
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "22px",
        "4xl": "28px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(61,50,38,0.04), 0 8px 24px rgba(61,50,38,0.06)",
        "card-dark": "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.25)",
        accent: "0 4px 14px rgba(201,123,74,0.35)",
        "accent-hover": "0 6px 18px rgba(201,123,74,0.45)",
        glow: "0 0 20px rgba(201,123,74,0.4), 0 0 40px rgba(201,123,74,0.2)",
        "glow-sage":
          "0 0 20px rgba(138,154,123,0.4), 0 0 40px rgba(138,154,123,0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "dash-flow": "dashFlow 1.5s linear infinite",
        "node-appear": "nodeAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        dashFlow: {
          to: { strokeDashoffset: "-20" },
        },
        nodeAppear: {
          from: { opacity: "0", transform: "scale(0.5)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
