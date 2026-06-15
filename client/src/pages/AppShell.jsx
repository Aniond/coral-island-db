import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { THEME } from '../lib/theme.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CommandPalette from '../components/CommandPalette.jsx';

const ItineraryPage = React.lazy(() => import('./ItineraryPage.jsx'));
const RoadmapPage = React.lazy(() => import('./RoadmapPage.jsx'));
const PlansPage = React.lazy(() => import('./PlansPage.jsx'));
const HomePage = React.lazy(() => import('./HomePage.jsx'));
const FarmPlannerPage = React.lazy(() => import('./FarmPlannerPage.jsx'));

const PAGES = { home: HomePage, itinerary: ItineraryPage, roadmap: RoadmapPage, plans: PlansPage, planner: FarmPlannerPage };

export default function AppShell() {
  const [activePage, setActivePage] = React.useState('home');

  function handleNavigate(page, query) {
    setActivePage(page);
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
        aiChatOpen={activePage === 'home'}
      />

      {/* Page content */}
      <main key={activePage} style={{
        flex: 1, height: '100vh', overflowY: 'auto', overflowX: 'hidden',
        background: THEME.bg,
        animation: 'ciPageIn 0.18s ease',
      }}>
        <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
          <CurrentPage density={density} onNavigate={handleNavigate} />
        </Suspense>
      </main>
    </div>
  );
}
