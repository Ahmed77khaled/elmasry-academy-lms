/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Alexandria', 'sans-serif'],
        arabic: ['Alexandria', 'Cairo', 'sans-serif'],
        latin: ['Inter', 'sans-serif'],
      },
      colors: {
        obsidian: {
          950: '#050811',
          900: '#070B14',
          850: '#0B101D',
          800: '#0E1525',
          700: '#131C2E',
          600: '#192338',
          500: '#2D3C56',
          400: '#7D8FA8',
          300: '#98A8C0',
          200: '#CBD5E1',
          100: '#E2E8F0',
        },
        emerald: {
          brand: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
        azure: {
          brand: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
        },
        status: {
          paid: '#10B981',
          partial: '#F59E0B',
          unpaid: '#F43F5E',
          overpaid: '#8B5CF6',
          active: '#10B981',
          closed: '#F43F5E',
          upcoming: '#3B82F6',
          warning: '#F59E0B',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'spin-slow': 'spin-slow 1s linear infinite',
      },
    },
  },
  plugins: [],
};
