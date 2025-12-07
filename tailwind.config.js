/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#007FA3',
          green: '#8EC63F',
        },
        brand: {
          aqua: '#00A8C9',
          gray: '#F2F4F7',
          purple: '#6E4AB6',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
