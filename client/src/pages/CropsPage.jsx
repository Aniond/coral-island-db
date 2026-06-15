// ── Crops Page ───────────────────────────────────────────────────────────────
import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { SeasonPill, RankBadge, TypeBadge, FilterSelect, EmptyState, SkeletonLoader, typeLabel } from '../components/ui.jsx';
import { fetchCrops } from '../data/api.js';

function CropCard({ crop, density, isCalculating }) {
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
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: THEME.textMid, fontSize: 12.5 }}>
          <Icon name="clock" size={13} color={THEME.textMid} />
          <span>{crop.growTime != null ? `${crop.growTime}d` : '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>
          <Icon name="coin" size={13} color="#b45309" />
          <span style={{ fontWeight: 700, color: '#92400e' }}>
            {isCalculating ? `${crop.profit}g profit` : `${crop.sellPrice}g`}
          </span>
          {!isCalculating && crop.seedPrice != null && (
            <span style={{ color: THEME.textMuted, fontWeight: 500, marginLeft: 4 }}>(Cost: {crop.seedPrice}g)</span>
          )}
          {isCalculating && (
            <span style={{ color: THEME.textMuted, fontWeight: 500, marginLeft: 4 }}>({crop.harvests} {crop.harvests === 1 ? 'harvest' : 'harvests'})</span>
          )}
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
  const [daysLeft, setDaysLeft] = React.useState('');
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

  const isCalculating = parseInt(daysLeft) > 0;
  
  const calculated = filtered.map(c => {
    let harvests = 0;
    let totalRevenue = 0;
    let profit = 0;
    if (isCalculating && c.growTime != null && c.sellPrice != null) {
      const dl = parseInt(daysLeft) || 0;
      if (dl >= c.growTime) {
        harvests = 1;
        if (c.regrows && c.regrowthDays) {
          harvests += Math.floor((dl - c.growTime) / c.regrowthDays);
        }
        totalRevenue = harvests * c.sellPrice;
        const totalCost = c.seedPrice || 0;
        profit = totalRevenue - totalCost;
      }
    }
    return { ...c, harvests, totalRevenue, profit };
  });

  let displayCrops = isCalculating ? calculated.filter(c => c.harvests > 0) : calculated;
  if (isCalculating) {
    displayCrops.sort((a, b) => b.profit - a.profit);
  }

  const hasFilter = season || type || rank || search || daysLeft;

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
            {crops.length} crops across all seasons · Filtered: <strong>{displayCrops.length}</strong>
          </p>
        </div>
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

        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <input
            type="number" min="1" max="28"
            value={daysLeft}
            onChange={e => setDaysLeft(e.target.value)}
            placeholder="Days left..."
            style={{
              padding: '7px 12px',
              border: `1.5px solid ${daysLeft ? '#b45309' : THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: daysLeft ? '#fffbeb' : 'white', width: 110,
            }}
          />
        </div>

        {hasFilter && (
          <button
            onClick={() => { setSeason(''); setType(''); setRank(''); setSearch(''); setDaysLeft(''); }}
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
      ) : displayCrops.length === 0 ? (
        <EmptyState message="No crops match these filters" sub={isCalculating ? "Not enough days left to grow any of the filtered crops." : "Try a different season, type, or rank"} />
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {displayCrops.map(crop => <CropCard key={crop.id} crop={crop} density={density} isCalculating={isCalculating} />)}
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
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Seed Cost</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sell (Base)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>{isCalculating ? 'Total Profit' : 'Profit (Base)'}</th>
                {isCalculating && <th style={{ padding: '12px 16px', fontWeight: 600 }}>Harvests</th>}
              </tr>
            </thead>
            <tbody>
              {displayCrops.map((crop, i) => (
                <tr key={crop.id} style={{ borderBottom: `1px solid ${THEME.cardBorder}`, background: i % 2 === 0 ? 'white' : THEME.bg }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: THEME.textDark }}>{crop.name}</td>
                  <td style={{ padding: '12px 16px' }}><SeasonPill season={crop.season} /></td>
                  <td style={{ padding: '12px 16px' }}><TypeBadge type={crop.type} /></td>
                  <td style={{ padding: '12px 16px' }}><RankBadge rank={crop.rank} /></td>
                  <td style={{ padding: '12px 16px', color: THEME.textMid }}>
                    {crop.growTime != null ? `${crop.growTime}d` : '—'}
                    {crop.regrows && <span style={{ color: '#15803d', fontSize: 12, marginLeft: 6 }}>↩ {crop.regrowthDays}d</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: THEME.textMid }}>{crop.seedPrice ? `${crop.seedPrice}g` : '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#92400e' }}>{crop.sellPrice}g</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a' }}>
                    {isCalculating ? `+${crop.profit}g` : (crop.seedPrice ? `+${crop.sellPrice - crop.seedPrice}g` : '—')}
                  </td>
                  {isCalculating && <td style={{ padding: '12px 16px', color: THEME.textMid }}>{crop.harvests}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
