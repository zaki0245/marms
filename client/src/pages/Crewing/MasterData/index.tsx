// client/src/pages/MasterData/index.tsx
// [FUNGSI] Kerangka halaman Master Data dengan sub-navigasi.
// [ALASAN] Menyatukan Jabatan, Kapal, dan Pengaturan dalam satu menu.

import { NavLink, Outlet } from 'react-router-dom';

export default function MasterData() {
  const tabs = [
    { to: '/dashboard/master-data/jabatan', label: 'Jabatan' },
    { to: '/dashboard/master-data/kapal', label: 'Kapal' },
    { to: '/dashboard/master-data/pengaturan', label: 'Uang Makan' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy">Master Data</h2>
      <div className="mt-4 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `rounded-t px-4 py-2 text-sm font-semibold ${
                isActive
                  ? 'bg-white text-navy border-b-2 border-navy'
                  : 'text-gray-500 hover:text-navy'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
