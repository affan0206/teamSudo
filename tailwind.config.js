/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F2',
        surface: '#FFFFFF',
        subtle: '#F2F3EE',
        stone: {
          border: '#E6E8E2',
          strong: '#D3D6CE',
          muted: '#F0F1EC',
        },
        ink: {
          primary: '#202522',
          secondary: '#5A625C',
          muted: '#747A74',
        },
        forest: {
          DEFAULT: '#285C46',
          hover: '#1F4937',
          light: '#EBF2EE',
          subtle: '#F4F8F5',
          border: '#C5D8CE',
        },
        status: {
          danger: {
            bg: '#FDF3F2',
            text: '#9E2A2B',
            border: '#F3D0CE',
            dot: '#C93B3B',
          },
          warning: {
            bg: '#FDF8EE',
            text: '#8C5811',
            border: '#F1DFBA',
            dot: '#C8811A',
          },
          success: {
            bg: '#F1F8F4',
            text: '#1E5E3A',
            border: '#C4E2D0',
            dot: '#287D4E',
          },
          neutral: {
            bg: '#F4F5F3',
            text: '#4A504B',
            border: '#D8DBD6',
            dot: '#747A74',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(32, 37, 34, 0.04)',
        elevated: '0 8px 24px -4px rgba(32, 37, 34, 0.08), 0 2px 6px -1px rgba(32, 37, 34, 0.04)',
      },
    },
  },
  plugins: [],
};
