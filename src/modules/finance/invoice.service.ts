// src/modules/finance/invoice.service.ts
// [FUNGSI] Logika bisnis Invoice Finance (AR & AP).
// [ALASAN] Nomor otomatis, cek duplikat, snapshot counterparty, hitung total terpusat di sini.

import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/AppError';
import { getKonfigurasi } from './konfigurasi.service';
import { sendMail } from '../../shared/mailer';
import type { InvoiceInput } from './finance.model';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';

// [FUNGSI] Buat nomor invoice otomatis: INV-YYYY-NNNN (reset tiap tahun).
export async function generateNoInvoice(): Promise<string> {
  const tahun = new Date().getFullYear();
  const prefix = `INV-${tahun}-`;
  const last = await prisma.invoice.findFirst({
    where: { no: { startsWith: prefix } },
    orderBy: { no: 'desc' },
    select: { no: true },
  });
  let next = 1;
  if (last) {
    const n = Number(last.no.slice(prefix.length));
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

// [FUNGSI] Ambil snapshot vendor + satu rekening bank (untuk AP).
export async function resolveVendorSnapshot(vendorId: string, bankAccountId?: string | null) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, include: { banks: true } });
  if (!vendor) throw new AppError(404, 'Vendor tidak ditemukan');
  const bank = vendor.banks.find((b) => b.id === bankAccountId) ?? vendor.banks[0] ?? null;
  return {
    vendorName: vendor.nama,
    vendorNpwp: vendor.npwp ?? null,
    vendorAlamat: vendor.alamat ?? null,
    bankAccountNo: bank?.accountNo ?? null,
    bankAccountName: bank?.accountName ?? null,
    bank: bank?.bank ?? null,
  };
}

// [FUNGSI] Ambil snapshot customer + satu rekening bank (untuk AR).
export async function resolveCustomerSnapshot(customerId: string, bankAccountId?: string | null) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, include: { banks: true } });
  if (!customer) throw new AppError(404, 'Customer tidak ditemukan');
  const bank = customer.banks.find((b) => b.id === bankAccountId) ?? customer.banks[0] ?? null;
  return {
    customerName: customer.nama,
    customerNpwp: customer.npwp ?? null,
    customerAlamat: customer.alamat ?? null,
    bankAccountNo: bank?.accountNo ?? null,
    bankAccountName: bank?.accountName ?? null,
    bank: bank?.bank ?? null,
  };
}

// [FUNGSI] Susun data Invoice dari input (dipakai create & update).
async function buildData(input: InvoiceInput): Promise<Omit<Prisma.InvoiceUncheckedCreateInput, 'no'>> {
  const jenis = input.jenis ?? 'AP';
  // [FUNGSI] Invoice DP tidak membawa PPN/PPH; PPN/PPH hanya di Pelunasan/final.
  const isDp = (input.tipe ?? 'REGULAR') === 'DP';
  const ppn = isDp ? null : input.ppn ?? null;
  const pph = isDp ? null : input.pph ?? null;
  const total = (input.dpp ?? 0) + (ppn ?? 0) - (pph ?? 0);

  const base = {
    jenis,
    kategori: input.kategori ?? 'OTHERS',
    tipe: input.tipe ?? 'REGULAR',
    tanggal: new Date(input.tanggal),
    bupot: input.bupot || null,
    bankAccountId: input.bankAccountId || null,
    inv: input.inv?.trim() || null,
    ref: input.ref || null,
    keterangan: input.keterangan || null,
    dpp: input.dpp ?? 0,
    ppn,
    pphPasal: input.pphPasal || null,
    pph,
    total,
    cargoQuantity: input.cargoQuantity ?? null,
    unitPrice: input.unitPrice ?? null,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    masaPajakPPN: input.masaPajakPPN || null,
    masaPajakPPH: input.masaPajakPPH || null,
    statusFakturPajak: input.statusFakturPajak ?? 'BELUM_DITERIMA',
    parentInvoiceId: input.parentInvoiceId || null,
    // [FUNGSI] Belum lengkap = bupot belum diisi (boleh dilengkapi nanti).
    incomplete: !input.bupot,
    fakturPajak: { create: input.fakturPajak ?? [] },
  };

  if (jenis === 'AR') {
    if (!input.customerId) throw new AppError(400, 'Customer wajib diisi untuk invoice AR');
    const snap = await resolveCustomerSnapshot(input.customerId, input.bankAccountId);
    return {
      ...base,
      vendorId: null,
      vendorName: null,
      vendorNpwp: null,
      vendorAlamat: null,
      customerId: input.customerId,
      ...snap,
    };
  }

  if (!input.vendorId) throw new AppError(400, 'Vendor wajib diisi untuk invoice AP');
  const snap = await resolveVendorSnapshot(input.vendorId, input.bankAccountId);
  return {
    ...base,
    vendorId: input.vendorId,
    customerId: null,
    customerName: null,
    customerNpwp: null,
    customerAlamat: null,
    ...snap,
  };
}

