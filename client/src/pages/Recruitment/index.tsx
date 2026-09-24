// client/src/pages/Recruitment/index.tsx
// [FUNGSI] Halaman admin Rekrutmen: daftar pelamar, ubah status, verifikasi dokumen.
// [ALASAN] Admin memproses pelamar dari sini (verifikasi -> interview -> diterima).

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { DOKUMEN_LABEL } from '../../constants';

interface Dokumen {
  id: string;
  jenis: string;
  filePath: string;
  tanggalExpired?: string | null;
}

interface Pelamar {
  id: string;
  nomorPendaftaran: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  noHp: string;
  email: string;
  alamat: string;
  kontakReferensi?: string | null;
  posisiDilamar: string;
  pengalamanTahun?: number | null;
  kapalTerakhir?: string | null;
  jabatanTerakhir?: string | null;
  status: string;
  createdAt: string;
  documents: Dokumen[];
}

const STATUS = ['BARU', 'VERIFIKASI', 'INTERVIEW', 'DITERIMA', 'DITOLAK'];
const STATUS_LABEL: Record<string, string> = {
  BARU: 'Baru',
  VERIFIKASI: 'Verifikasi',
  INTERVIEW: 'Wawancara',
  DITERIMA: 'Diterima',
  DITOLAK: 'Ditolak',
};

// [FUNGSI] Tampilkan badge status dengan warna sesuai arti.
function statusBadge(s: string) {
  const base = 'rounded px-2 py-0.5 text-xs font-medium';
  if (s === 'DITERIMA') return `${base} bg-positive/10 text-positive`;
  if (s === 'DITOLAK') return `${base} bg-negative/10 text-negative`;
  if (s === 'BARU') return `${base} bg-navy/10 text-navy`;
  return `${base} bg-amber-100 text-amber-700`;
}

// [FUNGSI] Satu baris dokumen: label, tanggal expired, dan link lihat file.
function DokumenRow({ doc }: { doc: Dokumen }) {
  return (
    <div className="flex items-center justify-between rounded border border-gray-200 p-3">
      <div>
        <span className="font-medium text-navy">{DOKUMEN_LABEL[doc.jenis] ?? doc.jenis}</span>
        {doc.tanggalExpired && (
          <p className="mt-0.5 text-xs text-gray-500">
            Expired: {doc.tanggalExpired.slice(0, 10)}
          </p>
        )}
      </div>
      <a href={doc.filePath} target="_blank" rel="noreferrer" className="text-sm text-navy underline">
        Lihat file
      </a>
    </div>
  );
}

export default function Recruitment() {
  const [items, setItems] = useState<Pelamar[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Pelamar | null>(null);
  const [status, setStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<Pelamar[]>('/recruitment/pelamar', {
        params: filter ? { status: filter } : {},
      });
      setItems(data);
    } catch {
      // [ALASAN] Abaikan error memuat; tabel cukup tampil kosong.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function openDetail(p: Pelamar) {
    try {
      const { data } = await api.get(`/recruitment/pelamar/${p.id}`);
      setSelected(data);
      setStatus(data.status);
      setSuccess('');
    } catch {
      // ignore
    }
  }

  async function saveStatus() {
    if (!selected) return;
    setSavingStatus(true);
    try {
      await api.patch(`/recruitment/pelamar/${selected.id}/status`, { status });
      setSelected({ ...selected, status });
      setSuccess('Status berhasil diubah');
      load();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Gagal mengubah status');
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Rekrutmen</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="mt-6 text-gray-500">Memuat...</p>
      ) : (
        <table className="mt-4 w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-navy-light text-left text-navy">
              <th className="px-3 py-2">No. Pendaftaran</th>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Posisi</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  Belum ada pelamar.
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono">{p.nomorPendaftaran}</td>
                <td className="px-3 py-2">{p.namaLengkap}</td>
                <td className="px-3 py-2">{p.posisiDilamar}</td>
                <td className="px-3 py-2">
                  <span className={statusBadge(p.status)}>{STATUS_LABEL[p.status]}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => openDetail(p)} className="text-navy hover:underline">
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy">{selected.namaLengkap}</h3>
                <p className="text-sm text-gray-500">
                  {selected.nomorPendaftaran} · {selected.posisiDilamar}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Tutup
              </button>
            </div>

            {success && (
              <div className="mt-4 rounded bg-positive/10 p-3 text-sm text-positive">{success}</div>
            )}

            <div className="mt-4 flex items-end gap-2 rounded border border-gray-200 p-3">
              <div>
                <label className="block text-xs text-gray-500">Status Seleksi</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={saveStatus}
                disabled={savingStatus}
                className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white"
              >
                {savingStatus ? 'Menyimpan...' : 'Simpan Status'}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <div><span className="text-gray-500">No HP:</span> {selected.noHp}</div>
              <div><span className="text-gray-500">Email:</span> {selected.email}</div>
              <div>
                <span className="text-gray-500">TTL:</span> {selected.tempatLahir}, {selected.tanggalLahir?.slice(0, 10)}
              </div>
              <div className="col-span-2"><span className="text-gray-500">Alamat:</span> {selected.alamat}</div>
              <div><span className="text-gray-500">Pengalaman:</span> {selected.pengalamanTahun ?? '-'} thn</div>
              <div><span className="text-gray-500">Kapal terakhir:</span> {selected.kapalTerakhir ?? '-'}</div>
            </div>

            <h4 className="mt-5 font-semibold text-navy">Dokumen</h4>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selected.documents.map((d) => (
                <DokumenRow key={d.id} doc={d} />
              ))}
            </div>
            {selected.documents.length === 0 && (
              <p className="mt-2 text-sm text-gray-400">Belum ada dokumen diunggah.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
