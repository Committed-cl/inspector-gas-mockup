import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F3D5C',
          soft: '#E6EEF4',
          dark: '#0A2C43',
        },
        accent: {
          DEFAULT: '#E25822',
          dark: '#B8461A',
        },
        ok: '#22C55E',
        warn: '#F59E0B',
        danger: '#DC2626',
        ink: '#1F2937',
        muted: '#6B7280',
        hairline: '#E5E7EB',
        base: '#FAFAFA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        phone: '0 24px 48px -16px rgba(15, 61, 92, 0.25), 0 8px 24px -8px rgba(15, 61, 92, 0.15)',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.85' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'mic-pulse': 'pulse 1.8s ease-in-out infinite',
        pop: 'pop 0.35s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
