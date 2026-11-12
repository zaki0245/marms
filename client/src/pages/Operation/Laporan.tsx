// client/src/pages/Operation/Laporan.tsx
// [FUNGSI] Laporan harian voyage untuk customer: versi gambar (email) & teks (WhatsApp).
// [ALASAN] Menggantikan tab VDR: gambar bisa ditempel ke email, teks memuat link posisi.

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import html2canvas from 'html2canvas';
import { api } from '../../api/client';
import MapResizer from '../../components/MapResizer';
import { pinKapal } from '../../components/leafletPin';
import { TILE_ATTRIBUTION, TILE_URL } from '../../components/mapTiles';
import {
  Shipment,
  fmtDesimal,
  fmtLaycan,
  fmtTanggalJam,
  tanggalLaporan,
} from './types';

// [FUNGSI] Satu baris label : nilai pada kartu laporan.
function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-40 shrink-0 text-gray-600">{label}</span>
      <span className="shrink-0">:</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function Judul({ children }: { children: ReactNode }) {
  return <div className="mt-4 rounded bg-gray-200 px-3 py-1 text-[13px] font-semibold">{children}</div>;
}

function Waktu({ label, iso }: { label: string; iso: string | null }) {
  return (
    <div className="flex gap-2 text-[13px]">
      <span className="w-48 shrink-0 text-gray-600">{label}</span>
      <span className="shrink-0">:</span>
      <span className="font-medium">{fmtTanggalJam(iso)}</span>
    </div>
  );
}

// [FUNGSI] Susun teks laporan WhatsApp persis template sheet (VDR).
function buatTeks(s: Shipment, peta: string): string {
  const link = peta || 'TBA';
  const garis = '-----------------------------------------';
  return [
    'DEAR ALL',
    'HEREBY INFORM TO YOU, THE UPDATES FOR BELOW NOMINATIONS:',
    '',
    `TB ${s.tb}`,
    `BG ${s.bg}`,
    garis,
    tanggalLaporan(),
    '',
    `LAYCAN : ${fmtLaycan(s.laycan)}`,
    garis,
    `DSR POL : ${fmtDesimal(s.dsrPol)}`,
    `DSR POD : ${fmtDesimal(s.dsrPod)}`,
    garis,
    `POL : ${s.pol}`,
    `POD : ${s.pod ?? 'TBA'}`,
    '',
    `STATUS : ${s.remarks ?? 'TBA'}`,
    `POSITION : ${s.position ?? 'TBA'}`,
    garis,
    '',
    'POL',
    `TA. POL = ${fmtTanggalJam(s.taPol)}`,
    `TB. POL = ${fmtTanggalJam(s.tbPol)}`,
    `COMMENCED LDG. = ${fmtTanggalJam(s.slPol)}`,
    `COMPLTD. LDG. = ${fmtTanggalJam(s.clPol)}`,
    `CAST OFF = ${fmtTanggalJam(s.coPol)}`,
    `TD = ${fmtTanggalJam(s.tdPol)}`,
    '',
    'POD',
    `TA. POD = ${fmtTanggalJam(s.taPod)}`,
    `TB. POD = ${fmtTanggalJam(s.tbPod)}`,
    `COMMENCED DISCH. = ${fmtTanggalJam(s.sdPod)}`,
    `COMPLTD. DISCH. = ${fmtTanggalJam(s.cdPod)}`,
    `CAST OFF = ${fmtTanggalJam(s.coPod)}`,
    `TD = ${fmtTanggalJam(s.tdPod)}`,
    garis,
    '',
    'CONTACT MASTER / CAPT. TB',
    s.contactMaster ?? 'TBA',
    '',
    'AGENT POL ',
    s.agentPol ?? 'TBA',
    s.picPol ?? 'TBA',
    s.contactAgentPol ?? 'TBA',
    '',
    'AGENT POD ',
    s.agentPod ?? 'TBA',
    s.picPod ?? 'TBA',
    s.contactAgentPod ?? 'TBA',
    '',
    `TRACKING POSITION : ${link}`,
    '',
    "B'RGRDS",
  ].join('\n');
}

// [FUNGSI] Level zoom peta yang ditawarkan di laporan (WA & email).
// [ALASAN] Angka 1-3 lebih mudah dipahami daripada nilai zoom Geoapify 5/8/11.
const LEVEL_ZOOM = [
  { level: 1, zoom: 5, label: 'Regional / pulau' },
  { level: 2, zoom: 8, label: 'Provinsi' },
  { level: 3, zoom: 11, label: 'Kota' },
] as const;

