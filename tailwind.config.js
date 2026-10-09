/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Exact Approved 5-Color Palette
        apricot: '#f9dbbd',
        cotton: '#ffa5ab',
        blush: '#da627d',
        berry: '#a53860',
        bordeaux: '#450920',

        // Semantic Theme-Aware Tokens (RGB channels for full Tailwind opacity support)
        ghost: 'rgb(var(--c-canvas) / <alpha-value>)',
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        subtle: 'rgb(var(--c-subtle) / <alpha-value>)',
        carbon: 'rgb(var(--c-text-primary) / <alpha-value>)',

        sidebar: {
          DEFAULT: 'rgb(var(--c-sidebar-bg) / <alpha-value>)',
          elevated: 'rgb(var(--c-sidebar-elevated) / <alpha-value>)',
          text: 'rgb(var(--c-sidebar-text) / <alpha-value>)',
          muted: 'rgb(var(--c-sidebar-muted) / <alpha-value>)',
          border: 'rgb(var(--c-sidebar-border) / <alpha-value>)',
        },

        imperial: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
          hover: 'rgb(var(--c-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--c-primary-light) / <alpha-value>)',
          subtle: 'rgb(var(--c-primary-subtle) / <alpha-value>)',
          border: 'rgb(var(--c-primary-border) / <alpha-value>)',
        },

        bluebell: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          hover: 'rgb(var(--c-accent-hover) / <alpha-value>)',
          light: 'rgb(var(--c-accent-light) / <alpha-value>)',
          subtle: 'rgb(var(--c-accent-subtle) / <alpha-value>)',
          border: 'rgb(var(--c-accent-border) / <alpha-value>)',
        },

        magenta: {
          DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)',
          hover: 'rgb(var(--c-danger-hover) / <alpha-value>)',
          light: 'rgb(var(--c-danger-bg) / <alpha-value>)',
          border: 'rgb(var(--c-danger-border) / <alpha-value>)',
          text: 'rgb(var(--c-danger-text) / <alpha-value>)',
        },

        stone: {
          border: 'rgb(var(--c-border) / <alpha-value>)',
          strong: 'rgb(var(--c-border-strong) / <alpha-value>)',
          muted: 'rgb(var(--c-subtle) / <alpha-value>)',
        },

        ink: {
          primary: 'rgb(var(--c-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--c-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--c-text-muted) / <alpha-value>)',
        },

        status: {
          danger: {
            bg: 'rgb(var(--c-danger-bg) / <alpha-value>)',
            text: 'rgb(var(--c-danger-text) / <alpha-value>)',
            border: 'rgb(var(--c-danger-border) / <alpha-value>)',
            dot: 'rgb(var(--c-danger-dot) / <alpha-value>)',
          },
          warning: {
            bg: 'rgb(var(--c-warning-bg) / <alpha-value>)',
            text: 'rgb(var(--c-warning-text) / <alpha-value>)',
            border: 'rgb(var(--c-warning-border) / <alpha-value>)',
            dot: 'rgb(var(--c-warning-dot) / <alpha-value>)',
          },
          info: {
            bg: 'rgb(var(--c-info-bg) / <alpha-value>)',
            text: 'rgb(var(--c-info-text) / <alpha-value>)',
            border: 'rgb(var(--c-info-border) / <alpha-value>)',
            dot: 'rgb(var(--c-info-dot) / <alpha-value>)',
          },
          success: {
            bg: 'rgb(var(--c-info-bg) / <alpha-value>)',
            text: 'rgb(var(--c-info-text) / <alpha-value>)',
            border: 'rgb(var(--c-info-border) / <alpha-value>)',
            dot: 'rgb(var(--c-info-dot) / <alpha-value>)',
          },
          neutral: {
            bg: 'rgb(var(--c-neutral-bg) / <alpha-value>)',
            text: 'rgb(var(--c-neutral-text) / <alpha-value>)',
            border: 'rgb(var(--c-neutral-border) / <alpha-value>)',
            dot: 'rgb(var(--c-neutral-dot) / <alpha-value>)',
          },
        },
      },
      fontFamily: {
        display: [
          '"Plus Jakarta Sans"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
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
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        monolith: 'var(--shadow-monolith)',
      },
    },
  },
  plugins: [],
};
