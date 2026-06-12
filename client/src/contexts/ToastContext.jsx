import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';

const ToastContext = React.createContext();

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const toast = React.useMemo(() => ({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info')
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'white', borderRadius: 12, padding: '12px 16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: `1px solid ${THEME.cardBorder}`,
            display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto',
            animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: t.type === 'success' ? '#dcfce7' : t.type === 'error' ? '#fee2e2' : THEME.primaryXLight,
              color: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : THEME.primary
            }}>
              <Icon name={t.type === 'success' ? 'check' : t.type === 'error' ? 'x' : 'info'} size={14} color="currentColor" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: THEME.textDark, fontFamily: "'Inter', sans-serif" }}>{t.message}</div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