// [FUNGSI] Ukuran gambar peta statis di link WhatsApp (piksel).
const LEBAR_PETA = 600;
const TINGGI_PETA = 300;

export default function Laporan() {
  const { id } = useParams();
  const [s, setS] = useState<Shipment | null>(null);
  const [error, setError] = useState('');
  const [pesanGambar, setPesanGambar] = useState('');
  const [pesanTeks, setPesanTeks] = useState('');
  const [mapSiap, setMapSiap] = useState(false);
  const [zoom, setZoom] = useState(5);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Shipment>(`/operation/shipments/${id}`)
      .then(({ data }) => setS(data))
      .catch(() => setError('Gagal memuat shipment'));
  }, [id]);

  // [FUNGSI] Reset status peta saat ganti shipment/zoom. | [ALASAN] Jangan copy sebelum peta baru termuat.
  useEffect(() => {
    setMapSiap(false);
  }, [s?.id, zoom]);

  // [FUNGSI] Buka tombol copy setelah 5 detik walau tile peta gagal dimuat.
  useEffect(() => {
    if (!s) return;
    const t = setTimeout(() => setMapSiap(true), 5000);
    return () => clearTimeout(t);
  }, [s, zoom]);

  if (error) return <div className="alert-error">{error}</div>;
  if (!s) return <p className="text-gray-500">Memuat...</p>;

  const punyaKoordinat = s.latitude != null && s.longitude != null;
  const bisaCopy = !punyaKoordinat || mapSiap;
  // [FUNGSI] Tautan pendek ke server sendiri; API key Geoapify tetap di backend.
  // [ALASAN] Link ini dibagikan ke customer lewat WhatsApp dan tidak boleh memuat key.
  const peta = punyaKoordinat
    ? `${window.location.origin}/peta/${encodeURIComponent(s.kode)}${zoom === 5 ? '' : `?zoom=${zoom}`}`
    : '';
  const teks = buatTeks(s, peta);
  const kode = s.kode;

  async function buatBlob(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  function unduh(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${kode}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyGambar() {
    setPesanGambar('');
    try {
      const blob = await buatBlob();
      if (!blob) throw new Error('gagal');
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setPesanGambar('Gambar disalin. Tempel (Ctrl+V) di badan email.');
      } catch {
        unduh(blob);
        setPesanGambar('Browser tidak mengizinkan copy gambar; PNG diunduh.');
      }
    } catch {
      setPesanGambar('Gagal membuat gambar laporan.');
    }
  }

  async function unduhGambar() {
    setPesanGambar('');
    try {
      const blob = await buatBlob();
      if (!blob) throw new Error('gagal');
      unduh(blob);
      setPesanGambar('Gambar diunduh.');
    } catch {
      setPesanGambar('Gagal membuat gambar laporan.');
    }
  }

  async function copyTeks() {
    setPesanTeks('');
    try {
      await navigator.clipboard.writeText(teks);
      setPesanTeks('Teks disalin. Tempel di WhatsApp.');
    } catch {
      // [ALASAN] Fallback untuk browser tanpa Clipboard API.
      const area = document.createElement('textarea');
      area.value = teks;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      setPesanTeks('Teks disalin.');
    }
  }

  return (
    <div>
      <Link
        to="/dashboard/operation/shipment"
        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        &larr; Kembali ke Shipment
      </Link>
      <h1 className="page-title mt-2">Laporan {s.kode}</h1>

      {/* [FUNGSI] Satu level zoom untuk peta di teks WhatsApp & gambar email. */}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="label">Level zoom peta (WA &amp; email)</label>
          <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="input mt-1 w-56">
            {LEVEL_ZOOM.map((z) => (
              <option key={z.zoom} value={z.zoom}>
                Level {z.level} — {z.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-500">Berlaku untuk link peta WhatsApp dan peta pada gambar email.</p>
      </div>

      <div className="mt-4 space-y-6">
        {/* ---------- Laporan gambar (email) ---------- */}
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Laporan Gambar (email)</h2>
            <div className="flex gap-2">
              <button onClick={copyGambar} disabled={!bisaCopy} className="btn-primary disabled:opacity-50">
                Copy Gambar
              </button>
              <button onClick={unduhGambar} disabled={!bisaCopy} className="btn-secondary disabled:opacity-50">
                Unduh PNG
              </button>
            </div>
          </div>
          {!bisaCopy && <p className="mt-2 text-xs text-gray-500">Menunggu peta selesai dimuat...</p>}
          {pesanGambar && <p className="mt-2 text-xs text-gray-600">{pesanGambar}</p>}

          <div className="mt-3 overflow-x-auto rounded border border-gray-200">
            <div ref={cardRef} className="w-[720px] bg-white p-6 text-gray-900">
              <div className="flex items-center gap-4 border-b-2 border-navy pb-4">
                <img src="/logo.png" alt="MARMS" className="h-12 w-auto" />
                <div>
                  <div className="text-lg font-bold tracking-wide">DAILY MONITORING SHIPMENT</div>
                  <div className="mt-1 text-xs text-gray-600">Details Daily Report</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-[13px]">
                <Info label="Name of Vessel">
                  <div>{s.tb}</div>
                  <div>{s.bg}</div>
                </Info>
                <Info label="Contact Master / Captain">{s.contactMaster ?? 'TBA'}</Info>
                <Info label="Commodities">{s.commodities ?? 'TBA'}</Info>
                <Info label="Agent POL">{s.agentPol ?? 'TBA'}</Info>
                <Info label="Laycan">{s.laycan ?? 'TBA'}</Info>
                <Info label="Agent POD">{s.agentPod ?? 'TBA'}</Info>
                <Info label="POL">{s.pol}</Info>
                <Info label="Position">{s.position ?? 'TBA'}</Info>
                <Info label="POD">{s.pod ?? 'TBA'}</Info>
                <Info label="Current Status">{s.remarks ?? 'TBA'}</Info>
                <Info label="DSR POL">{fmtDesimal(s.dsrPol)}</Info>
                <Info label="DSR POD">{fmtDesimal(s.dsrPod)}</Info>
              </div>

              <Judul>Port of Loading</Judul>
              <div className="mt-2 space-y-0.5">
                <Waktu label="Time Arrivals POL" iso={s.taPol} />
                <Waktu label="Time Berthing POL" iso={s.tbPol} />
                <Waktu label="Commenced Loading" iso={s.slPol} />
                <Waktu label="Completed Loading" iso={s.clPol} />
                <Waktu label="Cast Off POL" iso={s.coPol} />
                <Waktu label="Time Departures" iso={s.tdPol} />
              </div>

              <Judul>Port of Discharge</Judul>
              <div className="mt-2 space-y-0.5">
                <Waktu label="Time Arrivals POD" iso={s.taPod} />
                <Waktu label="Time Berthing POD" iso={s.tbPod} />
                <Waktu label="Commenced Discharge" iso={s.sdPod} />
                <Waktu label="Completed Discharge" iso={s.cdPod} />
                <Waktu label="Cast Off POD" iso={s.coPod} />
                <Waktu label="Time Departures" iso={s.tdPod} />
              </div>

              <Judul>Position Status</Judul>
              <div className="mt-2 overflow-hidden rounded border border-gray-300">
                {punyaKoordinat && TILE_URL ? (
                  <MapContainer
                    key={zoom}
                    center={[s.latitude!, s.longitude!]}
                    zoom={zoom}
                    className="h-[180px] w-full"
                    dragging={false}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                  >
                    <MapResizer />
                    <TileLayer
                      attribution={TILE_ATTRIBUTION}
                      url={TILE_URL}
                      eventHandlers={{ load: () => setMapSiap(true) }}
                    />
                    <Marker position={[s.latitude!, s.longitude!]} icon={pinKapal} />
                  </MapContainer>
                ) : (
                  <div className="flex h-[100px] items-center justify-center text-xs text-gray-500">
                    {punyaKoordinat ? 'Peta belum dikonfigurasi (VITE_GEOAPIFY_API_KEY)' : 'Posisi belum tersedia'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Laporan teks (WhatsApp) ---------- */}
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Laporan Teks (WhatsApp)</h2>
            <button onClick={copyTeks} className="btn-primary">
              Copy Teks
            </button>
          </div>
          {pesanTeks && <p className="mt-2 text-xs text-gray-600">{pesanTeks}</p>}

          {peta && (
            <div className="mt-3 overflow-x-auto">
              <a href={peta} target="_blank" rel="noreferrer">
                <img
                  src={peta}
                  alt="Peta posisi kapal"
                  width={LEBAR_PETA}
                  height={TINGGI_PETA}
                  className="h-auto max-w-full rounded border border-gray-200"
                />
              </a>
            </div>
          )}

          <pre className="mt-3 max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded border border-gray-200 bg-surface p-4 text-[13px] text-gray-900">
            {teks}
          </pre>
        </section>
      </div>
    </div>
  );
}
