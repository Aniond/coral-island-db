import React from 'react';
import FarmPlanner from '../components/FarmPlanner.jsx';

export default function FarmPlannerPage() {
  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0', fontFamily: "'Playfair Display', serif" }}>
        Farm Planner
      </h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Design your optimal farm layout manually. Use the AI Guide to generate a base layout for you!
      </p>
      
      <div style={{ maxWidth: 860 }}>
        {/* Render a default empty 15x15 grid for the dedicated page */}
        <FarmPlanner layoutData={{ width: 15, height: 15, grid: [] }} />
      </div>
    </div>
  );
}
