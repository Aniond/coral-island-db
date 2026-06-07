// ── Recipes Page ─────────────────────────────────────────────────────────────
// Cooking + crafting recipes. Two top-level tabs, a search bar that matches both
// recipe names AND ingredient names, plus a per-tab filter (utensil / category).
import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { EmptyState, LoadingDots, FilterSelect } from '../components/ui.jsx';
import { fetchCookingRecipes, fetchCraftingRecipes } from '../data/api.js';

const MODES = [
  { id: 'cooking',  label: 'Cooking',  emoji: '🍳' },
  { id: 'crafting', label: 'Crafting', emoji: '🔨' },
];

const CATEGORY_COLORS = {
  Farming:   { bg: '#dcfce7', color: '#15803d' },
  Artisan:   { bg: '#ede9fe', color: '#6d28d9' },
  Decor:     { bg: '#fce7f3', color: '#be185d' },
  Scarecrow: { bg: '#fef3c7', color: '#b45309' },
  Misc:      { bg: '#f1f5f9', color: '#475569' },
};

// ── Small ingredient / output thumbnail with emoji-free fallback ──────────────
function Thumb({ src, size = 40 }) {
  const [failed, setFailed] = React.useState(false);
  if (src && !failed) {
    return (
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0,
          background: THEME.primaryXLight, borderRadius: 8, padding: 3 }} />
    );
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: 8,
      background: THEME.primaryXLight, display: 'flex', alignItems: 'center',
      justifyContent: 'center' }}>
      <Icon name="cookingPot" size={Math.round(size * 0.5)} color={THEME.primary} />
    </div>
  );
}

function StatChip({ icon, color, value, suffix }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color }}>
      <Icon name={icon} size={12} color={color} />{value}{suffix}
    </span>
  );
}

function IngredientList({ items }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: THEME.textMuted }}>
        Ingredients
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((ing, i) => (
          <span key={i} title={`${ing.amount}× ${ing.name}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: THEME.primaryXLight, border: `1px solid ${THEME.cardBorder}`,
            borderRadius: 999, padding: '2px 9px 2px 3px', fontSize: 12, color: THEME.textDark,
          }}>
            <Thumb src={ing.icon} size={22} />
            <span><b style={{ color: THEME.textMid }}>{ing.amount}×</b> {ing.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function RecipeCard({ item }) {
  const [hov, setHov] = React.useState(false);
  const isCooking = item.kind === 'cooking';
  const cat = !isCooking && (CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Misc);

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
        display: 'flex', flexDirection: 'column', gap: 11,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <Thumb src={item.image} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14.5, color: THEME.textDark, lineHeight: 1.2 }}>
            {item.name}{!isCooking && item.outputAmount > 1 ? ` ×${item.outputAmount}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {isCooking && item.utensil && (
              <span style={{ padding: '1px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                {item.utensil}
              </span>
            )}
            {cat && (
              <span style={{ padding: '1px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: cat.bg, color: cat.color }}>
                {item.category}
              </span>
            )}
            {!isCooking && item.masteryType && (
              <span style={{ fontSize: 11, fontWeight: 600, color: THEME.textMuted }}>
                {item.masteryType} Lv.{item.masteryLevel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cooking stats */}
      {isCooking && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {item.health != null && <StatChip icon="heart" color="#dc2626" value={item.health} />}
          {item.energy != null && <StatChip icon="zap" color="#d97706" value={item.energy} />}
          {item.sellPrice != null && <StatChip icon="coin" color="#b45309" value={item.sellPrice} suffix="g" />}
        </div>
      )}

      {/* Buff */}
      {isCooking && item.buff && (
        <span style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
          background: THEME.primaryXLight, color: THEME.primary, border: `1px solid ${THEME.cardBorder}`,
        }}>
          <Icon name="sparkles" size={12} color={THEME.primary} />
          {item.buff}{item.buffDuration ? ` · ${item.buffDuration} min` : ''}
        </span>
      )}

      <IngredientList items={item.ingredients} />

      {item.description && (
        <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.45, fontStyle: 'italic' }}>
          {item.description}
        </div>
      )}
    </div>
  );
}

export default function RecipesPage({ density }) {
  const [cooking,  setCooking]  = React.useState([]);
  const [crafting, setCrafting] = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState(null);
  const [mode,     setMode]     = React.useState('cooking');
  const [search,   setSearch]   = React.useState('');
  const [utensil,  setUtensil]  = React.useState('');
  const [category, setCategory] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchCookingRecipes(), fetchCraftingRecipes()])
      .then(([c, cr]) => { if (alive) { setCooking(c); setCrafting(cr); setError(null); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const utensils   = React.useMemo(() => [...new Set(cooking.map(r => r.utensil).filter(Boolean))].sort(), [cooking]);
  const categories = React.useMemo(() => [...new Set(crafting.map(r => r.category).filter(Boolean))].sort(), [crafting]);

  const list = mode === 'cooking' ? cooking : crafting;
  const q = search.trim().toLowerCase();
  const filtered = list.filter(r => {
    if (mode === 'cooking'  && utensil  && r.utensil  !== utensil)  return false;
    if (mode === 'crafting' && category && r.category !== category) return false;
    if (q) {
      const hay = (r.name + ' ' + r.ingredients.map(i => i.name).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px' }}>
          Recipes
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {cooking.length} cooking & {crafting.length} crafting recipes — search by name or ingredient
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {MODES.map(m => {
          const active = mode === m.id;
          const count = m.id === 'cooking' ? cooking.length : crafting.length;
          return (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 9, cursor: 'pointer',
              border: `1.5px solid ${active ? THEME.primary : THEME.cardBorder}`,
              background: active ? THEME.primary : 'white',
              color: active ? 'white' : THEME.textMid,
              fontSize: 13, fontWeight: active ? 600 : 500,
              fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
            }}>
              <span>{m.emoji}</span>
              {m.label}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '0 6px', borderRadius: 999,
                background: active ? 'rgba(255,255,255,0.22)' : THEME.primaryXLight,
                color: active ? 'white' : THEME.primary,
              }}>
                {count || '·'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 10, color: THEME.textMuted, display: 'flex', pointerEvents: 'none' }}>
            <Icon name="search" size={14} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${mode} recipes or ingredients…`}
            style={{
              padding: '7px 30px 7px 30px',
              border: `1.5px solid ${search ? THEME.primary : THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: 'white', width: 280, maxWidth: '100%',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} title="Clear" style={{
              position: 'absolute', right: 8, display: 'flex', border: 'none',
              background: 'transparent', cursor: 'pointer', color: THEME.textMuted, padding: 0,
            }}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {mode === 'cooking'
          ? <FilterSelect label="Utensil"  options={utensils}   value={utensil}  onChange={setUtensil} />
          : <FilterSelect label="Category" options={categories} value={category} onChange={setCategory} />}
      </div>

      {/* Body */}
      {loading ? (
        <LoadingDots />
      ) : error ? (
        <EmptyState message="Couldn't load recipes" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No recipes match" sub="Try a different search or filter" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map(it => <RecipeCard key={`${it.kind}-${it.id}`} item={it} />)}
        </div>
      )}
    </div>
  );
}
