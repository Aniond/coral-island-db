// ── AI Search — Floating chat panel ──────────────────────────────────────────
// (a.k.a. the "AI Guide" — talks only to our Express backend at POST /api/search;
//  the Anthropic call is server-side, never in the browser.)
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { SUGGESTED_QS } from '../ai/responses.js';
import { streamSearch, savePlan, fetchSearchHistory } from '../data/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useIsMobile } from '../lib/useIsMobile.js';
import FarmPlanner from '../components/FarmPlanner.jsx';
import ProfitCalculator from '../components/ProfitCalculator.jsx';
import BundleWizard from '../components/BundleWizard.jsx';
import CollectionsVisualizer from '../components/CollectionsVisualizer.jsx';

const isEmpty = (children) => !children || (typeof children === 'string' && !children.trim());

function makeMdComponents(large = false) {
  const base = large ? 15 : 12.5;
  return {
    h1: ({ children }) => isEmpty(children) ? null : <div style={{ fontSize: large ? 22 : 15, fontWeight: 700, color: THEME.textDark, marginBottom: 8, marginTop: large ? 20 : 10, borderBottom: `2px solid ${THEME.primaryLight}`, paddingBottom: 6 }}>{children}</div>,
    h2: ({ children }) => isEmpty(children) ? null : <div style={{ fontSize: large ? 18 : 13.5, fontWeight: 700, color: THEME.textDark, marginBottom: 6, marginTop: large ? 18 : 10, borderBottom: `1px solid ${THEME.primaryLight}`, paddingBottom: 4 }}>{children}</div>,
    h3: ({ children }) => isEmpty(children) ? null : <div style={{ fontSize: large ? 12 : 11, fontWeight: 700, color: THEME.primary, marginBottom: 5, marginTop: large ? 14 : 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>,
    p:  ({ children }) => <div style={{ marginBottom: 8, lineHeight: 1.7, fontSize: base }}>{children}</div>,
    strong: ({ children }) => <strong style={{ fontWeight: 700, color: THEME.dark }}>{children}</strong>,
    em: ({ children }) => <em style={{ color: '#6b7a74' }}>{children}</em>,
    hr: () => <div style={{ height: 1, background: THEME.primaryLight, margin: '14px 0' }} />,
    blockquote: ({ children }) => (
      <div style={{ borderLeft: `3px solid ${THEME.primary}`, paddingLeft: 12, margin: '10px 0', color: '#6b7a74', fontStyle: 'italic', fontSize: base - 0.5, background: THEME.primaryXLight, borderRadius: '0 6px 6px 0', padding: '8px 8px 8px 12px' }}>
        {children}
      </div>
    ),
    ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '4px 0 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</ol>,
    li: ({ children }) => <li style={{ fontSize: base, lineHeight: 1.65 }}>{children}</li>,
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match && match[1] === 'json') {
        const text = String(children).replace(/\n$/, '');
        try {
          const data = JSON.parse(text);
          if (data.type === 'farm_layout') {
            return <FarmPlanner layoutData={data} />;
          }
          if (data.type === 'profit_calculator') {
            return <ProfitCalculator data={data} />;
          }
          if (data.type === 'bundle_wizard') {
            return <BundleWizard data={data} />;
          }
          if (data.type === 'collections_visualizer') {
            return <CollectionsVisualizer data={data} />;
          }
        } catch (e) {}
      }
      return inline
        ? <code style={{ background: 'rgba(15,118,110,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: base - 1, fontFamily: 'monospace' }}>{children}</code>
        : <pre style={{ background: 'rgba(15,118,110,0.06)', padding: '10px 12px', borderRadius: 8, fontSize: base - 1, overflowX: 'auto', margin: '8px 0' }}><code>{children}</code></pre>;
    },
    table: ({ children }) => (
      <div style={{ overflowX: 'auto', margin: '10px 0', borderRadius: 8, border: `1px solid ${THEME.primaryLight}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: large ? 13.5 : 12 }}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead style={{ background: THEME.primary }}>{children}</thead>,
    th: ({ children }) => <th style={{ padding: large ? '9px 14px' : '6px 10px', textAlign: 'left', color: 'white', fontWeight: 600, whiteSpace: 'nowrap', fontSize: large ? 13 : 11.5 }}>{children}</th>,
    td: ({ children }) => <td style={{ padding: large ? '8px 14px' : '5px 10px', borderBottom: `1px solid ${THEME.primaryLight}`, verticalAlign: 'top' }}>{children}</td>,
    tr: ({ children, ...props }) => <tr {...props} style={{ background: 'white' }}>{children}</tr>,
  };
}

const MD_COMPONENTS       = makeMdComponents(false);
const MD_COMPONENTS_LARGE = makeMdComponents(true);

function ExpandModal({ content, query, onClose }) {
  const closeRef = React.useRef(null);

  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog on open, back to the opener on close.
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="AI Guide result" style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(7,30,28,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      animation: 'fadeUp 0.18s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 860,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px', borderBottom: `1px solid ${THEME.primaryLight}`,
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          background: THEME.primary,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={16} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: "'Playfair Display', serif" }}>AI Guide Result</div>
            {query && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11.5, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{query}"</div>}
          </div>
          <button ref={closeRef} onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            color: 'white', cursor: 'pointer', padding: '6px 12px',
            fontSize: 12.5, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Icon name="x" size={14} color="white" /> Close
          </button>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', fontFamily: "'Inter', sans-serif", color: THEME.textDark }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS_LARGE}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg, query, isTyping }) {
  const { session } = useAuth();
  const toast = useToast();
  const [expanded, setExpanded] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const isUser = msg.role === 'user';

  async function handleSave() {
    if (!session?.access_token || saved || saving) return;
    setSaving(true);
    try {
      await savePlan(query, msg.content, session.access_token);
      setSaved(true);
      if (toast) toast.success('AI Plan saved to your dashboard!');
    } catch (err) {
      console.error('Save failed:', err);
      if (toast) toast.error('Failed to save plan.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      {expanded && <ExpandModal content={msg.content} query={query} onClose={() => setExpanded(false)} />}
      <div style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 8, marginBottom: 12,
      }}>
        {!isUser && (
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 2,
            background: THEME.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkles" size={13} color="white" />
          </div>
        )}
        <div style={{ maxWidth: isUser ? '78%' : '90%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            padding: '9px 13px',
            borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
            background: isUser ? 'var(--accent-light, #fff7ed)' : THEME.primaryXLight,
            color: isUser ? '#7c2d12' : THEME.textDark,
            fontSize: 12.5, lineHeight: 1.65,
            border: `1px solid ${isUser ? 'var(--accent-border, #fed7aa)' : THEME.primaryLight}`,
            overflowX: 'auto',
          }}>
            {isUser
              ? msg.content
              : <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{msg.content}</ReactMarkdown>
            }
          </div>
          {!isUser && (
            <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-start' }}>
              <button onClick={() => setExpanded(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: `1px solid ${THEME.primaryLight}`,
                borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                color: THEME.primary, fontSize: 11, fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = THEME.primaryXLight; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                <Icon name="expand" size={12} color={THEME.primary} /> Expand
              </button>

              {!isTyping && (
                <button onClick={handleSave} disabled={saved || saving} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: saved ? THEME.primaryXLight : 'none',
                  border: `1px solid ${THEME.primaryLight}`,
                  borderRadius: 6, padding: '3px 10px',
                  cursor: saved || saving ? 'default' : 'pointer',
                  color: THEME.primary, fontSize: 11, fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.12s',
                  opacity: saved || saving ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!saved && !saving) e.currentTarget.style.background = THEME.primaryXLight; }}
                onMouseLeave={e => { if (!saved && !saving) e.currentTarget.style.background = 'none'; }}>
                  <Icon name={saved ? 'check' : 'bookmark'} size={12} color={THEME.primary} /> {saved ? 'Saved' : saving ? 'Saving...' : 'Save Plan'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
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

export default function HomePage() {
  const { session } = useAuth();
  const isMobile = useIsMobile();
  const [messages, setMessages] = React.useState([]);
  const [input,    setInput]    = React.useState('');
  const [typing,   setTyping]   = React.useState(false);
  const scrollRef = React.useRef(null);
  const [season,   setSeason]   = React.useState('Spring');
  const [day,      setDay]      = React.useState('1');
  const [time,     setTime]     = React.useState('Morning');
  const [weather,  setWeather]  = React.useState('Sunny');
  const [rank,     setRank]     = React.useState('F');

  const [historyLoaded, setHistoryLoaded] = React.useState(false);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  React.useEffect(() => {
    async function loadHistory() {
      if (!session?.access_token || historyLoaded) return;
      try {
        const history = await fetchSearchHistory(session.access_token);
        if (history && history.length > 0) {
          const loadedMessages = [];
          for (const row of history) {
            loadedMessages.push({ role: 'user', content: row.query, id: row.id, query: row.query });
            loadedMessages.push({ role: 'assistant', content: row.response, id: row.id + '_ai', query: row.query });
          }
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error('Failed to load search history:', err);
      } finally {
        setHistoryLoaded(true);
      }
    }
    loadHistory();
  }, [session, historyLoaded]);

  /* initialQuery not needed for full page, removed effect */

  async function send(text) {
    const t = text.trim();
    if (!t) return;
    const userId = Date.now();
    const aiId = userId + 1;
    setMessages(prev => [...prev, { role: 'user', content: t, id: userId, query: t }]);
    setInput('');
    setTyping(true);

    // The assistant bubble is created inside the state updater on first chunk,
    // so creation/append stays atomic no matter how chunks and errors interleave.
    const appendChunk = (chunk) => {
      setTyping(false);
      setMessages(prev => prev.some(m => m.id === aiId)
        ? prev.map(m => (m.id === aiId ? { ...m, content: m.content + chunk } : m))
        : [...prev, { role: 'assistant', content: chunk, id: aiId, query: t }]);
    };

    let started = false;
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const gameState = { season, day, time, weather, rank };
      await streamSearch(t, history, gameState, (chunk) => { started = true; appendChunk(chunk); }, session?.access_token);
      if (!started) appendChunk('(No response received.)');
      setTyping(false);
    } catch (err) {
      // Mid-stream failure appends to the partial answer instead of adding a
      // second orphaned bubble; pre-stream failure creates the bubble.
      appendChunk(`${started ? '\n\n' : ''}⚠️ ${err.message}`);
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: THEME.bg,
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
        </div>

        {/* Game State Picker */}
        <div style={{
          padding: '8px 12px',
          background: THEME.primaryDark || '#0b5a54',
          display: 'flex', gap: 8, alignItems: 'center',
          flexShrink: 0, overflowX: 'auto', borderBottom: `1px solid ${THEME.primaryLight}`,
        }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Icon name="calendar" size={13} color="rgba(255,255,255,0.8)" />
            <select value={season} onChange={e => setSeason(e.target.value)} style={{ background: 'rgba(0,0,0,0.15)', color: 'white', border: 'none', borderRadius: 4, padding: '3px 6px', fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
            <select value={day} onChange={e => setDay(e.target.value)} style={{ background: 'rgba(0,0,0,0.15)', color: 'white', border: 'none', borderRadius: 4, padding: '3px 6px', fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", marginLeft: 4 }}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>Day {d}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Icon name="clock" size={13} color="rgba(255,255,255,0.8)" />
            <select value={time} onChange={e => setTime(e.target.value)} style={{ background: 'rgba(0,0,0,0.15)', color: 'white', border: 'none', borderRadius: 4, padding: '3px 6px', fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Icon name="sun" size={13} color="rgba(255,255,255,0.8)" />
            <select value={weather} onChange={e => setWeather(e.target.value)} style={{ background: 'rgba(0,0,0,0.15)', color: 'white', border: 'none', borderRadius: 4, padding: '3px 6px', fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <option value="Sunny">Sunny</option>
              <option value="Raining">Raining</option>
              <option value="Snowing">Snowing</option>
              <option value="Stormy">Stormy</option>
              <option value="Windy">Windy</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Icon name="map" size={13} color="rgba(255,255,255,0.8)" />
            <select value={rank} onChange={e => setRank(e.target.value)} style={{ background: 'rgba(0,0,0,0.15)', color: 'white', border: 'none', borderRadius: 4, padding: '3px 6px', fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <option value="F">Rank F</option>
              <option value="E">Rank E</option>
              <option value="D">Rank D</option>
              <option value="C">Rank C</option>
              <option value="B">Rank B</option>
              <option value="A">Rank A</option>
              <option value="S">Rank S</option>
            </select>
          </div>
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
                    onMouseEnter={e => (e.currentTarget.style.background = THEME.primaryLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = THEME.primaryXLight)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => <ChatBubble key={msg.id} msg={msg} query={msg.query} isTyping={typing && idx === messages.length - 1} />)}
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
            onFocus={e => (e.target.style.borderColor = THEME.primary)}
            onBlur={e => (e.target.style.borderColor = THEME.cardBorder)}
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
  );
}
