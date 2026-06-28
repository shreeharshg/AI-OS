/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matrix-green': '#00FF41',
      },
      fontFamily: {
        'mono': ['"Courier New"', 'Courier', 'monospace'],
      }
    },
  },
  plugins: [],
}