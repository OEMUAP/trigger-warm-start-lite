import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: "#0c0a09", secondary: "#1c1917", tertiary: "#292524" },
        foreground: { DEFAULT: "#fafaf9", muted: "#a8a29e" },
        accent: { DEFAULT: "#22c55e", hover: "#16a34a" },
        border: { DEFAULT: "#44403c" },
      },
    },
  },
  plugins: [],
} satisfies Config;
