
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { num } from '../pages/Finance/utils';

export interface PvPrintInvoice {
  inv: string | null;
  ref: string | null;
  dpp: unknown;
  ppn: unknown;
  pphPasal: string | null;
  pph: unknown;
  includeTax: boolean;
}

export interface PvPrintData {
  konfigurasi: {
    perusahaanNama: string;
    alamat1: string;
    alamat2: string;
    alamat3: string;
    alamat4: string;
    ttdPrepared: string;
    ttdVerified: string;
    ttdApproved: string;
  };
  pvNo: string;
  jenis: 'RV' | 'PV';
  payTo: string;
  vendorAlamat: string;
  tanggal: string;
  keterangan: string;
  bankAccountNo: string;
  bankAccountName: string;
  bank: string;
  chequeNo: string;
  issuedDate: string;
  bankCharge: number;
  balance: number;
  invoices: PvPrintInvoice[];
}

const fmt = (v: unknown) =>
  num(v).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const COLORS = {
  navy: [15, 44, 76] as [number, number, number],
  light: [240, 244, 248] as [number, number, number],
  border: [210, 218, 227] as [number, number, number],
  text: [43, 52, 65] as [number, number, number],
  muted: [100, 112, 126] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const MARGIN = 12;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_LINE_Y = PAGE_H - 12;
const FOOTER_TEXT_Y = PAGE_H - 7;

const SATUAN = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
];

function terbilang3(n: number): string {
  const r: string[] = [];
  const ratus = Math.floor(n / 100);
  const sisa = n % 100;

  if (ratus > 0) {
    r.push(ratus === 1 ? 'seratus' : `${SATUAN[ratus]} ratus`);
  }

  if (sisa >= 20) {
    const pul = Math.floor(sisa / 10);
    const sat = sisa % 10;
    r.push(`${SATUAN[pul]} puluh${sat ? ` ${SATUAN[sat]}` : ''}`);
  } else if (sisa >= 12) {
    r.push(`${SATUAN[sisa - 10]} belas`);
  } else if (sisa === 11) {
    r.push('sebelas');
  } else if (sisa === 10) {
    r.push('sepuluh');
  } else if (sisa > 0) {
    r.push(SATUAN[sisa]);
  }

  return r.join(' ');
}

const SCALES: [number, string][] = [
  [1e12, 'triliun'],
  [1e9, 'miliar'],
  [1e6, 'juta'],
  [1e3, 'ribu'],
];

export function terbilang(n: number): string {
  n = Math.floor(Math.abs(n));

  if (n === 0) return 'nol';

  const parts: string[] = [];

  for (const [scale, name] of SCALES) {
    const m = Math.floor(n / scale);

    if (m > 0) {
      parts.push(
        name === 'ribu' && m === 1
          ? 'seribu'
          : `${terbilang3(m)} ${name}`,
      );

      n %= scale;
    }
  }

  if (n > 0) {
    parts.push(terbilang3(n));
  }

  return parts.join(' ');
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch('/logo.png');

    if (!res.ok) return null;

    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawSectionTitle(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.navy);
  doc.text(title.toUpperCase(), x, y);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.25);
  doc.line(x, y + 2, PAGE_W - MARGIN, y + 2);
}

function drawFooter(
  doc: jsPDF,
  pvNo: string,
  companyName: string,
  jenis: 'RV' | 'PV',
) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, FOOTER_LINE_Y, PAGE_W - MARGIN, FOOTER_LINE_Y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);

    doc.text(
      companyName || 'PT. MARITIM ARMADA RAYA',
      MARGIN,
      FOOTER_TEXT_Y,
    );

    doc.text(
      `${jenis === 'RV' ? 'RV No' : 'PV No'}: ${pvNo || '-'}`,
      PAGE_W / 2,
      FOOTER_TEXT_Y,
      { align: 'center' },
    );

    doc.text(
      `Page ${page} of ${pageCount}`,
      PAGE_W - MARGIN,
      FOOTER_TEXT_Y,
      { align: 'right' },
    );
  }
}

