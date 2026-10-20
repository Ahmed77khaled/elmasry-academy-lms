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
          900: '#0B0F17',
          800: '#0F172A',
          700: '#161E2E',
          600: '#1E293B',
          500: '#334155',
          400: '#475569',
          300: '#64748B',
          200: '#94A3B8',
          100: '#CBD5E1',
        },
        emerald: {
          brand: '#10B981',
          light: '#6EE7B7',
          dark: '#059669',
        },
        azure: {
          brand: '#3B82F6',
          light: '#6366F1',
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
