// ── AI Guide — Floating chat panel ───────────────────────────────────────────

const SUGGESTED_QS = [
  "What's the best crop to plant in spring?",
  "How do I unlock the Water Mine?",
  "What gifts does Lily love?",
  "How do I earn money fast early on?",
  "What can I forage in fall?",
];

const AI_KB = {
  spring:   "Spring is perfect for high-value crops 🌸\n\n**Strawberries** (Rank A · 120g · regrows) are the undisputed best. Plant on Day 1 so they regrow as many times as possible before summer.\n\n**Cauliflower** (Rank B · 90g) is great for a one-time big payout. **Tulips** are low-value but Lily adores them as gifts.",
  summer:   "Summer is hot and profitable ☀️\n\n**Blueberries** (Rank B · 80g · regrows) are your best friend — plant once, harvest multiple times. **Tomatoes** (35g · regrows) are a budget staple. **Corn** regrows too and can carry into Fall if you plant early.",
  fall:     "Fall is harvest festival season 🍂\n\n**Cranberries** (Rank A · 130g · regrows) are the most valuable seasonal crop. **Eggplant** (30g · regrows) is a reliable low-effort earner. **Pumpkin** is crowd-pleasing but doesn't regrow, so plant it Day 1.",
  winter:   "Winter farming is challenging but rewarding ❄️\n\n**Crystal Berry** (Rank B · 110g) is your top earner. **Snow Peas** regrow and are consistent. The season is short — plant early and consider spending time in the mines instead.",
  mine:     "The 5 elemental mines unlock progressively 🪨\n\n**Earth Mine** — Day 1, no requirements\n**Water Mine** — Town Rank D (donate 30 items to museum)\n**Wind Mine** — Town Rank C (complete Tidal's quest)\n**Fire Mine** — Town Rank B (clear all 40 Wind Mine floors)\n**Memories Mine** — Town Rank A (secret seasonal event)",
  water:    "The **Water Mine** unlocks at Town Rank D — donate 30 items to the island museum to reach it.\n\nInside: Coral Fragments (floors 1–15), Sea Crystals (16–25, very valuable!), and rare Pearls (26–40). Tidal's quest will walk you through the unlock.",
  lily:     "Lily is the island's **Botanist** at the Greenhouse (7am–4pm, Park afternoons) 🌿\n\nShe absolutely loves: Rare Flowers, Honey, and Crystal Berry.\n\nHer quest line asks for exotic plant specimens — completing it unlocks new seed varieties and, eventually, expands your farming options.",
  gift:     "Gift-giving tips 🎁\n\nEach NPC has 3 loved gifts visible on their card. Universal safe bets: Gems, Sea Crystals, and high-quality produce. **Never** give junk or recycled items — it hurts your friendship score. Birthday gifts give **8× friendship points**, so mark those dates!",
  money:    "Early money-making strategies 💰\n\n1. Plant regrow crops (Strawberries → Blueberries → Cranberries)\n2. Mine copper & iron — sell raw or smelt for tools/upgrades\n3. Forage daily — it's completely free gold\n4. Fishing at the Harbor earns decent cash and Sam's friendship\n5. Sell direct at the market on festival days for a price bonus",
  forage:   "Foraging by season 🌿\n\n**Spring:** Wild Berries (Forest Trail), Fiddlehead Fern (River Bank)\n**Summer:** Coconut & Palm Fruit (Coastal), Sea Urchin (Tide Pools)\n**Fall:** Wild Mushroom & Chanterelle (Deep Forest — most valuable!)\n**Winter:** Holly Berry (Snow Fields), Ice Crystal (Frozen Lake)\n**Year-round:** Seaweed (Shoreline) — useful for crafting",
  npc:      "There are 8 island residents to befriend 👥\n\n**Sam** (Harbor) loves fish · **Lily** (Greenhouse) loves flowers · **Marcus** (Restaurant) loves truffles · **Elena** (Clinic) loves herbs & gems · **Tidal** (Research Center) loves sea items · **Naomi** (Mayor) loves relics · **Keanu** (Beach) loves coastal finds · **Mira** (Studio) loves gems & flowers",
  rank:     "Town Rank is the backbone of Coral Island's progression 🏆\n\nDonate items to the museum, complete NPC quests, and ship crops to raise your rank from F → E → D → C → B → A. Each rank unlocks new mines, areas, and events. Talk to Mayor Naomi for rank-up guidance.",
  default:  "Happy to help with all things Coral Island! 🌴\n\nTry asking about:\n• **Seasonal crops** and their profit tiers\n• **Mine unlocks** and what to find inside\n• **NPC gifts** and quest rewards\n• **Foraging spots** by season\n• **Money-making** strategies",
};

