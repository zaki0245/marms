// client/postcss.config.js
// [FUNGSI] Konfigurasi PostCSS untuk menjalankan Tailwind & Autoprefixer.
// [ALASAN] Tailwind v3 diproses lewat PostCSS saat build.

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
