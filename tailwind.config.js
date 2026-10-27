/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss,css}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          DEFAULT: '#E11D48'
        },
        clinical: {
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          dark: '#0F172A',
          primary: '#0284C7'
        }
      }
    },
  },
  plugins: [],
}
