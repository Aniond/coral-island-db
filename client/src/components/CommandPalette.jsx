import React from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGlobalSearchIndex } from '../data/api.js';
import Icon from './Icon.jsx';
import { THEME } from '../lib/theme.js';
import Fuse from 'fuse.js';

let globalCache = null;

export default function CommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      if (!globalCache) {
        setLoading(true);
        fetchGlobalSearchIndex().then(data => {
          globalCache = data;
          setResults(data);
          setLoading(false);
        });
      } else {
        setResults(globalCache);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!globalCache) return;
    if (!query.trim()) {
      setResults(globalCache);
    } else {
      const fuse = new Fuse(globalCache, {
        keys: ['name', 'type', 'subtitle'],
        threshold: 0.3, // 0.0 is perfect match, 1.0 is match anything
        distance: 100,
        ignoreLocation: true // matches anywhere in the string
      });
      const filtered = fuse.search(query).map(result => result.item);
      setResults(filtered.slice(0, 50)); // cap at 50 to keep UI snappy
    }
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex].route);
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', paddingTop: '10vh' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setIsOpen(false)} />
      <div style={{ position: 'relative', background: 'white', width: '100%', maxWidth: 600, borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '60vh' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${THEME.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="search" size={20} color={THEME.textMuted} />
          <input 
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search crops, npcs, caves..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 18, color: THEME.textDark, width: '100%', fontFamily: "'Inter', sans-serif" }}
          />
          <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted, background: THEME.bg, padding: '4px 8px', borderRadius: 4, letterSpacing: 0.5 }}>ESC</div>
        </div>
        <div style={{ overflowY: 'auto', padding: 8 }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: THEME.textMuted, fontSize: 14 }}>Loading database...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: THEME.textMuted, fontSize: 14 }}>No results found.</div>
          ) : (
            results.map((item, idx) => (
              <div 
                key={item.id} 
                onClick={() => { navigate(item.route); setIsOpen(false); }}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: idx === selectedIndex ? THEME.primaryXLight : 'transparent',
                  borderRadius: 8, cursor: 'pointer',
                  borderLeft: idx === selectedIndex ? `3px solid ${THEME.primary}` : '3px solid transparent'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: idx === selectedIndex ? THEME.primaryDark : THEME.textDark, fontSize: 15 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>{item.subtitle}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textMid, textTransform: 'uppercase', letterSpacing: 0.5, background: THEME.bg, padding: '4px 8px', borderRadius: 999 }}>
                  {item.type}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
