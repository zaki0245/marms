// client/src/components/Pagination.tsx
// [FUNGSI] Navigasi halaman (prev/next) + pilihan jumlah baris per halaman.
// [ALASAN] Dipakai ulang di semua daftar bertabel; page size dinamis sesuai pilihan user.
// ponytail: pagination client-side (slice). Upgrade ke server-side (Prisma take/skip) bila data menembus puluhan ribu baris.

export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-gray-600">
        <span>
          Menampilkan {from}–{to} dari {total}
        </span>
        <label className="flex items-center gap-1">
          <span>Per halaman</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-gray-300 px-2 py-1 text-navy"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded border border-gray-300 px-3 py-1.5 text-navy disabled:opacity-40"
        >
          &lsaquo; Sebelumnya
        </button>
        <span className="text-gray-600">
          Halaman {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded border border-gray-300 px-3 py-1.5 text-navy disabled:opacity-40"
        >
          Berikutnya &rsaquo;
        </button>
      </div>
    </div>
  );
}
