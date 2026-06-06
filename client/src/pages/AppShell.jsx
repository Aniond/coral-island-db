// ── App Shell ────────────────────────────────────────────────────────────────
// The main database app: sidebar + active page + floating AI guide.
// Adapted from the handoff's app.jsx (Tweaks panel omitted per README note #4;
// density fixed to 'comfortable', --accent/--radius defaults live in index.css).
import React from 'react';
import Sidebar from '../components/Sidebar.jsx';
import AIGuide from '../components/AIGuide.jsx';
import { THEME } from '../lib/theme.js';
import CropsPage from './CropsPage.jsx';
import CavesPage from './CavesPage.jsx';
import ForagingPage from './ForagingPage.jsx';
import NPCPage from './NPCPage.jsx';

const PAGES = { crops: CropsPage, caves: CavesPage, foraging: ForagingPage, npcs: NPCPage };

export default function AppShell() {
  const [activePage, setActivePage] = React.useState('crops');
  const [chatOpen,   setChatOpen]   = React.useState(false);

  function handleNavigate(page) {
    if (page === 'guide') {
      setChatOpen(prev => !prev);
    } else {
      setActivePage(page);
      // don't auto-close chat when navigating pages
    }
  }

  const CurrentPage = PAGES[activePage] || CropsPage;
  const density = 'comfortable';

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: THEME.bg,
      fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        aiChatOpen={chatOpen}
      />

      {/* Page content — key forces re-mount (triggers fade animation) */}
      <main key={activePage} style={{
        flex: 1, height: '100vh', overflowY: 'auto',
        background: THEME.bg,
        animation: 'ciPageIn 0.18s ease',
      }}>
        <CurrentPage density={density} />
      </main>

      <AIGuide isOpen={chatOpen} onToggle={() => setChatOpen(p => !p)} />
    </div>
  );
}
