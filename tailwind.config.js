/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#FFF8F0",
        surface: "#FFFFFF",
        "surface-glass": "rgba(255,248,240,0.90)",
        border: "rgba(0,0,0,0.08)",
        text: "#1A1B1E",
        muted: "rgba(26,27,30,0.48)",
        accent: "#FF5733",
        warm: "#F59E0B",
        cool: "#06B6D4",
        green: "#10B981",
        "heat-a": "#FF4D30",
        "heat-b": "#FF6B3D",
        "heat-c": "#FFAA33",
        "heat-d": "#F5B731",
        "heat-e": "#06B6D4",
        "heat-f": "#0EA5E9",
      },
      fontFamily: {
        heading: ["Nunito_700Bold"],
        sans: ["NunitoSans_400Regular", "sans-serif"],
      },
      borderRadius: {
        sm: "12px",
        md: "18px",
        lg: "24px",
        xl: "32px",
      },
    },
  },
  plugins: [],
};
