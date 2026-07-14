import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#0F172A',
        accent: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#F8FAFC'
      }
    }
  },
  plugins: []
} satisfies Config;
