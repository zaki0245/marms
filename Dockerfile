# ============================================================
# Dockerfile — MARMS (multi-stage, non-root, HEALTHCHECK)
# ============================================================
# [FUNGSI] Membangun & menjalankan aplikasi MARMS dalam satu container.
# [ALASAN] Multi-stage membuat image akhir kecil & aman: stage build
#          dipisah dari stage runtime sehingga dependency build tidak ikut.

# ---------- Stage 1: build frontend (React + Vite) ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
# [FUNGSI] Salin manifest dependency client lalu install.
# [ALASAN] Memisahkan copy manifest agar layer npm install bisa di-cache.
COPY client/package*.json ./
RUN npm ci
# [FUNGSI] Salin seluruh kode client lalu build produksi.
COPY client/ ./
RUN npm run build

# ---------- Stage 2: build backend (TypeScript) ----------
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY src ./src
# [FUNGSI] Compile TypeScript menjadi JavaScript.
# [ALASAN] Hasil compile (dist/) yang akan dijalankan di runtime.
RUN npx prisma generate && npm run build

# ---------- Stage 3: runtime (non-root) ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# [FUNGSI] Buat user non-root agar container tidak jalan sebagai root.
# [ALASAN] Keamanan: jika aplikasi diretas, peretas tidak punya akses root.
RUN addgroup -S marms && adduser -S marms -G marms

# [FUNGSI] Salin dependency produksi dan hasil build.
# [ALASAN] Hanya bawa file yang benar-benar dibutuhkan saat runtime.
COPY --from=backend-build /app/package*.json ./
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/client/dist ./client/dist

# [FUNGSI] Buat folder uploads milik user non-root.
# [ALASAN] Agar aplikasi bisa menulis file dokumen pelamar.
RUN mkdir -p /app/uploads && chown -R marms:marms /app

USER marms
EXPOSE 3000

# [FUNGSI] Jalankan migrasi database lalu start server.
# [ALASAN] Migrasi dipastikan terpasang sebelum aplikasi menerima request.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]

# [FUNGSI] HEALTHCHECK: cek endpoint /health setiap 30 detik.
# [ALASAN] Docker Compose memakai ini untuk menandai container sehat/siap.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
