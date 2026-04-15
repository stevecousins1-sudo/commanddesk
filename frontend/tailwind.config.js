/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        'bg-base': '#07090f',
        'bg-surface': '#0c1018',
        'bg-elevated': '#101622',
        'bg-card': '#141c2b',
        'border': '#1b2840',
        'border-light': '#243558',
        'blue': '#4a90d9',
        'blue-bright': '#60a5fa',
        'amber': '#f59e0b',
        'green': '#34d399',
        'red': '#f87171',
        'cyan': '#22d3ee',
        'text-1': '#dce6f5',
        'text-2': '#7a92b4',
        'text-3': '#3d5478',
      },
    },
  },
  plugins: [],
}
