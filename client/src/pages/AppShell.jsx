// ── App Shell ────────────────────────────────────────────────────────────────
// The main database app: sidebar + active page + floating AI guide.
// Adapted from the handoff's app.jsx (Tweaks panel omitted per README note #4;
// density fixed to 'comfortable', --accent/--radius defaults live in index.css).
import React from 'react';
import Sidebar from '../components/Sidebar.jsx';
import AISearch from '../components/AISearch.jsx';
import { THEME } from '../lib/theme.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CommandPalette from '../components/CommandPalette.jsx';
import CropsPage from './CropsPage.jsx';
import CavesPage from './CavesPage.jsx';
import ForagingPage from './ForagingPage.jsx';
import CollectionsPage from './CollectionsPage.jsx';
import RecipesPage from './RecipesPage.jsx';
import NPCPage from './NPCPage.jsx';
import RoadmapPage from './RoadmapPage.jsx';
import PlansPage from './PlansPage.jsx';
import HomePage from './HomePage.jsx';

const PAGES = { home: HomePage, crops: CropsPage, caves: CavesPage, foraging: ForagingPage, collections: CollectionsPage, recipes: RecipesPage, npcs: NPCPage, roadmap: RoadmapPage, plans: PlansPage };

export default function AppShell() {
  const [activePage, setActivePage] = React.useState('home');
  const [chatOpen,   setChatOpen]   = React.useState(false);
  const [chatQuery,  setChatQuery]  = React.useState('');

  function handleNavigate(page, query) {
    if (page === 'guide') {
      setChatOpen(true); // always ensure it opens
      if (query) setChatQuery(query);
    } else {
      setActivePage(page);
      // don't auto-close chat when navigating pages
    }
  }

  const CurrentPage = PAGES[activePage] || HomePage;
  // On phones, reuse the existing 'compact' density to tighten padding & gaps.
  const isMobile = useIsMobile();
  const density = isMobile ? 'compact' : 'comfortable';

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: THEME.bg,
      fontFamily: "'Inter', sans-serif",
    }}>
      <CommandPalette />

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
        <CurrentPage density={density} onNavigate={handleNavigate} />
      </main>

      <AISearch isOpen={chatOpen} onToggle={() => setChatOpen(p => !p)} initialQuery={chatQuery} />
    </div>
  );
}
