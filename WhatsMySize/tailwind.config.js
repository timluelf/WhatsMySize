/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDF9',
          100: '#FBF8F3',
          200: '#F5F0E8',
          300: '#E8E0D4',
          400: '#D4C9B8',
        },
        sage: {
          DEFAULT: '#2D5A3D',
          light: '#E8F0EB',
          dark: '#1a3a28',
        },
        blush: {
          50: '#FFF5F7',
          100: '#FFE8EE',
          200: '#FFD1DD',
          300: '#FFB3C6',
          400: '#E8A0BF',
          500: '#D4789C',
          600: '#B5567A',
        },
        warm: {
          DEFAULT: '#D4A574',
          light: '#F0DCC8',
          dark: '#A67B50',
        },
        text: {
          DEFAULT: '#1A1A1A',
          secondary: '#6B6560',
          muted: '#9B9590',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
