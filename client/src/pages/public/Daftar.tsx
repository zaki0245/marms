// client/src/pages/public/Daftar.tsx
// [FUNGSI] Form pendaftaran pelamar publik + upload 21 dokumen.
// [ALASAN] Pintu masuk data pelamar; duplikat email/HP ditolak oleh backend.

import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { DOKUMEN } from '../../constants';
import Logo from '../../components/Logo';

interface Jabatan {
  kode: string;
  nama: string;
}

const emptyForm = {
  namaLengkap: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'LAKI_LAKI',
  noHp: '',
  email: '',
  alamat: '',
  posisiDilamar: '',
  pengalamanTahun: '',
  kapalTerakhir: '',
  jabatanTerakhir: '',
};

export default function Daftar() {
  const navigate = useNavigate();
  const [jabatan, setJabatan] = useState<Jabatan[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // [FUNGSI] Muat daftar jabatan untuk dropdown "Posisi dilamar".
    api
      .get<Jabatan[]>('/master-data/jabatan')
      .then(({ data }) => setJabatan(data))
      .catch(() => undefined);
  }, []);

  function setField(k: keyof typeof emptyForm, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    // [FUNGSI] Hitung dokumen yang belum diunggah; konfirmasi bila ada yang kosong.
    // [ALASAN] Dokumen opsional, tapi pelamar tetap diingatkan bila belum lengkap.
    const uploaded = DOKUMEN.filter((d) => files[d.kode]).length;
    const missing = DOKUMEN.length - uploaded;
    if (missing > 0) {
      const ok = window.confirm(
        `Masih ada ${missing} dokumen yang belum diunggah. Lanjutkan pendaftaran?`
      );
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      (Object.keys(form) as (keyof typeof emptyForm)[]).forEach((k) => fd.append(k, form[k]));
      DOKUMEN.forEach((d) => {
        const f = files[d.kode];
        if (f) fd.append(`dokumen_${d.kode}`, f);
        if (d.expired && expiry[d.kode]) fd.append(`tanggalExpired_${d.kode}`, expiry[d.kode]);
      });
      await api.post('/recruitment/pelamar', fd);
      navigate('/terima-kasih');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal mengirim pendaftaran');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'mt-1 w-full rounded border border-gray-300 px-3 py-2';

  return (
    <div className="min-h-screen bg-surface pb-16">
      <header className="bg-navy px-6 py-5 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <span className="text-xl font-bold">MARMS</span>
          </div>
          <p className="mt-1 text-sm text-white/70">Formulir Pendaftaran Pelamar</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {error && (
          <div className="mb-4 rounded bg-negative/10 p-3 text-sm text-negative">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Pribadi */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-navy">Data Pribadi</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500">Nama Lengkap *</label>
                <input required value={form.namaLengkap} onChange={(e) => setField('namaLengkap', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tempat Lahir *</label>
                <input required value={form.tempatLahir} onChange={(e) => setField('tempatLahir', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Tanggal Lahir *</label>
                <input required type="date" value={form.tanggalLahir} onChange={(e) => setField('tanggalLahir', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Jenis Kelamin</label>
                <select value={form.jenisKelamin} onChange={(e) => setField('jenisKelamin', e.target.value)} className={inputCls}>
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">No HP/WA *</label>
                <input required value={form.noHp} onChange={(e) => setField('noHp', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500">Alamat *</label>
                <input required value={form.alamat} onChange={(e) => setField('alamat', e.target.value)} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Data Pengalaman */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-navy">Data Pengalaman</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-500">Posisi Dilamar *</label>
                <select required value={form.posisiDilamar} onChange={(e) => setField('posisiDilamar', e.target.value)} className={inputCls}>
                  <option value="">Pilih posisi</option>
                  {jabatan.map((j) => (
                    <option key={j.kode} value={j.nama}>{j.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Pengalaman (tahun)</label>
                <input type="number" min={0} value={form.pengalamanTahun} onChange={(e) => setField('pengalamanTahun', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Kapal Terakhir</label>
                <input value={form.kapalTerakhir} onChange={(e) => setField('kapalTerakhir', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Jabatan Terakhir</label>
                <input value={form.jabatanTerakhir} onChange={(e) => setField('jabatanTerakhir', e.target.value)} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Dokumen */}
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-navy">Dokumen</h2>
            <p className="text-xs text-gray-500">PDF/JPG/PNG, maksimal 5 MB per file. Boleh diunggah sebagian.</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DOKUMEN.map((d) => (
                <div key={d.kode}>
                  <label className="block text-xs text-gray-500">
                    {d.label}{d.expired ? ' (berlaku s/d tanggal)' : ''}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFiles({ ...files, [d.kode]: e.target.files?.[0] ?? null })}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  {d.expired && (
                    <input
                      type="date"
                      value={expiry[d.kode] ?? ''}
                      onChange={(e) => setExpiry({ ...expiry, [d.kode]: e.target.value })}
                      className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-navy px-6 py-3 text-lg font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
          </button>
        </form>
      </main>
    </div>
  );
}
