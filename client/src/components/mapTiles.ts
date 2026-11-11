// client/src/components/mapTiles.ts
// [FUNGSI] URL tile peta Geoapify (osm-carto) + atribusi wajib.
// [ALASAN] Dipakai dua halaman (Dashboard & Laporan) agar URL/atribusi tidak berbeda.
// [ALASAN] Key dibaca dari VITE_GEOAPIFY_API_KEY saat build; kosong = peta tidak dirender.

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export const TILE_URL = API_KEY
  ? `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}{r}.png?apiKey=${API_KEY}`
  : '';

export const TILE_ATTRIBUTION =
  'Powered by <a href="https://www.geoapify.com/">Geoapify</a> | ' +
  '<a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>';
