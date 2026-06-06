// ── App Root ─────────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent":  "#f97316",
  "radius":  "12",
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activePage,  setActivePage]  = React.useState('crops');
  const [chatOpen,    setChatOpen]    = React.useState(false);

  // Apply CSS variables for theming
  React.useEffect(() => {
    const accentMap = {
      '#f97316': { light: '#fff7ed', border: '#fed7aa' },  // coral
      '#14b8a6': { light: '#f0fdfa', border: '#99f6e4' },  // seafoam
      '#a855f7': { light: '#faf5ff', border: '#e9d5ff' },  // violet
    };
    const a = accentMap[t.accent] || accentMap['#f97316'];
    document.documentElement.style.setProperty('--accent',        t.accent);
    document.documentElement.style.setProperty('--accent-light',  a.light);
    document.documentElement.style.setProperty('--accent-border', a.border);
    document.documentElement.style.setProperty('--radius',        t.radius + 'px');
  }, [t.accent, t.radius]);

  function handleNavigate(page) {
    if (page === 'guide') {
      setChatOpen(prev => !prev);
    } else {
      setActivePage(page);
      // don't auto-close chat when navigating pages
    }
  }

  const PAGES = { crops: CropsPage, caves: CavesPage, foraging: ForagingPage, npcs: NPCPage };
  const CurrentPage = PAGES[activePage] || CropsPage;
  const density = t.density === 'compact' ? 'compact' : 'comfortable';

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

      {/* Tweaks panel */}
      <TweaksPanel>
        <TweakSection label="Accent Colour" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={['#f97316', '#14b8a6', '#a855f7']}
          onChange={v => setTweak('accent', v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['comfortable', 'compact']}
          onChange={v => setTweak('density', v)}
        />
        <TweakSlider
          label="Card radius"
          value={Number(t.radius)}
          min={0} max={24} step={2} unit="px"
          onChange={v => setTweak('radius', String(v))}
        />
      </TweaksPanel>
    </div>
  );
}

const domRoot = document.getElementById('root');
ReactDOM.createRoot(domRoot).render(<App />);