export async function cetakPV(d: PvPrintData) {
  const k = d.konfigurasi;
  const isRv = d.jenis === 'RV';
  const voucherTitle = isRv ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const logo = await loadLogo();

  doc.setProperties({
    title: `${voucherTitle} ${d.pvNo}`,
    subject: `${voucherTitle} - ${d.payTo}`,
    author: k.perusahaanNama,
    creator: 'Maritim Armada Raya Finance',
  });

  // =========================================================
  // HEADER PERUSAHAAN
  // =========================================================

  let companyX = MARGIN;

  if (logo) {
    try {
      const imageType = logo.startsWith('data:image/jpeg')
        ? 'JPEG'
        : 'PNG';

      doc.addImage(logo, imageType, MARGIN, 10, 27, 14);
      companyX = 44;
    } catch {
      companyX = MARGIN;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...COLORS.navy);

  doc.text(
    k.perusahaanNama || 'PT. MARITIM ARMADA RAYA',
    companyX,
    14,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);

  const addresses = [
    k.alamat1,
    k.alamat2,
    k.alamat3,
    k.alamat4,
  ].filter(Boolean);

  addresses.forEach((address, i) => {
    doc.text(address, companyX, 18 + i * 3.5);
  });

  // Nomor PV: sisi kanan sejajar dengan margin konten.
  const pvBoxW = 56;
  const pvBoxX = PAGE_W - MARGIN - pvBoxW;

  doc.setFillColor(...COLORS.light);
  doc.roundedRect(pvBoxX, 9, pvBoxW, 17, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);

  doc.text(
    isRv ? 'RECEIPT VOUCHER NO.' : 'PAYMENT VOUCHER NO.',
    pvBoxX + pvBoxW / 2,
    14,
    { align: 'center' },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.navy);

  doc.text(
    d.pvNo || '-',
    pvBoxX + pvBoxW / 2,
    21,
    { align: 'center' },
  );

  doc.setDrawColor(...COLORS.navy);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, 31, PAGE_W - MARGIN, 31);

  // =========================================================
  // JUDUL
  // =========================================================

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.navy);

  doc.text(voucherTitle, PAGE_W / 2, 40, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);

  doc.text('FINANCE & ACCOUNTING', PAGE_W / 2, 44, {
    align: 'center',
  });

  // =========================================================
  // PAYMENT INFORMATION & PAYMENT REFERENCE
  // =========================================================

  const infoY = 52;
  const leftX = MARGIN + 2;
  const rightX = 108;

  drawSectionTitle(doc, 'Payment Information', leftX, infoY);
  drawSectionTitle(doc, 'Payment Reference', rightX, infoY);

  // Description dihapus dari Payment Information.
  const infoRows: [string, string][] = [
    [isRv ? 'Received From' : 'Pay To', d.payTo],
    ['Address', d.vendorAlamat],
  ];

  // PV No dihapus dari Payment Reference.
  const referenceRows: [string, string][] = [
    ['Voucher Date', d.tanggal],
  ];

  const drawInfoValue = (
    label: string,
    value: string,
    x: number,
    y: number,
    labelWidth: number,
    valueWidth: number,
  ) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);

    doc.text(label, x, y);
    doc.text(':', x + labelWidth, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);

    const lines = doc.splitTextToSize(value || '-', valueWidth);

    doc.text(lines.slice(0, 2), x + labelWidth + 3, y);
  };

  infoRows.forEach(([label, value], i) => {
    drawInfoValue(
      label,
      value,
      leftX,
      infoY + 8 + i * 8,
      21,
      65,
    );
  });

  referenceRows.forEach(([label, value], i) => {
    drawInfoValue(
      label,
      value,
      rightX,
      infoY + 8 + i * 8,
      22,
      50,
    );
  });

  // =========================================================
  // TABEL INVOICE
  // =========================================================

  const tableStartY = 76;

  const rows = d.invoices.map((inv, i) => {
    const ppnShown = inv.includeTax ? num(inv.ppn) : 0;
    const pphShown = inv.includeTax ? num(inv.pph) : 0;
    return [
      String(i + 1),
      inv.inv || '-',
      inv.ref || '-',
      fmt(inv.dpp),
      fmt(ppnShown),
      inv.includeTax ? (inv.pphPasal || '-') : '-',
      fmt(pphShown),
      fmt(num(inv.dpp) + ppnShown - pphShown),
    ];
  });

  const total =
    d.invoices.reduce(
      (sum, inv) => sum + num(inv.dpp) + (inv.includeTax ? num(inv.ppn) - num(inv.pph) : 0),
      0,
    ) +
    num(d.bankCharge) +
    num(d.balance);

  autoTable(doc, {
    startY: tableStartY,

    margin: {
      left: MARGIN,
      right: MARGIN,
      top: 12,
      bottom: 20,
    },

    head: [[
      'No',
      'Invoice No.',
      'Ref. No.',
      'DPP',
      'PPN',
      'PPh Psl',
      'PPh',
      'Nominal',
    ]],

    body: rows,

    foot: [[
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      fmt(total),
    ]],

    showHead: 'everyPage',
    showFoot: 'lastPage',
    theme: 'grid',

    styles: {
      font: 'helvetica',
      fontSize: 5.8,
      cellPadding: {
        top: 2.5,
        right: 1,
        bottom: 2.5,
        left: 1,
      },
      textColor: COLORS.text,
      lineColor: COLORS.border,
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak',
    },

    headStyles: {
      fillColor: COLORS.navy,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 5.8,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2,
    },

    footStyles: {
      fillColor: COLORS.light,
      textColor: COLORS.navy,
      fontStyle: 'bold',
      lineColor: COLORS.border,
      lineWidth: 0.25,
      minCellHeight: 8,
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },

    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 24 },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 11, halign: 'center' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
    },
  });

  // =========================================================
  // AMOUNT IN WORDS & TOTAL PEMBAYARAN
  // =========================================================

  let y = (doc as any).lastAutoTable.finalY + 8;

  const SUMMARY_MIN_HEIGHT = 100;

  if (y + SUMMARY_MIN_HEIGHT > FOOTER_LINE_Y - 3) {
    doc.addPage();
    y = 18;
  }

  drawSectionTitle(doc, 'Amount in Words', MARGIN + 2, y);

  const words = `${terbilang(total)} rupiah`;
  const wordLines = doc.splitTextToSize(words, 105);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.text);

  doc.text(wordLines, MARGIN + 2, y + 8);

  // Rincian (Bank Charge & Balance) + kotak total, sisi kanan.
  const totalBoxW = 67;
  const totalBoxX = PAGE_W - MARGIN - totalBoxW;

  const rincian: [string, unknown][] = [
    ['Bank Charge', d.bankCharge],
    ['Balance', d.balance],
  ];

  let rincianY = y + 8;
  rincian.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(label, totalBoxX, rincianY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.text);
    doc.text(fmt(value), totalBoxX + totalBoxW, rincianY, { align: 'right' });

    rincianY += 4.5;
  });

  const totalBoxY = rincianY + 3;

  doc.setFillColor(...COLORS.light);
  doc.roundedRect(
    totalBoxX,
    totalBoxY,
    totalBoxW,
    15,
    2,
    2,
    'F',
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.muted);

  doc.text(
    isRv ? 'TOTAL PENERIMAAN' : 'TOTAL PEMBAYARAN',
    totalBoxX + totalBoxW / 2,
    totalBoxY + 4.5,
    { align: 'center' },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.navy);

  doc.text(
    fmt(total),
    totalBoxX + totalBoxW / 2,
    totalBoxY + 11,
    { align: 'center' },
  );

  // =========================================================
  // PAYMENT DESCRIPTION
  // =========================================================

  const descriptionY = Math.max(
    y + 8 + wordLines.length * 4 + 6,
    totalBoxY + 15 + 6,
  );

  drawSectionTitle(
    doc,
    'Payment Description',
    MARGIN + 2,
    descriptionY,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.text);

  const descriptionLines = doc.splitTextToSize(
    d.keterangan || '-',
    CONTENT_W - 4,
  );

  doc.text(descriptionLines, MARGIN + 2, descriptionY + 8);

  // =========================================================
  // BANK INFORMATION
  // =========================================================

  const bankY =
    descriptionY + 8 + descriptionLines.length * 4 + 7;

  drawSectionTitle(
    doc,
    'Bank Information',
    MARGIN + 2,
    bankY,
  );

  const bankRows: [string, string][] = [
    ['Account No.', d.bankAccountNo],
    ['Account Name', d.bankAccountName],
    ['Bank', d.bank],
    ['Cheque No.', d.chequeNo || 'Online Banking'],
    ['Issued Date', d.issuedDate],
  ];

  const bankRowHeight = 12;
  const bankContentStartY = bankY + 8;
  const bankRowCount = Math.ceil(bankRows.length / 2);

  bankRows.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);

    const x = MARGIN + 2 + col * (CONTENT_W / 2);
    const itemY = bankContentStartY + row * bankRowHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);

    doc.text(label, x, itemY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);

    const valueLines = doc.splitTextToSize(
      value || '-',
      CONTENT_W / 2 - 8,
    );

    doc.text(valueLines.slice(0, 2), x, itemY + 4);
  });

  // =========================================================
  // AUTHORIZATION / TANDA TANGAN
  // =========================================================

  // Posisi dihitung dari baris terakhir bank agar tidak bertabrakan.
  const lastBankRowY =
    bankContentStartY + (bankRowCount - 1) * bankRowHeight;

  let signY = lastBankRowY + 20;

  const signatureBlockHeight = 32;
  const maxSignatureY = FOOTER_LINE_Y - signatureBlockHeight;

  if (signY > maxSignatureY) {
    doc.addPage();
    signY = 20;
  }

  drawSectionTitle(
    doc,
    'Authorization',
    MARGIN + 2,
    signY,
  );

  const signatureGap = CONTENT_W / 3;

  const signers: [string, string][] = [
    ['Prepared By', k.ttdPrepared],
    ['Verified By (CFO)', k.ttdVerified],
    ['Approved By (BOD)', k.ttdApproved],
  ];

  signers.forEach(([role, name], i) => {
    const x = MARGIN + i * signatureGap + 2;
    const width = signatureGap - 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);

    doc.text(role, x, signY + 8);

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);

    doc.line(
      x,
      signY + 25,
      x + width,
      signY + 25,
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);

    const nameLines = doc.splitTextToSize(
      name || '-',
      width,
    );

    doc.text(nameLines.slice(0, 2), x, signY + 30);
  });

  // =========================================================
  // FOOTER & SAVE PDF
  // =========================================================

  drawFooter(doc, d.pvNo, k.perusahaanNama, d.jenis);

  const safePvNo = (d.pvNo || 'draft').replace(/[\\/:*?"<>|]/g, '-');

  doc.save(`PV-${safePvNo}.pdf`);
}
