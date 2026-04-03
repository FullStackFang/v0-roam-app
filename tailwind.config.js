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
        bg: "#F5F3EF",
        surface: "#FFFFFF",
        "surface-glass": "rgba(255,255,255,0.82)",
        border: "rgba(0,0,0,0.06)",
        text: "#1A1B1E",
        muted: "rgba(26,27,30,0.40)",
        accent: "#F04D2C",
        warm: "#E08A3C",
        cool: "#4A9E9E",
        green: "#38A07A",
        "heat-a": "#E84428",
        "heat-b": "#F05030",
        "heat-c": "#E88030",
        "heat-d": "#D4922A",
        "heat-e": "#4DAAAC",
        "heat-f": "#5A9EB0",
      },
      fontFamily: {
        serif: ["PlayfairDisplay_500Medium", "serif"],
        sans: ["DMSans_400Regular", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "20px",
        xl: "28px",
      },
    },
  },
  plugins: [],
};
