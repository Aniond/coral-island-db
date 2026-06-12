import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { FilterSelect, EmptyState, LoadingDots, PriceBadge } from '../components/ui.jsx';
import { fetchAnimalProducts, fetchArtisanProducts } from '../data/api.js';

function ProductCard({ item, type, density }) {
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
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          padding: '2px 6px', borderRadius: 4,
          background: type === 'animal' ? '#e0f2fe' : '#fce7f3',
          color: type === 'animal' ? '#0369a1' : '#be185d',
        }}>
          {type === 'animal' ? 'Animal' : 'Artisan'}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <PriceBadge price={item.sell_price} />
      </div>

      {item.description && (
        <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.45 }}>{item.description}</div>
      )}
    </div>
  );
}

export default function ProductsPage({ density }) {
  const [animal, setAnimal] = React.useState([]);
  const [artisan, setArtisan] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [productType, setProductType] = React.useState('all');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchAnimalProducts(), fetchArtisanProducts()])
      .then(([anData, arData]) => {
        if (alive) {
          setAnimal(anData.map(d => ({ ...d, product_category: 'animal' })));
          setArtisan(arData.map(d => ({ ...d, product_category: 'artisan' })));
          setError(null);
        }
      })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const allProducts = React.useMemo(() => [...animal, ...artisan], [animal, artisan]);

  const filtered = allProducts.filter(p => {
    if (productType !== 'all' && p.product_category !== productType) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasFilter = productType !== 'all' || search;

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px',
        }}>
          Farm Products
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {allProducts.length} items from animals and machines · Filtered: <strong>{filtered.length}</strong>
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
            placeholder="Search products…"
            style={{
              padding: '7px 12px 7px 30px',
              border: `1.5px solid ${search ? THEME.primary : THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: 'white', width: 180,
            }}
          />
        </div>

        <FilterSelect label="Type" options={['all', 'animal', 'artisan']} value={productType} onChange={setProductType} displayFn={s => s === 'all' ? 'All' : (s.charAt(0).toUpperCase() + s.slice(1))} />

        {hasFilter && (
          <button
            onClick={() => { setProductType('all'); setSearch(''); }}
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
        <EmptyState message="Couldn't load products" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No products found" sub="Try adjusting your filters" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map(item => <ProductCard key={`${item.product_category}-${item.name}`} item={item} type={item.product_category} density={density} />)}
        </div>
      )}
    </div>
  );
}
