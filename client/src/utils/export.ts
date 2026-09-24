// client/src/utils/export.ts
// [FUNGSI] Export data ke Excel (.xlsx) dan PDF.
// [ALASAN] Admin bisa mengunduh rekap payroll untuk arsip/laporan.

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportSheet {
  title: string;
  subtitle: string;
  filename: string;
  columns: string[];
  rows: (string | number)[][];
  totalLabel: string;
  totalValue: string;
}

// [FUNGSI] Export ke file Excel.
export function exportExcel(s: ExportSheet) {
  const totalRow: (string | number)[] = [
    ...Array(Math.max(0, s.columns.length - 2)).fill(''),
    s.totalLabel,
    s.totalValue,
  ];
  const ws = XLSX.utils.aoa_to_sheet([s.columns, ...s.rows, totalRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
  XLSX.writeFile(wb, `${s.filename}.xlsx`);
}

// [FUNGSI] Export ke file PDF.
export function exportPdf(s: ExportSheet) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(15, 44, 76);
  doc.text(s.title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(s.subtitle, 14, 23);

  autoTable(doc, {
    head: [s.columns],
    body: s.rows,
    foot: [[...Array(Math.max(0, s.columns.length - 2)).fill(''), s.totalLabel, s.totalValue]],
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 44, 76], textColor: 255 },
    footStyles: { fillColor: [234, 240, 247], textColor: [15, 44, 76], fontStyle: 'bold' },
  });

  doc.save(`${s.filename}.pdf`);
}
