/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d1117',
          1: '#161b22',
          2: '#21262d',
          3: '#30363d',
        },
        accent: { DEFAULT: '#58a6ff', dark: '#1f6feb' },
        success: '#3fb950',
        danger: '#f85149',
        warning: '#d29922',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
