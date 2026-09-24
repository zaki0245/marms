// client/src/pages/MasterData/index.tsx
// [FUNGSI] Kerangka halaman Master Data dengan sub-navigasi.
// [ALASAN] Menyatukan Jabatan, Kapal, dan Pengaturan dalam satu menu.

import { NavLink, Outlet } from 'react-router-dom';

export default function MasterData() {
  const tabs = [
    { to: '/admin/master-data/jabatan', label: 'Jabatan' },
    { to: '/admin/master-data/kapal', label: 'Kapal' },
    { to: '/admin/master-data/pengaturan', label: 'Uang Makan' },
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
              `px-4 py-2 text-sm font-medium ${
                isActive
                  ? 'border-b-2 border-navy text-navy'
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