function getResponse(q) {
  const s = q.toLowerCase();
  if (s.includes('spring'))                                    return AI_KB.spring;
  if (s.includes('summer'))                                    return AI_KB.summer;
  if (s.includes('fall') || s.includes('autumn'))             return AI_KB.fall;
  if (s.includes('winter'))                                    return AI_KB.winter;
  if (s.includes('water mine'))                               return AI_KB.water;
  if ((s.includes('unlock') && s.includes('mine')) || (s.includes('mine') && !s.includes('yours'))) return AI_KB.mine;
  if (s.includes('lily'))                                      return AI_KB.lily;
  if (s.includes('gift') || s.includes('love') || s.includes('give')) return AI_KB.gift;
  if (s.includes('money') || s.includes('earn') || s.includes('gold') || s.includes('profit') || s.includes('fast')) return AI_KB.money;
  if (s.includes('forage') || s.includes('find') || s.includes('pick')) return AI_KB.forage;
  if (s.includes('npc') || s.includes('resident') || s.includes('friend')) return AI_KB.npc;
  if (s.includes('rank') || s.includes('town'))               return AI_KB.rank;
  return AI_KB.default;
}

// renders markdown-style **bold** inline
function MsgLine({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8, marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: THEME.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="sparkles" size={13} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '9px 13px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
        background: isUser ? 'var(--accent-light, #fff7ed)' : THEME.primaryXLight,
        color: isUser ? '#7c2d12' : THEME.textDark,
        fontSize: 12.5, lineHeight: 1.65,
        border: `1px solid ${isUser ? 'var(--accent-border, #fed7aa)' : THEME.primaryLight}`,
      }}>
        {msg.content.split('\n').map((line, i, arr) => (
          <div key={i} style={{ marginBottom: i < arr.length - 1 ? 3 : 0 }}>
            <MsgLine text={line} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: THEME.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name="sparkles" size={13} color="white" />
      </div>
      <div style={{
        padding: '11px 15px', borderRadius: '4px 14px 14px 14px',
        background: THEME.primaryXLight, border: `1px solid ${THEME.primaryLight}`,
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: THEME.primary,
            animation: `ciWave 1.1s ease-in-out ${i * 0.16}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

function AIGuide({ isOpen, onToggle }) {
  const [messages, setMessages] = React.useState([]);
  const [input,    setInput]    = React.useState('');
  const [typing,   setTyping]   = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  function send(text) {
    const t = text.trim();
    if (!t) return;
    setMessages(prev => [...prev, { role: 'user', content: t, id: Date.now() }]);
    setInput('');
    setTyping(true);
    const delay = 700 + Math.random() * 600;
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: getResponse(t), id: Date.now() + 1 },
      ]);
    }, delay);
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={onToggle}
        title="AI Guide"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: '50%',
          background: isOpen ? 'var(--accent, #f97316)' : THEME.primary,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
          transition: 'background 0.2s, transform 0.15s',
          zIndex: 1001,
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Icon name={isOpen ? 'x' : 'sparkles'} size={22} color="white" />
      </button>

      {/* Chat panel */}
      <div style={{
        position: 'fixed', bottom: 88, right: 24,
        width: 380, height: 500,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.16)',
        border: `1px solid ${THEME.cardBorder}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        transformOrigin: 'bottom right',
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.94)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s',
      }}>
        {/* Header */}
        <div style={{
          padding: '13px 15px',
          background: THEME.primary,
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkles" size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: 'white', fontWeight: 700, fontSize: 14,
              fontFamily: "'Playfair Display', serif",
            }}>Island AI Guide</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>Ask me anything</div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Clear chat"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                padding: '4px 8px', cursor: 'pointer', color: 'white',
                fontSize: 11, fontFamily: "'Inter', sans-serif",
              }}
            >
              Clear
            </button>
          )}
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <Icon name="x" size={16} color="rgba(255,255,255,0.8)" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 14px' }}>
          {messages.length === 0 && !typing ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ fontSize: 34, lineHeight: 1, marginBottom: 8 }}>🌴</div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 15, fontWeight: 700, color: THEME.textDark, marginBottom: 5,
                }}>Welcome to the AI Guide!</div>
                <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5 }}>
                  Ask about crops, mining, NPCs, or island life.
                </div>
              </div>
              <div style={{
                fontSize: 10.5, fontWeight: 700, color: THEME.textMid,
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
              }}>
                Suggested questions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTED_QS.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    style={{
                      textAlign: 'left', padding: '8px 12px', borderRadius: 8,
                      background: THEME.primaryXLight,
                      border: `1px solid ${THEME.cardBorder}`,
                      color: THEME.textDark, fontSize: 12.5, cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = THEME.primaryLight}
                    onMouseLeave={e => e.currentTarget.style.background = THEME.primaryXLight}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
              {typing && <TypingBubble />}
            </>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 12px',
          borderTop: `1px solid ${THEME.primaryLight}`,
          display: 'flex', gap: 8, alignItems: 'center',
          background: '#fafaf9', flexShrink: 0,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder="Ask about crops, mines, NPCs…"
            style={{
              flex: 1, padding: '8px 12px',
              border: `1.5px solid ${THEME.cardBorder}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              fontFamily: "'Inter', sans-serif", color: THEME.textDark,
              background: 'white',
            }}
            onFocus={e => e.target.style.borderColor = THEME.primary}
            onBlur={e  => e.target.style.borderColor = THEME.cardBorder}
          />
          <button
            onClick={() => send(input)}
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: input.trim() ? THEME.primary : '#e2e8f0',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <Icon name="send" size={15} color="white" />
          </button>
        </div>
      </div>
    </>
  );
}

window.AIGuide = AIGuide;
