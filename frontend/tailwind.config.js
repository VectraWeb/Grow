/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Sora", "sans-serif"],
      },
      colors: {
        ferre: {
          50: "#faf8f5",
          100: "#f0ece5",
          200: "#e4ded4",
          300: "#d4cbb9",
          400: "#c2b69a",
          500: "#a69a78",
          600: "#8f8260",
          700: "#756a4e",
          800: "#5d5440",
          900: "#4a4334",
        },
        steel: {
          50: "#faf8f5",
          100: "#f5f2ed",
          200: "#e2e4e0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        concrete: {
          50: "#f8f8f6",
          100: "#efeeea",
          200: "#dddbd3",
          300: "#c7c3b7",
          400: "#aba596",
          500: "#968e7c",
          600: "#877e6e",
          700: "#70685c",
          800: "#5d574d",
          900: "#4e4a42",
        },
        safety: {
          yellow: "#f59e0b",
          orange: "#f97316",
          red: "#ef4444",
        },
      },
      boxShadow: {
        "ferre": "0 1px 3px rgba(166, 154, 120, 0.3)",
        "ferre-lg": "0 4px 12px rgba(166, 154, 120, 0.4)",
        "steel": "0 1px 2px rgba(0, 0, 0, 0.04)",
        "steel-lg": "0 4px 12px rgba(0, 0, 0, 0.06)",
        "card": "0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
