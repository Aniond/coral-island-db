// ── Admin Dashboard ─────────────────────────────────────────────────────────
// Tabs: Stats, Users, Search Logs. All data from /api/admin/* (requireAdmin).
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const { useState, useEffect, useCallback } = React;

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const C = { primary: '#0f766e', dark: '#134e4a', accent: '#f97316', cream: '#fefce8' };

function authFetch(path, token, opts = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

function Ico({ n, s = 18, c = 'currentColor', w = 1.75 }) {
  const d = {
    users:  <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    chart:  <><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></>,
    check:  <><path d="M20 6 9 17l-5-5"/></>,
    x:      <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>,
    refresh:<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>,
    leaf:   <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {d[n]}
    </svg>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ico n={icon} s={20} c={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.dark, lineHeight: 1 }}>{value ?? <span style={{ opacity: 0.3 }}>—</span>}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Toggle({ on, busy, onChange }) {
  return (
    <button
      onClick={() => !busy && onChange(!on)}
      disabled={busy}
      title={on ? 'Limits are enforced — click to turn off' : 'Limits are off — click to turn on'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', padding: 0, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
    >
      <span style={{ width: 40, height: 23, borderRadius: 999, position: 'relative', flexShrink: 0, background: on ? C.primary : '#cbd5e1', transition: 'background 0.15s' }}>
        <span style={{ position: 'absolute', top: 2.5, left: on ? 19.5 : 2.5, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: on ? C.primary : '#9ca3af' }}>
        {on ? 'Limits ON' : 'Limits OFF'}
      </span>
    </button>
  );
}

// Editable AI-search testing limits + live usage, on the Stats tab.
function LimitsPanel({ token, stats, reload }) {
  const [glob,    setGlob]    = useState('');
  const [def,     setDef]     = useState('');
  const [enabled, setEnabled] = useState(true);
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    if (!stats) return;
    setGlob(stats.globalDailyLimit != null ? String(stats.globalDailyLimit) : '');
    setDef(stats.defaultUserLimit  != null ? String(stats.defaultUserLimit)  : '');
    setEnabled(stats.limitsEnabled !== false);
  }, [stats]);

  async function patch(body, okMsg) {
    setBusy(true); setMsg('');
    try {
      const r = await authFetch('/api/admin/settings', token, { method: 'PATCH', body: JSON.stringify(body) });
      if (!r.ok) {
        let m = `Failed (${r.status})`;
        try { m = (await r.json()).error || m; } catch { /* ignore */ }
        throw new Error(m);
      }
      setMsg(okMsg || 'Saved');
      reload();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  function saveLimits() {
    const g = glob.trim(), d = def.trim();
    const gv = g === '' ? null : parseInt(g, 10);
    const dv = d === '' ? null : parseInt(d, 10);
    if ((g !== '' && (isNaN(gv) || gv < 1)) || (d !== '' && (isNaN(dv) || dv < 1))) {
      setMsg('Enter positive numbers, or leave blank for no cap.');
      return;
    }
    patch({ globalDailyLimit: gv, defaultUserLimit: dv }, 'Limits saved');
  }

  const used = stats?.searchesToday ?? 0;
  const cap  = stats?.globalDailyLimit ?? null;
  const pct  = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  const over = cap != null && used >= cap;

  const fieldStyle = {
    width: 90, padding: '7px 10px', borderRadius: 8, fontSize: 13,
    border: '1.5px solid #e5e7eb', outline: 'none', color: C.dark,
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div style={{ marginTop: 24, background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>AI Search Testing Limits</div>
          <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 2 }}>
            Guards against unexpectedly burning Anthropic credits. Flip off when you need unrestricted testing.
          </div>
        </div>
        <Toggle on={enabled} busy={busy} onChange={(next) => { setEnabled(next); patch({ limitsEnabled: next }, next ? 'Limits enabled' : 'Limits disabled'); }} />
      </div>

      {/* Today's usage vs the global cap */}
      <div style={{ marginTop: 18, opacity: enabled ? 1 : 0.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Today's searches (all users)</span>
          <span style={{ fontWeight: 700, color: over ? '#dc2626' : C.dark }}>
            {used}{cap != null ? ` / ${cap}` : ' (no global cap)'}
          </span>
        </div>
        {cap != null && (
          <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: over ? '#dc2626' : C.primary, transition: 'width 0.2s' }} />
          </div>
        )}
      </div>

      {/* Editable caps */}
      <div style={{ marginTop: 18, display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-end', opacity: enabled ? 1 : 0.5 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
          Global daily cap
          <input type="number" min="1" value={glob} onChange={e => setGlob(e.target.value)} placeholder="no cap" style={fieldStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
          Per-user default
          <input type="number" min="1" value={def} onChange={e => setDef(e.target.value)} placeholder="no cap" style={fieldStyle} />
        </label>
        <button
          onClick={saveLimits}
          disabled={busy}
          style={{ padding: '8px 18px', borderRadius: 8, background: C.primary, border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          Save limits
        </button>
        {msg && <span style={{ fontSize: 12.5, color: msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('enter') ? '#dc2626' : '#15803d', fontWeight: 600 }}>{msg}</span>}
      </div>

      <div style={{ marginTop: 14, fontSize: 11.5, color: '#9ca3af', lineHeight: 1.5 }}>
        Blank = no cap for that scope. The <b>global cap</b> stops all AI searches once the day's total is reached; the
        {' '}<b>per-user default</b> applies to anyone without an explicit limit on the Users tab. Counts reset at midnight UTC.
      </div>
    </div>
  );
}

function StatsTab({ token }) {
  const [stats, setStats] = useState(null);
  const [err,   setErr]   = useState('');

  const load = useCallback(async () => {
    setErr('');
    try {
      const r = await authFetch('/api/admin/stats', token);
      if (!r.ok) throw new Error(await r.text());
      setStats(await r.json());
    } catch (e) { setErr(e.message); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (err) return <div style={{ color: '#dc2626', padding: 20 }}>Error: {err}</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
        <StatCard icon="users"  label="Total Users"    value={stats?.totalUsers}   sub="registered accounts"     color={C.primary} />
        <StatCard icon="shield" label="Admins"         value={stats?.totalAdmins}  sub="with admin role"         color="#7c3aed" />
        <StatCard icon="search" label="Total Searches" value={stats?.totalSearches} sub="all time"               color={C.accent} />
        <StatCard icon="chart"  label="Searches Today" value={stats?.searchesToday} sub="since midnight UTC"     color="#0ea5e9" />
      </div>

      <LimitsPanel token={token} stats={stats} reload={load} />

      <button onClick={load} style={{
        marginTop: 20, display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: `1px solid #e5e7eb`, borderRadius: 8,
        padding: '8px 14px', cursor: 'pointer', color: '#6b7280', fontSize: 13,
      }}>
        <Ico n="refresh" s={14} /> Refresh
      </button>
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
      background: isAdmin ? '#ede9fe' : '#f0fdf4',
      color: isAdmin ? '#6d28d9' : '#15803d',
    }}>
      {isAdmin ? 'Admin' : 'User'}
    </span>
  );
}

function UsersTab({ token, currentUserId }) {
  const [users,        setUsers]        = useState([]);
  const [defaultLimit, setDefaultLimit] = useState(null);
  const [limitsEnabled,setLimitsEnabled]= useState(true);
  const [loading,      setLoading]      = useState(true);
  const [err,          setErr]          = useState('');
  const [busy,         setBusy]         = useState({});
  const [editingLimit, setEditingLimit] = useState(null);
  const [limitInput,   setLimitInput]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await authFetch('/api/admin/users', token);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      // New shape: { users, defaultUserLimit, limitsEnabled } (tolerate old array shape)
      const list = Array.isArray(data) ? data : (data.users || []);
      setUsers(list);
      if (!Array.isArray(data)) {
        setDefaultLimit(data.defaultUserLimit ?? null);
        setLimitsEnabled(data.limitsEnabled !== false);
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function toggleAdmin(userId, currentRole) {
    setBusy(p => ({ ...p, [userId]: true }));
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const r = await authFetch(`/api/admin/users/${userId}/role`, token, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      if (!r.ok) throw new Error(await r.text());
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) { alert(e.message); }
    finally { setBusy(p => ({ ...p, [userId]: false })); }
  }

  function startEditLimit(userId, currentLimit) {
    setEditingLimit(userId);
    setLimitInput(currentLimit !== null && currentLimit !== undefined ? String(currentLimit) : '');
  }

  async function saveLimit(userId) {
    const parsed = limitInput.trim() === '' ? null : parseInt(limitInput.trim(), 10);
    if (limitInput.trim() !== '' && (isNaN(parsed) || parsed < 1)) {
      alert('Enter a positive number, or leave blank for unlimited.');
      return;
    }
    setBusy(p => ({ ...p, [userId + '_limit']: true }));
    try {
      const r = await authFetch(`/api/admin/users/${userId}/limit`, token, {
        method: 'PATCH',
        body: JSON.stringify({ limit: parsed }),
      });
      if (!r.ok) throw new Error(await r.text());
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, dailyLimit: parsed } : u));
      setEditingLimit(null);
    } catch (e) { alert(e.message); }
    finally { setBusy(p => ({ ...p, [userId + '_limit']: false })); }
  }

  if (loading) return <div style={{ padding: 20, color: '#9ca3af' }}>Loading users…</div>;
  if (err) return <div style={{ color: '#dc2626', padding: 20 }}>Error: {err}</div>;

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
          {users.length} users
          {!limitsEnabled && (
            <span style={{ marginLeft: 10, fontSize: 11.5, fontWeight: 600, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 999, padding: '2px 9px' }}>
              Limits OFF
            </span>
          )}
        </span>
        <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
          <Ico n="refresh" s={15} />
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Email', 'Role', 'Daily Limit', 'Today', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              // Effective per-user cap: explicit value, else the configured default.
              const eff = u.dailyLimit != null ? u.dailyLimit : defaultLimit;
              return (
              <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: 13.5, color: C.dark }}>
                  {u.email}
                  {u.id === currentUserId && <span style={{ marginLeft: 6, fontSize: 11, color: C.primary, fontWeight: 600 }}>(you)</span>}
                </td>
                <td style={{ padding: '12px 16px' }}><RoleBadge role={u.role} /></td>

                {/* Daily Limit inline editor */}
                <td style={{ padding: '10px 16px' }}>
                  {editingLimit === u.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <input
                        type="number"
                        min="1"
                        value={limitInput}
                        onChange={e => setLimitInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveLimit(u.id); if (e.key === 'Escape') setEditingLimit(null); }}
                        placeholder="default"
                        autoFocus
                        style={{
                          width: 58, padding: '4px 7px', borderRadius: 6, fontSize: 12.5,
                          border: `1.5px solid ${C.primary}`, outline: 'none',
                          fontFamily: "'Inter', sans-serif", color: C.dark,
                        }}
                      />
                      <button
                        onClick={() => saveLimit(u.id)}
                        disabled={busy[u.id + '_limit']}
                        style={{ padding: '4px 8px', borderRadius: 6, background: C.primary, border: 'none', color: 'white', fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingLimit(null)}
                        style={{ padding: '4px 7px', borderRadius: 6, background: 'none', border: '1px solid #e5e7eb', color: '#9ca3af', fontSize: 11.5, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditLimit(u.id, u.dailyLimit)}
                      title="Click to set a per-user limit (leave blank to use the default)"
                      style={{
                        background: u.dailyLimit !== null ? '#f0fdf4' : '#f9fafb',
                        border: `1px solid ${u.dailyLimit !== null ? '#86efac' : '#e5e7eb'}`,
                        borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                        fontSize: 12.5, fontWeight: 600,
                        color: u.dailyLimit !== null ? '#15803d' : '#9ca3af',
                      }}
                    >
                      {u.dailyLimit !== null
                        ? `${u.dailyLimit}/day`
                        : defaultLimit != null ? `Default (${defaultLimit})` : '∞ none'}
                    </button>
                  )}
                </td>

                {/* Today's usage — against the effective limit (explicit or default) */}
                <td style={{ padding: '12px 16px', fontSize: 12.5 }}>
                  {eff != null ? (
                    <span style={{
                      color: u.searchesToday >= eff ? '#dc2626' : (u.searchesToday > 0 ? C.primary : '#9ca3af'),
                      fontWeight: u.searchesToday >= eff ? 700 : 500,
                    }}>
                      {u.searchesToday}/{eff}
                    </span>
                  ) : (
                    <span style={{ color: u.searchesToday > 0 ? C.primary : '#d1d5db', fontWeight: 500 }}>
                      {u.searchesToday}
                    </span>
                  )}
                </td>

                <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#9ca3af' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => toggleAdmin(u.id, u.role)}
                      disabled={busy[u.id]}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 500,
                        cursor: busy[u.id] ? 'default' : 'pointer',
                        border: '1px solid',
                        background: u.role === 'admin' ? '#fef2f2' : '#f0fdf4',
                        borderColor: u.role === 'admin' ? '#fca5a5' : '#86efac',
                        color: u.role === 'admin' ? '#dc2626' : '#15803d',
                        opacity: busy[u.id] ? 0.6 : 1,
                      }}
                    >
                      <Ico n={u.role === 'admin' ? 'x' : 'check'} s={13} />
                      {u.role === 'admin' ? 'Revoke admin' : 'Grant admin'}
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogsTab({ token }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const PER_PAGE = 20;

  const load = useCallback(async (p) => {
    setLoading(true); setErr('');
    try {
      const r = await authFetch(`/api/admin/search-logs?page=${p}&limit=${PER_PAGE}`, token);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(page); }, [load, page]);

  const totalPages = Math.ceil(total / PER_PAGE);

  if (err) return <div style={{ color: '#dc2626', padding: 20 }}>Error: {err}</div>;

  return (
    <div>
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{total} total searches</span>
          <button onClick={() => load(page)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
            <Ico n="refresh" s={15} />
          </button>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Query', 'User', 'When'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={l.id} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontSize: 13.5, color: C.dark, maxWidth: 400 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {l.query}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {l.userEmail || l.userId?.slice(0, 8) + '…' || '—'}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>No searches yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: 'white', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: 'white', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'stats', label: 'Stats',        icon: 'chart'  },
  { id: 'users', label: 'Users',        icon: 'users'  },
  { id: 'logs',  label: 'Search Logs',  icon: 'search' },
];

export default function AdminPage() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const token = session?.access_token;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.dark, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 58, gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #0d9488, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico n="leaf" s={17} c="white" />
          </div>
          <span style={{ color: 'white', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15 }}>Coral Island</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>/</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', padding: '4px 11px', borderRadius: 6 }}>
            <Ico n="shield" s={14} c="#a78bfa" />
            <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: 12.5 }}>Admin</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>{user?.email}</span>
            <button onClick={() => navigate('/app')} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)', borderRadius: 7, padding: '5px 12px',
              fontSize: 12.5, cursor: 'pointer',
            }}>
              ← App
            </button>
            <button onClick={handleSignOut} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12.5,
            }}>
              <Ico n="logout" s={14} /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 13.5, color: '#6b7280' }}>Manage users, view stats, and review search activity.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'white', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid #e5e7eb' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 7, border: 'none',
              cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              background: activeTab === t.id ? C.dark : 'transparent',
              color: activeTab === t.id ? 'white' : '#6b7280',
              transition: 'all 0.15s',
            }}>
              <Ico n={t.icon} s={15} c={activeTab === t.id ? 'white' : '#9ca3af'} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === 'stats' && <StatsTab token={token} />}
        {activeTab === 'users' && <UsersTab token={token} currentUserId={user?.id} />}
        {activeTab === 'logs'  && <LogsTab  token={token} />}
      </div>
    </div>
  );
}
