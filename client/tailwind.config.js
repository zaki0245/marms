// client/tailwind.config.js
// [FUNGSI] Konfigurasi Tailwind: palet warna + tipografi design system MARMS.
// [ALASAN] Satu sumber kebenaran warna/font agar semua halaman seragam.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F2C4C',
        'navy-light': '#EAF0F7',
        surface: '#F8F8F8',
        positive: '#2E7D32',
        negative: '#C4242A',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
