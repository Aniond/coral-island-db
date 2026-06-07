// ── Roadmap Page ─────────────────────────────────────────────────────────────
// Official Coral Island developer roadmap as a vertical timeline.
import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { ROADMAP, ROADMAP_SOURCE } from '../data/roadmap.js';

const STATUS = {
  released:     { label: 'Released',       color: '#15803d', bg: '#f0fdf4', border: '#86efac', dot: '#22c55e' },
  'in-progress':{ label: 'In Development',  color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', dot: 'var(--accent, #f97316)' },
  planned:      { label: 'Planned',         color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6' },
};

function MilestoneCard({ item, density, isLast }) {
  const s = STATUS[item.status] || STATUS.planned;
  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      {/* Timeline rail */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 18 }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: s.dot,
          border: '3px solid white', boxShadow: `0 0 0 2px ${s.dot}`, marginTop: 6, zIndex: 1,
          ...(item.status === 'in-progress' ? { animation: 'pulse 1.6s ease-in-out infinite' } : {}),
        }} />
        {!isLast && <div style={{ flex: 1, width: 2, background: THEME.primaryLight, marginTop: 4 }} />}
      </div>

      {/* Card */}
      <div style={{
        flex: 1, marginBottom: isLast ? 0 : (density === 'compact' ? 14 : 18),
        background: THEME.cardBg, border: `1px solid ${THEME.cardBorder}`,
        borderRadius: 'var(--radius, 12px)', padding: density === 'compact' ? 14 : 18,
        boxShadow: THEME.shadow,
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: item.summary ? 6 : 10 }}>
          <span style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 700,
            fontSize: 13, color: 'white', background: THEME.primary,
            padding: '2px 10px', borderRadius: 6, letterSpacing: '0.02em',
          }}>
            v{item.version}
          </span>
          <span style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 700,
            fontSize: density === 'compact' ? 16 : 18, color: THEME.textDark, lineHeight: 1.15,
          }}>
            {item.title}
          </span>
          <span style={{
            marginLeft: 'auto',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
          }}>
            {item.status === 'released' && <Icon name="check" size={11} color={s.color} />}
            {s.label}
          </span>
          {item.date && (
            <span style={{ fontSize: 11.5, color: THEME.textMuted, fontWeight: 500 }}>{item.date}</span>
          )}
        </div>

        {item.summary && (
          <p style={{ fontSize: 13, color: THEME.textMid, margin: '0 0 12px', lineHeight: 1.5 }}>
            {item.summary}
          </p>
        )}

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {item.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: THEME.textDark, lineHeight: 1.5 }}>
              <span style={{
                flexShrink: 0, marginTop: 6, width: 5, height: 5, borderRadius: '50%', background: s.dot,
              }} />
              {f}
            </div>
          ))}
        </div>

        {item.note && (
          <div style={{
            marginTop: 12, padding: '8px 11px', borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`,
            fontSize: 12, color: s.color, lineHeight: 1.5,
          }}>
            <strong>Note:</strong> {item.note}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoadmapPage({ density }) {
  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 820 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px',
        }}>
          Developer Roadmap
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          What Stairway Games has shipped and what's coming next ·{' '}
          <a href={ROADMAP_SOURCE} target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent, #f97316)', fontWeight: 600, textDecoration: 'none' }}>
            official blog ↗
          </a>
        </p>
      </div>

      {/* Timeline */}
      <div>
        {ROADMAP.map((item, i) => (
          <MilestoneCard key={item.version} item={item} density={density} isLast={i === ROADMAP.length - 1} />
        ))}
      </div>

      <p style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 18, lineHeight: 1.5 }}>
        Reflects the roadmap as announced by Stairway Games. Plans and dates may change — see the official blog & Discord for the latest.
      </p>
    </div>
  );
}
