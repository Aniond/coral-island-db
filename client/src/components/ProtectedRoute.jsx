import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const THEME = { primary: '#0f766e' };

function Spinner() {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#fefce8' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `3px solid rgba(15,118,110,0.2)`,
        borderTopColor: THEME.primary,
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/app" replace />;
  return children;
}
