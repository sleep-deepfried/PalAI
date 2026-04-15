import type { Config } from 'tailwindcss';

const config: Config = {
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
        olive: {
          DEFAULT: '#576238',
          50: '#f4f5f0',
          100: '#e6e8dd',
          200: '#cdd2bc',
          300: '#adb494',
          400: '#8d9570',
          500: '#576238',
          600: '#4a5330',
          700: '#3d4428',
          800: '#333822',
          900: '#2a2e1c',
        },
        sunbeam: {
          DEFAULT: '#FFD95E',
          50: '#fffbeb',
          100: '#fff4c6',
          200: '#ffe888',
          300: '#FFD95E',
          400: '#ffc72c',
          500: '#f9a307',
          600: '#dd7b02',
          700: '#b75606',
          800: '#94420c',
          900: '#7a370d',
        },
        ivory: {
          DEFAULT: '#F0EADC',
          50: '#fdfcf9',
          100: '#F0EADC',
          200: '#e5dcc8',
          300: '#d4c7a9',
          400: '#c2ae88',
          500: '#b49a6f',
          600: '#a78660',
          700: '#8b6d51',
          800: '#725a46',
          900: '#5e4a3b',
        },
      },
    },
  },
  plugins: [],
};
export default config;
