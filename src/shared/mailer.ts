// src/shared/mailer.ts
// [FUNGSI] Kirim email via SMTP (nodemailer).
// [ALASAN] Dipakai untuk approval voucher; transporter dibuat lazy dari env.

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

// [FUNGSI] Buat transporter sekali; kembalikan null bila SMTP belum dikonfigurasi.
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
      : undefined,
  });
  return transporter;
}

// [FUNGSI] Kirim email HTML. `to` & `cc` boleh string berkoma untuk banyak penerima.
export async function sendMail(to: string, cc: string | undefined, subject: string, html: string) {
  const t = getTransporter();
  if (!t) throw new Error('SMTP belum dikonfigurasi');
  await t.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    cc: cc || undefined,
    subject,
    html,
  });
}
