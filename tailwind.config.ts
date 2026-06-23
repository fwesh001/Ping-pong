import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-cyan": {
          DEFAULT: "#00CFFF",
          600: "#00B8E6",
        },
        "brand-purple": {
          DEFAULT: "#9B4DCC",
          600: "#7F3FB0",
        },
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out forwards",
        "radar-ping": "radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        radarPing: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addBase, theme }) {
      addBase({
        "body": {
          backgroundColor: theme("colors.slate.900"),
          color: theme("colors.slate.100"),
        },
      });
    }),
  ],
};

export default config;
