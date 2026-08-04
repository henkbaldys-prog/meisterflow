import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          DEFAULT: "#22D3EE",
          400: "#22D3EE",
          500: "#06b6d4",
          600: "#0891b2",
        },
        dark: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#111827",
          950: "#0A0F1C",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        modal: "16px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.24), 0 8px 24px rgba(0,0,0,0.18)",
        glow: "0 0 0 3px rgba(99,102,241,0.25)",
        "glow-accent": "0 0 24px rgba(34,211,238,0.15)",
        modal: "0 24px 64px rgba(0,0,0,0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "modal-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-indigo": {
          to: { transform: "rotate(360deg)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateX(16px) translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0) translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        "modal-in": "modal-in 0.2s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        "spin-indigo": "spin-indigo 0.8s linear infinite",
        "toast-in": "toast-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
