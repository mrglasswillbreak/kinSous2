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
        background: "#FDFCFB",
        foreground: "#1A1A1A",
        primary: {
          DEFAULT: "#E67E22",
          50: "#FEF3E8",
          100: "#FDE7D1",
          200: "#FBCFA3",
          300: "#F9B776",
          400: "#F79E48",
          500: "#E67E22",
          600: "#C4691B",
          700: "#9E5416",
        },
        secondary: {
          DEFAULT: "#27AE60",
          50: "#E9F7EF",
          100: "#D4EFDF",
          200: "#A9DFBF",
          500: "#27AE60",
          600: "#219450",
          700: "#1A7A41",
        },
        cream: "#FDFCFB",
        charcoal: "#2C2C2C",
        muted: "#8E8E8E",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        primary: "0 4px 20px rgba(230,126,34,0.3)",
        secondary: "0 4px 20px rgba(39,174,96,0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
