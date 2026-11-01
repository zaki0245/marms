// client/tailwind.config.js
// [FUNGSI] Konfigurasi Tailwind: palet warna + tipografi design system MARMS.
// [ALASAN] Warna netral (gray/surface/card) dan aksen (navy/positive/negative) memakai
//          CSS variable agar bisa switch terang/gelap lewat class `.dark` di <html>.

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // [FUNGSI] Aksen memakai channel RGB + <alpha-value> agar opacity (/10, /90) tetap jalan.
        navy: 'rgb(var(--navy) / <alpha-value>)',
        'navy-light': '#EAF0F7',
        surface: 'var(--surface)',
        card: 'var(--card)',
        positive: 'rgb(var(--positive) / <alpha-value>)',
        negative: 'rgb(var(--negative) / <alpha-value>)',
        gray: {
          50: 'var(--gray-50)',
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
          950: 'var(--gray-950)',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
