// ── Register Page ────────────────────────────────────────────────────────────
// Same split-hero layout as LoginPage, but with perks sidebar on the form side.
// Auth: Supabase — email/password + Google OAuth. No guest bypass.
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

const { useState } = React;

const C = {
  primary: '#0f766e',
  dark:    '#134e4a',
  accent:  '#f97316',
};

function Ico({ n, s = 20, c = 'currentColor', w = 1.75 }) {
  const d = {
    leaf:     <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>,
    check:    <><path d="M20 6 9 17l-5-5"/></>,
    sparkles: <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
    eye:      <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:   <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></>,
    user:     <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    lock:     <><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    mail:     <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {d[n]}
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const PERKS = [
  { icon: 'sparkles', label: 'AI Search', desc: 'Ask anything about crops, caves, NPCs' },
  { icon: 'leaf',     label: 'Full Database', desc: 'Browse every item, season & location' },
  { icon: 'check',    label: 'Always Free',   desc: 'No subscription, no paywalls' },
];

function SuccessState() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'bounceIn 0.5s ease',
      }}>
        <Ico n="check" s={34} c="#059669" w={2.5} />
      </div>
      <div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Welcome to the island! 🌴</h3>
        <p style={{ fontSize: 13.5, color: '#6b7a74', lineHeight: 1.65 }}>
          Check your email for a confirmation link, then sign in to start exploring.
        </p>
      </div>
      <button onClick={() => navigate('/login')} style={{
        padding: '12px 32px', background: C.primary, color: 'white',
        border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
        fontFamily: "'Inter', sans-serif", cursor: 'pointer',
      }}>
        Go to sign in
      </button>
    </div>
  );
}

function RegisterForm() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [success,  setSuccess]  = useState(false);

  function validate() {
    const e = {};
    if (!email.trim())                      e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))   e.email    = 'Enter a valid email';
    if (!password)                          e.password = 'Password is required';
    else if (password.length < 8)           e.password = 'At least 8 characters';
    if (!confirm)                           e.confirm  = 'Please confirm your password';
    else if (confirm !== password)          e.confirm  = 'Passwords do not match';
    setFieldErr(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    const { error: authErr } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authErr) { setError(authErr.message); return; }
    setSuccess(true);
  }

  async function handleGoogle() {
    setError('');
    const { error: authErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (authErr) setError(authErr.message);
  }

  if (success) return <SuccessState />;

  const fieldStyle = (err) => ({
    width: '100%', padding: '11px 12px 11px 38px',
    border: `1.5px solid ${err ? '#fca5a5' : '#e5e7eb'}`,
    borderRadius: 10, fontSize: 13.5, outline: 'none',
    fontFamily: "'Inter', sans-serif", color: '#111827',
    background: err ? '#fef2f2' : 'white',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  });

  return (
    <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 13px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: fieldErr.email ? '#dc2626' : '#9ca3af', display: 'flex' }}>
            <Ico n="mail" s={16} />
          </div>
          <input type="email" value={email} placeholder="you@example.com"
            onChange={e => { setEmail(e.target.value); setFieldErr(p => ({ ...p, email: '' })); }}
            style={fieldStyle(fieldErr.email)} />
        </div>
        {fieldErr.email && <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{fieldErr.email}</p>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: fieldErr.password ? '#dc2626' : '#9ca3af', display: 'flex' }}>
            <Ico n="lock" s={16} />
          </div>
          <input type={showPw ? 'text' : 'password'} value={password} placeholder="At least 8 characters"
            onChange={e => { setPassword(e.target.value); setFieldErr(p => ({ ...p, password: '' })); }}
            style={{ ...fieldStyle(fieldErr.password), paddingRight: 40 }} />
          <button type="button" onClick={() => setShowPw(p => !p)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex',
          }}>
            <Ico n={showPw ? 'eyeOff' : 'eye'} s={16} />
          </button>
        </div>
        {fieldErr.password && <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{fieldErr.password}</p>}
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirm password</label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: fieldErr.confirm ? '#dc2626' : '#9ca3af', display: 'flex' }}>
            <Ico n="lock" s={16} />
          </div>
          <input type={showCf ? 'text' : 'password'} value={confirm} placeholder="Repeat your password"
            onChange={e => { setConfirm(e.target.value); setFieldErr(p => ({ ...p, confirm: '' })); }}
            style={{ ...fieldStyle(fieldErr.confirm), paddingRight: 40 }} />
          <button type="button" onClick={() => setShowCf(p => !p)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex',
          }}>
            <Ico n={showCf ? 'eyeOff' : 'eye'} s={16} />
          </button>
        </div>
        {fieldErr.confirm && <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{fieldErr.confirm}</p>}
      </div>

      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '13px', marginBottom: 14,
        background: loading ? '#5eead4' : C.primary,
        border: 'none', borderRadius: 10, color: 'white',
        fontSize: 14.5, fontWeight: 600, fontFamily: "'Inter', sans-serif",
        cursor: loading ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {loading
          ? <><div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating account…</>
          : 'Create Account'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>or</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      <button type="button" onClick={handleGoogle} style={{
        width: '100%', padding: '12px',
        background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10,
        color: '#374151', fontSize: 14, fontWeight: 500,
        fontFamily: "'Inter', sans-serif", cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}>
        <GoogleLogo /> Sign up with Google
      </button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left hero */}
      <div style={{
        flex: '1 1 55%',
        background: 'linear-gradient(148deg, #071e1c 0%, #0b3330 45%, #134e4a 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '36px 48px', position: 'relative', overflow: 'hidden',
      }}>
        {[
          { w: 480, h: 480, top: -200, right: -160, anim: 'blob1 14s ease-in-out infinite', g: 'rgba(15,118,110,0.28)' },
          { w: 300, h: 300, bottom: -80, left: -70, anim: 'blob2 18s ease-in-out infinite', g: 'rgba(249,115,22,0.12)' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', width: b.w, height: b.h, borderRadius: '50%',
            top: b.top, right: b.right, bottom: b.bottom, left: b.left,
            background: `radial-gradient(circle, ${b.g} 0%, transparent 70%)`,
            animation: b.anim, pointerEvents: 'none',
          }} />
        ))}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative', zIndex: 2 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #0d9488, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico n="leaf" s={20} c="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16 }}>Coral Island</div>
            <div style={{ color: '#5eead4', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>Database</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2, gap: 32, paddingTop: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 14 }}>
              Join the island.<br />
              <span style={{ color: C.accent, fontStyle: 'italic' }}>Everything unlocked.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.65, maxWidth: 420 }}>
              Create a free account to access every feature — including the AI guide that answers any question about the game.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PERKS.map((p) => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ico n={p.icon} s={20} c="#5eead4" />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{p.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, position: 'relative', zIndex: 2, paddingTop: 12 }}>
          v1.0.0 · Fan-made companion · Not affiliated with Stairway Games
        </div>
      </div>

      {/* Right registration panel */}
      <div style={{
        flex: '0 0 420px', background: '#fefce8',
        display: 'flex', flexDirection: 'column',
        padding: '44px 44px 36px', overflow: 'auto',
        borderLeft: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌺</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: C.dark, marginBottom: 7 }}>Create account</h2>
          <p style={{ fontSize: 13.5, color: '#6b7a74', lineHeight: 1.55 }}>
            Free forever. AI search, full database, NPC guides.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
