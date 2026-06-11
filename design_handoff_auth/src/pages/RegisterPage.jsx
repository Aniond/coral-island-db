// ── Register / Create Account Page ──────────────────────────────────────────
// Split hero (brand perks) + register form. Matches Register.html reference.
// Drop into client/src/pages/ and add <Route path="/register"> in App.jsx.
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const { useState } = React;

const C = {
  primary: '#0f766e',
  dark:    '#134e4a',
  accent:  '#f97316',
  cream:   '#fefce8',
};

// ── Icons (same inline set as LoginPage) ─────────────────────────────────────
function Ico({ n, s = 20, c = 'currentColor', w = 1.75 }) {
  const d = {
    leaf:      <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>,
    user:      <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    mail:      <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
    lock:      <><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    eye:       <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:    <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></>,
    check:     <><path d="M20 6 9 17l-5-5"/></>,
    sparkles:  <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
    shield:    <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></>,
    arrowRight:<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {d[n]}
    </svg>
  );
}

// ── Google logo SVG ───────────────────────────────────────────────────────────
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

// ── Password strength ─────────────────────────────────────────────────────────
function strengthOf(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  const map = [
    { label: '',       color: '#e5e7eb' },
    { label: 'Weak',   color: '#ef4444' },
    { label: 'Fair',   color: '#f97316' },
    { label: 'Good',   color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
  ];
  return { score, ...map[score] };
}

function StrengthBar({ password }) {
  const { score, label, color } = strengthOf(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? color : '#e5e7eb',
            transition: 'background 0.25s',
          }} />
        ))}
      </div>
      {label && <p style={{ fontSize: 11, color, fontWeight: 600, letterSpacing: '0.02em' }}>{label}</p>}
    </div>
  );
}

// ── Perks ─────────────────────────────────────────────────────────────────────
const PERKS = [
  { icon: 'sparkles', title: 'AI companion',        desc: 'Ask anything about Coral Island — crops, NPCs, caves and more.' },
  { icon: 'leaf',     title: 'Track favourites',    desc: 'Bookmark items and build your personal collection list.' },
  { icon: 'shield',   title: 'Sync across devices', desc: 'Your data is saved securely and available everywhere.' },
];

