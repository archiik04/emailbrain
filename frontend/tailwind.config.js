/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0A0A0A",
        panel: "#111111",
        accent: "#7C5CFF",
      },
      boxShadow: {
        halo: "0 0 0 1px rgba(255,255,255,0.06), 0 18px 48px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(124,92,255,0.2), 0 0 24px rgba(124,92,255,0.18)",
      },
      borderColor: {
        soft: "rgba(255,255,255,0.08)",
      },
      backgroundImage: {
        "app-grid":
          "radial-gradient(circle at top left, rgba(124, 92, 255, 0.16), transparent 28%), radial-gradient(circle at top right, rgba(109, 149, 255, 0.1), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 28%)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
