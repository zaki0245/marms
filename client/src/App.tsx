// client/src/App.tsx
// [FUNGSI] Mendefinisikan rute (routing) aplikasi.
// [ALASAN] Semua halaman diatur di sini lewat react-router-dom.

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Crewing';
import MasterData from './pages/Crewing/MasterData';
import Jabatan from './pages/Crewing/MasterData/Jabatan';
import Kapal from './pages/Crewing/MasterData/Kapal';
import Pengaturan from './pages/Crewing/MasterData/Pengaturan';
import PublicHome from './pages/public/PublicHome';
import Daftar from './pages/public/Daftar';
import TerimaKasih from './pages/public/TerimaKasih';
import Login from './pages/Login';
import Recruitment from './pages/Crewing/Recruitment';
import Crew from './pages/Crewing/Crew';
import Payroll from './pages/Crewing/Payroll';
import Reports from './pages/Crewing/Reports';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import FinanceDaftarInvoice from './pages/Finance/DaftarInvoice';
import FinanceInputInvoice from './pages/Finance/InputInvoice';
import FinanceCetakPv from './pages/Finance/Cetak';
import FinanceVendor from './pages/Finance/Vendor';
import FinanceCustomer from './pages/Finance/Customer';
import FinanceLaporan from './pages/Finance/Laporan';
import FinanceKonfigurasi from './pages/Finance/Konfigurasi';
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
        <Route path="finance/invoice" element={<FinanceDaftarInvoice />} />
        <Route path="finance/invoice/input" element={<FinanceInputInvoice />} />
        <Route path="finance/invoice/input/:id" element={<FinanceInputInvoice />} />
        <Route path="finance/cetak" element={<FinanceCetakPv />} />
        <Route path="finance/vendor" element={<FinanceVendor />} />
        <Route path="finance/customer" element={<FinanceCustomer />} />
        <Route path="finance/laporan" element={<FinanceLaporan />} />
        <Route path="finance/konfigurasi" element={<FinanceKonfigurasi />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
