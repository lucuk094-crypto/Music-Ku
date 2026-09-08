/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
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
      backdropBlur: { xs: '2px' },
      animation: {
        'bar-1': 'bar 1.2s ease-in-out 0.0s infinite',
        'bar-2': 'bar 1.2s ease-in-out 0.15s infinite',
        'bar-3': 'bar 1.2s ease-in-out 0.3s infinite',
        'bar-4': 'bar 1.2s ease-in-out 0.45s infinite',
        'bar-5': 'bar 1.2s ease-in-out 0.6s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-in': 'fadeIn 0.2s ease',
      },
      keyframes: {
        bar: {
          '0%,100%': { transform: 'scaleY(1)' },
          '50%':     { transform: 'scaleY(1.8)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
