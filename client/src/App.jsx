import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

const LoginPage    = React.lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage.jsx'));
const AppShell     = React.lazy(() => import('./pages/AppShell.jsx'));
const AdminPage    = React.lazy(() => import('./pages/AdminPage.jsx'));

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
          <Routes>
            <Route path="/"        element={<Navigate to="/login" replace />} />
            <Route path="/login"   element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/app"     element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
            <Route path="/admin"   element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
            <Route path="*"        element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
