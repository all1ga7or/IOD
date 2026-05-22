'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function Lab7Page() {
  const router = useRouter();

  // Initial Parameters (Variant 15)
  const initialParams = { N: 20, n: 10, s: 5 };
  const [params, setParams] = useState(initialParams);

  // Dynamic constraints
  let safeN = params.N < 1 ? 1 : params.N;
  let safeNseq = params.n < 1 ? 1 : params.n;
  if (safeNseq > safeN) safeNseq = safeN;
  let safeS = params.s < 1 ? 1 : params.s;

  // Compute Results dynamically based on Amdahl's Laws
  const results = useMemo(() => {
    // Частка послідовних обчислень (beta)
    const beta = safeNseq / safeN;

    // 2-й закон Амдала: Прискорення (R_s)
    const denom = beta * safeS + (1 - beta);
    const R_s = safeS / denom;

    // 3-й закон Амдала: Граничне прискорення (R_max)
    const R_max = beta > 0 ? 1 / beta : Infinity;

    // Ефективність (E)
    const E = R_s / safeS;

    return { beta, R_s, R_max, E };
  }, [safeN, safeNseq, safeS]);

  const resetVariant = () => setParams(initialParams);

  const handleParamChange = (field, value) => {
    setParams(prev => ({ ...prev, [field]: Number(value) }));
  };

  const isVariant15 = safeN === 20 && safeNseq === 10 && safeS === 5;

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="header-bar animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/')}>
            ← На головну
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="page-title" style={{ fontSize: '1.6rem', margin: 0, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text' }}>
              ЛР 7: Закони Амдала (Прискорення і Ефективність)
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Аналіз паралельного алгоритму за шириною та критичним шляхом</span>
          </div>
        </div>
        <div className="download-area" style={{ margin: 0 }}>
          <button className="btn btn-secondary" onClick={resetVariant} style={{ padding: '8px 16px', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            🔄 Скинути до Варіанту 15
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }} className="animate-slide-up">
        {/* Param Inputs */}
        <div className="glass-card" style={{ flex: '1 1 300px' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>Параметри алгоритму</h2>

          <div className="form-group">
            <label className="form-label">Загальна кількість операцій (N):</label>
            <input
              type="number"
              className="input"
              value={params.N}
              onChange={(e) => handleParamChange('N', e.target.value)}
              min={safeNseq}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Послідовних операцій (критичний шлях, n):</label>
            <input
              type="number"
              className="input"
              value={params.n}
              onChange={(e) => handleParamChange('n', e.target.value)}
              min="1" max={safeN}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Кількість процесорів (ширина алгоритму, s):</label>
            <input
              type="number"
              className="input"
              value={params.s}
              onChange={(e) => handleParamChange('s', e.target.value)}
              min="1"
            />
          </div>

          <div style={{ padding: '16px', background: 'rgba(255, 145, 0, 0.1)', border: '1px solid rgba(255,145,0,0.3)', borderRadius: 'var(--radius-sm)', marginTop: '24px' }}>
            <span style={{ color: '#ff9100', fontWeight: 'bold' }}>Частка послідовного коду (β)</span>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '4px' }}>
              {(results.beta).toFixed(4)} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({safeNseq} / {safeN})</span>
            </div>
          </div>
        </div>

        {/* Results Panels */}
        <div style={{ flex: '2 1 450px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 0 }}>
            {/* Speedup */}
            <div className="stat-card" style={{ borderColor: 'rgba(3, 218, 198, 0.3)', background: 'rgba(3, 218, 198, 0.05)' }}>
              <div className="stat-value" style={{ background: 'var(--gradient-teal)', WebkitBackgroundClip: 'text', fontSize: '2.4rem' }}>
                {results.R_s.toFixed(3)}
              </div>
              <div className="stat-label" style={{ color: 'var(--teal)' }}>Прискорення (R_s)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>2-й закон: s / (βs + (1-β))</div>
            </div>

            {/* Max Speedup */}
            <div className="stat-card" style={{ borderColor: 'rgba(255, 145, 0, 0.3)', background: 'rgba(255, 145, 0, 0.05)' }}>
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #ff9100 0%, #ff3d00 100%)', WebkitBackgroundClip: 'text', fontSize: '2.4rem' }}>
                {results.R_max === Infinity ? '∞' : results.R_max.toFixed(3)}
              </div>
              <div className="stat-label" style={{ color: '#ff9100' }}>Граничне приск. (R_max)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>3-й закон (Асимптота): 1 / β</div>
            </div>

            {/* Efficiency */}
            <div className="stat-card" style={{ borderColor: 'rgba(187, 134, 252, 0.3)', background: 'rgba(187, 134, 252, 0.05)' }}>
              <div className="stat-value" style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', fontSize: '2.4rem' }}>
                {(results.E * 100).toFixed(1)}%
              </div>
              <div className="stat-label" style={{ color: 'var(--accent)' }}>Ефективність (E)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Коеф. використання: R_s / s</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', overflowX: 'auto', textAlign: 'center', transition: 'var(--transition)' }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>
              {isVariant15 ? 'Граф алгоритму (Рисунок 5, В-15)' : 'Граф алгоритму'}
            </h2>
            <GraphSVG N={safeN} n={safeNseq} s={safeS} isVariant15={isVariant15} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
              {isVariant15
                ? `Червоним виділено одну з гілок критичного шляху (n = ${safeNseq}). Ширина графа: s = ${safeS}.`
                : `Автоматична генерація графа: N=${safeN}, критичний шлях n=${safeNseq}, ширина s=${safeS}.`
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// SVG Visualization with smart dynamic rendering
function GraphSVG({ N, n, s, isVariant15 }) {
  const { edges, criticalPath, nodePositions, maxTiers } = useMemo(() => {
    if (isVariant15) {
      // ----------------------------------------------------
      // EXACT TOPOLOGY FOR VARIANT 15 (Рисунок 5)
      // ----------------------------------------------------
      const fixedEdges = [
        [1, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7],
        [3, 8], [7, 9], [4, 10], [5, 10], [6, 10], [8, 10], [9, 10],
        [10, 11], [11, 12], [11, 13], [11, 14], [11, 15], [11, 16],
        [12, 17], [16, 18], [13, 19], [14, 19], [15, 19], [17, 19], [18, 19],
        [19, 20]
      ];
      const fixedCrit = [1, 2, 3, 8, 10, 11, 12, 17, 19, 20];
      const fixedPos = {
        1: { x: 300, y: 30 }, 2: { x: 300, y: 100 },
        3: { x: 100, y: 170 }, 4: { x: 200, y: 170 }, 5: { x: 300, y: 170 }, 6: { x: 400, y: 170 }, 7: { x: 500, y: 170 },
        8: { x: 100, y: 240 }, 9: { x: 500, y: 240 },
        10: { x: 300, y: 310 }, 11: { x: 300, y: 380 },
        12: { x: 100, y: 450 }, 13: { x: 200, y: 450 }, 14: { x: 300, y: 450 }, 15: { x: 400, y: 450 }, 16: { x: 500, y: 450 },
        17: { x: 100, y: 520 }, 18: { x: 500, y: 520 },
        19: { x: 300, y: 590 }, 20: { x: 300, y: 660 },
      };
      return { edges: fixedEdges, criticalPath: fixedCrit, nodePositions: fixedPos, maxTiers: 10 };
    }

    // ----------------------------------------------------
    // DYNAMIC GENERATOR (Fallback for custom variables)
    // ----------------------------------------------------
    const dynTiers = {};
    for (let i = 1; i <= n; i++) dynTiers[i] = [i];

    let remaining = N - n;
    let currNode = n + 1;
    let targetTiers = [];
    if (n > 2) {
      for (let i = 2; i < n; i++) targetTiers.push(i);
    } else if (n > 1) {
      targetTiers = [1, n];
    } else {
      targetTiers = [1];
    }

    // Distribute remaining nodes broadly across middle tiers
    while (remaining > 0) {
      let addedInRound = 0;
      for (let t of targetTiers) {
        if (remaining <= 0) break;
        if (dynTiers[t].length < s) {
          dynTiers[t].push(currNode);
          currNode++;
          remaining--;
          addedInRound++;
        }
      }
      if (addedInRound === 0) break;
    }

    const dynEdges = [];
    // Critical pathway connecting sequential steps
    for (let i = 1; i < n; i++) dynEdges.push([i, i + 1]);

    // Connect broad algorithm nodes to previous/next tier leader
    for (let tStr in dynTiers) {
      const t = parseInt(tStr);
      const nodes = dynTiers[t];
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        if (t > 1) dynEdges.push([dynTiers[t - 1][0], node]);
        if (t < n) dynEdges.push([node, dynTiers[t + 1][0]]);
        else if (t === n && n > 1) dynEdges.push([dynTiers[t - 1][0], node]);
      }
    }

    const dynCrit = [];
    for (let i = 1; i <= n; i++) dynCrit.push(i);

    // Dynamic coordinates 
    const dynNodePos = {};
    const ySpacing = 70;
    const xSpacing = 80;
    const baseY = 30;

    for (let tStr in dynTiers) {
      const t = parseInt(tStr);
      const nodes = dynTiers[t];
      const tierY = baseY + (t - 1) * ySpacing;

      let startX = 300 - ((nodes.length - 1) * xSpacing) / 2;

      nodes.forEach((node, idx) => {
        dynNodePos[node] = { x: startX + idx * xSpacing, y: tierY };
      });
    }

    return { edges: dynEdges, criticalPath: dynCrit, nodePositions: dynNodePos, maxTiers: n };
  }, [N, n, s, isVariant15]);

  // Max SVG height depending on dynamically generated tiers
  const svgHeight = maxTiers > 0 ? (maxTiers * 70 + 40) : 500;

  return (
    <div style={{ transition: 'all 0.5s ease-out', minHeight: '400px' }}>
      <svg width="100%" viewBox={`0 0 600 ${svgHeight}`} style={{ maxWidth: '500px', margin: '0 auto', display: 'block', transition: 'viewBox 0.5s ease-out' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="24" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 255, 255, 0.2)" />
          </marker>
          <marker id="arrowheadCrit" markerWidth="10" markerHeight="7" refX="26" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff4081" />
          </marker>
          <filter id="glowCrit" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Draw edges with subtle enter animations */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {edges.map(([u, v], i) => {
            const uPos = nodePositions[u];
            const vPos = nodePositions[v];
            if (!uPos || !vPos) return null;

            const uIndex = criticalPath.indexOf(u);
            const isCritical = uIndex !== -1 && criticalPath[uIndex + 1] === v;

            return (
              <line
                key={`edge-${isVariant15 ? 'var15' : 'dyn'}-${u}-${v}`}
                x1={uPos.x} y1={uPos.y}
                x2={vPos.x} y2={vPos.y}
                stroke={isCritical ? "#ff4081" : "rgba(255, 255, 255, 0.15)"}
                strokeWidth={isCritical ? "3" : "2"}
                markerEnd={isCritical ? "url(#arrowheadCrit)" : "url(#arrowhead)"}
                style={{
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            );
          })}
        </g>

        {/* Draw nodes */}
        {Object.keys(nodePositions).map(idStr => {
          const id = parseInt(idStr);
          const pos = nodePositions[id];
          const isCritical = criticalPath.includes(id);

          return (
            <g
              key={`node-${isVariant15 ? 'var15' : 'dyn'}-${id}`}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {isCritical && (
                <circle r="16" fill="transparent" stroke="#ff4081" strokeWidth="3" filter="url(#glowCrit)" opacity="0.6" />
              )}
              <circle
                r="14"
                fill={isCritical ? '#ff1744' : '#1e1e2d'}
                stroke={isCritical ? '#ff8a80' : '#8888a0'}
                strokeWidth="2"
                style={{ transition: 'fill 0.3s, stroke 0.3s' }}
              />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                {id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
