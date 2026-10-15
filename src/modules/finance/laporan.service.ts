// src/modules/finance/laporan.service.ts
// [FUNGSI] Logika bisnis Laporan Finance.
// [ALASAN] Satu laporan: Rekap AP (semua PV + item) + ringkasan dashboard.

import { prisma } from '../../shared/prisma';

// [FUNGSI] Rekap AP: satu baris per item PV (invoice) + info PV, terbaru dulu.
export async function rekapAp() {
  const pvs = await prisma.pv.findMany({
    include: { items: { include: { invoice: true } } },
    orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
  });

  const rows: any[] = [];
  for (const pv of pvs) {
    for (const item of pv.items) {
      const inv = item.invoice;
      rows.push({
        id: item.id,
        pvId: pv.id,
        pvNo: pv.pvNo,
        tanggal: pv.tanggal,
        vendorName: pv.vendorName,
        inv: inv.inv,
        ref: inv.ref,
        keterangan: pv.keterangan,
        dpp: Number(item.nominal),
        ppn: item.includeTax && inv.ppn != null ? Number(inv.ppn) : null,
        pph: item.includeTax && inv.pph != null ? Number(inv.pph) : null,
        nominal: Number(item.nominal),
        bankCharge: pv.bankCharge != null ? Number(pv.bankCharge) : null,
        balance: pv.balance != null ? Number(pv.balance) : null,
      });
    }
  }
  return rows;
}

// [FUNGSI] Ringkasan dashboard Finance.
export async function dashboard() {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // [FUNGSI] Invoice berstatus != LUNAS + item PV.
  const candidates = await prisma.invoice.findMany({
    where: { statusPembayaran: { not: 'LUNAS' } },
    include: { pvItems: true },
  });

  // [FUNGSI] Lunas efektif = SEBAGIAN tapi akumulasi nominal sudah >= total.
  const lunasEfektif = (inv: any) =>
    inv.statusPembayaran === 'SEBAGIAN' &&
    inv.pvItems.reduce((s: number, it: any) => s + Number(it.nominal), 0) >= Number(inv.total);

  const belumLunas = candidates.filter((inv) => !lunasEfektif(inv));

  const totalHutangBulanIni = belumLunas
    .filter((inv) => inv.tanggal >= startMonth && inv.tanggal < endMonth)
    .reduce((s, inv) => s + Number(inv.total), 0);

  const jatuhTempo = belumLunas
    .filter((inv) => inv.dueDate && inv.dueDate >= now)
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
    .slice(0, 5);

  const [belumBayarCount, fakturBelumCount] = await Promise.all([
    prisma.invoice.count({ where: { statusPembayaran: 'BELUM_BAYAR' } }),
    prisma.invoice.count({ where: { statusFakturPajak: 'BELUM_DITERIMA' } }),
  ]);

  return {
    totalHutangBulanIni,
    invoiceBelumBayar: belumBayarCount,
    fakturPajakBelumDiterima: fakturBelumCount,
    jatuhTempoTerdekat: jatuhTempo.map((inv) => ({
      id: inv.id,
      no: inv.no,
      tanggal: inv.tanggal,
      vendorName: inv.vendorName,
      inv: inv.inv,
      total: Number(inv.total),
      dueDate: inv.dueDate,
    })),
  };
}