export function listInvoices(params: { q?: string; status?: string; jenis?: string } = {}) {
  const statuses = params.status
    ? params.status.split(',').filter((s) => s && s !== 'SEMUA')
    : [];
  const jenis = params.jenis && params.jenis !== 'SEMUA' ? (params.jenis as any) : undefined;
  return prisma.invoice.findMany({
    where: {
      ...(jenis ? { jenis } : {}),
      ...(statuses.length ? { statusPembayaran: { in: statuses as any } } : {}),
    },
    include: {
      fakturPajak: true,
      pvItems: { select: { id: true, invoiceId: true, nominal: true } },
      vendor: { select: { id: true, nama: true } },
      customer: { select: { id: true, nama: true } },
    },
    orderBy: { no: 'desc' },
  });
}

export function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      fakturPajak: true,
      pvItems: true,
      vendor: { include: { banks: true } },
      customer: { include: { banks: true } },
      parent: true,
      children: true,
    },
  });
}

export async function createInvoice(input: InvoiceInput) {
  const jenis = input.jenis ?? 'AP';
  const inv = input.inv?.trim() || null;
  if (inv) {
    const exists = await prisma.invoice.findFirst({
      where: jenis === 'AR'
        ? { customerId: input.customerId ?? undefined, inv }
        : { vendorId: input.vendorId ?? undefined, inv },
    });
    if (exists) throw new AppError(409, jenis === 'AR' ? 'Customer + nomor invoice sudah ada (duplikat)' : 'Vendor + nomor invoice sudah ada (duplikat)');
  }

  const no = await generateNoInvoice();
  const data = await buildData(input);
  return prisma.invoice.create({ data: { ...data, no }, include: { fakturPajak: true } });
}

export async function updateInvoice(id: string, input: InvoiceInput) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Invoice tidak ditemukan');

  const jenis = input.jenis ?? 'AP';
  const inv = input.inv?.trim() || null;
  if (inv) {
    const exists = await prisma.invoice.findFirst({
      where: jenis === 'AR'
        ? { customerId: input.customerId ?? undefined, inv, NOT: { id } }
        : { vendorId: input.vendorId ?? undefined, inv, NOT: { id } },
    });
    if (exists) throw new AppError(409, jenis === 'AR' ? 'Customer + nomor invoice sudah ada (duplikat)' : 'Vendor + nomor invoice sudah ada (duplikat)');
  }

  const data = await buildData(input);
  await prisma.fakturPajak.deleteMany({ where: { invoiceId: id } });
  return prisma.invoice.update({
    where: { id },
    data,
    include: { fakturPajak: true },
  });
}

// [FUNGSI] Hitung ulang status pembayaran invoice dari akumulasi DPP + pajak PV/RV.
// [ALASAN] Status BELUM_BAYAR/SEBAGIAN/LUNAS jadi otomatis (bukan manual).
export async function recomputeStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { pvItems: { select: { nominal: true, includeTax: true } } },
  });
  if (!invoice) return;
  const taxDelta = Number(invoice.ppn ?? 0) - Number(invoice.pph ?? 0);
  const paid = invoice.pvItems.reduce(
    (s, it) => s + Number(it.nominal) + (it.includeTax ? taxDelta : 0),
    0,
  );
  const total = Number(invoice.total);
  let status: 'BELUM_BAYAR' | 'SEBAGIAN' | 'LUNAS' = 'BELUM_BAYAR';
  if (paid > 0 && paid < total) status = 'SEBAGIAN';
  else if (paid >= total) status = 'LUNAS';
  await prisma.invoice.update({ where: { id: invoiceId }, data: { statusPembayaran: status } });
}

// [FUNGSI] Hapus invoice; tolak bila jadi induk DP/Pelunasan atau sudah dibayar.
export async function deleteInvoice(id: string) {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { children: { select: { id: true } }, pvItems: { select: { id: true } } },
  });
  if (!existing) throw new AppError(404, 'Invoice tidak ditemukan');
  if (existing.children.length > 0) {
    throw new AppError(409, 'Invoice punya invoice DP/Pelunasan, tidak bisa dihapus');
  }
  if (existing.pvItems.length > 0) {
    throw new AppError(409, 'Invoice sudah dibayar (ada voucher), tidak bisa dihapus');
  }
  return prisma.invoice.delete({ where: { id } });
}

