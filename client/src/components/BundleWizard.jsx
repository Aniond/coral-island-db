import React from 'react';
import { THEME } from '../lib/theme.js';
import Icon from './Icon.jsx';

export default function BundleWizard({ data }) {
  if (!data || !data.items) return null;

  const total = data.items.length;
  const completedCount = data.items.filter(i => i.completed).length;
  const progressPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

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
        background: THEME.primary,
        padding: '16px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon name="star" size={18} color="#FFD700" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{data.altar}</h3>
        </div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>{data.bundle} Bundle</div>
        
        {/* Progress Bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span>Progress</span>
            <span>{completedCount} / {total}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              background: '#4ade80', 
              transition: 'width 0.5s ease' 
            }} />
          </div>
        </div>
      </div>

      {/* Items Tree */}
      <div style={{ padding: '16px' }}>
        <div style={{ position: 'relative' }}>
          {/* Vertical connection line */}
          <div style={{
            position: 'absolute',
            left: 15,
            top: 20,
            bottom: 20,
            width: 2,
            background: THEME.primaryLight,
            zIndex: 0
          }} />

          {data.items.map((item, idx) => {
            const isCompleted = item.completed;
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 16, 
                marginBottom: idx < data.items.length - 1 ? 16 : 0,
                position: 'relative',
                zIndex: 1
              }}>
                {/* Node icon */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isCompleted ? '#4ade80' : 'white',
                  border: `2px solid ${isCompleted ? '#4ade80' : THEME.primaryLight}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isCompleted ? (
                    <Icon name="check" size={16} color="white" />
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: THEME.primaryLight }} />
                  )}
                </div>

                {/* Item Details */}
                <div style={{
                  background: THEME.bg,
                  padding: '12px 16px',
                  borderRadius: 8,
                  flexGrow: 1,
                  opacity: isCompleted ? 0.6 : 1,
                  border: `1px solid ${isCompleted ? 'transparent' : THEME.primaryLight}`,
                }}>
                  <div style={{ 
                    fontWeight: 600, 
                    color: THEME.text, 
                    fontSize: 14,
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#666' }}>
                    {item.season && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="clock" size={12} /> {item.season}
                      </div>
                    )}
                    {item.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="map-pin" size={12} /> {item.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
