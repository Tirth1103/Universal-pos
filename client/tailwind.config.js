/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary)',
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          hover: 'var(--brand-primary-hover)',
          'accent-hover': 'var(--brand-accent-hover)',
          text: 'var(--brand-primary-text)',
          'accent-text': 'var(--brand-accent-text)',
          'primary-10': 'var(--brand-primary-10)',
          'primary-20': 'var(--brand-primary-20)',
          'accent-15': 'var(--brand-accent-15)',
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        dark: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          850: '#144c29',
          900: '#14532d',
          925: '#0f3a21',
          950: '#09251a',
          975: '#061a11',
          990: '#04120b',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          warm: '#d4af37',
          light: '#f7e7a9',
          dark: '#a8801c',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
