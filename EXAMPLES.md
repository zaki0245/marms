# EXAMPLES.md — Contoh Kasus & Perhitungan

> **Penjelasan untuk Pemula:** Dokumen ini berisi contoh nyata perhitungan (misalnya gaji
> prorata) dan contoh alur kerja, supaya kita punya "jawaban benar" untuk dibandingkan
> saat mengetes aplikasi.
>
> **Kenapa Ini Penting:** Contoh yang sudah dihitung manual jadi patokan. Kalau aplikasi
> menghasilkan angka berbeda dari contoh ini, berarti ada bug yang harus dicari.

## 1. Contoh Payroll Gaji — Kapal SURYA SEGARA 3 (Mei 2026, 31 hari)
| Nama | Jabatan | Hari | Gaji Pokok | Gaji Prorata |
|---|---|---|---|---|
| Andi Ardi Said | Master | 31 | 10.500.000 | 10.500.000 |
| Ariyanto Agus S. | KKM | 4 | 9.000.000 | 1.161.290 |
| Kasmir | KKM | 27 | 9.000.000 | 7.838.710 |

**Cara hitung Ariyanto (4 hari):**
- Gaji prorata = 9.000.000 / 31 × 4 = 1.161.290,32 → dibulatkan **1.161.290**

> Catatan: Ariyanto & Kasmir sama-sama jabatan KKM tapi muncul 2 baris terpisah
> karena relief (ganti orang) tanggal 5 Mei.

## 2. Contoh Payroll Uang Makan (uang makan = Rp 1.650.000/bulan)
| Nama | Hari | U. Makan/bln | U. Makan Prorata |
|---|---|---|---|
| Ariyanto | 4 | 1.650.000 | 212.903 |
| Kasmir | 27 | 1.650.000 | 1.437.097 |

- U. makan prorata = 1.650.000 / 31 × 4 = 212.903,22 → **212.903**

## 3. Contoh Pembulatan (round half up)
| Nilai mentah | Hasil dibulatkan |
|---|---|
| 1.161.290,32 | 1.161.290 |
| 212.903,22 | 212.903 |
| 7.838.709,68 | 7.838.710 |
| 1.437.096,77 | 1.437.097 |

## 4. Contoh Masa Kerja & Leave Pay
- Crew 3 segmen: 60 + 75 + 45 = **180 hari** kumulatif → berhak 1 leave pay.
- Masa kerja 370 hari → **berhak 2 leave pay** (floor(370/180) = 2).
- Setelah cair 1x, "Dibayar" = 1, "Sisa" = berhak − dibayar.
- Masa kerja **live**: saat crew On Board, hitungan terus bertambah tiap hari.

## 5. Contoh Aturan Duplikat Pelamar
- Pelamar A: email `a@mail.com`, HP `0812...`. Tersimpan.
- Pelamar B: email sama → **DITOLAK**: "Email sudah terdaftar."
- Pelamar C: email beda tapi HP sama → **DITOLAK**: "No HP sudah terdaftar."

## 6. Contoh Dokumen Expired & Pembaruan
- Crew punya BST expired 1 Mei 2026 → assign penempatan baru **ditolak**.
- Admin klik "Perbarui" pada dokumen BST → upload file baru + isi tanggal expired baru → assign berhasil.
