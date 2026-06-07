// ── Mobile Top Bar ───────────────────────────────────────────────────────────
// Shown only on phones (toggled via #ci-mobile-topbar media query in index.css).
// Gives mobile users the logo/branding + an account menu (admin / sign out),
// which otherwise live in the desktop sidebar that's hidden on mobile.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function MobileTopBar() {
  const { session, user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials  = (user?.email || '?').slice(0, 1).toUpperCase();

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
  }
  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/login');
  }

  return (
    <div id="ci-mobile-topbar" style={{
      display: 'none',
      position: 'fixed', top: 0, left: 0, right: 0, height: 52,
      background: '#134e4a', zIndex: 150,
      alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px',
      borderBottom: '1px solid rgba(94,234,212,0.18)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #0d9488 0%, var(--accent, #f97316) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="leaf" size={16} color="white" />
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ color: 'white', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14 }}>
            Coral Island
          </div>
          <div style={{ color: '#5eead4', fontSize: 8.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Database
          </div>
        </div>
      </div>

      {/* Account */}
      <div style={{ position: 'relative' }}>
        {session ? (
          <button
            onClick={() => setOpen(p => !p)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '2px solid rgba(94,234,212,0.45)', objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d9488, #f97316)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'white',
              }}>{initials}</div>
            )}
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, color: 'white', fontSize: 12.5, fontWeight: 500,
              padding: '6px 12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Sign in
          </button>
        )}

        {/* Dropdown */}
        {open && session && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 190,
              background: '#1a2e2b', border: '1px solid rgba(94,234,212,0.2)',
              borderRadius: 10, overflow: 'hidden', zIndex: 50,
              boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
            }}>
              <div style={{ padding: '11px 13px', borderBottom: '1px solid rgba(94,234,212,0.12)' }}>
                <div style={{ color: 'white', fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </div>
                {isAdmin && <div style={{ color: '#f97316', fontSize: 10.5, fontWeight: 600, marginTop: 2 }}>Admin</div>}
              </div>
              {isAdmin && (
                <button onClick={() => { setOpen(false); navigate('/admin'); }} style={menuItem('#a78bfa', true)}>
                  <Icon name="users" size={14} color="#a78bfa" /> Admin dashboard
                </button>
              )}
              <button onClick={handleSignOut} style={menuItem('#f87171', false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function menuItem(color, border) {
  return {
    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
    padding: '11px 13px', background: 'transparent', border: 'none',
    color, fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif",
    cursor: 'pointer', textAlign: 'left',
    borderBottom: border ? '1px solid rgba(94,234,212,0.1)' : 'none',
  };
}
