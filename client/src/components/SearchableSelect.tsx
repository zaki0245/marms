// client/src/components/SearchableSelect.tsx
// [FUNGSI] Dropdown yang bisa diketik untuk mencari nama.
// [ALASAN] Vendor/customer bisa banyak; pilih lewat ketik + saran lebih cepat daripada scroll select biasa.

import { useEffect, useState } from 'react';

interface Option {
  id: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  onChange: (id: string) => void;
}

export default function SearchableSelect({ value, options, placeholder, className, wrapperClassName, onChange }: Props) {
  const selected = options.find((o) => o.id === value);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(selected?.label ?? '');
    // [ALASAN] Sinkronkan teks saat value berubah eksternal (edit / reset jenis).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className={`relative ${wrapperClassName ?? ''}`}>
      <input
        value={query}
        placeholder={placeholder}
        className={className}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</li>
          )}
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.id);
                  setQuery(o.label);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-navy-light"
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
