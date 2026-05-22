'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function Lab6Page() {
  const router = useRouter();

  // Initial Productivities (Variant 15, column 5, Lab 6 table)
  const initialProductivities = {
    0: 6, 1: 9, 2: 5, 3: 7, 4: 12, 5: 8,
    6: 5, 7: 5, 8: 9, 9: 5, 10: 15,
    11: 9, 12: 7, 13: 8, 14: 5
  };

  const [productivities, setProductivities] = useState(initialProductivities);

  // Graph Definition (ФП=1)
  const subsystems = useMemo(() => ({
    1: { nodes: [0, 1, 2, 3, 4, 5], color: '#bb86fc' },
    2: { nodes: [6, 7, 8, 9, 10], color: '#03dac6' },
    3: { nodes: [11, 12, 13, 14], color: '#ffb74d' }
  }), []);

  const edges = useMemo(() => [
    // Sub 1
    [2, 1], [1, 0], [1, 3], [0, 4], [3, 4], [4, 5],
    // Sub 2
    [9, 6], [9, 7], [6, 7], [6, 10], [6, 8], [7, 8],
    // Sub 3
    [13, 14], [13, 11], [13, 12], [14, 12], [11, 12]
  ], []);

  // Compute Results dynamically
  const results = useMemo(() => {
    const res = {};
    let totalReal = 0;
    let totalPeak = 0;
    let maxPiObj = 0;

    Object.keys(subsystems).forEach(subId => {
      const devGroup = subsystems[subId].nodes;
      let minPi = Infinity;
      devGroup.forEach(d => {
        const val = Number(productivities[d]) || 0;
        totalPeak += val;
        if (val < minPi) minPi = val;
        if (val > maxPiObj) maxPiObj = val;
      });

      const realProd = minPi * devGroup.length;
      totalReal += realProd;

      const loads = {};
      const bottlenecks = [];
      devGroup.forEach(d => {
        const val = Number(productivities[d]) || 0;
        loads[d] = val > 0 ? (minPi / val) : 0;
        if (val === minPi) bottlenecks.push(d);
      });

      res[subId] = {
        minPi,
        realProd,
        loads,
        bottlenecks,
        devices: devGroup
      };
    });

    const incompatibility = totalPeak - totalReal;
    const rho = totalPeak > 0 ? (totalReal / totalPeak) * 100 : 0; // system load
    const speedup = maxPiObj > 0 ? (totalReal / maxPiObj) : 0; // acceleration

    // Generating "Compatible Configurations" (Downwards and Upwards)
    const lowConfig = {};
    const highConfig = {};
    
    Object.keys(subsystems).forEach(subId => {
      const devGroup = subsystems[subId].nodes;
      const minPi = res[subId].minPi;
      let maxPiSub = 0;
      devGroup.forEach(d => {
        const val = Number(productivities[d]) || 0;
        if (val > maxPiSub) maxPiSub = val;
      });
      devGroup.forEach(d => {
        lowConfig[d] = minPi;
        highConfig[d] = maxPiSub;
      });
    });

    return { 
      subsystems: res, 
      totalReal, 
      totalPeak, 
      incompatibility, 
      rho, 
      maxPiObj, 
      speedup,
      lowConfig,
      highConfig
    };
  }, [productivities, subsystems]);

  const resetVariant = () => setProductivities(initialProductivities);

  const handlePiChange = (id, val) => {
    setProductivities(prev => ({
      ...prev,
      [id]: Math.max(1, Number(val) || 1)
    }));
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="header-bar animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/')}>
            ← На головну
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="page-title" style={{ fontSize: '1.6rem', margin: 0, background: 'var(--gradient-teal)', WebkitBackgroundClip: 'text' }}>
              ЛР 6: Характеристики систем (Метод Амдала)
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Прискорення, завантаженість системи та усунення несумісності</span>
          </div>
        </div>
        <div className="download-area" style={{ margin: 0 }}>
          <button className="btn btn-secondary" onClick={resetVariant} style={{ padding: '8px 16px', borderColor: 'var(--teal)', color: 'var(--teal)' }}>
            🔄 Скинути до Варіанту 15
          </button>
        </div>
      </div>

      <div className="stats-grid animate-slide-up" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{results.totalPeak}</div>
          <div className="stat-label">Пікова продуктивність (Π)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'var(--gradient-teal)', WebkitBackgroundClip: 'text', fontSize: '1.8rem' }}>
            {results.totalReal}
          </div>
          <div className="stat-label">Реальна підсумкова (r)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #ffb74d 0%, #f57c00 100%)', WebkitBackgroundClip: 'text', fontSize: '1.8rem' }}>
            {results.rho.toFixed(1)}%
          </div>
          <div className="stat-label">Завантаженість системи (ρ)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #651fff 0%, #3d5afe 100%)', WebkitBackgroundClip: 'text', fontSize: '1.8rem' }}>
            {results.speedup.toFixed(2)}x
          </div>
          <div className="stat-label">Прискорення системи (S)</div>
        </div>
        <div className="stat-card" style={{ borderColor: results.incompatibility > 0 ? 'rgba(207, 102, 121, 0.4)' : 'var(--border-color)' }}>
          <div className="stat-value" style={{ background: results.incompatibility > 0 ? 'linear-gradient(135deg, #ff4081 0%, #d50000 100%)' : 'var(--gradient-teal)', WebkitBackgroundClip: 'text', fontSize: '1.8rem' }}>
            {results.incompatibility}
          </div>
          <div className="stat-label">Втрати (Несумісність δ)</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }} className="animate-slide-up">
        {/* Dynamic Inputs Panel */}
        <div className="glass-card" style={{ flex: '1 1 300px' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>Управління (π)</h2>
          <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
            {[1, 2, 3].map(subId => (
              <div key={`input-sub-${subId}`} style={{ marginBottom: '16px' }}>
                <h3 style={{ color: subsystems[subId].color, fontSize: '0.9rem', marginBottom: '8px' }}>
                  Підсистема {subId}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                  {subsystems[subId].nodes.map(node => (
                    <div key={`input-${node}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ФП {node}</label>
                      <input 
                        type="number"
                        className="input"
                        value={productivities[node]}
                        onChange={(e) => handlePiChange(node, e.target.value)}
                        style={{ 
                          padding: '6px 8px', fontSize: '0.9rem', 
                          borderColor: results.subsystems[subId]?.bottlenecks.includes(node) ? '#ff4081' : 'var(--border-color)',
                          background: results.subsystems[subId]?.bottlenecks.includes(node) ? 'rgba(255, 64, 129, 0.05)' : 'var(--bg-input)'
                        }}
                        min="1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph visualization via SVG */}
        <div className="glass-card" style={{ flex: '2 1 450px', padding: '24px', overflowX: 'auto', textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginTop: 0, color: 'var(--teal)' }}>Топологія (ФП=1)</h2>
          <GraphSVG 
            productivities={productivities} 
            results={results} 
            subsystems={subsystems} 
            edges={edges}
          />
        </div>
      </div>

      {/* Recommended Adjustments */}
      <div className="animate-slide-up" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="glass-card">
          <h2 className="section-title" style={{ marginTop: 0, color: 'var(--accent)' }}>Спосіб А: Зрівняння донизу</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Скорочення швидкості швидких елементів до швидкості "вузького місця". Несумісність вироджується в 0.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[1, 2, 3].map(subId => {
              const reqPi = results.subsystems[subId].minPi;
              return (
                <div key={`low-${subId}`} className="badge" style={{ background: `${subsystems[subId].color}20`, color: subsystems[subId].color, padding: '8px 12px', fontSize: '0.85rem' }}>
                  Підсистема {subId} → <strong>π = {reqPi}</strong>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card">
          <h2 className="section-title" style={{ marginTop: 0, color: 'var(--teal)' }}>Спосіб Б: Зрівняння догори</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Заміна повільних пристроїв моделями з продуктивністю найшвидшого елемента підсистеми.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[1, 2, 3].map(subId => {
              const maxPiDevs = subsystems[subId].nodes.map(n => Number(productivities[n]));
              const requiredPi = Math.max(...maxPiDevs);
              return (
                <div key={`high-${subId}`} className="badge" style={{ background: `${subsystems[subId].color}20`, color: subsystems[subId].color, padding: '8px 12px', fontSize: '0.85rem' }}>
                  Підсистема {subId} → <strong>π = {requiredPi}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

// Sub-component to draw the nodes and lines
function GraphSVG({ productivities, results, subsystems, edges }) {
  // Coordinates mapped exactly to visual structure from methodological guidelines
  const nodePositions = {
    2: { x: 100, y: 50 },
    1: { x: 100, y: 150 },
    0: { x: 50, y: 250 },
    3: { x: 150, y: 250 },
    4: { x: 100, y: 350 },
    5: { x: 100, y: 450 },

    9: { x: 300, y: 50 },
    6: { x: 250, y: 150 },
    7: { x: 350, y: 150 },
    10: { x: 250, y: 250 },
    8: { x: 350, y: 250 },

    13: { x: 500, y: 50 },
    14: { x: 450, y: 150 },
    11: { x: 550, y: 150 },
    12: { x: 500, y: 250 },
  };

  const getNodeData = (id) => {
    let color = '#8888a0';
    let isBottleneck = false;
    Object.keys(subsystems).forEach(subId => {
      if (subsystems[subId].nodes.includes(id)) {
        color = subsystems[subId].color;
        if (results.subsystems[subId].bottlenecks.includes(id)) {
          isBottleneck = true;
        }
      }
    });
    return { pos: nodePositions[id], color, isBottleneck };
  };

  return (
    <svg width="100%" viewBox="0 0 600 500" style={{ maxWidth: '550px', margin: '0 auto', display: 'block' }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 255, 255, 0.4)" />
        </marker>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Draw edges */}
      {edges.map(([u, v], i) => {
        const uPos = nodePositions[u];
        const vPos = nodePositions[v];
        if (!uPos || !vPos) return null;
        return (
          <line 
            key={`edge-${i}`}
            x1={uPos.x} y1={uPos.y} 
            x2={vPos.x} y2={vPos.y} 
            stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" 
            markerEnd="url(#arrowhead)" 
          />
        );
      })}

      {/* Draw nodes */}
      {Object.keys(nodePositions).map(idStr => {
        const id = parseInt(idStr);
        const { pos, color, isBottleneck } = getNodeData(id);
        const pi = productivities[id] || 0;
        
        return (
          <g key={`node-${id}`} transform={`translate(${pos.x}, ${pos.y})`}>
            {isBottleneck && (
              <circle r="22" fill="transparent" stroke="#ff4081" strokeWidth="2" filter="url(#glow)">
                <animate attributeName="r" values="22; 26; 22" dur="2s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="1; 0.3; 1" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle 
              r="20" 
              fill={isBottleneck ? '#ff4081' : color} 
              stroke="white" strokeWidth="2"
              style={{ transition: 'all 0.3s' }}
            />
            <text x="0" y="5" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              {id}
            </text>
            <rect x="-18" y="24" width="36" height="18" rx="4" fill="rgba(0,0,0,0.7)" />
            <text x="0" y="37" textAnchor="middle" fill="white" fontSize="10">
              π={pi}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
