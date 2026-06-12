import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { FilterSelect, EmptyState, LoadingDots, TypeBadge } from '../components/ui.jsx';
import { fetchOfferings } from '../data/api.js';

export default function OfferingsPage({ density }) {
  const [offerings, setOfferings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [altar, setAltar] = React.useState('');
  const [bundle, setBundle] = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchOfferings()
      .then(rows => { if (alive) { setOfferings(rows); setError(null); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const altars = React.useMemo(() => [...new Set(offerings.map(o => o.altar_name))].sort(), [offerings]);
  
  // Filter bundles based on selected altar (if any)
  const availableBundles = React.useMemo(() => {
    const subset = altar ? offerings.filter(o => o.altar_name === altar) : offerings;
    return [...new Set(subset.map(o => o.bundle_name))].sort();
  }, [offerings, altar]);

  const filtered = offerings.filter(o => {
    if (altar && o.altar_name !== altar) return false;
    if (bundle && o.bundle_name !== bundle) return false;
    if (search && !o.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasFilter = altar || bundle || search;

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px',
        }}>
          Goddess Offerings
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {offerings.length} items required for bundles · Filtered: <strong>{filtered.length}</strong>
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
              background: 'white', width: 180,
            }}
          />
        </div>

        <FilterSelect label="Altar" options={altars} value={altar} onChange={a => { setAltar(a); setBundle(''); }} />
        <FilterSelect label="Bundle" options={availableBundles} value={bundle} onChange={setBundle} />

        {hasFilter && (
          <button
            onClick={() => { setAltar(''); setBundle(''); setSearch(''); }}
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
        <EmptyState message="Couldn't load offerings" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No offerings found" sub="Try adjusting your filters" />
      ) : (
        <div style={{
          background: 'white', borderRadius: 12, border: `1px solid ${THEME.cardBorder}`,
          overflow: 'hidden', boxShadow: THEME.shadow
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ background: THEME.bg, borderBottom: `2px solid ${THEME.cardBorder}`, color: THEME.textMid, fontSize: 12, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Altar</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Bundle</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Item</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Quality</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={`${item.altar_name}-${item.bundle_name}-${item.item_name}`} style={{ borderBottom: `1px solid ${THEME.cardBorder}`, background: i % 2 === 0 ? 'white' : THEME.bg }}>
                  <td style={{ padding: '12px 16px', color: THEME.textMid, fontWeight: 500 }}>{item.altar_name}</td>
                  <td style={{ padding: '12px 16px', color: THEME.textMid }}>{item.bundle_name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: THEME.textDark }}>{item.item_name}</td>
                  <td style={{ padding: '12px 16px', color: THEME.textDark }}>{item.amount}</td>
                  <td style={{ padding: '12px 16px' }}><TypeBadge type={item.quality || 'Base'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
