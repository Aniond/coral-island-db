// ── Crops Page ───────────────────────────────────────────────────────────────
import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { SeasonPill, RankBadge, TypeBadge, FilterSelect, EmptyState, SkeletonLoader, typeLabel } from '../components/ui.jsx';
import { fetchCrops } from '../data/api.js';

function CropCard({ crop, density }) {
  const [hov, setHov] = React.useState(false);
  const pad = density === 'compact' ? 14 : 18;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: THEME.cardBg,
        border: `1px solid ${hov ? THEME.primaryLight : THEME.cardBorder}`,
        borderRadius: 'var(--radius, 12px)',
        padding: pad,
        cursor: 'default',
        transition: 'box-shadow 0.2s, transform 0.18s, border-color 0.18s',
        boxShadow: hov ? THEME.shadowHover : THEME.shadow,
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      {/* Row 1: name + season */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700, fontSize: density === 'compact' ? 14 : 15.5,
          color: THEME.textDark, lineHeight: 1.2,
        }}>
          {crop.name}
        </div>
        <SeasonPill season={crop.season} />
      </div>

      {/* Row 2: badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <TypeBadge type={crop.type} />
        <RankBadge rank={crop.rank} />
        {crop.regrows && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: '#f0fdf4', color: '#15803d',
            padding: '2px 8px', borderRadius: 999,
            fontSize: 11, fontWeight: 600,
          }}>
            ↩ Regrows{crop.regrowthDays != null ? ` ${crop.regrowthDays}d` : ''}
          </span>
        )}
      </div>

      {/* Notes */}
      {crop.notes && (
        <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.45 }}>{crop.notes}</div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: THEME.primaryXLight }} />

      {/* Row 3: stats */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: THEME.textMid, fontSize: 12.5 }}>
          <Icon name="clock" size={13} color={THEME.textMid} />
          <span>{crop.growTime != null ? `${crop.growTime}d` : '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>
          <Icon name="coin" size={13} color="#b45309" />
          <span style={{ fontWeight: 700, color: '#92400e' }}>{crop.sellPrice}g</span>
        </div>
      </div>
    </div>
  );
}

export default function CropsPage({ density }) {
  const [crops,   setCrops]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(null);

  const [season, setSeason] = React.useState('');
  const [type,   setType]   = React.useState('');
  const [rank,   setRank]   = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCrops()
      .then(rows => { if (alive) { setCrops(rows); setError(null); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const types   = React.useMemo(() => [...new Set(crops.map(c => c.type))].sort(), [crops]);
  const ranks   = ['F', 'E', 'D', 'C', 'B', 'A'];
  const seasons = ['spring', 'summer', 'fall', 'winter'];
  const cap     = s => s.charAt(0).toUpperCase() + s.slice(1);

  const filtered = crops.filter(c => {
    // partial match so combos ("summer/fall") and "all"-season crops still pass
    if (season && !(String(c.season).includes(season) || c.season === 'all')) return false;
    if (type && c.type !== type) return false;
    if (rank && c.rank !== rank) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasFilter = season || type || rank || search;

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px',
        }}>
          Crops &amp; Plants
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {crops.length} crops across all seasons · Filtered: <strong>{filtered.length}</strong>
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 10, color: THEME.textMuted, display: 'flex', pointerEvents: 'none' }}>
            <Icon name="search" size={14} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search crops…"
            style={{
              padding: '7px 12px 7px 30px',
              border: `1.5px solid ${search ? THEME.primary : THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: 'white', width: 160,
            }}
          />
        </div>

        <FilterSelect label="Season" options={seasons} value={season} onChange={setSeason} displayFn={cap} />
        <FilterSelect label="Type"   options={types}   value={type}   onChange={setType}   displayFn={typeLabel} />
        <FilterSelect label="Rank"   options={ranks}   value={rank}   onChange={setRank}   />

        {hasFilter && (
          <button
            onClick={() => { setSeason(''); setType(''); setRank(''); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 8,
              background: THEME.accentLight,
              border: `1.5px solid var(--accent-border, #fed7aa)`,
              color: 'var(--accent, #f97316)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Icon name="x" size={13} color="var(--accent, #f97316)" />
            Clear
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <SkeletonLoader count={6} height={60} />
      ) : error ? (
        <EmptyState message="Couldn't load crops" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No crops match these filters" sub="Try a different season, type, or rank" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map(crop => <CropCard key={crop.id} crop={crop} density={density} />)}
        </div>
      )}
    </div>
  );
}
