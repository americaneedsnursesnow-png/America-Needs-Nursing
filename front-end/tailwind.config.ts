import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      colors: {
        primary: {
          DEFAULT: "#3b82f6",
          dark: "#2563eb",
          light: "#60a5fa",
        },
        button: {
          DEFAULT: "#dc2626",
          dark: "#b91c1c",
          light: "#ef4444",
        },
        footer: {
          bg: "#172554",
          muted: "#9ca3af",
        },
        text: {
          "footer-muted": "#9ca3af",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans, ui-sans-serif)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 24px -4px rgba(15, 23, 42, 0.08)",
        "card-hover":
          "0 4px 12px rgba(15, 23, 42, 0.06), 0 12px 40px -8px rgba(15, 23, 42, 0.12)",
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        shake: 'shake 0.2s ease-in-out 0s 2',
      },
    },
  },
  plugins: [],
};

export default config;
