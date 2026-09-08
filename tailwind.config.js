/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './context/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#7c3aed',
          dark:    '#6d28d9',
          light:   '#a855f7',
        },
      },
      animation: {
        'bar-1':     'bar 1.2s ease-in-out 0.00s infinite',
        'bar-2':     'bar 1.2s ease-in-out 0.15s infinite',
        'bar-3':     'bar 1.2s ease-in-out 0.30s infinite',
        'bar-4':     'bar 1.2s ease-in-out 0.45s infinite',
        'bar-5':     'bar 1.2s ease-in-out 0.60s infinite',
        'fade-in':   'fadeIn 0.2s ease',
        'slide-up':  'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        bar: {
          '0%,100%': { transform: 'scaleY(1)' },
          '50%':     { transform: 'scaleY(1.9)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(12px)' },
          to:   { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
