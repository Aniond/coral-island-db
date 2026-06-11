// ── App.jsx — updated to include /register route ─────────────────────────────
// Changes from original:
//   1. Import RegisterPage
//   2. Add <Route path="/register" element={<RegisterPage />} />
//
// Drop this file in as a full replacement for client/src/App.jsx.
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage    from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AppShell     from './pages/AppShell.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<Navigate to="/login" replace />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app"      element={<AppShell />} />
      <Route path="*"         element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
