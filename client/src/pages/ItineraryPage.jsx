import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchItinerary, markOfferingComplete } from '../data/api.js';
import Icon from '../components/Icon.jsx';

export default function ItineraryPage({ density = 'comfortable' }) {
  const { token } = useAuth();
  
  // Game State
  const [gameState, setGameState] = useState({
    season: 'Spring',
    day: 1,
    weather: 'Sunny',
    townRank: 'F'
  });

  // Data State
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchItinerary(gameState, token);
        if (isMounted) setItinerary(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    // Debounce slightly to avoid spamming the backend if user rapidly changes dropdowns
    const timer = setTimeout(loadData, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [gameState, token]);

  const handleChange = (e) => {
    setGameState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleComplete = async (itemName) => {
    try {
      await markOfferingComplete(itemName, token);
      // Remove from UI optimistically
      setItinerary(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          offeringsToGather: prev.offeringsToGather.filter(o => o.item !== itemName)
        };
      });
    } catch (err) {
      console.error('Failed to mark complete:', err);
      alert('Failed to save completion. Please try again.');
    }
  };

  // --- Styles ---
  const containerStyle = {
    padding: density === 'compact' ? '12px' : '24px',
    maxWidth: 800,
    margin: '0 auto',
    color: '#e2fdf9',
    paddingBottom: 80 // Space for bottom tab bar on mobile
  };

  const headerCardStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    position: 'sticky',
    top: 12,
    zIndex: 5,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  };

  const selectGroupStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12
  };

  const selectWrapperStyle = {
    flex: '1 1 calc(50% - 6px)',
    minWidth: 120,
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  };

  const labelStyle = {
    fontSize: 12,
    color: '#5eead4',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const selectStyle = {
    width: '100%',
    padding: '0 12px',
    height: 44, // Touch target size
    borderRadius: 8,
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    appearance: 'none'
  };

  const sectionTitleStyle = {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 16
  };

  const checkboxStyle = {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '2px solid var(--accent, #f97316)',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: '0 0 8px', color: '#fff', fontWeight: 700 }}>Daily Itinerary</h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          Set your game state to see what you should do today.
        </p>
      </div>

      <div style={headerCardStyle}>
        <div style={selectGroupStyle}>
          <div style={selectWrapperStyle}>
            <label style={labelStyle}>Season</label>
            <select name="season" value={gameState.season} onChange={handleChange} style={selectStyle}>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
          </div>
          <div style={selectWrapperStyle}>
            <label style={labelStyle}>Day</label>
            <select name="day" value={gameState.day} onChange={handleChange} style={selectStyle}>
              {[...Array(28)].map((_, i) => (
                <option key={i+1} value={i+1}>Day {i+1}</option>
              ))}
            </select>
          </div>
          <div style={selectWrapperStyle}>
            <label style={labelStyle}>Weather</label>
            <select name="weather" value={gameState.weather} onChange={handleChange} style={selectStyle}>
              <option value="Sunny">Sunny</option>
              <option value="Rain">Rain</option>
              <option value="Snow">Snow</option>
              <option value="Storm">Storm</option>
              <option value="Windy">Windy</option>
            </select>
          </div>
          <div style={selectWrapperStyle}>
            <label style={labelStyle}>Town Rank</label>
            <select name="townRank" value={gameState.townRank} onChange={handleChange} style={selectStyle}>
              {['F', 'E', 'D', 'C', 'B', 'A'].map(rank => (
                <option key={rank} value={rank}>Rank {rank}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#5eead4' }}>Loading itinerary...</div>}
      {error && <div style={{ color: '#ef4444', padding: 16, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>}

      {!loading && !error && itinerary && (
        <>
          {/* Birthdays Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={sectionTitleStyle}>
              <Icon name="users" size={20} color="var(--accent, #f97316)" />
              Today's Birthdays
            </h2>
            {itinerary.birthdays.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No birthdays today.</div>
            ) : (
              itinerary.birthdays.map((npc, idx) => (
                <div key={idx} style={cardStyle}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 24,
                    background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon name="users" size={24} color="#99f6e4" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{npc.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                      <span style={{ color: '#f97316' }}>Loves:</span> {npc.lovedGifts}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lake Temple Offerings Section */}
          <div>
            <h2 style={sectionTitleStyle}>
              <Icon name="sparkles" size={20} color="var(--accent, #f97316)" />
              Gathering Checklist
            </h2>
            {itinerary.offeringsToGather.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No offerings available to gather today!</div>
            ) : (
              itinerary.offeringsToGather.map((offering, idx) => (
                <div key={idx} style={cardStyle}>
                  {/* Interactive Checkbox */}
                  <div 
                    style={checkboxStyle}
                    onClick={() => handleComplete(offering.item)}
                    title="Mark as donated"
                  >
                    {/* Empty state is just a bordered box */}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{offering.item}</div>
                      <div style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'rgba(94,234,212,0.1)', color: '#5eead4' }}>
                        {offering.sourceType}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                      {offering.bundle} • {offering.location}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