// ── Register form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSuccess }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [errors,   setErrors]   = useState({});

  function validate() {
    const e = {};
    if (!name.trim())                        e.name     = 'Name is required';
    if (!email.trim())                       e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))   e.email    = 'Enter a valid email';
    if (!password)                           e.password = 'Password is required';
    else if (password.length < 6)            e.password = 'At least 6 characters';
    if (!confirm)                            e.confirm  = 'Please confirm your password';
    else if (confirm !== password)           e.confirm  = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // TODO: replace with your real auth call, e.g. supabase.auth.signUp(...)
    setTimeout(() => { setLoading(false); setSuccess(true); }, 1200);
    setTimeout(() => onSuccess(), 2600);
  }

  const fieldStyle = (err) => ({
    width: '100%', padding: '11px 12px 11px 38px',
    border: `1.5px solid ${err ? '#fca5a5' : '#e5e7eb'}`,
    borderRadius: 10, fontSize: 13.5, outline: 'none',
    fontFamily: "'Inter', sans-serif", color: '#111827',
    background: err ? '#fef2f2' : 'white',
    transition: 'border-color 0.15s',
  });

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', animation: 'fadeUp 0.4s ease forwards' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <Ico n="check" s={28} c={C.primary} w={2.5} />
        </div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.dark, marginBottom: 6 }}>
          Welcome to the island!
        </h3>
        <p style={{ fontSize: 13, color: '#6b7a74' }}>Taking you to the database…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>

      {/* Display name */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '0.02em' }}>
          Display name
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: errors.name ? '#dc2626' : '#9ca3af', display: 'flex' }}>
            <Ico n="user" s={16} />
          </div>
          <input
            type="text" value={name} placeholder="Your name"
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
            style={fieldStyle(errors.name)}
            onFocus={e => { if (!errors.name) e.target.style.borderColor = C.primary; }}
            onBlur={e  => { if (!errors.name) e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>
        {errors.name && <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors.name}</p>}
      </div>

      {/* Email */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '0.02em' }}>
          Email address
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: errors.email ? '#dc2626' : '#9ca3af', display: 'flex' }}>
            <Ico n="mail" s={16} />
          </div>
          <input
            type="email" value={email} placeholder="you@example.com"
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
            style={fieldStyle(errors.email)}
            onFocus={e => { if (!errors.email) e.target.style.borderColor = C.primary; }}
            onBlur={e  => { if (!errors.email) e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>
        {errors.email && <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors.email}</p>}
      </div>

      {/* Password */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '0.02em' }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: errors.password ? '#dc2626' : '#9ca3af', display: 'flex' }}>
            <Ico n="lock" s={16} />
          </div>
          <input
            type={showPw ? 'text' : 'password'} value={password} placeholder="Min. 6 characters"
            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
            style={{ ...fieldStyle(errors.password), paddingRight: 40 }}
            onFocus={e => { if (!errors.password) e.target.style.borderColor = C.primary; }}
            onBlur={e  => { if (!errors.password) e.target.style.borderColor = '#e5e7eb'; }}
          />
          <button type="button" onClick={() => setShowPw(p => !p)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex',
          }}>
            <Ico n={showPw ? 'eyeOff' : 'eye'} s={16} />
          </button>
        </div>
        <StrengthBar password={password} />
        {errors.password && <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors.password}</p>}
      </div>

      {/* Confirm password */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '0.02em' }}>
          Confirm password
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: errors.confirm ? '#dc2626' : '#9ca3af', display: 'flex' }}>
            <Ico n="lock" s={16} />
          </div>
          <input
            type={showConf ? 'text' : 'password'} value={confirm} placeholder="Repeat password"
            onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
            style={{ ...fieldStyle(errors.confirm), paddingRight: confirm && password && confirm === password ? 60 : 40 }}
            onFocus={e => { if (!errors.confirm) e.target.style.borderColor = C.primary; }}
            onBlur={e  => { if (!errors.confirm) e.target.style.borderColor = '#e5e7eb'; }}
          />
          {/* Match checkmark */}
          {confirm && password && confirm === password && (
            <div style={{ position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: '#22c55e' }}>
              <Ico n="check" s={14} c="#22c55e" w={2.5} />
            </div>
          )}
          <button type="button" onClick={() => setShowConf(p => !p)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex',
          }}>
            <Ico n={showConf ? 'eyeOff' : 'eye'} s={16} />
          </button>
        </div>
        {errors.confirm && <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors.confirm}</p>}
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '13px', marginBottom: 14,
        background: loading ? '#5eead4' : C.primary,
        border: 'none', borderRadius: 10, color: 'white',
        fontSize: 14.5, fontWeight: 600, fontFamily: "'Inter', sans-serif",
        cursor: loading ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0d6b63'; }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.primary; }}>
        {loading
          ? <><div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating account…</>
          : 'Create Account'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>or</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      {/* Google */}
      <button type="button"
        onClick={() => { /* TODO: trigger Google OAuth */ }}
        style={{
          width: '100%', padding: '12px', marginBottom: 10,
          background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10,
          color: '#374151', fontSize: 14, fontWeight: 500,
          fontFamily: "'Inter', sans-serif", cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}>
        <GoogleLogo /> Continue with Google
      </button>

      {/* Guest */}
      <button type="button"
        onClick={onSuccess}
        style={{
          width: '100%', padding: '12px', background: 'transparent',
          border: 'none', borderRadius: 10,
          color: '#9ca3af', fontSize: 13, fontWeight: 400,
          fontFamily: "'Inter', sans-serif", cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#6b7280'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}>
        Continue as Guest <Ico n="arrowRight" s={14} />
      </button>
    </form>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const enter = () => navigate('/app');

  return (
    <div className="ci-split" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Left hero panel ── */}
      <div className="ci-hero" style={{
        flex: '1 1 55%',
        background: 'linear-gradient(148deg, #071e1c 0%, #0b3330 45%, #134e4a 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '36px 48px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Blobs */}
        {[
          { w: 520, h: 520, top: -220, right: -180, anim: 'blob1 14s ease-in-out infinite', gradient: 'rgba(15,118,110,0.3)' },
          { w: 360, h: 360, bottom: -100, left: -90,  anim: 'blob2 18s ease-in-out infinite', gradient: 'rgba(249,115,22,0.12)' },
          { w: 220, h: 220, bottom: 80,  right: 60,   anim: 'blob3 11s ease-in-out infinite', gradient: 'rgba(94,234,212,0.07)' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', width: b.w, height: b.h, borderRadius: '50%',
            top: b.top, right: b.right, bottom: b.bottom, left: b.left,
            background: `radial-gradient(circle, ${b.gradient} 0%, transparent 70%)`,
            animation: b.anim, pointerEvents: 'none',
          }} />
        ))}

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: 'linear-gradient(135deg, #0d9488, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ico n="leaf" s={20} c="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16 }}>Coral Island</div>
            <div style={{ color: '#5eead4', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>Database</div>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2, gap: 36, paddingTop: 20 }}>
          <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(26px, 3.2vw, 46px)',
              fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 14,
            }}>
              Join the<br />
              <span style={{ color: '#f97316', fontStyle: 'italic' }}>island</span> community
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.65, maxWidth: 400 }}>
              A free account unlocks your personal island toolkit — save progress, track favourites, and get AI-powered answers.
            </p>
          </div>

          {/* Perks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp 0.5s ease 0.1s forwards' }}>
            {PERKS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ico n={p.icon} s={17} c="#5eead4" />
                </div>
                <div>
                  <div style={{ color: 'white', fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{p.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, lineHeight: 1.55 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, position: 'relative', zIndex: 2, paddingTop: 12 }}>
          v1.0.0 · Fan-made companion · Not affiliated with Stairway Games
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="ci-form" style={{
        flex: '0 0 440px',
        background: C.cream,
        display: 'flex', flexDirection: 'column',
        padding: '44px 44px 36px',
        overflow: 'auto',
        borderLeft: '1px solid #e5e7eb',
      }}>
        {/* Already have account */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Already a member?{' '}
            <Link to="/login" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </span>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>🌊</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: C.dark, marginBottom: 7 }}>
            Create your account
          </h2>
          <p style={{ fontSize: 13.5, color: '#6b7a74', lineHeight: 1.55 }}>
            Free forever. No credit card needed.
          </p>
        </div>

        <RegisterForm onSuccess={enter} />

        <div style={{ marginTop: 'auto', paddingTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.65 }}>
            By creating an account you agree to our{' '}
            <a href="#" onClick={e => e.preventDefault()} style={{ color: C.primary, textDecoration: 'none' }}>Terms</a>
            {' '}and{' '}
            <a href="#" onClick={e => e.preventDefault()} style={{ color: C.primary, textDecoration: 'none' }}>Privacy Policy</a>
          </p>
        </div>
      </div>

    </div>
  );
}
