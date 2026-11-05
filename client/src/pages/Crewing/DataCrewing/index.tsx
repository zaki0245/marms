// client/src/pages/Crewing/DataCrewing/index.tsx
// [FUNGSI] Kerangka halaman Data Crewing dengan sub-navigasi.
// [ALASAN] Menyatukan Jabatan dan Uang Makan dalam satu menu.
//          Kapal sudah dipindah ke modul top-level "Data Master".

import { NavLink, Outlet } from 'react-router-dom';

export default function DataCrewing() {
  const tabs = [
    { to: '/dashboard/data-crewing/jabatan', label: 'Jabatan' },
    { to: '/dashboard/data-crewing/pengaturan', label: 'Uang Makan' },
  ];

  return (
    <div>
      <h1 className="page-title">Data Crewing</h1>
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
