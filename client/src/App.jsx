import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import LoginPage    from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AppShell     from './pages/AppShell.jsx';
import AdminPage    from './pages/AdminPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"        element={<Navigate to="/login" replace />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app"     element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
        <Route path="/admin"   element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
        <Route path="*"        element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
