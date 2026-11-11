// client/src/components/leafletPin.ts
// [FUNGSI] Ikon marker peta berbentuk titik (divIcon).
// [ALASAN] Ikon default Leaflet mencari file gambar relatif ke CSS dan rusak di bundler Vite.

import L from 'leaflet';

export const pinKapal = L.divIcon({
  className: '',
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#0F2C4C;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(15,44,76,0.35)"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
