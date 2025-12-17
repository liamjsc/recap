/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NBA-inspired color palette
        'nba-blue': '#1d428a',
        'nba-red': '#c8102e',
      },
    },
  },
  plugins: [],
}
