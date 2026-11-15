import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#0F0E0C',
        surface: '#181714',
        'surface-raised': '#211F1B',
        border: '#2E2B26',
        primary: '#FF6A2B',
        'primary-hover': '#FF8250',
        accent: '#F5C84B',
        highlight: '#7DD3C0',
        text: '#F4EFE6',
        'text-muted': '#A8A094',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF6A2B 0%, #FF9A3C 55%, #F5C84B 100%)',
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
