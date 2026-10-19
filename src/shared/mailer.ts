// src/shared/mailer.ts
// [FUNGSI] Kirim email: prioritas Resend HTTP API (jalan di semua plan Railway),
//          fallback ke SMTP nodemailer bila RESEND_API_KEY tidak diisi.
// [ALASAN] Railway memblokir outbound SMTP di plan Free/Trial/Hobby; Resend via HTTPS (port 443) tidak diblokir.

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

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

// [FUNGSI] Pisahkan string berkoma menjadi array email.
function toArray(v?: string | null): string[] {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

// [FUNGSI] Kirim email. Prioritas: Resend API (bila RESEND_API_KEY ada), lalu SMTP.
export async function sendMail(to: string, cc: string | undefined, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY;

  // Mode Resend (HTTPS, jalan di semua plan Railway)
  if (resendKey) {
    const body: Record<string, unknown> = {
      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
      to: toArray(to),
      subject,
      html,
    };
    const ccArr = toArray(cc);
    if (ccArr.length) body.cc = ccArr;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Resend gagal (${res.status}): ${await res.text()}`);
    }
    return;
  }

  // Mode SMTP (fallback)
  const t = getTransporter();
  if (!t) throw new Error('SMTP/Resend belum dikonfigurasi');
  await t.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    cc: cc || undefined,
    subject,
    html,
  });
}
