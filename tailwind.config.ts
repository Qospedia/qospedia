import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#1e3a5f',
          foreground: '#fefae0',
        },
        accent: {
          DEFAULT: '#e07a5f',
          foreground: '#fefae0',
        },
        card: {
          DEFAULT: '#fefae0',
          foreground: '#1e3a5f',
        },
        muted: {
          DEFAULT: '#f5f0dc',
          foreground: '#6b7280',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#fefae0',
        },
        border: '#e5dfd0',
        input: '#e5dfd0',
        ring: '#e07a5f',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-source)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-in': 'slide-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;