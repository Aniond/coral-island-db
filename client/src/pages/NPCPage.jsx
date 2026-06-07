// ── NPC Page ─────────────────────────────────────────────────────────────────
import React from 'react';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { FilterSelect, EmptyState, LoadingDots } from '../components/ui.jsx';
import { fetchNpcs } from '../data/api.js';

function Avatar({ npc, size = 52 }) {
  const [failed, setFailed] = React.useState(false);
  const ring = { boxShadow: `0 0 0 3px ${npc.color}33` };
  if (npc.image && !failed) {
    return (
      <img
        src={npc.image}
        alt={npc.name}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          objectFit: 'cover', background: THEME.primaryXLight, ...ring,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: npc.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: "'Playfair Display', serif",
      fontWeight: 700, fontSize: size * 0.32, ...ring,
    }}>
      {npc.initials}
    </div>
  );
}

function GiftRow({ label, gifts, tone }) {
  if (!gifts.length) return null;
  const styles = tone === 'loved'
    ? { bg: '#fff1f2', fg: '#be123c', bd: '#fecdd3' }
    : { bg: THEME.primaryXLight, fg: THEME.primary, bd: THEME.primaryLight };
  return (
    <div>
      <div style={{
        fontSize: 10.5, fontWeight: 700, color: THEME.textMid,
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {gifts.map(gift => (
          <span key={gift} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: styles.bg, color: styles.fg, border: `1px solid ${styles.bd}`,
            padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500,
          }}>
            {tone === 'loved' && <Icon name="heart" size={10} color={styles.fg} />}
            {gift}
          </span>
        ))}
      </div>
    </div>
  );
}

function NPCCard({ npc, density }) {
  const [open, setOpen] = React.useState(false);
  const [hov, setHov] = React.useState(false);
  const hasWhereabouts = npc.location || npc.schedule;

  return (
    <div
      onClick={() => setOpen(o => !o)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: THEME.cardBg,
        border: `1px solid ${open || hov ? THEME.primaryLight : THEME.cardBorder}`,
        borderRadius: 'var(--radius, 12px)',
        padding: density === 'compact' ? 14 : 18,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.18s, border-color 0.18s',
        boxShadow: hov || open ? THEME.shadowHover : THEME.shadow,
        transform: hov && !open ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: open ? 14 : 0,
      }}
    >
      {/* Collapsed header — portrait + name (always visible) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative' }}>
        {/* chevron toggle hint */}
        <div style={{
          position: 'absolute', top: -2, right: -2,
          color: THEME.textMuted, display: 'flex',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          <Icon name="chevDown" size={16} color={THEME.textMuted} />
        </div>

        <Avatar npc={npc} size={72} />

        <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700, fontSize: 16, color: THEME.textDark, lineHeight: 1.2,
          }}>
            {npc.name}
          </div>
          {!open && (
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3 }}>
              {npc.role}
            </div>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.18s ease' }}>
          {/* role + birthday badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-block',
              background: THEME.primaryXLight, color: THEME.primary,
              padding: '2px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600,
            }}>
              {npc.role}
            </span>
            {npc.birthday && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                background: '#fdf2f8', color: '#be185d',
                padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
              }}>
                🎂 {npc.birthday}
              </span>
            )}
          </div>

          {/* Location + schedule (only when known) */}
          {hasWhereabouts && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {npc.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: THEME.textMid }}>
                  <Icon name="mapPin" size={12} color={THEME.textMid} />
                  <span style={{ fontWeight: 500 }}>{npc.location}</span>
                </div>
              )}
              {npc.schedule && (
                <div style={{ fontSize: 12, color: THEME.textMuted, paddingLeft: 17 }}>
                  {npc.schedule}
                </div>
              )}
            </div>
          )}

          <GiftRow label="Loved Gifts" gifts={npc.lovedGifts} tone="loved" />
          <GiftRow label="Liked Gifts" gifts={npc.likedGifts} tone="liked" />

          {/* About / bio */}
          {npc.quest && (
            <div style={{
              padding: '10px 13px', borderRadius: 8,
              background: THEME.primaryXLight,
              border: `1px solid ${THEME.primaryLight}`,
              fontSize: 12.5, color: THEME.textDark, lineHeight: 1.55,
            }}>
              <span style={{ fontWeight: 700, color: THEME.primary }}>About </span>
              {npc.quest}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NPCPage({ density }) {
  const [npcs,    setNpcs]    = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(null);

  const [search, setSearch] = React.useState('');
  const [role,   setRole]   = React.useState('');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchNpcs()
      .then(rows => { if (alive) { setNpcs(rows); setError(null); } })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const roles = React.useMemo(() => [...new Set(npcs.map(n => n.role))].sort(), [npcs]);

  const filtered = npcs.filter(n => {
    if (role && n.role !== role) return false;
    if (search &&
      !n.name.toLowerCase().includes(search.toLowerCase()) &&
      !n.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasFilter = role || search;

  return (
    <div style={{ padding: density === 'compact' ? '20px 24px 80px' : '32px 32px 80px', maxWidth: 1280 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: THEME.textDark, margin: '0 0 5px',
        }}>
          NPCs &amp; Quests
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.textMid, margin: 0 }}>
          {npcs.length} island residents · Build friendships &amp; complete quests
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
            placeholder="Search residents…"
            style={{
              padding: '7px 12px 7px 30px',
              border: `1.5px solid ${search ? THEME.primary : THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: 'white', width: 170,
            }}
          />
        </div>

        <FilterSelect label="Role" options={roles} value={role} onChange={setRole} />

        {hasFilter && (
          <button
            onClick={() => { setRole(''); setSearch(''); }}
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
        <EmptyState message="Couldn't load residents" sub={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No residents found" sub="Try a different search or role filter" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
          alignItems: 'start',
        }}>
          {filtered.map(npc => <NPCCard key={npc.id} npc={npc} density={density} />)}
        </div>
      )}
    </div>
  );
}
