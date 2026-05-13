/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F1E8",
        panel: "#FAF7F2",
        surface: "#EFE8DB",
        accent: "#DD6B57",
        ink: "#2B2B2B",
        muted: "#6F665C",
      },
      boxShadow: {
        halo: "0 14px 40px rgba(109, 91, 68, 0.08), 0 1px 0 rgba(255,255,255,0.65)",
        glow: "0 12px 24px rgba(221, 107, 87, 0.16)",
      },
      borderColor: {
        soft: "rgba(43, 43, 43, 0.08)",
      },
      backgroundImage: {
        "app-grid":
          "radial-gradient(circle at top left, rgba(232, 208, 182, 0.62), transparent 26%), radial-gradient(circle at top right, rgba(250, 247, 242, 0.98), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.56), rgba(250,247,242,0.9))",
      },
      fontFamily: {
        sans: ['"Manrope"', '"Segoe UI"', "sans-serif"],
        serif: ['"Newsreader"', "serif"],
      },
    },
  },
  plugins: [],
};
