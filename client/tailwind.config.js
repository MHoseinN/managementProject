/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-green': '#1b4d3e',
        'light-green': '#2d7a5c',
        'dark-bg': '#0f1419',
        'card-bg': '#1a1f2a',
      }
    },
  },
  plugins: [],
}
