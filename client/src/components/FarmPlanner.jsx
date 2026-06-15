import React, { useState, useEffect } from 'react';
import Icon from './Icon.jsx';
import { THEME } from '../lib/theme.js';

const TILE_SIZE = 32;

const ITEMS = {
  dirt: { color: '#8B5A2B', icon: null, name: 'Dirt' },
  crop_strawberry: { color: '#8B5A2B', icon: 'leaf', iconColor: '#ff4d4d', name: 'Strawberry' },
  crop_generic: { color: '#8B5A2B', icon: 'leaf', iconColor: '#4ade80', name: 'Crop' },
  sprinkler_1: { color: '#8B5A2B', icon: 'droplets', iconColor: '#93c5fd', name: 'Sprinkler I', aoe: 1, aoeColor: 'rgba(59, 130, 246, 0.3)' },
  sprinkler_2: { color: '#8B5A2B', icon: 'droplets', iconColor: '#3b82f6', name: 'Sprinkler II', aoe: 2, aoeColor: 'rgba(59, 130, 246, 0.3)' },
  sprinkler_3: { color: '#8B5A2B', icon: 'droplets', iconColor: '#1d4ed8', name: 'Sprinkler III', aoe: 4, aoeColor: 'rgba(59, 130, 246, 0.3)' },
  scarecrow_1: { color: '#8B5A2B', icon: 'ghost', iconColor: '#fde047', name: 'Scarecrow', aoe: 5, aoeColor: 'rgba(250, 204, 21, 0.2)' },
  scarecrow_2: { color: '#8B5A2B', icon: 'ghost', iconColor: '#eab308', name: 'Scarecrow II', aoe: 9, aoeColor: 'rgba(250, 204, 21, 0.2)' },
  path_stone: { color: '#d1d5db', icon: null, name: 'Stone Path' }
};

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 75%, 60%)`;
}

export function getDef(cell) {
  if (ITEMS[cell]) return ITEMS[cell];
  if (typeof cell === 'string' && cell.startsWith('crop_')) {
    const name = cell.replace('crop_', '');
    const niceName = name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { color: '#8B5A2B', icon: 'leaf', iconColor: stringToColor(name), name: niceName };
  }
  return ITEMS.dirt;
}

export default function FarmPlanner({ layoutData }) {
  const [grid, setGrid] = useState([]);
  const [width, setWidth] = useState(11);
  const [height, setHeight] = useState(11);
  const [selectedTool, setSelectedTool] = useState('crop_generic');
  const [isPainting, setIsPainting] = useState(false);

  useEffect(() => {
    if (layoutData) {
      setWidth(layoutData.width || 11);
      setHeight(layoutData.height || 11);
      if (layoutData.grid && layoutData.grid.length > 0) {
        setGrid(layoutData.grid);
      } else {
        const newGrid = Array(layoutData.height || 11).fill(null).map(() => Array(layoutData.width || 11).fill('dirt'));
        setGrid(newGrid);
      }
    } else {
      const newGrid = Array(11).fill(null).map(() => Array(11).fill('dirt'));
      setGrid(newGrid);
    }
  }, [layoutData]);

  function handleCellDown(r, c) {
    setIsPainting(true);
    paintCell(r, c);
  }

  function handleCellEnter(r, c) {
    if (isPainting) {
      paintCell(r, c);
    }
  }

  function handleMouseUp() {
    setIsPainting(false);
  }

  function paintCell(r, c) {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[r] = [...newGrid[r]];
      newGrid[r][c] = selectedTool;
      return newGrid;
    });
  }

  // Calculate AoE Highlights
  const highlights = [];
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const itemDef = ITEMS[cell];
      if (itemDef && itemDef.aoe) {
        highlights.push({
          r, c,
          range: itemDef.aoe,
          color: itemDef.aoeColor
        });
      }
    });
  });

  return (
    <div style={{
      border: `1px solid ${THEME.primaryLight}`,
      borderRadius: 12,
      background: 'white',
      overflow: 'hidden',
      margin: '16px 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      userSelect: 'none'
    }} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div style={{ padding: '12px 16px', background: THEME.primaryXLight, borderBottom: `1px solid ${THEME.primaryLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 600, color: THEME.primaryDark, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="leaf" size={16} /> AI Farm Planner ({width}x{height})
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Object.entries(ITEMS).map(([key, def]) => (
            <button
              key={key}
              onClick={() => setSelectedTool(key)}
              title={def.name}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: selectedTool === key ? THEME.primary : 'white',
                border: `1px solid ${selectedTool === key ? THEME.primary : THEME.primaryLight}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {def.icon ? <Icon name={def.icon} size={14} color={selectedTool === key ? 'white' : def.iconColor} /> : <div style={{ width: 14, height: 14, background: def.color, borderRadius: 2 }} />}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ padding: 24, overflowX: 'auto', display: 'flex', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${width}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${height}, ${TILE_SIZE}px)`,
          gap: 1,
          background: '#cbd5e1',
          border: '2px solid #94a3b8',
          position: 'relative'
        }}>
          {grid.map((row, r) => row.map((cell, c) => {
            const def = getDef(cell);
            return (
              <div
                key={`${r}-${c}`}
                onMouseDown={() => handleCellDown(r, c)}
                onMouseEnter={() => handleCellEnter(r, c)}
                style={{
                  width: TILE_SIZE, height: TILE_SIZE,
                  background: def.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  zIndex: 2 // Icons above highlights
                }}
              >
                {def.icon && <Icon name={def.icon} size={18} color={def.iconColor} />}
              </div>
            );
          }))}

          {/* AoE Overlays */}
          {highlights.map((hl, i) => {
            const top = Math.max(0, hl.r - hl.range);
            const left = Math.max(0, hl.c - hl.range);
            const bottom = Math.min(height - 1, hl.r + hl.range);
            const right = Math.min(width - 1, hl.c + hl.range);
            const hRange = bottom - top + 1;
            const wRange = right - left + 1;

            return (
              <div key={`hl-${i}`} style={{
                position: 'absolute',
                top: top * (TILE_SIZE + 1),
                left: left * (TILE_SIZE + 1),
                width: wRange * TILE_SIZE + (wRange - 1),
                height: hRange * TILE_SIZE + (hRange - 1),
                background: hl.color,
                pointerEvents: 'none',
                zIndex: 1 // Below icons, above background
              }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
