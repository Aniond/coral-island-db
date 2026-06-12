// ── Shared UI components ────────────────────────────────────────────────────
// SeasonPill, RankBadge, MineBadge, TypeBadge, LoadingDots, EmptyState,
// FilterSelect — plus the colour config maps. Ported verbatim from the handoff.
import { THEME } from '../lib/theme.js';
import Icon from './Icon.jsx';

// ── Season Pill ──────────────────────────────────────────────────────────────
export const seasonConfig = {
  spring: { label: 'Spring', bg: '#dcfce7', color: '#16a34a' },
  summer: { label: 'Summer', bg: '#fef3c7', color: '#d97706' },
  fall:   { label: 'Fall',   bg: '#ffedd5', color: '#ea580c' },
  winter: { label: 'Winter', bg: '#dbeafe', color: '#2563eb' },
  all:    { label: 'All Seasons', bg: '#f1f5f9', color: '#64748b' },
};

export function SeasonPill({ season }) {
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

// ── Rank Badge ───────────────────────────────────────────────────────────────
export const rankConfig = {
  F: { bg: '#f1f5f9', color: '#475569' },
  E: { bg: '#fef9c3', color: '#a16207' },
  D: { bg: '#ffedd5', color: '#c2410c' },
  C: { bg: '#e0f2fe', color: '#0369a1' },
  B: { bg: '#ede9fe', color: '#6d28d9' },
  A: { bg: '#fef3c7', color: '#92400e' },
};

export function RankBadge({ rank }) {
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

// ── Mine Badge ───────────────────────────────────────────────────────────────
export const mineConfig = {
  earth:    { label: 'Earth',    bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
  water:    { label: 'Water',    bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  wind:     { label: 'Wind',     bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  fire:     { label: 'Fire',     bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  memories: { label: 'Memories', bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6' },
};

export function MineBadge({ mine }) {
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
// Covers both the live DB taxonomy (lowercase: seed/ore/gem/...) and the
// design's sample taxonomy (capitalized: Fruit/Mineral/...). Entries with a
// `label` render that; others are prettified from the key.
export const typeColors = {
  // crop growth types (database)
  seed:         { bg: '#f0fdf4', color: '#166534', label: 'Seed' },
  fruit_plant:  { bg: '#ccfbf1', color: '#0f766e', label: 'Fruit Plant' },
  fruit_tree:   { bg: '#d1fae5', color: '#065f46', label: 'Fruit Tree' },
  ocean_crop:   { bg: '#cffafe', color: '#155e75', label: 'Ocean Crop' },
  // cave item types (database)
  ore:          { bg: '#fef9c3', color: '#854d0e', label: 'Ore' },
  gem:          { bg: '#fae8ff', color: '#86198f', label: 'Gem' },
  geode:        { bg: '#e0e7ff', color: '#3730a3', label: 'Geode' },
  monster_drop: { bg: '#fee2e2', color: '#991b1b', label: 'Monster Drop' },
  fish:         { bg: '#dbeafe', color: '#1e40af', label: 'Fish' },
  scavengeable: { bg: '#f1f5f9', color: '#475569', label: 'Scavengeable' },
  // sample-data taxonomy (design prototype / login teaser)
  Mineral:   { bg: '#fef9c3', color: '#854d0e' },
  Gem:       { bg: '#fae8ff', color: '#86198f' },
  Artifact:  { bg: '#ede9fe', color: '#5b21b6' },
  Material:  { bg: '#e0f2fe', color: '#075985' },
  Fruit:     { bg: '#dcfce7', color: '#14532d' },
  Vegetable: { bg: '#f0fdf4', color: '#166534' },
  Grain:     { bg: '#fef3c7', color: '#78350f' },
  Flower:    { bg: '#fdf2f8', color: '#9d174d' },
};

// 'deep_forest' -> 'Deep Forest', 'ore' -> 'Ore'
export const prettifyTag = (s) =>
  String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const typeLabel = (type) =>
  (typeColors[type] && typeColors[type].label) || prettifyTag(type);

export function TypeBadge({ type }) {
  const cfg = typeColors[type] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 9px', borderRadius: 6,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600,
    }}>
      {cfg.label || prettifyTag(type)}
    </span>
  );
}

// ── Loading Dots ─────────────────────────────────────────────────────────────
export function LoadingDots() {
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

// ── Skeleton Loader ──────────────────────────────────────────────────────────
export function SkeletonLoader({ count = 3, height = 80 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '24px 0' }}>
      <style>{`
        @keyframes ciPulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          height,
          borderRadius: 8,
          background: THEME.cardBorder,
          animation: 'ciPulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}


// ── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message = 'No results found', sub = 'Try adjusting your filters' }) {
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

// ── Filter Select ────────────────────────────────────────────────────────────
export function FilterSelect({ label, options, value, onChange, displayFn }) {
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
