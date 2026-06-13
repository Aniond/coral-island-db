import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from '../components/Icon.jsx';
import { THEME } from '../lib/theme.js';
import { fetchPlans, getChecklist, saveChecklist, deletePlan } from '../data/api.js';
import { SkeletonLoader } from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

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
    code: ({ inline, children }) => inline
      ? <code style={{ background: 'rgba(15,118,110,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: base - 1, fontFamily: 'monospace' }}>{children}</code>
      : <pre style={{ background: 'rgba(15,118,110,0.06)', padding: '10px 12px', borderRadius: 8, fontSize: base - 1, overflowX: 'auto', margin: '8px 0' }}><code>{children}</code></pre>,
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

const MD_COMPONENTS = makeMdComponents(false);

export default function HomePage({ onNavigate }) {
  const { session, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    if (session?.access_token) {
      fetchPlans(session.access_token)
        .then(data => {
          setPlans(data.slice(0, 5)); // Show up to 5 recent plans
          if (data.length > 0) setExpandedPlanId(data[0].id); // Expand the latest one by default
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
      
      getChecklist(session.access_token)
        .then(data => {
          if (data.tasks && data.tasks.length > 0) {
            setChecklist(data.tasks);
          }
        })
        .catch(err => console.error("Failed to load checklist", err));
    } else {
      setLoading(false);
    }
  }, [session]);

  const [checklist, setChecklist] = useState([
    { id: 1, text: "Water crops", done: false },
    { id: 2, text: "Check Traveling Merchant", done: false },
    { id: 3, text: "Gift townies", done: false },
    { id: 4, text: "Visit Blacksmith", done: false },
    { id: 5, text: "Check Daily Quests", done: false },
  ]);

  const toggleTask = async (taskId) => {
    const newTasks = checklist.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    setChecklist(newTasks);
    if (session?.access_token) {
      saveChecklist(newTasks, session.access_token).catch(e => {
        console.error("Failed to save checklist", e);
        if (toast) toast.error('Failed to save checklist to database');
      });
    }
  };

  const resetChecklist = async () => {
    const newTasks = checklist.map(t => ({ ...t, done: false }));
    setChecklist(newTasks);
    if (toast) toast.info('Checklist unchecked');
    if (session?.access_token) {
      saveChecklist(newTasks, session.access_token).catch(e => {
        console.error("Failed to save checklist", e);
        if (toast) toast.error('Failed to save checklist to database');
      });
    }
  };

  const deleteTask = async (taskId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const newTasks = checklist.filter(t => t.id !== taskId);
    setChecklist(newTasks);
    if (toast) toast.success('Task removed');
    if (session?.access_token) {
      saveChecklist(newTasks, session.access_token).catch(e => {
        console.error("Failed to save checklist", e);
        if (toast) toast.error('Failed to save checklist to database');
      });
    }
  };

  const userName = profile?.username || 'Farmer';

  return (
    <div style={{ padding: isMobile ? '24px 16px' : '40px 48px', maxWidth: 1000, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: 20, 
            background: 'linear-gradient(135deg, #0d9488 0%, var(--accent, #f97316) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.2)'
          }}>
            <Icon name="leaf" size={40} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: THEME.textDark, margin: '0 0 8px 0', fontFamily: "'Playfair Display', serif" }}>
              Welcome back, {userName}!
            </h1>
            <p style={{ margin: 0, fontSize: 16, color: THEME.textMuted }}>
              Your Coral Island dashboard is ready. What would you like to explore today?
            </p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('guide', 'I am playing Coral Island. Give me a detailed, optimized daily itinerary of what I should do today. Assume I am in the Spring season, but you can ask me to specify if needed.')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: THEME.primary, color: 'white', padding: '12px 24px',
            borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 16, fontWeight: 600, boxShadow: '0 4px 12px rgba(15,118,110,0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = THEME.shadowHover; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,118,110,0.2)'; }}
        >
          <span>✨</span> Plan My Day
        </button>
      </div>

      {/* Quick Links Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { id: 'crops', label: 'Crops & Plants', icon: 'leaf', desc: 'View seasonal crops' },
          { id: 'caves', label: 'Caves & Mining', icon: 'pickaxe', desc: 'Explore the mines' },
          { id: 'recipes', label: 'Recipes', icon: 'cookingPot', desc: 'Cook up a storm' },
          { id: 'npcs', label: 'NPCs & Quests', icon: 'users', desc: 'Find the islanders' }
        ].map(link => (
          <button 
            key={link.id}
            onClick={() => onNavigate && onNavigate(link.id)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 12,
              padding: 20, background: 'white', border: `1px solid ${THEME.cardBorder}`,
              borderRadius: 16, cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = THEME.primaryLight;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = THEME.cardBorder;
            }}
          >
            <div style={{ 
              width: 40, height: 40, borderRadius: 10, background: THEME.primaryXLight, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.primary
            }}>
              <Icon name={link.icon} size={20} color="currentColor" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: THEME.textDark, marginBottom: 4 }}>{link.label}</div>
              <div style={{ fontSize: 13, color: THEME.textMuted }}>{link.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Daily Checklist */}
        <div style={{ 
          background: 'white', borderRadius: 24, padding: isMobile ? 20 : 32, 
          border: `1px solid ${THEME.cardBorder}`,
          boxShadow: '0 12px 32px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: THEME.textDark, margin: 0, fontFamily: "'Playfair Display', serif" }}>
              Daily Checklist
            </h2>
            <button onClick={resetChecklist} style={{
              background: THEME.primaryXLight, border: 'none', color: THEME.primary,
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}>Reset</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checklist.map(task => (
              <label key={task.id} style={{ 
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                padding: '12px 16px', borderRadius: 12, background: task.done ? THEME.primaryXLight : '#fafaf9',
                border: `1px solid ${task.done ? THEME.primaryLight : THEME.cardBorder}`,
                transition: 'all 0.2s', position: 'relative'
              }}>
                <input 
                  type="checkbox" 
                  checked={task.done} 
                  onChange={() => toggleTask(task.id)}
                  style={{ width: 18, height: 18, accentColor: THEME.primary, cursor: 'pointer' }}
                />
                <span style={{ 
                  fontSize: 15, fontWeight: task.done ? 500 : 600, 
                  color: task.done ? THEME.primary : THEME.textDark,
                  textDecoration: task.done ? 'line-through' : 'none',
                  flex: 1
                }}>
                  {task.text}
                </span>
                <button 
                  onClick={(e) => deleteTask(task.id, e)}
                  title="Remove task"
                  style={{
                    background: 'transparent', border: 'none', color: '#ef4444', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 8, borderRadius: 6, opacity: 0.8, transition: 'opacity 0.2s', marginLeft: 'auto',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                >
                  <Icon name="trash" size={18} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Saved Results Box */}
      <div style={{ 
        background: 'white', borderRadius: 24, padding: 32, 
        border: `1px solid ${THEME.cardBorder}`,
        boxShadow: '0 12px 32px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-light, #ffedd5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bookmark" size={18} color="var(--accent, #f97316)" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: THEME.textDark, margin: 0, fontFamily: "'Playfair Display', serif" }}>
              Recent AI Results
            </h2>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('plans')}
            style={{
              background: 'transparent', border: 'none', color: THEME.primary,
              fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            View all plans <Icon name="expand" size={14} color="currentColor" />
          </button>
        </div>

        {loading ? (
          <SkeletonLoader count={3} height={60} />
        ) : plans.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', background: THEME.primaryXLight, borderRadius: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
            <h3 style={{ margin: '0 0 8px 0', color: THEME.textDark, fontSize: 16 }}>No saved results yet</h3>
            <p style={{ margin: 0, color: THEME.textMuted, fontSize: 14 }}>
              Open the AI Guide, ask a question, and click "Save Plan" to reference it here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plans.map(plan => {
              const isExpanded = expandedPlanId === plan.id;
              return (
                <div key={plan.id} style={{
                  border: `1px solid ${isExpanded ? THEME.primaryLight : THEME.cardBorder}`,
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'all 0.2s',
                  background: isExpanded ? 'white' : '#fafaf9',
                  boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.06)' : 'none'
                }}>
                  <button
                    onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                    style={{
                      width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: THEME.textDark, marginBottom: 4 }}>
                        {plan.query}
                      </div>
                      <div style={{ fontSize: 12, color: THEME.textMuted }}>
                        Saved on {new Date(plan.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: '50%', background: isExpanded ? THEME.primary : 'rgba(0,0,0,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: isExpanded ? 'white' : THEME.textMuted,
                      transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'all 0.2s'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div style={{ 
                      padding: '0 20px 24px 20px', 
                      borderTop: `1px solid ${THEME.cardBorder}`,
                      marginTop: 8, paddingTop: 16,
                      color: THEME.textDark, lineHeight: 1.6
                    }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                        {plan.content}
                      </ReactMarkdown>
                      <button
                        onClick={() => {
                          const confirmed = window.confirm("Delete this plan?");
                          if (confirmed) {
                            deletePlan(plan.id, session.access_token)
                              .then(() => {
                                setPlans(plans.filter(x => x.id !== plan.id));
                                if (expandedPlanId === plan.id) setExpandedPlanId(null);
                                if (toast) toast.success('Plan deleted');
                              })
                              .catch(err => {
                                console.error(err);
                                if (toast) toast.error('Failed to delete plan');
                              });
                          }
                        }}
                        style={{ marginTop: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                      >
                        Delete Plan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
