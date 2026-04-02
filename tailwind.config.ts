import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--color-bg-base)',
        surface: 'var(--color-bg-surface)',
        elevated: 'var(--color-bg-elevated)',
        overlay: 'var(--color-bg-overlay)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-default': 'var(--color-border-default)',
        'border-strong': 'var(--color-border-strong)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-inverse': 'var(--color-text-inverse)',
        'accent-amber': 'var(--color-accent-amber)',
        'accent-amber-hover': 'var(--color-accent-amber-hover)',
        'accent-amber-muted': 'var(--color-accent-amber-muted)',
        'accent-blue': 'var(--color-accent-blue)',
        'accent-green': 'var(--color-accent-green)',
        'accent-red': 'var(--color-accent-red)',
        'accent-purple': 'var(--color-accent-purple)',
        'chart-1': 'var(--color-chart-1)',
        'chart-2': 'var(--color-chart-2)',
        'chart-3': 'var(--color-chart-3)',
        'chart-4': 'var(--color-chart-4)',
        'chart-5': 'var(--color-chart-5)',
      },
      fontFamily: {
        display: ['var(--font-fraunces)'],
        sans: ['var(--font-dm-sans)'],
        mono: ['var(--font-jetbrains-mono)'],
      },
    },
  },
  plugins: [],
}
export default config
