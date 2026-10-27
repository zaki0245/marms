// client/src/components/Pagination.tsx
// [FUNGSI] Navigasi halaman Next/Prev + info halaman.
// [ALASAN] Dipakai ulang di semua daftar modul Finance (max 15 record per halaman).

export const PAGE_SIZE = 15;

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-4 text-sm">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded border border-gray-300 px-3 py-1.5 text-navy disabled:opacity-40"
      >
        &lsaquo; Sebelumnya
      </button>
      <span className="text-gray-600">
        Halaman {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded border border-gray-300 px-3 py-1.5 text-navy disabled:opacity-40"
      >
        Berikutnya &rsaquo;
      </button>
    </div>
  );
}
