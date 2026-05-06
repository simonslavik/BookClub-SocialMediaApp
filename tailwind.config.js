/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './frontend/src/**/*.{js,jsx,ts,tsx}',
    './frontend/public/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Outfit', 'sans-serif'],
        'system': ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'outfit': ['Outfit', 'sans-serif'],
        'serif': ['Lora', 'Georgia', 'serif'],
        'display': ['Playfair Display', 'serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        parchment: {
          DEFAULT: '#ece4d8',
          light: '#f2ece2',
          dark: '#e2d8ca',
        },
        warmgray: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#e8e4de',
          300: '#d5cec4',
          400: '#b5ab9c',
          500: '#958a78',
          600: '#7a6f5e',
          700: '#625849',
          800: '#4a4237',
          900: '#352f27',
        },
      },
    },
  },
  plugins: [],
}

