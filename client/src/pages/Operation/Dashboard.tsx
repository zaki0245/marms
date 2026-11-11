// client/src/pages/Operation/Dashboard.tsx
// [FUNGSI] Dashboard Operation: peta Indonesia dengan pin shipment yang sedang berjalan.
// [ALASAN] Operasional butuh melihat posisi seluruh voyage aktif dalam satu layar.

import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../api/client';
import MapResizer from '../../components/MapResizer';
import { pinKapal } from '../../components/leafletPin';
import { TILE_ATTRIBUTION, TILE_URL } from '../../components/mapTiles';
import { fmtUpdate, linkPosisi } from './types';

interface Ongoing {
  id: string;
  kode: string;
  tb: string;
  bg: string;
  pol: string;
  pod: string | null;
  position: string | null;
  remarks: string | null;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
}

export default function OperationDashboard() {
  const [items, setItems] = useState<Ongoing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Ongoing[]>('/operation/dashboard')
      .then(({ data }) => setItems(data))
      .catch(() => setError('Gagal memuat data shipment'))
      .finally(() => setLoading(false));
  }, []);

  const dipetakan = items.filter((s) => s.latitude != null && s.longitude != null);
  const tanpaKoordinat = items.length - dipetakan.length;

  return (
    <div>
      <h1 className="page-title">Dashboard Operation</h1>
      <p className="mt-1 text-sm text-gray-500">Posisi shipment yang sedang berjalan.</p>

      {error && <div className="mt-3 alert-error">{error}</div>}

      {loading ? (
        <p className="mt-4 text-gray-500">Memuat...</p>
      ) : (
        <>
          {TILE_URL ? (
            <div className="card mt-4 overflow-hidden">
              <MapContainer
                center={[-2.5, 118]}
                zoom={5}
                scrollWheelZoom
                className="h-[calc(100vh_-_11rem)] min-h-[420px] w-full"
              >
                <MapResizer />
                <TileLayer
                  attribution={TILE_ATTRIBUTION}
                  url={TILE_URL}
                />
                {dipetakan.map((s) => {
                  const link = linkPosisi(s.latitude, s.longitude);
                  return (
                    <Marker key={s.id} position={[s.latitude!, s.longitude!]} icon={pinKapal}>
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold">{s.tb} / {s.bg}</div>
                          <div className="text-xs text-gray-500">{s.kode}</div>
                          <div className="mt-1">{s.pol} &rarr; {s.pod ?? 'TBA'}</div>
                          <div>Posisi: {s.position ?? '-'}</div>
                          {s.remarks && <div>{s.remarks}</div>}
                          <div className="mt-1 text-xs text-gray-500">Update: {fmtUpdate(s.updatedAt)}</div>
                          {link && (
                            <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-navy underline">
                              Buka di Google Maps
                            </a>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          ) : (
            <div className="card mt-4 p-4 text-sm text-gray-500">
              Peta belum dikonfigurasi (VITE_GEOAPIFY_API_KEY).
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>{items.length} shipment berjalan · {dipetakan.length} tampil di peta</span>
            {tanpaKoordinat > 0 && <span>{tanpaKoordinat} shipment belum punya koordinat</span>}
          </div>
        </>
      )}
    </div>
  );
}
