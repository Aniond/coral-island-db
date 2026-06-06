// ── Shared UI Components ────────────────────────────────────────────────────
// Exports: THEME, Icon, SeasonPill, RankBadge, MineBadge, TypeBadge,
//          LoadingDots, EmptyState, FilterSelect, seasonConfig, mineConfig

const THEME = {
  primary:      '#0f766e',
  primaryDark:  '#134e4a',
  primaryMid:   '#1d8079',
  primaryLight: '#ccfbf1',
  primaryXLight:'#f0fdfa',
  accent:       'var(--accent, #f97316)',
  accentLight:  'var(--accent-light, #fff7ed)',
  bg:           '#fefce8',
  cardBg:       '#ffffff',
  cardBorder:   '#99f6e4',
  textDark:     '#134e4a',
  textMid:      '#0f766e',
  textMuted:    '#6b7a74',
  shadow:       '0 1px 4px rgba(0,0,0,0.05)',
  shadowHover:  '0 8px 28px rgba(15,118,110,0.14)',
};

// ── SVG Icon ────────────────────────────────────────────────────────────────
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) {
  const defs = {
    leaf:     <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>,
    pickaxe:  <><path d="M14.531 12.469 6.619 20.38a1 1 0 1 1-3-3l7.912-7.912"/><path d="M15.686 4.314A12.5 12.5 0 0 0 5.461 2.958 1 1 0 0 0 5.58 4.71a22.5 22.5 0 0 1 6.318 3.393"/><path d="m12 6 6.586 6.586a2 2 0 0 1 0 2.828l-.5.5a2 2 0 0 1-2.828 0l-7.172-7.172a2 2 0 0 1 0-2.828l.5-.5A2 2 0 0 1 11 4.5"/></>,
    sprout:   <><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 1 3.9 6 6 6 0 0 1-1.6 4c-2.4.5-3.7.1-4.3-.5-1.5-1.5-2.3-4.1-.4-6.5 1-.8 1.6-3 2.4-3z"/></>,
    users:    <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    sparkles: <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
    coin:     <><circle cx="12" cy="12" r="9"/><path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9"/><path d="M12 6v2m0 8v2"/></>,
    heart:    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    mapPin:   <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    chevDown: <polyline points="6 9 12 15 18 9"/>,
    send:     <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    x:        <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    search:   <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    refresh:  <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-3.36"/></>,
    scroll:   <><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 3H4.5"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {defs[name] || null}
    </svg>
  );
}

// ── Season Pill ─────────────────────────────────────────────────────────────
const seasonConfig = {
  spring: { label: 'Spring', bg: '#dcfce7', color: '#16a34a' },
  summer: { label: 'Summer', bg: '#fef3c7', color: '#d97706' },
  fall:   { label: 'Fall',   bg: '#ffedd5', color: '#ea580c' },
  winter: { label: 'Winter', bg: '#dbeafe', color: '#2563eb' },
  all:    { label: 'All Seasons', bg: '#f1f5f9', color: '#64748b' },
};

function SeasonPill({ season }) {
  const cfg = seasonConfig[season] || seasonConfig.all;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.01em', whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ── Rank Badge ──────────────────────────────────────────────────────────────
const rankConfig = {
  F: { bg: '#f1f5f9', color: '#475569' },
  E: { bg: '#fef9c3', color: '#a16207' },
  D: { bg: '#ffedd5', color: '#c2410c' },
  C: { bg: '#e0f2fe', color: '#0369a1' },
  B: { bg: '#ede9fe', color: '#6d28d9' },
  A: { bg: '#fef3c7', color: '#92400e' },
};

function RankBadge({ rank }) {
  const cfg = rankConfig[rank] || rankConfig.F;
  const star = rank === 'A' ? ' ★' : '';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 9px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
    }}>
      {rank}{star}
    </span>
  );
}

// ── Mine Badge ──────────────────────────────────────────────────────────────
const mineConfig = {
  earth:    { label: 'Earth',    bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
  water:    { label: 'Water',    bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  wind:     { label: 'Wind',     bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  fire:     { label: 'Fire',     bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  memories: { label: 'Memories', bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6' },
};

function MineBadge({ mine }) {
  const cfg = mineConfig[mine] || mineConfig.earth;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Item Type Badge ──────────────────────────────────────────────────────────
const typeColors = {
  Mineral:   { bg: '#fef9c3', color: '#854d0e' },
  Gem:       { bg: '#fae8ff', color: '#86198f' },
  Artifact:  { bg: '#ede9fe', color: '#5b21b6' },
  Material:  { bg: '#e0f2fe', color: '#075985' },
  Fruit:     { bg: '#dcfce7', color: '#14532d' },
  Vegetable: { bg: '#f0fdf4', color: '#166534' },
  Grain:     { bg: '#fef3c7', color: '#78350f' },
  Flower:    { bg: '#fdf2f8', color: '#9d174d' },
};

function TypeBadge({ type }) {
  const cfg = typeColors[type] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 9px', borderRadius: 6,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600,
    }}>
      {type}
    </span>
  );
}

// ── Loading Dots ─────────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '48px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 9, height: 9, borderRadius: '50%', background: THEME.primary,
          animation: `ciWave 1.2s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message = 'No results found', sub = 'Try adjusting your filters' }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 20px' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: THEME.primaryXLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Icon name="search" size={30} color={THEME.primary} />
      </div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: THEME.textDark, margin: '0 0 8px' }}>
        {message}
      </p>
      <p style={{ fontSize: 13, color: THEME.textMuted, margin: 0 }}>{sub}</p>
    </div>
  );
}

// ── Filter Select ─────────────────────────────────────────────────────────────
function FilterSelect({ label, options, value, onChange, displayFn }) {
  const display = displayFn || (v => v);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          background: 'white',
          border: `1.5px solid ${value ? THEME.primary : THEME.cardBorder}`,
          borderRadius: 8,
          padding: '7px 34px 7px 12px',
          fontSize: 13, fontWeight: value ? 600 : 400,
          color: value ? THEME.textDark : THEME.textMuted,
          cursor: 'pointer', outline: 'none',
          fontFamily: "'Inter', sans-serif",
          transition: 'border-color 0.15s',
        }}
      >
        <option value="">{label}: All</option>
        {options.map(o => (
          <option key={o} value={o}>{display(o)}</option>
        ))}
      </select>
      <div style={{
        position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: THEME.textMid, display: 'flex',
      }}>
        <Icon name="chevDown" size={13} />
      </div>
    </div>
  );
}

Object.assign(window, {
  THEME, Icon, SeasonPill, RankBadge, MineBadge, TypeBadge,
  LoadingDots, EmptyState, FilterSelect,
  seasonConfig, mineConfig, rankConfig, typeColors,
});
