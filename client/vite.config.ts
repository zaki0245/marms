// client/vite.config.ts
// [FUNGSI] Konfigurasi Vite (build tool frontend).
// [ALASAN] Menentukan plugin React & proxy API ke backend saat development.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // [FUNGSI] Teruskan request /api ke backend di port 3000.
    // [ALASAN] Saat dev, frontend & backend beda port; proxy menyatukan jalur API.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
