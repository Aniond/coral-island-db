import React from 'react';
import { THEME } from '../lib/theme.js';
import Icon from './Icon.jsx';

export default function ProfitCalculator({ data }) {
  if (!data) return null;

  const formatNumber = (num) => new Intl.NumberFormat().format(num);

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: `1px solid ${THEME.primaryLight}`,
      overflow: 'hidden',
      margin: '12px 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: THEME.primary,
        padding: '12px 16px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 600
      }}>
        <Icon name="coin" size={18} color="#FFD700" />
        ROI Calculator: {data.crop}
      </div>
      
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Amount</span>
            <span style={{ fontSize: 15, color: THEME.text }}>{data.amount} seeds</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Grow Time</span>
            <span style={{ fontSize: 15, color: THEME.text }}>{data.growDays} days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Seed Cost</span>
            <span style={{ fontSize: 15, color: THEME.text }}>{data.seedCost}g each</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Base Sell Price</span>
            <span style={{ fontSize: 15, color: THEME.text }}>{data.sellPriceBase}g each</span>
          </div>
        </div>

        <div style={{
          background: THEME.bg,
          borderRadius: 8,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 500 }}>
            <span>Total Cost</span>
            <span>-{formatNumber(data.totalCost)}g</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 500 }}>
            <span>Total Revenue</span>
            <span>+{formatNumber(data.totalRevenue)}g</span>
          </div>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.1)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: THEME.primaryDark, fontWeight: 700, fontSize: 18 }}>
            <span>Net Profit</span>
            <span>+{formatNumber(data.netProfit)}g</span>
          </div>
        </div>
        
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#888' }}>
          *Assuming no fertilizer and standard quality
        </div>
      </div>
    </div>
  );
}
