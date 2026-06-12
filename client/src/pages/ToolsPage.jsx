import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { FilterSelect, EmptyState, LoadingDots, PriceBadge } from '../components/ui.jsx';
import { fetchTools } from '../data/api.js';

function ToolCard({ item, density }) {
  const [hov, setHov] = React.useState(false);
  let reqs = [];
  try {
    reqs = JSON.parse(item.requirements);
  } catch (e) {}

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
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700, fontSize: density === 'compact' ? 14 : 15.5,
          color: THEME.textDark, lineHeight: 1.2,
        }}>
          {item.name}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          padding: '2px 6px', borderRadius: 4,
          background: '#f1f5f9', color: '#475569',
        }}>
          {item.tier}
        </div>
      </div>
      
      <div style={{ fontSize: 12, fontWeight: 600, color: THEME.primary }}>
        {item.tool_type}
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <PriceBadge price={item.price} prefix="Cost: " />
        {item.days_delay > 0 && (
          <span style={{ fontSize: 12, color: THEME.textMid, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={12} /> {item.days_delay} Days
          </span>
        )}
      </div>

      {reqs.length > 0 && (
        <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.45 }}>
          <strong>Requirements:</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {reqs.map((r, i) => (
              <li key={i}>{r.amount}x {r.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ToolsPage({ density }) {
  const [tools, setTools] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [toolType, setToolType] = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTools()
      .then(rows => { if (alive) { setTools(rows); setError(null); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const types = React.useMemo(() => [...new Set(tools.map(o => o.tool_type))].sort(), [tools]);

  const filtered = tools.filter(t => {
    if (toolType && t.tool_type !== toolType) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasFilter = toolType || search;

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px',
        }}>
          Tools &amp; Upgrades
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {tools.length} equipment upgrades · Filtered: <strong>{filtered.length}</strong>
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 10, color: THEME.textMuted, display: 'flex', pointerEvents: 'none' }}>
            <Icon name="search" size={14} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tools…"
            style={{
              padding: '7px 12px 7px 30px',
              border: `1.5px solid ${search ? THEME.primary : THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: 'white', width: 180,
            }}
          />
        </div>

        <FilterSelect label="Tool Type" options={types} value={toolType} onChange={setToolType} />

        {hasFilter && (
          <button
            onClick={() => { setToolType(''); setSearch(''); }}
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
        <EmptyState message="Couldn't load tools" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No tools found" sub="Try adjusting your filters" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map((item, i) => <ToolCard key={`${item.name}-${i}`} item={item} density={density} />)}
        </div>
      )}
    </div>
  );
}
