/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary:{
          light: '#1d4ed8',
          dark: '#3b82f6',
        }
      },
    },
  plugins: [],
}
};
