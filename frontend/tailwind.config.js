/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:    '#0F0F0F',
        surface: '#1A1A1A',
        'surface-2': '#222222',
        border:  '#2A2A2A',
        'border-2': '#333333',
        primary: { DEFAULT: '#F5F5F5', muted: '#888888' },
        accent:  { DEFAULT: '#7C3AED', hover: '#6D28D9', soft: '#1E1A2E' },
        success: '#22C55E',
        warning: '#F59E0B',
        danger:  '#EF4444',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      fontSize: {
        'label': ['11px', { letterSpacing: '0.08em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};
