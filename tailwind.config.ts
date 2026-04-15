import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      colors: {
        surface: {
          base: "var(--color-surface-base)",
          sidebar: "var(--color-surface-sidebar)",
          card: "var(--color-surface-card)",
        },
        content: {
          primary: "var(--color-content-primary)",
          muted: "var(--color-content-muted)",
          faint: "var(--color-content-faint)",
        },
        hairline: "var(--color-border-hairline)",
        well: {
          border: "var(--color-border-well)",
        },
        brand: {
          DEFAULT: "var(--color-accent-brand)",
          soft: "var(--color-accent-brand-soft)",
        },
        sidebar: {
          bg: "var(--color-sidebar-bg)",
          active: "var(--color-sidebar-active)",
          hover: "var(--color-sidebar-hover)",
          border: "var(--color-sidebar-border)",
          nav: "var(--color-sidebar-nav)",
          "nav-active": "var(--color-sidebar-nav-active)",
          sub: "var(--color-sidebar-sub)",
        },
        input: {
          bg: "var(--color-input-bg)",
        },
        ring: {
          focus: "var(--color-ring-focus)",
        },
        background: {
          DEFAULT: "var(--color-surface-base)",
          secondary: "var(--color-surface-sidebar)",
          tertiary: "var(--color-well-via)",
          elevated: "var(--color-surface-card)",
        },
        foreground: {
          DEFAULT: "var(--color-content-primary)",
          secondary: "var(--color-content-muted)",
          tertiary: "var(--color-content-faint)",
        },
        border: {
          DEFAULT: "var(--color-border-hairline)",
          hover: "var(--color-border-well)",
        },
        accent: {
          blue: "#0070f3",
          green: "#00d084",
          red: "#ef4444",
        },
      },
      borderRadius: {
        delicate: "0.625rem",
        well: "1rem",
      },
      minHeight: {
        control: "2.5rem",
        "control-sm": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
