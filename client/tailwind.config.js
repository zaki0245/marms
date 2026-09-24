// client/tailwind.config.js
// [FUNGSI] Konfigurasi Tailwind, termasuk warna design system MARMS.
// [ALASAN] Warna ini dipakai konsisten di seluruh halaman (lihat DESIGN_SYSTEM.md).

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F2C4C',
        'navy-light': '#EAF0F7',
        surface: '#F5F6F8',
        positive: '#1E7A46',
        negative: '#B3261E',
      },
    },
  },
  plugins: [],
};
