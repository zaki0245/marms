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
      <h1 className="page-title">Master Data</h1>
      <div className="mt-4 flex border-b border-gray-200">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium ${
                isActive
                  ? '-mb-px border-b-2 border-gray-900 text-gray-900'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-900'
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
