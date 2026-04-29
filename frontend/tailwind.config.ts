import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./components/**/*.{vue,js,ts}",
    "./composables/**/*.{js,ts}",
    "./pages/**/*.vue"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#fffaf4",
        ink: "#17212b",
        muted: "#5b6574",
        accent: {
          DEFAULT: "#e3653a",
          deep: "#b2441d",
          soft: "#fff1ea"
        },
        clan: {
          teal: "#1f7a84"
        }
      },
      boxShadow: {
        soft: "0 22px 60px rgba(74, 60, 46, 0.12)"
      },
      borderRadius: {
        panel: "24px"
      }
    }
  }
} satisfies Config;

