// ── AuthButton ───────────────────────────────────────────────────────────────
// Sidebar footer widget: "Sign in with Google" when logged out,
// avatar + email + sign-out when logged in.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const { useState } = React;

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Avatar({ user }) {
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials  = (user?.email || '?').slice(0, 1).toUpperCase();
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="" style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        border: '2px solid rgba(94,234,212,0.4)',
        objectFit: 'cover',
      }} />
    );
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #0d9488, #f97316)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: 'white',
    }}>
      {initials}
    </div>
  );
}

export default function AuthButton() {
  const { session, user, isAdmin, signOut } = useAuth();
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    setLoading(false);
  }

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate('/login');
  }

  // ── Logged out ─────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <button
        onClick={handleSignIn}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '9px 12px',
          background: loading ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 8, cursor: loading ? 'default' : 'pointer',
          color: 'white', fontSize: 13, fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
      >
        {loading
          ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          : <GoogleLogo />}
        {loading ? 'Signing in…' : 'Sign in with Google'}
      </button>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  const email     = user?.email || '';
  const shortEmail = email.length > 22 ? email.slice(0, 20) + '…' : email;

  return (
    <div style={{ position: 'relative' }}>
      {/* User pill */}
      <button
        onClick={() => setMenuOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          width: '100%', padding: '7px 10px',
          background: menuOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, cursor: 'pointer',
          textAlign: 'left', transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      >
        <Avatar user={user} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortEmail}
          </div>
          {isAdmin && (
            <div style={{ fontSize: 10, color: '#f97316', fontWeight: 600, marginTop: 1 }}>Admin</div>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setMenuOpen(false)} />
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#1a2e2b', border: '1px solid rgba(94,234,212,0.2)',
            borderRadius: 9, overflow: 'hidden', zIndex: 50,
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
          }}>
            {isAdmin && (
              <button onClick={() => { setMenuOpen(false); navigate('/admin'); }} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '10px 13px',
                background: 'transparent', border: 'none',
                color: '#a78bfa', fontSize: 13, fontWeight: 500,
                fontFamily: "'Inter', sans-serif", cursor: 'pointer',
                borderBottom: '1px solid rgba(94,234,212,0.1)',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                Admin dashboard
              </button>
            )}
            <button onClick={handleSignOut} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '10px 13px',
              background: 'transparent', border: 'none',
              color: '#f87171', fontSize: 13, fontWeight: 500,
              fontFamily: "'Inter', sans-serif", cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
