/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#0055FF',
          700: '#0044cc',
        },
        secondary: {
          500: '#00C2CB',
          600: '#00a8b0',
        },
        neutral: {
          50: '#F5F7FA',
          800: '#4A5056',
          900: '#1A1D21',
        }
      }
    },
  },
  plugins: [],
}
