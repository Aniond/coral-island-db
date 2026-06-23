import React from 'react';
import { THEME } from '../lib/theme.js';
import Icon from './Icon.jsx';

export default function CollectionsVisualizer({ data }) {
  if (!data || !data.items) return null;

  const total = data.items.length;
  const completedCount = data.items.filter(i => i.completed).length;
  const progressPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  // We'll use a placeholder for images. In a real app we'd map name to an actual /assets/ url
  const getIconUrl = (name) => {
    // Attempt a generic slug-based image URL. If it 404s, we can use alt text.
    return `/assets/images/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.webp`;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: `1px solid ${THEME.primaryLight}`,
      overflow: 'hidden',
      margin: '16px 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: THEME.primaryDark,
        padding: '16px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Icon name="archive" size={18} color="#A78BFA" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Museum Shadowbox</h3>
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            {data.category} • {data.season}
          </div>
        </div>
        
        {/* Circular Progress */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{progressPercent}%</div>
          <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase' }}>Collected</div>
        </div>
      </div>

      {/* Grid of shadowboxes */}
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
          gap: '12px'
        }}>
          {data.items.map((item, idx) => {
            const isCompleted = item.completed;
            return (
              <div key={idx} style={{
                position: 'relative',
                aspectRatio: '1/1',
                background: isCompleted ? 'rgba(74, 222, 128, 0.1)' : THEME.bg,
                border: `2px solid ${isCompleted ? '#4ade80' : THEME.primaryLight}`,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                opacity: isCompleted ? 1 : 0.6,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>
                  {item.category === 'Bug' ? '🦋' : item.category === 'Fish' ? '🐟' : '🐚'}
                </div>
                <div style={{ 
                  fontSize: 9, 
                  textAlign: 'center', 
                  fontWeight: 600, 
                  color: THEME.text,
                  lineHeight: 1.1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.name}
                </div>
                {isCompleted && (
                  <div style={{ position: 'absolute', top: -6, right: -6, background: 'white', borderRadius: '50%' }}>
                    <Icon name="check-circle" size={16} color="#16a34a" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
