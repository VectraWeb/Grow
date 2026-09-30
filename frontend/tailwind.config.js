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
          50: "#f4f9f2",
          100: "#e5f3e2",
          200: "#c7e6c1",
          300: "#9ad491",
          400: "#0f9717", // Verde Grow
          500: "#0c8213",
          600: "#096d0f",
          700: "#07570b",
          800: "#064609",
          900: "#043507",
        },
        grow: {
          green: {
            50: "#f4f9f2",
            100: "#e5f3e2",
            200: "#c7e6c1",
            300: "#9ad491",
            400: "#22c55e",
            500: "#0f9717",
            600: "#0c8213",
            700: "#07570b",
            800: "#064609",
            900: "#043507",
          },
          earth: {
            50: "#fbf6f0",
            100: "#f5ebdd",
            200: "#ebd7bc",
            300: "#dcbe93",
            400: "#c49a62",
            500: "#874e04", // Tierra Brown
            600: "#754103",
            700: "#5c3302",
            800: "#442502",
            900: "#2d1801",
          },
          gold: {
            50: "#fefce8",
            100: "#fef9c3",
            200: "#fef08a",
            300: "#fde047",
            400: "#facc15",
            500: "#e0b721", // Grow Golden Mustard
            600: "#ca8a04",
            700: "#a16207",
            800: "#854d0e",
            900: "#713f12",
          },
        },
        steel: {
          50: "#f8faf7",
          100: "#f1f5ef",
          200: "#e2e8e0",
          300: "#cbd5cb",
          400: "#8e9f8e",
          500: "#607460",
          600: "#445544",
          700: "#2f3e2f",
          800: "#1e291e",
          900: "#111a11",
          950: "#080e08",
        },
        concrete: {
          50: "#fbfdf9",
          100: "#f3f7f1",
          200: "#e4ece1",
          300: "#d1decb",
          400: "#b5c5ad",
          500: "#96a78e",
          600: "#798c72",
          700: "#5d6d56",
          800: "#465241",
          900: "#323c2f",
        },
        safety: {
          yellow: "#e0b721",
          orange: "#f97316",
          red: "#ef4444",
        },
      },
      boxShadow: {
        "ferre": "0 2px 8px rgba(15, 151, 23, 0.25)",
        "ferre-lg": "0 8px 24px rgba(15, 151, 23, 0.35)",
        "grow-gold": "0 4px 14px rgba(224, 183, 33, 0.35)",
        "grow-earth": "0 4px 14px rgba(135, 78, 4, 0.25)",
        "steel": "0 1px 2px rgba(0, 0, 0, 0.04)",
        "steel-lg": "0 4px 12px rgba(0, 0, 0, 0.06)",
        "card": "0 1px 3px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 20px rgba(15, 151, 23, 0.12)",
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
