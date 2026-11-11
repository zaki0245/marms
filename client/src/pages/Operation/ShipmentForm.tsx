// client/src/pages/Operation/ShipmentForm.tsx
// [FUNGSI] Modal form tambah/edit shipment (identitas, POL/POD, laytime, posisi, dokumen).
// [ALASAN] Data voyage diisi sekali di sini; laytime dihitung backend saat disimpan.

import { FormEvent, useState } from 'react';
import { api } from '../../api/client';
import { Shipment, ShipmentDocument, ShipmentStatus, STATUS_LABEL } from './types';

const KOSONG = {
  tb: '',
  bg: '',
  ownerOperator: '',
  shipper: '',
  commodities: '',
  contactMaster: '',
  laycan: '',
  pol: '',
  agentPol: '',
  picPol: '',
  contactAgentPol: '',
  pod: '',
  agentPod: '',
  picPod: '',
  contactAgentPod: '',
  taPol: '',
  tbPol: '',
  slPol: '',
  clPol: '',
  coPol: '',
  tdPol: '',
  dsPol: '',
  taPod: '',
  tbPod: '',
  sdPod: '',
  cdPod: '',
  coPod: '',
  tdPod: '',
  dsPod: '',
  laytimeAllowed: '',
  dsrPol: '',
  dsrPod: '',
  position: '',
  remarks: '',
  status: 'PLANNED',
  koordinat: '',
};

type FormState = typeof KOSONG;

// [FUNGSI] Daftar field yang disimpan sebagai tanggal.
const FIELD_TANGGAL: (keyof FormState)[] = [
  'taPol', 'tbPol', 'slPol', 'clPol', 'coPol', 'tdPol', 'dsPol',
  'taPod', 'tbPod', 'sdPod', 'cdPod', 'coPod', 'tdPod', 'dsPod',
];

// [FUNGSI] Ubah ISO dari server menjadi nilai input datetime-local (waktu WIB).
function keInputTanggal(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(new Date(iso))
    .replace(' ', 'T');
}

function dariShipment(s: Shipment): FormState {
  const teks = (v: string | null) => v ?? '';
  const angka = (v: number | null) => (v == null ? '' : String(v));
  return {
    tb: s.tb,
    bg: s.bg,
    ownerOperator: teks(s.ownerOperator),
    shipper: teks(s.shipper),
    commodities: teks(s.commodities),
    contactMaster: teks(s.contactMaster),
    laycan: teks(s.laycan),
    pol: s.pol,
    agentPol: teks(s.agentPol),
    picPol: teks(s.picPol),
    contactAgentPol: teks(s.contactAgentPol),
    pod: teks(s.pod),
    agentPod: teks(s.agentPod),
    picPod: teks(s.picPod),
    contactAgentPod: teks(s.contactAgentPod),
    taPol: keInputTanggal(s.taPol),
    tbPol: keInputTanggal(s.tbPol),
    slPol: keInputTanggal(s.slPol),
    clPol: keInputTanggal(s.clPol),
    coPol: keInputTanggal(s.coPol),
    tdPol: keInputTanggal(s.tdPol),
    dsPol: keInputTanggal(s.dsPol),
    taPod: keInputTanggal(s.taPod),
    tbPod: keInputTanggal(s.tbPod),
    sdPod: keInputTanggal(s.sdPod),
    cdPod: keInputTanggal(s.cdPod),
    coPod: keInputTanggal(s.coPod),
    tdPod: keInputTanggal(s.tdPod),
    dsPod: keInputTanggal(s.dsPod),
    laytimeAllowed: angka(s.laytimeAllowed),
    dsrPol: angka(s.dsrPol),
    dsrPod: angka(s.dsrPod),
    position: teks(s.position),
    remarks: teks(s.remarks),
    status: s.status,
    koordinat: s.latitude != null && s.longitude != null ? `${s.latitude} ${s.longitude}` : '',
  };
}

