import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import AppShell from './pages/AppShell.jsx';

// Login is the entry point (matches the design's two-file flow:
// Login.html -> Coral Island Database.html). Sign In / Continue as Guest
// both navigate to /app. Add real auth middleware here later if desired.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AppShell />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
