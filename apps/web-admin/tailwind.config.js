/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Tokens
        app: 'var(--bg-app)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        'accent-gold': 'var(--accent-gold)',
        'accent-blue': 'var(--accent-blue)',
        'surface-glass': 'var(--surface-glass)',
        'surface-glass-border': 'var(--surface-glass-border)',
        'surface-hero': 'var(--surface-hero)',
      }
    },
  },
  plugins: [],
}