export default function ShipmentForm({
  initial,
  onClose,
  onSaved,
  onRefresh,
}: {
  initial: Shipment | null;
  onClose: () => void;
  onSaved: () => void;
  onRefresh?: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial ? dariShipment(initial) : KOSONG);
  const [files, setFiles] = useState<File[]>([]);
  const [docs, setDocs] = useState<ShipmentDocument[]>(initial?.documents ?? []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setField(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // [FUNGSI] Hapus satu dokumen langsung (tanpa menunggu Simpan).
  async function hapusDokumen(doc: ShipmentDocument) {
    if (!initial) return;
    setError('');
    if (!window.confirm(`Hapus dokumen "${doc.nama}"?`)) return;
    try {
      await api.delete(`/operation/shipments/${initial.id}/documents/${doc.id}`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      onRefresh?.();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menghapus dokumen');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    // [FUNGSI] Pecah satu field "lat lng" menjadi dua angka. | [ALASAN] Data & peta butuh angka terpisah.
    const bagian = form.koordinat.trim().split(/\s+/).filter(Boolean);
    let lat: number | null = null;
    let lng: number | null = null;
    if (bagian.length > 0) {
      lat = Number(bagian[0]);
      lng = Number(bagian[1]);
      if (
        bagian.length !== 2 ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        setError('Format koordinat harus "lat lng", contoh: -7.70646 113.57935');
        return;
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      (Object.keys(form) as (keyof FormState)[]).forEach((k) => {
        const v = form[k];
        // [FUNGSI] Kirim tanggal sebagai ISO agar backend tidak salah zona waktu.
        fd.append(k, FIELD_TANGGAL.includes(k) && v ? new Date(v).toISOString() : v);
      });
      fd.append('latitude', lat == null ? '' : String(lat));
      fd.append('longitude', lng == null ? '' : String(lng));
      files.forEach((f) => fd.append('documents', f));

      if (initial) {
        await api.put(`/operation/shipments/${initial.id}`, fd);
      } else {
        await api.post('/operation/shipments', fd);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Gagal menyimpan shipment');
    } finally {
      setLoading(false);
    }
  }

  // [FUNGSI] Input teks/angka/tanggal dengan label seragam.
  const teks = (k: keyof FormState, label: string) => (
    <div key={k}>
      <label className="label">{label}</label>
      <input value={form[k]} onChange={(e) => setField(k, e.target.value)} className="input mt-1 w-full" />
    </div>
  );

  const angka = (k: keyof FormState, label: string) => (
    <div key={k}>
      <label className="label">{label}</label>
      <input type="number" step="any" value={form[k]} onChange={(e) => setField(k, e.target.value)} className="input mt-1 w-full" />
    </div>
  );

  const waktu = (k: keyof FormState, label: string) => (
    <div key={k}>
      <label className="label">{label}</label>
      <input type="datetime-local" value={form[k]} onChange={(e) => setField(k, e.target.value)} className="input mt-1 w-full" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {initial ? `Edit Shipment ${initial.kode}` : 'Buat Shipment'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {error && <div className="alert-error">{error}</div>}

          <section>
            <h4 className="font-semibold text-gray-900">Identitas &amp; Voyage</h4>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {teks('tb', 'TB *')}
              {teks('bg', 'BG *')}
              {teks('ownerOperator', 'Barges Owners / Operator')}
              {teks('shipper', 'Shipper')}
              {teks('commodities', 'Commodities')}
              {teks('contactMaster', 'Contact Master / Captain')}
              {teks('laycan', 'Laycan')}
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={(e) => setField('status', e.target.value)} className="input mt-1 w-full">
                  {(Object.keys(STATUS_LABEL) as ShipmentStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900">Port of Loading (POL)</h4>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {teks('pol', 'POL *')}
              {teks('agentPol', 'Agent POL')}
              {teks('picPol', 'PIC POL')}
              {teks('contactAgentPol', 'Contact Agent POL')}
              {waktu('taPol', 'Time Arrivals POL')}
              {waktu('tbPol', 'Time Berthing POL')}
              {waktu('slPol', 'Commenced Loading')}
              {waktu('clPol', 'Completed Loading')}
              {waktu('coPol', 'Cast Off POL')}
              {waktu('tdPol', 'Time Departures POL')}
              {waktu('dsPol', 'DS POL')}
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900">Port of Discharge (POD)</h4>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {teks('pod', 'POD')}
              {teks('agentPod', 'Agent POD')}
              {teks('picPod', 'PIC POD')}
              {teks('contactAgentPod', 'Contact Agent POD')}
              {waktu('taPod', 'Time Arrivals POD')}
              {waktu('tbPod', 'Time Berthing POD')}
              {waktu('sdPod', 'Commenced Discharge')}
              {waktu('cdPod', 'Completed Discharge')}
              {waktu('coPod', 'Cast Off POD')}
              {waktu('tdPod', 'Time Departures POD')}
              {waktu('dsPod', 'DS POD')}
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900">Laytime &amp; DSR</h4>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {angka('laytimeAllowed', 'Laytime Allowed (hari)')}
              {angka('dsrPol', 'DSR POL')}
              {angka('dsrPod', 'DSR POD')}
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900">Posisi &amp; Laporan</h4>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {teks('position', 'Position')}
              <div>
                <label className="label">Koordinat (lat lng)</label>
                <input
                  value={form.koordinat}
                  onChange={(e) => setField('koordinat', e.target.value)}
                  placeholder="-7.70646 113.57935"
                  className="input mt-1 w-full"
                />
                <p className="mt-1 text-xs text-gray-500">Pisahkan latitude dan longitude dengan spasi.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Remarks / Status</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setField('remarks', e.target.value)}
                  rows={2}
                  className="input mt-1 w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Dokumen</label>
                {docs.length > 0 && (
                  <ul className="mb-2 space-y-1">
                    {docs.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 rounded border border-gray-200 px-2 py-1 text-sm">
                        <a href={`/uploads/${d.file}`} target="_blank" rel="noreferrer" className="truncate text-navy hover:underline">
                          {d.nama}
                        </a>
                        <button
                          type="button"
                          onClick={() => hapusDokumen(d)}
                          className="shrink-0 rounded-md border border-negative/40 px-2 py-0.5 text-xs text-negative hover:bg-negative/5"
                        >
                          Hapus
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="input mt-1 w-full px-2 py-1.5"
                />
                <p className="mt-1 text-xs text-gray-500">PDF/JPG/PNG, maks 5 MB per file. Bisa pilih beberapa file.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
