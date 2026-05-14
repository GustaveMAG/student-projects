/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:      '#0D0D1A',
        surface:   '#16162A',
        'surface-2': '#1E1E35',
        'surface-3': '#252540',
        border:    '#2D2D4A',
        'border-2': '#3D3D5C',
        primary: { DEFAULT: '#3D1A6E', light: '#5A2A9E' },
        accent:  { DEFAULT: '#7C3AED', hover: '#6D28D9', soft: 'rgba(124,58,237,0.15)' },
        orange:  { DEFAULT: '#FF6B35', hover: '#FF5520', soft: 'rgba(255,107,53,0.15)' },
        ink:     { DEFAULT: '#F0EEFF', muted: '#9990BB', faint: '#6B648A' },
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      backgroundImage: {
        'gradient-hero':   'linear-gradient(135deg, #3D1A6E 0%, #1A0D3D 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FF6B35 0%, #FF3D71 100%)',
        'gradient-violet': 'linear-gradient(135deg, #7C3AED 0%, #3D1A6E 100%)',
        'gradient-btn':    'linear-gradient(135deg, #7C3AED 0%, #FF6B35 100%)',
        'gradient-card':   'linear-gradient(135deg, #1E1E35 0%, #16162A 100%)',
      },
      boxShadow: {
        'glow-violet': '0 0 40px rgba(124,58,237,0.2)',
        'glow-orange': '0 0 40px rgba(255,107,53,0.15)',
        'glow-sm':     '0 0 20px rgba(124,58,237,0.15)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
      },
      keyframes: {
        pulse_slow: {
          '0%, 100%': { opacity: '0.06' },
          '50%':      { opacity: '0.12' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse_slow 4s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
