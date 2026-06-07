// ── Foraging Page ────────────────────────────────────────────────────────────
import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { SeasonPill, FilterSelect, EmptyState, LoadingDots, prettifyTag } from '../components/ui.jsx';
import { fetchForageables } from '../data/api.js';

function SeasonChip({ season }) {
  if (!season) return null;
  const parts = String(season).toLowerCase().split('/');
  if (season === 'all' || parts.length >= 4) return <SeasonPill season="all" />;
  if (parts.length === 1) return <SeasonPill season={parts[0]} />;
  // combo (e.g. Spring/Fall) — render as a neutral text pill
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 999,
      background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {season}
    </span>
  );
}

function ForageIcon({ src }) {
  const [failed, setFailed] = React.useState(false);
  if (!src || failed) return null;
  return (
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)}
      style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0,
        background: THEME.primaryXLight, borderRadius: 9, padding: 3 }} />
  );
}

function ForagingCard({ item, density }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: THEME.cardBg,
        border: `1px solid ${hov ? THEME.primaryLight : THEME.cardBorder}`,
        borderRadius: 'var(--radius, 12px)',
        padding: density === 'compact' ? 14 : 18,
        transition: 'box-shadow 0.2s, transform 0.18s, border-color 0.18s',
        boxShadow: hov ? THEME.shadowHover : THEME.shadow,
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 9,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <ForageIcon src={item.image} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: density === 'compact' ? 14 : 15.5,
              color: THEME.textDark, lineHeight: 1.2,
            }}>
              {item.name}
            </div>
            <SeasonChip season={item.season} />
          </div>
          {item.sellPrice != null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4, fontSize: 12, fontWeight: 700, color: '#92400e' }}>
              <Icon name="coin" size={12} color="#b45309" />{item.sellPrice}g
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: THEME.textMid, fontSize: 12.5 }}>
        <Icon name="mapPin" size={13} color={THEME.textMid} />
        <span>{item.location}</span>
      </div>

      <span style={{
        display: 'inline-block', alignSelf: 'flex-start',
        background: THEME.primaryXLight, color: THEME.primary,
        padding: '3px 10px', borderRadius: 6,
        fontSize: 11, fontWeight: 600,
      }}>
        {prettifyTag(item.area)}
      </span>

      {item.notes && (
        <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.45, fontStyle: 'italic' }}>{item.notes}</div>
      )}
    </div>
  );
}

export default function ForagingPage({ density }) {
  const [forageables, setForageables] = React.useState([]);
  const [loading,     setLoading]     = React.useState(true);
  const [error,       setError]       = React.useState(null);

  const [season, setSeason] = React.useState('');
  const [area,   setArea]   = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchForageables()
      .then(rows => { if (alive) { setForageables(rows); setError(null); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const seasons = ['spring', 'summer', 'fall', 'winter'];
  const areas   = React.useMemo(() => [...new Set(forageables.map(f => f.area))].sort(), [forageables]);
  const cap     = s => s.charAt(0).toUpperCase() + s.slice(1);

  const filtered = forageables.filter(f => {
    // season values can be 'Spring', combos like 'Spring/Fall', or 'all'
    if (season && !(String(f.season).toLowerCase().includes(season) || f.season === 'all')) return false;
    if (area   && f.area   !== area)   return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasFilter = season || area || search;

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px',
        }}>
          Foraging
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {forageables.length} forageable items across the island · Filtered: <strong>{filtered.length}</strong>
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 10, color: THEME.textMuted, display: 'flex', pointerEvents: 'none' }}>
            <Icon name="search" size={14} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              padding: '7px 12px 7px 30px',
              border: `1.5px solid ${search ? THEME.primary : THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: 'white', width: 140,
            }}
          />
        </div>

        <FilterSelect label="Season" options={seasons} value={season} onChange={setSeason} displayFn={cap} />
        <FilterSelect label="Area"   options={areas}   value={area}   onChange={setArea}   displayFn={prettifyTag} />

        {hasFilter && (
          <button
            onClick={() => { setSeason(''); setArea(''); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 8,
              background: THEME.accentLight, border: `1.5px solid var(--accent-border, #fed7aa)`,
              color: 'var(--accent, #f97316)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Icon name="x" size={13} color="var(--accent, #f97316)" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <LoadingDots />
      ) : error ? (
        <EmptyState message="Couldn't load forageables" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="Nothing found here" sub="Try a different season or area" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map(item => <ForagingCard key={item.id} item={item} density={density} />)}
        </div>
      )}
    </div>
  );
}
