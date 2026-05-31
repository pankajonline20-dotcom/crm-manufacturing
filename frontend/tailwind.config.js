/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#E8500A', light: '#FEE8DC', dark: '#B83D07' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'count': 'countUp 600ms ease-out both',
        'fade-up': 'fadeInUp 250ms ease both',
        'slide-right': 'slideInRight 300ms cubic-bezier(0.34,1.56,0.64,1) both',
      },
    },
  },
  plugins: [],
}
