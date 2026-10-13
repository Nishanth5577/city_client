/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ═══ IVORY — Premium Light Construction ERP ═══ */
        canvas: '#FAFAF8',
        card: '#FFFFFF',
        'card-elevated': '#F5F5F0',
        sidebar: {
          bg: '#FFFFFF',
          hover: '#F5F5F0',
          active: '#EEF2F7',
          border: '#E8E5E0',
        },
        primary: {
          50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4',
          400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E',
          800: '#115E59', 900: '#134E4A', 950: '#042F2E',
        },
        surface: {
          50: '#FAFAF8', 100: '#F5F5F0', 200: '#E8E5E0', 300: '#D6D3CD',
          400: '#A8A49C', 500: '#78756E', 600: '#57534E', 700: '#44403C',
          800: '#292524', 900: '#1C1917', 950: '#0C0A09',
        },
        accent: {
          DEFAULT: '#0D9488',
          50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4',
          400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display': ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.045em', fontWeight: '800' }],
        'heading-1': ['1.625rem', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading-2': ['1.25rem', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'label': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.04em', fontWeight: '500' }],
      },
      spacing: { '18': '4.5rem', '68': '17rem' },
      borderRadius: {
        'lg': '10px', 'xl': '14px', '2xl': '18px', '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(28,25,23,0.04), 0 1px 2px rgba(28,25,23,0.03)',
        'card-hover': '0 8px 28px rgba(28,25,23,0.07), 0 2px 6px rgba(28,25,23,0.03)',
        'elevated': '0 12px 40px rgba(28,25,23,0.08), 0 4px 12px rgba(28,25,23,0.04)',
        'dropdown': '0 12px 40px rgba(28,25,23,0.08), 0 4px 12px rgba(28,25,23,0.04)',
        'glow': '0 0 24px rgba(13,148,136,0.12)',
        'glow-sm': '0 0 12px rgba(13,148,136,0.08)',
        'glow-lg': '0 0 48px rgba(13,148,136,0.15)',
        'glow-accent': '0 0 24px rgba(13,148,136,0.10)',
        'inner': 'inset 0 1px 2px rgba(28,25,23,0.05)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.9)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.32,0.72,0,1)',
        'fade-in-up': 'fadeInUp 0.45s cubic-bezier(0.32,0.72,0,1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.32,0.72,0,1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.32,0.72,0,1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.32,0.72,0,1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.32,0.72,0,1)',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeInUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'none' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'none' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'none' } },
        slideInLeft: { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'none' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pulseGlow: { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 0.8 } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
};
