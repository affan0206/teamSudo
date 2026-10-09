/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Official Core Brand Palette
        ghost: '#FFFAFF',
        canvas: '#FFFAFF',
        surface: '#FFFFFF',
        subtle: '#F6F4F8',
        carbon: '#1E1B18',
        imperial: {
          DEFAULT: '#0A2463',
          hover: '#071A4A',
          light: '#EEF2FA',
          subtle: '#F4F7FC',
          border: '#C5D3EE',
        },
        bluebell: {
          DEFAULT: '#3E92CC',
          hover: '#2E7BB3',
          light: '#EBF4FA',
          subtle: '#F3F8FC',
          border: '#B8D9F0',
        },
        magenta: {
          DEFAULT: '#D8315B',
          hover: '#B82349',
          light: '#FDF2F5',
          border: '#F5C6D3',
          text: '#B42046',
        },
        // Neutral Borders & Surfaces
        stone: {
          border: '#E5E2E7',
          strong: '#CFCBD4',
          muted: '#EFECE6',
        },
        // Typography Hierarchy anchored on Carbon Black (#1E1B18)
        ink: {
          primary: '#1E1B18',
          secondary: '#57534E',
          muted: '#78736E',
        },
        // Semantic Status Tokens
        status: {
          danger: {
            bg: '#FDF2F5',
            text: '#B42046',
            border: '#F5C6D3',
            dot: '#D8315B',
          },
          warning: {
            bg: '#FFFBEB',
            text: '#92400E',
            border: '#FDE68A',
            dot: '#D97706',
          },
          info: {
            bg: '#EBF4FA',
            text: '#0A2463',
            border: '#B8D9F0',
            dot: '#3E92CC',
          },
          success: {
            bg: '#EBF4FA',
            text: '#0A2463',
            border: '#B8D9F0',
            dot: '#3E92CC',
          },
          neutral: {
            bg: '#F6F4F8',
            text: '#57534E',
            border: '#DDD9E0',
            dot: '#78736E',
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
        card: '0 1px 2px 0 rgba(10, 36, 99, 0.04)',
        elevated:
          '0 8px 24px -4px rgba(10, 36, 99, 0.10), 0 2px 6px -1px rgba(30, 27, 24, 0.05)',
      },
    },
  },
  plugins: [],
};
