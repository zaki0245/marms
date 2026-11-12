-- [FUNGSI] Kolom mustChangePassword tidak dipakai lagi; password tidak wajib diganti saat login pertama.
ALTER TABLE "Admin" DROP COLUMN "mustChangePassword";
