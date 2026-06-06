// ── AI Guide — Floating chat panel ───────────────────────────────────────────
import React from 'react';
import Icon from './Icon.jsx';
import { THEME } from '../lib/theme.js';
import { SUGGESTED_QS } from '../ai/responses.js';
import { streamSearch } from '../data/api.js';

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

export default function AIGuide({ isOpen, onToggle }) {
  const [messages, setMessages] = React.useState([]);
  const [input,    setInput]    = React.useState('');
  const [typing,   setTyping]   = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function send(text) {
    const t = text.trim();
    if (!t) return;
    const userId = Date.now();
    const aiId = userId + 1;
    setMessages(prev => [...prev, { role: 'user', content: t, id: userId }]);
    setInput('');
    setTyping(true);

    let started = false;
    try {
      // Streams the answer from POST /api/search; the typing indicator shows
      // until the first chunk arrives, then the bubble grows as tokens stream in.
      await streamSearch(t, (chunk) => {
        if (!started) {
          started = true;
          setTyping(false);
          setMessages(prev => [...prev, { role: 'assistant', content: chunk, id: aiId }]);
        } else {
          setMessages(prev => prev.map(m => (m.id === aiId ? { ...m, content: m.content + chunk } : m)));
        }
      });
      if (!started) {
        setTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: '(No response received.)', id: aiId }]);
      }
    } catch (err) {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}`, id: aiId }]);
    }
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
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
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
    </>
  );
}
