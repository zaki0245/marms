// client/src/components/MemoryInput.tsx
// [FUNGSI] Input teks dengan saran dari riwayat (datalist).
// [ALASAN] Field voyage berulang tiap shipment; teks tetap bebas, saran mempercepat pengisian.

interface Props {
  /** Kunci unik untuk id datalist (mis. nama field). */
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function MemoryInput({ id, value, options, onChange }: Props) {
  return (
    <>
      <input
        list={`memori-${id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-1 w-full"
      />
      <datalist id={`memori-${id}`}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}
