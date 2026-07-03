/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.5rem", lg: "2rem" },
    },
    extend: {
      colors: {
        // 深空底色
        void: {
          950: "#04060F",
          900: "#070B1A",
          800: "#0C1228",
          700: "#141B3A",
          600: "#1E2750",
        },
        // 雷达青
        radar: {
          50: "#E6FEFF",
          100: "#B0F7FF",
          300: "#5DECFF",
          400: "#1FD9FF",
          500: "#00E5FF",
          600: "#00B8D4",
          700: "#008BA3",
        },
        // 琥珀警示
        amber: {
          glow: "#FFB300",
        },
        // 危险红
        alert: {
          400: "#FF6B81",
          500: "#FF3D5A",
          600: "#D81F3C",
        },
        // 合规绿
        pass: {
          400: "#3DEE93",
          500: "#00E676",
          600: "#00B85E",
        },
      },
      fontFamily: {
        display: ['"Orbitron"', '"Noto Sans SC"', "sans-serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 229, 255, 0.35)",
        "glow-sm": "0 0 12px rgba(0, 229, 255, 0.25)",
        "glow-amber": "0 0 24px rgba(255, 179, 0, 0.35)",
        "glow-alert": "0 0 24px rgba(255, 61, 90, 0.4)",
        "glow-pass": "0 0 24px rgba(0, 230, 118, 0.35)",
        "inset-line": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(31,217,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(31,217,255,0.06) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(circle at 50% 0%, rgba(0,229,255,0.12), transparent 60%)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      keyframes: {
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(2000%)" },
        },
        "blink-cursor": {
          "0%,49%": { opacity: "1" },
          "50%,100%": { opacity: "0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "float-soft": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "flicker": {
          "0%,19%,21%,23%,25%,54%,56%,100%": { opacity: "1" },
          "20%,22%,24%,55%": { opacity: "0.4" },
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 4s linear infinite",
        "scan-line": "scan-line 2.4s linear infinite",
        "blink-cursor": "blink-cursor 1s step-end infinite",
        "pulse-ring": "pulse-ring 3s ease-out infinite",
        "float-soft": "float-soft 6s ease-in-out infinite",
        "flicker": "flicker 4s linear infinite",
      },
    },
  },
  plugins: [],
};
