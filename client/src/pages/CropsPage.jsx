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

// ── Crop ROI Calculator ──────────────────────────────────────────────────────
function CropCalculator({ crops, isOpen, onClose }) {
  const [calcSeason, setCalcSeason] = React.useState('spring');
  const [daysLeft, setDaysLeft] = React.useState(28);

  if (!isOpen) return null;

  // Filter crops by season and calculate ROI
  const calculated = crops
    .filter(c => c.season === 'all' || String(c.season).includes(calcSeason))
    .filter(c => c.growTime != null && c.sellPrice != null)
    .map(c => {
      let harvests = 0;
      let totalRevenue = 0;
      if (daysLeft >= c.growTime) {
        harvests = 1;
        if (c.regrows && c.regrowthDays) {
          const remaining = daysLeft - c.growTime;
          harvests += Math.floor(remaining / c.regrowthDays);
        }
        totalRevenue = harvests * c.sellPrice;
      }
      return { ...c, harvests, totalRevenue };
    })
    .filter(c => c.harvests > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3);

  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 24, marginBottom: 24,
      border: `1px solid ${THEME.primaryLight}`, boxShadow: THEME.shadowHover,
      position: 'relative'
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none',
        color: THEME.textMuted, cursor: 'pointer'
      }}>
        <Icon name="x" size={20} />
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: THEME.primaryXLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="coin" size={20} color={THEME.primary} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: THEME.textDark, fontFamily: "'Playfair Display', serif" }}>Crop Revenue Calculator</h2>
          <div style={{ fontSize: 13, color: THEME.textMuted }}>Calculate max gross revenue based on remaining days.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.textMid, marginBottom: 6 }}>Current Season</label>
          <FilterSelect label="" options={['spring', 'summer', 'fall', 'winter']} value={calcSeason} onChange={setCalcSeason} displayFn={s => s.charAt(0).toUpperCase() + s.slice(1)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.textMid, marginBottom: 6 }}>Days Left</label>
          <input 
            type="number" min="1" max="28" value={daysLeft} 
            onChange={e => setDaysLeft(parseInt(e.target.value) || 0)}
            style={{
              padding: '6px 12px', border: `1.5px solid ${THEME.cardBorder}`, borderRadius: 8,
              fontSize: 14, outline: 'none', width: 100, fontFamily: "'Inter', sans-serif"
            }}
          />
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: THEME.textDark, marginBottom: 12 }}>Top 3 Most Lucrative Crops</h3>
        {calculated.length === 0 ? (
          <div style={{ fontSize: 13, color: THEME.textMuted, padding: '10px 0' }}>Not enough days left to grow any crops.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {calculated.map((c, idx) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: THEME.bg, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textMid, width: 16 }}>#{idx + 1}</div>
                  <div style={{ fontWeight: 600, color: THEME.textDark, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: THEME.textMuted }}>{c.harvests} {c.harvests === 1 ? 'harvest' : 'harvests'}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {c.totalRevenue}g <Icon name="coin" size={14} color="#b45309" />
                </div>
              </div>
            ))}
          </div>
        )}
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
  const [calcOpen, setCalcOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('grid');

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
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
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
        <button 
          onClick={() => setCalcOpen(!calcOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: calcOpen ? THEME.primaryLight : THEME.primary, 
            color: calcOpen ? THEME.primaryDark : 'white',
            fontWeight: 600, fontSize: 14, fontFamily: "'Inter', sans-serif",
            transition: 'background 0.2s'
          }}
        >
          <Icon name="coin" size={16} color="currentColor" />
          Calculator
        </button>
      </div>

      <CropCalculator crops={crops} isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

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

        <div style={{ marginLeft: 'auto', display: 'flex', background: THEME.bg, borderRadius: 8, padding: 4, border: `1px solid ${THEME.cardBorder}` }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
              background: viewMode === 'grid' ? 'white' : 'transparent',
              color: viewMode === 'grid' ? THEME.textDark : THEME.textMuted,
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              boxShadow: viewMode === 'grid' ? THEME.shadow : 'none',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Icon name="layout" size={14} color="currentColor" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
              background: viewMode === 'list' ? 'white' : 'transparent',
              color: viewMode === 'list' ? THEME.textDark : THEME.textMuted,
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              boxShadow: viewMode === 'list' ? THEME.shadow : 'none',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Icon name="list" size={14} color="currentColor" />
            List
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <SkeletonLoader count={6} height={60} />
      ) : error ? (
        <EmptyState message="Couldn't load crops" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No crops match these filters" sub="Try a different season, type, or rank" />
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map(crop => <CropCard key={crop.id} crop={crop} density={density} />)}
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 12, border: `1px solid ${THEME.cardBorder}`,
          overflow: 'hidden', boxShadow: THEME.shadow
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ background: THEME.bg, borderBottom: `2px solid ${THEME.cardBorder}`, color: THEME.textMid, fontSize: 12, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Season</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rank</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Grow Time</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sell Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((crop, i) => (
                <tr key={crop.id} style={{ borderBottom: `1px solid ${THEME.cardBorder}`, background: i % 2 === 0 ? 'white' : THEME.bg }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: THEME.textDark }}>{crop.name}</td>
                  <td style={{ padding: '12px 16px' }}><SeasonPill season={crop.season} /></td>
                  <td style={{ padding: '12px 16px' }}><TypeBadge type={crop.type} /></td>
                  <td style={{ padding: '12px 16px' }}><RankBadge rank={crop.rank} /></td>
                  <td style={{ padding: '12px 16px', color: THEME.textMid }}>
                    {crop.growTime != null ? `${crop.growTime}d` : '—'}
                    {crop.regrows && <span style={{ color: '#15803d', fontSize: 12, marginLeft: 6 }}>↩ {crop.regrowthDays}d</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#92400e' }}>{crop.sellPrice}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
