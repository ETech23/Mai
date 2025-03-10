module.exports = {
  darkMode: 'class', // Enable dark mode with class-based toggling
  content: ["./*.{html,js}"], // Ensure Tailwind scans your HTML and JS files
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#121212',
          100: '#1a1a1a',
          200: '#282828',
          300: '#3d3d3d',
        },
        gold: {
          DEFAULT: '#FFD700',
          100: '#FFF0A0',
          200: '#B8860B',
        },
        silver: {
          DEFAULT: '#C0C0C0',
          100: '#E6E6E6',
          200: '#A9A9A9',
        },
        copper: {
          DEFAULT: '#B87333',
          100: '#CD7F32',
          200: '#A55D35',
        },
        mining: {
          green: '#4caf50',
          accent: '#2C3E30',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'floating 3s ease-in-out infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [], // Add any Tailwind plugins here if needed
};
