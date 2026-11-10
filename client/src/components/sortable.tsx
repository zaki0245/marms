// client/src/components/sortable.tsx
// [FUNGSI] Utilitas sorting tabel: state sort, sortRows, dan header <th> yang bisa diklik.
// [ALASAN] Semua tabel daftar memakai pola sorting yang sama; dipusatkan agar konsisten.

import { ReactNode, useState } from 'react';

export type SortDir = 'asc' | 'desc';
export type SortState = { key: string; dir: SortDir } | null;
export type SortValue = string | number | null | undefined;

// [FUNGSI] Bandingkan dua nilai: angka numerik, teks locale Indonesia, nilai kosong selalu di akhir.
export function compareSortValues(a: SortValue, b: SortValue): number {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' });
}

// [FUNGSI] Urutkan salinan baris sesuai state sort; urutan asli dipertahankan bila sort null.
export function sortRows<T>(
  rows: T[],
  sort: SortState,
  accessors: Record<string, (row: T) => SortValue>,
): T[] {
  if (!sort) return rows;
  const get = accessors[sort.key];
  if (!get) return rows;
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => factor * compareSortValues(get(a), get(b)));
}

// [FUNGSI] State sort per tabel: klik kolom = asc -> desc -> kembali ke urutan default.
export function useSort() {
  const [sort, setSort] = useState<SortState>(null);
  function toggle(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  }
  return { sort, toggle };
}

interface SortableThProps {
  label: ReactNode;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  className?: string;
}

// [FUNGSI] Header kolom yang bisa diklik untuk sorting, dengan indikator arah panah.
export function SortableTh({ label, sortKey, sort, onSort, className = '' }: SortableThProps) {
  const active = sort?.key === sortKey;
  const indicator = active ? (sort?.dir === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <th
      className={`cursor-pointer select-none ${className}`}
      aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      onClick={() => onSort(sortKey)}
      title="Klik untuk urutkan"
    >
      {label}
      <span className={active ? 'text-gray-900' : 'text-gray-400'}>{indicator}</span>
    </th>
  );
}
