// ── Caves Page ───────────────────────────────────────────────────────────────
import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { MineBadge, TypeBadge, FilterSelect, EmptyState, LoadingDots, mineConfig, typeLabel, prettifyTag } from '../components/ui.jsx';
import { fetchCaves } from '../data/api.js';
import mineUnlocks from '../data/mineUnlocks.json';

// DB floor ranges are mixed: "1-20" (numeric) vs "all floors" / "water pockets".
function floorText(floors) {
  return /^\d/.test(String(floors)) ? `Floors ${floors}` : prettifyTag(floors);
}

function CaveCard({ item, density }) {
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
        <TypeBadge type={item.type} />
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <MineBadge mine={item.mine} />
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          padding: '3px 9px', borderRadius: 999,
          fontSize: 11, fontWeight: 600, color: '#475569',
        }}>
          {floorText(item.floors)}
        </span>
      </div>
      {item.notes && (
        <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.45 }}>{item.notes}</div>
      )}
    </div>
  );
}

function MineBanner({ mine }) {
  if (!mine) return null;
  const cfg    = mineConfig[mine];
  const unlock = mineUnlocks[mine];
  if (!cfg) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '13px 16px', borderRadius: 10, marginBottom: 20,
      background: cfg.bg, border: `1.5px solid ${cfg.dot}40`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: cfg.dot + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: cfg.dot }} />
      </div>
      <div>
        <div style={{ fontWeight: 700, color: cfg.color, fontSize: 13.5, marginBottom: 3 }}>
          {cfg.label} Mine
        </div>
        {unlock && <div style={{ fontSize: 12.5, color: THEME.textMuted, lineHeight: 1.5 }}>{unlock}</div>}
      </div>
    </div>
  );
}

export default function CavesPage({ density }) {
  const [caves,   setCaves]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(null);

  const [mine,     setMine]     = React.useState('');
  const [itemType, setItemType] = React.useState('');
  const [search,   setSearch]   = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCaves()
      .then(rows => { if (alive) { setCaves(rows); setError(null); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const mines     = ['earth', 'water', 'wind', 'fire', 'memories'];
  const itemTypes = React.useMemo(() => [...new Set(caves.map(c => c.type))].sort(), [caves]);
  const cap       = s => s.charAt(0).toUpperCase() + s.slice(1);

  const filtered = caves.filter(c => {
    if (mine     && c.mine !== mine)     return false;
    if (itemType && c.type !== itemType) return false;
    if (search   && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasFilter = mine || itemType || search;

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px',
        }}>
          Caves &amp; Mining
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {caves.length} items across 5 elemental mines · Filtered: <strong>{filtered.length}</strong>
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
            placeholder="Search items…"
            style={{
              padding: '7px 12px 7px 30px',
              border: `1.5px solid ${search ? THEME.primary : THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: 'white', width: 155,
            }}
          />
        </div>

        <FilterSelect label="Mine"      options={mines}     value={mine}     onChange={setMine}     displayFn={cap} />
        <FilterSelect label="Item Type" options={itemTypes} value={itemType} onChange={setItemType} displayFn={typeLabel} />

        {hasFilter && (
          <button
            onClick={() => { setMine(''); setItemType(''); setSearch(''); }}
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

      {mine && <MineBanner mine={mine} />}

      {loading ? (
        <LoadingDots />
      ) : error ? (
        <EmptyState message="Couldn't load cave items" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No cave items found" sub="Try a different mine or item type" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map(item => <CaveCard key={item.id} item={item} density={density} />)}
        </div>
      )}
    </div>
  );
}
