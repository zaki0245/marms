// client/src/main.tsx
// [FUNGSI] Titik masuk React: merender aplikasi ke elemen #root.
// [ALASAN] Ini file pertama yang dijalankan browser.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
