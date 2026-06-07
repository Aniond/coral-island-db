// ── Sidebar + Mobile Bottom Tab Bar ─────────────────────────────────────────
import React from 'react';
import Icon from './Icon.jsx';
import AuthButton from './AuthButton.jsx';
import MobileTopBar from './MobileTopBar.jsx';

const NAV_ITEMS = [
  { id: 'crops',       label: 'Crops & Plants', shortLabel: 'Crops',   icon: 'leaf'     },
  { id: 'caves',       label: 'Caves & Mining', shortLabel: 'Caves',   icon: 'pickaxe'  },
  { id: 'foraging',    label: 'Foraging',       shortLabel: 'Forage',  icon: 'sprout'   },
  { id: 'collections', label: 'Collections',    shortLabel: 'Collect', icon: 'scroll'   },
  { id: 'recipes',     label: 'Recipes',        shortLabel: 'Recipes', icon: 'cookingPot' },
  { id: 'npcs',        label: 'NPCs & Quests',  shortLabel: 'NPCs',    icon: 'users'    },
  { id: 'roadmap',     label: 'Roadmap',        shortLabel: 'Roadmap', icon: 'route'    },
  { id: 'guide',       label: 'AI Guide',       shortLabel: 'Guide',   icon: 'sparkles' },
];

function NavButton({ item, isActive, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 14px',
        borderRadius: 8, border: 'none',
        borderLeft: isActive ? '3px solid var(--accent, #f97316)' : '3px solid transparent',
        background: isActive
          ? 'rgba(255,255,255,0.11)'
          : hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: isActive ? '#ffffff' : hov ? '#e2fdf9' : '#99f6e4',
        cursor: 'pointer', textAlign: 'left',
        fontSize: 13.5, fontWeight: isActive ? 600 : 400,
        fontFamily: "'Inter', sans-serif",
        transition: 'background 0.12s, color 0.12s',
        lineHeight: 1,
      }}
    >
      <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.8 }}>
        <Icon name={item.icon} size={17}
          color={isActive ? 'var(--accent, #f97316)' : 'currentColor'} />
      </span>
      {item.label}
    </button>
  );
}

export default function Sidebar({ activePage, onNavigate, aiChatOpen }) {
  return (
    <>
      {/* ── Mobile top bar (logo + account) ── */}
      <MobileTopBar />

      {/* ── Desktop sidebar ── */}
      <div id="ci-sidebar" style={{
        width: 256, flexShrink: 0,
        background: '#134e4a',
        height: '100vh',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0,
        zIndex: 10,
      }}>
        {/* Logo area */}
        <div style={{ padding: '22px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #0d9488 0%, var(--accent, #f97316) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="leaf" size={19} color="white" />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{
                color: 'white',
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700, fontSize: 15,
              }}>
                Coral Island
              </div>
              <div style={{
                color: '#5eead4', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1,
              }}>
                Database
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(94,234,212,0.18)', margin: '0 18px 10px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activePage === item.id || (item.id === 'guide' && aiChatOpen);
            return (
              <NavButton
                key={item.id}
                item={item}
                isActive={isActive}
                onClick={() => onNavigate(item.id)}
              />
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(94,234,212,0.12)', margin: '0 18px 14px' }} />

        {/* Auth + version */}
        <div style={{ padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AuthButton />
          <div style={{ color: 'rgba(94,234,212,0.35)', fontSize: 10.5, fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
            v1.0.0 · Coral Island DB
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div id="ci-mobile-tabs" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#134e4a',
        borderTop: '1px solid rgba(94,234,212,0.2)',
        zIndex: 200,
        padding: '6px 0 env(safe-area-inset-bottom, 6px)',
        flexDirection: 'row',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.id || (item.id === 'guide' && aiChatOpen);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                padding: '6px 4px',
                background: 'transparent', border: 'none',
                color: isActive ? 'var(--accent, #f97316)' : '#99f6e4',
                cursor: 'pointer',
                fontSize: 10, fontWeight: isActive ? 600 : 400,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <Icon name={item.icon} size={21} color={isActive ? 'var(--accent, #f97316)' : 'currentColor'} />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
