// ── NPC Page ──────────────────────────────────────────────────────────────────

function NPCCard({ npc, density }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: THEME.cardBg,
        border: `1px solid ${hov ? THEME.primaryLight : THEME.cardBorder}`,
        borderRadius: 'var(--radius, 12px)',
        padding: density === 'compact' ? 16 : 20,
        transition: 'box-shadow 0.2s, transform 0.18s, border-color 0.18s',
        boxShadow: hov ? THEME.shadowHover : THEME.shadow,
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: npc.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700, fontSize: 16,
          boxShadow: `0 0 0 3px ${npc.color}33`,
        }}>
          {npc.initials}
        </div>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700, fontSize: 17, color: THEME.textDark, lineHeight: 1.2,
          }}>
            {npc.name}
          </div>
          <span style={{
            display: 'inline-block', marginTop: 4,
            background: THEME.primaryXLight, color: THEME.primary,
            padding: '2px 9px', borderRadius: 5,
            fontSize: 11, fontWeight: 600,
          }}>
            {npc.role}
          </span>
        </div>
      </div>

      {/* Location + schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: THEME.textMid }}>
          <Icon name="mapPin" size={12} color={THEME.textMid} />
          <span style={{ fontWeight: 500 }}>{npc.location}</span>
        </div>
        <div style={{ fontSize: 12, color: THEME.textMuted, paddingLeft: 17 }}>
          {npc.schedule}
        </div>
      </div>

      {/* Loved gifts */}
      <div>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: THEME.textMid,
          textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7,
        }}>
          Loved Gifts
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {npc.lovedGifts.map(gift => (
            <span key={gift} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#fff1f2', color: '#be123c',
              border: '1px solid #fecdd3',
              padding: '3px 9px', borderRadius: 999,
              fontSize: 11, fontWeight: 500,
            }}>
              <Icon name="heart" size={10} color="#be123c" />
              {gift}
            </span>
          ))}
        </div>
      </div>

      {/* Quest */}
      <div style={{
        padding: '10px 13px', borderRadius: 8,
        background: THEME.primaryXLight,
        border: `1px solid ${THEME.primaryLight}`,
        fontSize: 12.5, color: THEME.textDark, lineHeight: 1.55,
      }}>
        <span style={{ fontWeight: 700, color: THEME.primary }}>📜 Quest: </span>
        {npc.quest}
      </div>
    </div>
  );
}

function NPCPage({ density }) {
  const [search, setSearch] = React.useState('');
  const [role,   setRole]   = React.useState('');
  const { npcs } = window.GameData;

  const roles   = React.useMemo(() => [...new Set(npcs.map(n => n.role))].sort(), [npcs]);

  const filtered = npcs.filter(n => {
    if (role   && n.role !== role) return false;
    if (search && !n.name.toLowerCase().includes(search.toLowerCase()) &&
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

      {filtered.length === 0 ? (
        <EmptyState message="No residents found" sub="Try a different search or role filter" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: density === 'compact' ? 12 : 16,
        }}>
          {filtered.map(npc => <NPCCard key={npc.id} npc={npc} density={density} />)}
        </div>
      )}
    </div>
  );
}

window.NPCPage = NPCPage;
