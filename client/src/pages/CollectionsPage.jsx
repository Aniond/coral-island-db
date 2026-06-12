// ── Collections Page ─────────────────────────────────────────────────────────
// Museum / journal collectibles: fish, insects, sea critters, fossils,
// artifacts, gems. Tabbed by category, each item with icon, price & details.
import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { EmptyState, SkeletonLoader } from '../components/ui.jsx';
import { fetchCollectibles } from '../data/api.js';

const CATEGORIES = [
  { id: 'fish',        label: 'Fish',        emoji: '🐟' },
  { id: 'insect',      label: 'Insects',     emoji: '🦋' },
  { id: 'sea_critter', label: 'Sea Critters', emoji: '🦀' },
  { id: 'fossil',      label: 'Fossils',     emoji: '🦴' },
  { id: 'artifact',    label: 'Artifacts',   emoji: '🏺' },
  { id: 'gem',         label: 'Gems',        emoji: '💎' },
];

const RARITY = {
  Common:    { bg: '#f1f5f9', color: '#475569' },
  Uncommon:  { bg: '#dcfce7', color: '#15803d' },
  Rare:      { bg: '#dbeafe', color: '#1d4ed8' },
  Epic:      { bg: '#ede9fe', color: '#6d28d9' },
  Legendary: { bg: '#fef3c7', color: '#b45309' },
};

function ItemIcon({ src, emoji }) {
  const [failed, setFailed] = React.useState(false);
  if (src && !failed) {
    return (
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)}
        style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0,
          background: THEME.primaryXLight, borderRadius: 10, padding: 4 }} />
    );
  }
  return (
    <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10,
      background: THEME.primaryXLight, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 22 }}>
      {emoji}
    </div>
  );
}

function CollectibleCard({ item, emoji }) {
  const [hov, setHov] = React.useState(false);
  const r = item.rarity ? (RARITY[item.rarity] || RARITY.Common) : null;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: THEME.cardBg,
        border: `1px solid ${hov ? THEME.primaryLight : THEME.cardBorder}`,
        borderRadius: 'var(--radius, 12px)', padding: 14,
        boxShadow: hov ? THEME.shadowHover : THEME.shadow,
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 0.2s, transform 0.18s, border-color 0.18s',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <ItemIcon src={item.image} emoji={emoji} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14.5, color: THEME.textDark, lineHeight: 1.2 }}>
            {item.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {item.sellPrice != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                <Icon name="coin" size={12} color="#b45309" />{item.sellPrice}g
              </span>
            )}
            {r && (
              <span style={{ padding: '1px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: r.bg, color: r.color }}>
                {item.rarity}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Catch info (fish/insects/critters) */}
      {(item.seasons || item.locations || (item.timeOfDay && item.timeOfDay !== 'Any time')) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: THEME.textMid }}>
          {item.seasons && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="sprout" size={12} color={THEME.textMid} /> {item.seasons}
            </div>
          )}
          {item.locations && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
              <span style={{ marginTop: 1 }}><Icon name="mapPin" size={12} color={THEME.textMid} /></span>
              <span>{item.locations}</span>
            </div>
          )}
          {item.timeOfDay && item.timeOfDay !== 'Any time' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="clock" size={12} color={THEME.textMid} /> {item.timeOfDay}
            </div>
          )}
        </div>
      )}

      {item.description && (
        <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.45, fontStyle: 'italic' }}>
          {item.description}
        </div>
      )}
    </div>
  );
}

export default function CollectionsPage({ density }) {
  const [all,     setAll]     = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(null);
  const [tab,     setTab]     = React.useState('fish');
  const [search,  setSearch]  = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCollectibles()
      .then(rows => { if (alive) { setAll(rows); setError(null); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const counts = React.useMemo(() => {
    const c = {};
    for (const it of all) c[it.category] = (c[it.category] || 0) + 1;
    return c;
  }, [all]);

  const activeCat = CATEGORIES.find(c => c.id === tab);
  const filtered = all.filter(it => {
    if (it.category !== tab) return false;
    if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px' }}>
          Collections
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {all.length} museum & journal collectibles across {CATEGORIES.length} categories
        </p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {CATEGORIES.map(c => {
          const active = tab === c.id;
          return (
            <button key={c.id} onClick={() => setTab(c.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 9, cursor: 'pointer',
              border: `1.5px solid ${active ? THEME.primary : THEME.cardBorder}`,
              background: active ? THEME.primary : 'white',
              color: active ? 'white' : THEME.textMid,
              fontSize: 13, fontWeight: active ? 600 : 500,
              fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
            }}>
              <span>{c.emoji}</span>
              {c.label}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '0 6px', borderRadius: 999,
                background: active ? 'rgba(255,255,255,0.22)' : THEME.primaryXLight,
                color: active ? 'white' : THEME.primary,
              }}>
                {counts[c.id] ?? '·'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20, position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 10, color: THEME.textMuted, display: 'flex', pointerEvents: 'none' }}>
          <Icon name="search" size={14} />
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${activeCat?.label.toLowerCase()}…`}
          style={{
            padding: '7px 12px 7px 30px',
            border: `1.5px solid ${search ? THEME.primary : THEME.cardBorder}`,
            borderRadius: 8, fontSize: 13, outline: 'none',
            fontFamily: "'Inter', sans-serif", color: THEME.textDark,
            background: 'white', width: 220,
          }}
        />
      </div>

      {/* Body */}
      {loading ? (
        <SkeletonLoader count={6} height={60} />
      ) : error ? (
        <EmptyState message="Couldn't load collectibles" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="Nothing here" sub="Try a different search or category" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map(it => <CollectibleCard key={it.id} item={it} emoji={activeCat?.emoji} />)}
        </div>
      )}
    </div>
  );
}
