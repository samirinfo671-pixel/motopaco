import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F9FAFB',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          primary: '#E63012',
          secondary: '#111827',
          text: '#111827',
          muted: '#4B5563',
        },
      },
      fontFamily: {
        sans: ['"Montserrat"', 'sans-serif'],
        display: ['"Montserrat"', 'sans-serif'],
        body: ['"Montserrat"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        montserrat: ['"Montserrat"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
