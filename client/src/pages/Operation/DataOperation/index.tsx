// client/src/pages/Operation/DataOperation/index.tsx
// [FUNGSI] Kerangka halaman Data Operation dengan sub-navigasi.
// [ALASAN] Menyatukan master Unit Kapal dan Agen dalam satu menu.

import { NavLink, Outlet } from 'react-router-dom';

export default function DataOperation() {
  const tabs = [
    { to: '/dashboard/operation/data-operation/unit-kapal', label: 'Unit Kapal' },
    { to: '/dashboard/operation/data-operation/agent', label: 'Agen' },
  ];

  return (
    <div>
      <h1 className="page-title">Data Operation</h1>
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
