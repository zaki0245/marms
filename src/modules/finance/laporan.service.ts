// src/modules/finance/laporan.service.ts
// [FUNGSI] Logika bisnis Laporan Finance.
// [ALASAN] Rekap voucher (AR & AP) + ringkasan dashboard (hutang & piutang).

import { prisma } from '../../shared/prisma';

// [FUNGSI] Rekap voucher: satu baris per item (invoice) + info voucher.
export async function rekap(jenis?: string) {
  const pvs = await prisma.pv.findMany({
    where: jenis && jenis !== 'SEMUA' ? { jenis: jenis as any } : {},
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
        jenis: pv.jenis,
        tanggal: pv.tanggal,
        counterpartyName: pv.jenis === 'RV' ? pv.customerName ?? '' : pv.vendorName ?? '',
        inv: inv.inv,
        ref: inv.ref,
        keterangan: pv.keterangan,
        dpp: Number(item.nominal),
        ppn: item.includeTax && inv.ppn != null ? Number(inv.ppn) : null,
        pph: item.includeTax && inv.pph != null ? Number(inv.pph) : null,
        cargoQuantity: inv.cargoQuantity != null ? Number(inv.cargoQuantity) : null,
        unitPrice: inv.unitPrice != null ? Number(inv.unitPrice) : null,
        nominal: Number(item.nominal),
        bankCharge: pv.bankCharge != null ? Number(pv.bankCharge) : null,
        balance: pv.balance != null ? Number(pv.balance) : null,
      });
    }
  }
  return rows;
}

// [FUNGSI] Ringkasan dashboard Finance (hutang AP + piutang AR).
export async function dashboard() {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // [FUNGSI] Invoice berstatus != LUNAS + item voucher.
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
    .filter((inv) => inv.jenis === 'AP' && inv.tanggal >= startMonth && inv.tanggal < endMonth)
    .reduce((s, inv) => s + Number(inv.total), 0);

  const totalPiutangBulanIni = belumLunas
    .filter((inv) => inv.jenis === 'AR' && inv.tanggal >= startMonth && inv.tanggal < endMonth)
    .reduce((s, inv) => s + Number(inv.total), 0);

  const jatuhTempo = belumLunas
    .filter((inv) => inv.dueDate && inv.dueDate >= now)
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
    .slice(0, 5);

  const [belumBayarCount, belumDiterimaCount, fakturBelumCount] = await Promise.all([
    prisma.invoice.count({ where: { statusPembayaran: 'BELUM_BAYAR', jenis: 'AP' } }),
    prisma.invoice.count({ where: { statusPembayaran: 'BELUM_BAYAR', jenis: 'AR' } }),
    prisma.invoice.count({ where: { statusFakturPajak: 'BELUM_DITERIMA' } }),
  ]);

  return {
    totalHutangBulanIni,
    totalPiutangBulanIni,
    invoiceBelumBayar: belumBayarCount,
    invoiceBelumDiterima: belumDiterimaCount,
    fakturPajakBelumDiterima: fakturBelumCount,
    jatuhTempoTerdekat: jatuhTempo.map((inv) => ({
      id: inv.id,
      no: inv.no,
      jenis: inv.jenis,
      counterpartyName: inv.jenis === 'AR' ? inv.customerName ?? '' : inv.vendorName ?? '',
      tanggal: inv.tanggal,
      inv: inv.inv,
      total: Number(inv.total),
      dueDate: inv.dueDate,
    })),
  };
}
