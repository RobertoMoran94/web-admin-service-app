/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          500: '#4f63d2',
          600: '#3d4fc4',
          700: '#2f3daa',
        },
      },
    },
  },
  plugins: [],
}

