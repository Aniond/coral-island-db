import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { fetchPlans, deletePlan } from '../data/api.js';
import { SkeletonLoader } from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import FarmPlanner from '../components/FarmPlanner.jsx';

function makeMdComponents(large = false) {
  const base = large ? 15 : 12.5;
  return {
    h1: ({ children }) => <div style={{ fontSize: large ? 22 : 15, fontWeight: 700, color: THEME.textDark, marginBottom: 8, marginTop: large ? 20 : 10, borderBottom: `2px solid ${THEME.primaryLight}`, paddingBottom: 6 }}>{children}</div>,
    h2: ({ children }) => <div style={{ fontSize: large ? 18 : 13.5, fontWeight: 700, color: THEME.textDark, marginBottom: 6, marginTop: large ? 18 : 10, borderBottom: `1px solid ${THEME.primaryLight}`, paddingBottom: 4 }}>{children}</div>,
    h3: ({ children }) => <div style={{ fontSize: large ? 12 : 11, fontWeight: 700, color: THEME.primary, marginBottom: 5, marginTop: large ? 14 : 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>,
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

const MD_COMPONENTS_LARGE = makeMdComponents(true);

export default function PlansPage() {
  const { session } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (session?.access_token) {
      fetchPlans(session.access_token)
        .then(data => {
          setPlans(data);
          if (data.length > 0) setSelectedPlan(data[0]);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [session]);

  function exportText() {
    if (!selectedPlan) return;
    const blob = new Blob([selectedPlan.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-${selectedPlan.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    if (!selectedPlan) return;
    navigator.clipboard.writeText(selectedPlan.content)
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy', err));
  }

  async function handleDelete() {
    if (!selectedPlan || !session?.access_token) return;
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await deletePlan(selectedPlan.id, session.access_token);
      setPlans(prev => prev.filter(p => p.id !== selectedPlan.id));
      setSelectedPlan(null);
    } catch (err) {
      console.error('Failed to delete plan:', err);
      alert('Failed to delete plan.');
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 48, maxWidth: 860, margin: '0 auto', width: '100%' }}>
        <SkeletonLoader count={5} height={80} />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: THEME.textMuted }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
        <h2 style={{ color: THEME.textDark, fontFamily: "'Playfair Display', serif" }}>No saved plans</h2>
        <p>Ask the AI Guide for a plan and click the "Save" button to see it here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar for plans list */}
      <div style={{ width: 300, borderRight: `1px solid ${THEME.cardBorder}`, background: '#f8fafc', overflowY: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${THEME.cardBorder}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: THEME.textDark }}>Saved Plans</h2>
        </div>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: 8,
                background: selectedPlan?.id === plan.id ? 'white' : 'transparent',
                border: `1px solid ${selectedPlan?.id === plan.id ? THEME.primary : 'transparent'}`,
                boxShadow: selectedPlan?.id === plan.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: THEME.textDark, marginBottom: 4 }}>
                {plan.query}
              </div>
              <div style={{ fontSize: 11, color: THEME.textMuted }}>
                {new Date(plan.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', background: 'white' }}>
        {selectedPlan && (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: THEME.textDark, margin: '0 0 8px 0', fontFamily: "'Playfair Display', serif" }}>
                  {selectedPlan.query}
                </h1>
                <div style={{ color: THEME.textMuted, fontSize: 13 }}>
                  Created {new Date(selectedPlan.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={handleDelete}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'transparent', color: '#ef4444', border: `1px solid #fca5a5`, borderRadius: 8,
                    padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                >
                  <Icon name="trash" size={16} color="#ef4444" />
                </button>
                <button
                  onClick={copyToClipboard}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'transparent', color: THEME.primary, border: `1px solid ${THEME.primaryLight}`, borderRadius: 8,
                    padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = THEME.primaryXLight; e.currentTarget.style.borderColor = THEME.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = THEME.primaryLight; }}
                >
                  <Icon name="scroll" size={16} color={THEME.primary} /> Copy
                </button>
                <button
                  onClick={exportText}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: THEME.primary, color: 'white', border: 'none', borderRadius: 8,
                    padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = THEME.dark}
                  onMouseLeave={e => e.currentTarget.style.background = THEME.primary}
                >
                  <Icon name="download" size={16} color="white" /> Export TXT
                </button>
              </div>
            </div>
            
            <div style={{ color: THEME.textDark, lineHeight: 1.7 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS_LARGE}>
                {selectedPlan.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
