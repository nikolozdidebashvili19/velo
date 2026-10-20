import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Eyedropped from frame 0001 so the canvas edge disappears into the page.
        void: "#010101",
        ink: "#0A0A0C",
        fg: "#F5F5F7",
        muted: "#86868B",
        subtle: "#6E6E73",
        spearmint: "#00C98D",
        mint: "#8BFFD1",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Height-aware so headlines never collide with the tin on short laptops.
        hero: ["clamp(3rem, min(7.2vw, 11vh), 6.5rem)", { lineHeight: "1", letterSpacing: "-0.035em" }],
        headline: ["clamp(2.25rem, min(4vw, 7vh), 4rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        lead: ["clamp(1.5rem, min(2.4vw, 4.4vh), 2.25rem)", { lineHeight: "1.18", letterSpacing: "-0.02em" }],
        intro: ["clamp(1.1875rem, 1.6vw, 1.5rem)", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.28, 0.11, 0.32, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
