const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [join(__dirname, './index.html'), join(__dirname, './src/**/*.{js,ts,jsx,tsx}')],
  theme: {
    extend: {
      colors: {
        // Dark theme colors matching dismissible.io
        dark: {
          900: '#0a0e1a', // Darkest background
          800: '#121829', // Page background
          700: '#1a2332', // Card background
          600: '#242d3f', // Elevated elements
          500: '#2e394d', // Interactive elements
          400: '#3d4a61', // Hover states
          300: '#4d5b75', // Active/lighter hover states
        },
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // Main cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          cyan: '#06b6d4',
          teal: '#14b8a6',
        },
      },
    },
  },
  plugins: [],
};
