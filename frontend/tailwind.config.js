/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mocha: {
          950: '#1c130d',
          900: '#2b1e16',
          850: '#38271d',
          800: '#463124',
          700: '#583e2d',
          DEFAULT: '#6F4E37',
          600: '#7e5a40',
          500: '#916b4f',
          400: '#a78267',
          300: '#c0a18a',
          200: '#d9c4b3',
          100: '#ede2d9',
        },
        silver: {
          DEFAULT: '#E5E4E2',
          light: '#F3F2F1',
          muted: '#C4C3C1',
          dark: '#9E9D9B',
          deep: '#737271',
        },
        lavender: {
          DEFAULT: '#E6E0F0',
          light: '#F3F0FA',
          muted: '#C8BEDB',
          dark: '#9F91B8',
          deep: '#796B94',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'mocha-subtle': '0 4px 20px -2px rgba(28, 19, 13, 0.6), 0 0 0 1px rgba(229, 228, 226, 0.12)',
        'mocha-card': '0 8px 30px rgba(28, 19, 13, 0.5), 0 0 0 1px rgba(229, 228, 226, 0.15)',
        'lavender-glow': '0 0 25px -5px rgba(230, 224, 240, 0.25)',
      }
    },
  },
  plugins: [],
}

