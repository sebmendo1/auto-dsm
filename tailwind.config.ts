import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      colors: {
        background: {
          DEFAULT: "#000000",
          secondary: "#0a0a0a",
          tertiary: "#111111",
          elevated: "#171717",
        },
        foreground: {
          DEFAULT: "#ededed",
          secondary: "#a1a1a1",
          tertiary: "#737373",
        },
        border: {
          DEFAULT: "#262626",
          hover: "#404040",
        },
        accent: {
          blue: "#0070f3",
          green: "#00d084",
          red: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
