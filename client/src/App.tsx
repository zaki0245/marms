// client/src/App.tsx
// [FUNGSI] Mendefinisikan rute (routing) aplikasi.
// [ALASAN] Semua halaman diatur di sini lewat react-router-dom.

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import Jabatan from './pages/MasterData/Jabatan';
import Kapal from './pages/MasterData/Kapal';
import Pengaturan from './pages/MasterData/Pengaturan';
import PublicHome from './pages/public/PublicHome';
import Daftar from './pages/public/Daftar';
import TerimaKasih from './pages/public/TerimaKasih';
import Login from './pages/Login';
import Recruitment from './pages/Recruitment';
import Crew from './pages/Crew';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import Accounts from './pages/Accounts';

export default function App() {
  return (
    <Routes>
      {/* Publik (tanpa login) */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/daftar" element={<Daftar />} />
      <Route path="/terima-kasih" element={<TerimaKasih />} />
      <Route path="/admin/login" element={<Login />} />

      {/* Admin */}
      <Route path="/admin" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="master-data" element={<MasterData />}>
          <Route index element={<Navigate to="jabatan" replace />} />
          <Route path="jabatan" element={<Jabatan />} />
          <Route path="kapal" element={<Kapal />} />
          <Route path="pengaturan" element={<Pengaturan />} />
        </Route>
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="crew" element={<Crew />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="reports" element={<Reports />} />
        <Route path="finance" element={<Finance />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