const fmtRp = (n: unknown) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

const KATEGORI_LABEL: Record<string, string> = { FREIGHT: 'Freight', OPERATION: 'Operation', OTHERS: 'Others' };
const TIPE_LABEL: Record<string, string> = { REGULAR: 'Regular', DP: 'DP', PELUNASAN: 'Pelunasan' };
const FAKTUR_LABEL: Record<string, string> = { SUDAH_DITERIMA: 'Sudah diterima', BELUM_DITERIMA: 'Belum diterima', TIDAK_ADA: 'Tidak ada' };

// [FUNGSI] Susun detail lengkap invoice menjadi tabel HTML untuk email approval.
function invoiceHtml(inv: any): string {
  const faktur = (inv.fakturPajak ?? []).map((f: any) => f.nomor).join(', ') || '-';
  return `
    <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ddd;font-size:14px">
      <tr><td><b>No Invoice</b></td><td>${inv.no}</td></tr>
      <tr><td><b>Jenis</b></td><td>${inv.jenis}</td></tr>
      <tr><td><b>Kategori</b></td><td>${KATEGORI_LABEL[inv.kategori] ?? inv.kategori}</td></tr>
      <tr><td><b>Tipe</b></td><td>${TIPE_LABEL[inv.tipe] ?? inv.tipe}</td></tr>
      <tr><td><b>Tanggal</b></td><td>${inv.tanggal ? new Date(inv.tanggal).toLocaleDateString('id-ID') : '-'}</td></tr>
      <tr><td><b>Bupot</b></td><td>${inv.bupot ?? '-'}</td></tr>
      <tr><td><b>Vendor</b></td><td>${inv.vendorName ?? '-'}</td></tr>
      <tr><td><b>NPWP Vendor</b></td><td>${inv.vendorNpwp ?? '-'}</td></tr>
      <tr><td><b>Alamat Vendor</b></td><td>${inv.vendorAlamat ?? '-'}</td></tr>
      <tr><td><b>Bank</b></td><td>${inv.bank ?? '-'}</td></tr>
      <tr><td><b>No Rekening</b></td><td>${inv.bankAccountNo ?? '-'}</td></tr>
      <tr><td><b>Atas Nama</b></td><td>${inv.bankAccountName ?? '-'}</td></tr>
      <tr><td><b>Nomor Invoice (vendor)</b></td><td>${inv.inv ?? '-'}</td></tr>
      <tr><td><b>REF</b></td><td>${inv.ref ?? '-'}</td></tr>
      <tr><td><b>Keterangan</b></td><td><b>${inv.keterangan ?? '-'}</b></td></tr>
      <tr><td><b>DPP</b></td><td>${fmtRp(inv.dpp)}</td></tr>
      <tr><td><b>PPN</b></td><td>${fmtRp(inv.ppn)}</td></tr>
      <tr><td><b>PPh Pasal</b></td><td>${inv.pphPasal ?? '-'}</td></tr>
      <tr><td><b>PPh</b></td><td>${fmtRp(inv.pph)}</td></tr>
      <tr><td><b>Total</b></td><td><b>${fmtRp(inv.total)}</b></td></tr>
      <tr><td><b>Jatuh Tempo</b></td><td><b>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}</b></td></tr>
      <tr><td><b>Masa Pajak PPN</b></td><td>${inv.masaPajakPPN ?? '-'}</td></tr>
      <tr><td><b>Masa Pajak PPH</b></td><td>${inv.masaPajakPPH ?? '-'}</td></tr>
      <tr><td><b>Status Faktur Pajak</b></td><td>${FAKTUR_LABEL[inv.statusFakturPajak] ?? inv.statusFakturPajak}</td></tr>
      <tr><td><b>Nomor Faktur Pajak</b></td><td>${faktur}</td></tr>
    </table>
  `;
}

