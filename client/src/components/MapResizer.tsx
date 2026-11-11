// client/src/components/MapResizer.tsx
// [FUNGSI] Segarkan ukuran peta saat container berubah.
// [ALASAN] Leaflet hanya menghitung ukuran saat mount; tanpa ini peta tidak ikut resize.

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}
