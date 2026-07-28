/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vaidi brand palette — grounded in Dangs/tribal Gujarat
        terracotta: {
          50:  '#fdf3ee',
          100: '#fbe4d5',
          200: '#f6c5a8',
          300: '#f09e73',
          400: '#e8763c',
          500: '#c85c1e',
          600: '#a84818',
          700: '#8B4513',  // primary brand
          800: '#6b3410',
          900: '#4a230b',
        },
        forest: {
          50:  '#f0f5e8',
          100: '#daecc4',
          200: '#b4d98a',
          300: '#87c04e',
          400: '#5ea32e',
          500: '#3d7a1a',
          600: '#2D5016',  // secondary brand
          700: '#234010',
          800: '#19300b',
          900: '#0f1f07',
        },
        amber: {
          50:  '#fdf7ec',
          100: '#f9ead0',
          200: '#f3d49f',
          300: '#ebb76a',
          400: '#e19a3a',
          500: '#C17B3A',  // accent
          600: '#9c5f24',
          700: '#7a4819',
          800: '#563211',
          900: '#311d09',
        },
        parchment: '#FDF6ED',
        sand:      '#F0E6D3',
        umber:     '#1A1208',
        muted:     '#6B5B47',
        border:    '#DDD0BE',
        'urgent-red':   '#C0392B',
        'attention-amber': '#D4820A',
        'routine-green':   '#2D5016',
      },
      fontFamily: {
        serif:  ['"Noto Serif"', '"Tiro Devanagari"', 'Georgia', 'serif'],
        sans:   ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        body:   ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.5' }],
        'sm':   ['0.875rem', { lineHeight: '1.6' }],
        'base': ['1rem',     { lineHeight: '1.65' }],
        'lg':   ['1.125rem', { lineHeight: '1.6' }],
        'xl':   ['1.25rem',  { lineHeight: '1.5' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.4' }],
        '3xl':  ['1.875rem', { lineHeight: '1.3' }],
        '4xl':  ['2.25rem',  { lineHeight: '1.2' }],
      },
      borderRadius: {
        'sm': '6px',
        DEFAULT: '10px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 4px rgba(26,18,8,0.08), 0 0 0 1px rgba(26,18,8,0.04)',
        'card-hover': '0 4px 12px rgba(26,18,8,0.12), 0 0 0 1px rgba(26,18,8,0.06)',
        'input': '0 0 0 2px rgba(139,69,19,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
