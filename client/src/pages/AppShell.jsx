// ── App Shell ────────────────────────────────────────────────────────────────
// The main database app: sidebar + active page + floating AI guide.
// Adapted from the handoff's app.jsx (Tweaks panel omitted per README note #4;
// density fixed to 'comfortable', --accent/--radius defaults live in index.css).
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import AISearch from '../components/AISearch.jsx';
import { THEME } from '../lib/theme.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CommandPalette from '../components/CommandPalette.jsx';

const CropsPage = React.lazy(() => import('./CropsPage.jsx'));
const CavesPage = React.lazy(() => import('./CavesPage.jsx'));
const ForagingPage = React.lazy(() => import('./ForagingPage.jsx'));
const CollectionsPage = React.lazy(() => import('./CollectionsPage.jsx'));
const RecipesPage = React.lazy(() => import('./RecipesPage.jsx'));
const NPCPage = React.lazy(() => import('./NPCPage.jsx'));
const RoadmapPage = React.lazy(() => import('./RoadmapPage.jsx'));
const PlansPage = React.lazy(() => import('./PlansPage.jsx'));
const HomePage = React.lazy(() => import('./HomePage.jsx'));
const OfferingsPage = React.lazy(() => import('./OfferingsPage.jsx'));
const ProductsPage = React.lazy(() => import('./ProductsPage.jsx'));
const ToolsPage = React.lazy(() => import('./ToolsPage.jsx'));

const PAGES = { home: HomePage, crops: CropsPage, caves: CavesPage, foraging: ForagingPage, collections: CollectionsPage, recipes: RecipesPage, npcs: NPCPage, roadmap: RoadmapPage, plans: PlansPage, offerings: OfferingsPage, products: ProductsPage, tools: ToolsPage };

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
    }
  }

  const CurrentPage = PAGES[activePage] || HomePage;

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

      {/* Page content */}
      <main key={activePage} style={{
        flex: 1, height: '100vh', overflowY: 'auto',
        background: THEME.bg,
        animation: 'ciPageIn 0.18s ease',
      }}>
        <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
          <CurrentPage density={density} onNavigate={handleNavigate} />
        </Suspense>
      </main>

      <AISearch isOpen={chatOpen} onToggle={() => setChatOpen(p => !p)} initialQuery={chatQuery} />
    </div>
  );
}