// [FUNGSI] Kirim email approval invoice AP: generate token, kirim detail, catat pengiriman.
export async function sendApproval(invoiceId: string) {
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { fakturPajak: true },
  });
  if (!inv) throw new AppError(404, 'Invoice tidak ditemukan');
  if (inv.jenis !== 'AP') throw new AppError(400, 'Hanya invoice AP yang bisa diajukan approval');

  const konfig = await getKonfigurasi();
  const to = konfig.approvalEmail;
  if (!to) throw new AppError(400, 'Email approver belum diisi di Konfigurasi');
  const cc = konfig.approvalCc || undefined;

  const token = crypto.randomBytes(32).toString('hex');
  const base = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const link = `${base.replace(/\/$/, '')}/approve/${token}`;

  const subject = `Approval Invoice ${inv.no} - ${inv.vendorName ?? ''}`;
  const html = `
    <p>Dear Pak Zulfadhli,</p>
    <p style="margin-top:16px">Berikut kami sampaikan pengajuan untuk invoice berikut:</p>
    ${invoiceHtml(inv)}
    <p style="margin-top:16px">Klik tautan berikut untuk menyetujui:</p>
    <p><a href="${link}">${link}</a></p>
    <p style="margin-top:16px">Dear Pak Tri Handoyo,</p>
    <p>Mohon bantuannya agar dapat dibantu dijalankan pembayarannya sesuai term payment yang berlaku.</p>
    <p style="margin-top:16px">Demikian perihal pengajuan yang kami sampaikan,</p>
    <p>Terima kasih atas perhatian dan kerjasamanya.</p>
    <p style="margin-top:16px">Kind Regards,</p>
    <p style="margin: 0; padding: 0;">Finance Dept</p>
    <p style="margin: 0; padding: 0; color: #1a5fb4;">PT Maritim Armada <span style="color: #c01c28;">Raya</span></p>
  `;

  await sendMail(to, cc, subject, html);

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { approvalToken: token, approvalSentAt: new Date(), approvalSentTo: to },
  });
}

// [FUNGSI] Ambil detail invoice lewat token approval (untuk halaman approve publik).
export async function getInvoiceByToken(token: string) {
  const inv = await prisma.invoice.findUnique({
    where: { approvalToken: token },
    include: { fakturPajak: true },
  });
  if (!inv) throw new AppError(404, 'Tautan approval tidak valid');
  return {
    no: inv.no,
    jenis: inv.jenis,
    kategori: inv.kategori,
    tipe: inv.tipe,
    tanggal: inv.tanggal,
    bupot: inv.bupot,
    vendorName: inv.vendorName,
    vendorNpwp: inv.vendorNpwp,
    vendorAlamat: inv.vendorAlamat,
    bank: inv.bank,
    bankAccountNo: inv.bankAccountNo,
    bankAccountName: inv.bankAccountName,
    inv: inv.inv,
    ref: inv.ref,
    keterangan: inv.keterangan,
    dpp: Number(inv.dpp),
    ppn: inv.ppn != null ? Number(inv.ppn) : null,
    pphPasal: inv.pphPasal,
    pph: inv.pph != null ? Number(inv.pph) : null,
    total: Number(inv.total),
    dueDate: inv.dueDate,
    masaPajakPPN: inv.masaPajakPPN,
    masaPajakPPH: inv.masaPajakPPH,
    statusFakturPajak: inv.statusFakturPajak,
    fakturPajak: inv.fakturPajak.map((f) => f.nomor),
    approvalStatus: inv.approvalStatus,
    approvedAt: inv.approvedAt,
  };
}

// [FUNGSI] Ubah status approval invoice secara manual oleh SUPERADMIN.
// [ALASAN] Admin bisa mengoreksi status tanpa harus lewat tautan email.
export async function setApprovalStatus(id: string, status: string) {
  if (status !== 'BELUM_DIAPPROVE' && status !== 'SUDAH_DIAPPROVE') {
    throw new AppError(400, 'Status approval tidak valid');
  }
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) throw new AppError(404, 'Invoice tidak ditemukan');
  if (inv.jenis !== 'AP') throw new AppError(400, 'Hanya invoice AP yang punya approval');

  const data = status === 'SUDAH_DIAPPROVE'
    ? { approvalStatus: 'SUDAH_DIAPPROVE' as const, approvedAt: new Date(), approvalToken: null }
    : { approvalStatus: 'BELUM_DIAPPROVE' as const, approvedAt: null };
  return prisma.invoice.update({ where: { id }, data });
}

// [FUNGSI] Tandai invoice sudah di-approve (dipanggil dari tautan publik).
export async function approveInvoice(token: string) {
  const inv = await prisma.invoice.findUnique({ where: { approvalToken: token } });
  if (!inv) throw new AppError(404, 'Tautan approval tidak valid');
  if (inv.approvalStatus === 'SUDAH_DIAPPROVE') {
    return { no: inv.no, approvalStatus: 'SUDAH_DIAPPROVE' };
  }
  const updated = await prisma.invoice.update({
    where: { id: inv.id },
    data: { approvalStatus: 'SUDAH_DIAPPROVE', approvedAt: new Date(), approvalToken: null },
  });
  return { no: updated.no, approvalStatus: 'SUDAH_DIAPPROVE' };
}
