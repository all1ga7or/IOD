'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function Lab8Page() {
  const router = useRouter();

  // Initial Parameters (Variant 15)
  const initialParams = {
    parallel: 0.65, // 65% parallel (so beta = 0.35)
    s_given: 14,    // target speedup
    a1: 0.65,       // 65% of max
    a2: 0.90        // 90% of max
  };

  const [params, setParams] = useState(initialParams);

  const resetVariant = () => setParams(initialParams);

  // Parse uploaded file (txt or JSON)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        // Try JSON format first
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          setParams({
            parallel: data.parallel || initialParams.parallel,
            s_given: data.s_given || initialParams.s_given,
            a1: data.a1 || initialParams.a1,
            a2: data.a2 || initialParams.a2
          });
        } else {
          // Fallback to text parsing (space or comma separated)
          const parts = text.trim().split(/[\s,]+/);
          if (parts.length >= 4) {
            setParams({
              parallel: Number(parts[0]),
              s_given: Number(parts[1]),
              a1: Number(parts[2]),
              a2: Number(parts[3])
            });
          }
        }
      } catch (err) {
        alert("Помилка читання файлу: " + err.message);
      }
    };
    reader.readAsText(file);
    // clear input
    e.target.value = null;
  };

  const handleParamChange = (field, value) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => {
    // Parse strings to numbers or fallbacks
    const p = Number(params.parallel) || 0;
    const s_given = Number(params.s_given);
    const a1 = Number(params.a1);
    const a2 = Number(params.a2);

    const errors = {};
    if (params.s_given !== '' && (isNaN(s_given) || s_given <= 1)) {
      errors.s_given = "Прискорення має бути > 1";
    }
    if (params.a1 !== '' && (isNaN(a1) || a1 <= 0 || a1 >= 1)) {
      errors.a1 = "Має бути в межах 0.01 - 0.99";
    }
    if (params.a2 !== '' && (isNaN(a2) || a2 <= 0 || a2 >= 1)) {
      errors.a2 = "Має бути в межах 0.01 - 0.99";
    }

    // Constrain beta so we don't hit Infinity division
    const safeParallel = Math.max(0.001, Math.min(0.999, p));
    const beta = 1 - safeParallel;
    const s_max = 1 / beta;

    // 1. Calculate Required Processors (l) for s_given
    let l_calc = null;
    let impossible = false;
    const denom = 1 - s_given * beta;
    if (denom <= 0) {
      impossible = true;
    } else {
      l_calc = (s_given * (1 - beta)) / denom;
    }

    // 2. Calculate Processors for target ratios a1, a2
    const calcLForRatio = (a) => {
      if (a >= 1.0 || a <= 0) return Infinity; // Prevent NaN/Infinity issues if user clears field
      const l = (a / (1 - a)) * ((1 - beta) / beta);
      return Math.ceil(l);
    };

    const l_a1 = calcLForRatio(a1);
    const l_a2 = calcLForRatio(a2);

    // 3. Develop Proposed Variant (Tasks 6, 7)
    let altParallel;
    let isOriginalCompatible = !impossible;
    if (impossible) {
      // Propose a COMPATIBLE variant by drastically increasing parallelism
      // We need Smax > s_given => 1/beta > s_given => beta < 1/s_given
      // Let's make Smax = s_given * 1.2 for safety
      const targetBeta = 1 / (s_given * 1.2);
      altParallel = 1 - targetBeta;
    } else {
      // Propose an INCOMPATIBLE variant by decreasing parallelism
      // We need Smax < s_given => 1/beta < s_given => beta > 1/s_given
      // Let's make Smax = s_given * 0.8
      const targetBeta = 1 / (s_given * 0.8);
      altParallel = 1 - targetBeta;
    }
    // Clamp
    if (altParallel >= 1) altParallel = 0.99;
    if (altParallel <= 0) altParallel = 0.01;

    return { beta, s_max, l_calc, impossible, l_a1, l_a2, safeParallel, errors, altParallel, isOriginalCompatible };
  }, [params]);

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="header-bar animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/')}>
            ← На головну
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="page-title" style={{ fontSize: '1.6rem', margin: 0, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text' }}>
              ЛР 8: Зворотний розрахунок процесорів
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Аналіз необхідної кількості пристроїв для досягнення прискорення</span>
          </div>
        </div>
        <div className="download-area" style={{ margin: 0, display: 'flex', gap: '12px' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
            📂 З файлу
            <input type="file" accept=".txt,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-secondary" onClick={resetVariant} style={{ padding: '8px 16px', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            🔄 Скинути до Варіанту 15
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }} className="animate-slide-up">
        {/* Param Inputs */}
        <div className="glass-card" style={{ flex: '1 1 320px' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>Вхідні дані</h2>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Частка паралельних обчислень (1 - β):</span>
              <span style={{ color: 'var(--accent)' }}>{(params.parallel * 100).toFixed(1)}%</span>
            </label>
            <input 
              type="range" 
              style={{ width: '100%', marginBottom: '6px' }}
              min="0.01" max="0.99" step="0.01"
              value={params.parallel} 
              onChange={(e) => handleParamChange('parallel', e.target.value)} 
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Обов'язковий послідовний код (β) = {(results.beta * 100).toFixed(1)}%</div>
          </div>
          
          <div className="form-group" style={{ marginTop: '24px' }}>
            <label className="form-label">Бажане прискорення (S):</label>
            <input 
              type="number" 
              className="input" 
              value={params.s_given} 
              onChange={(e) => handleParamChange('s_given', e.target.value)} 
              min="1" step="0.5"
              style={{ borderColor: results.errors.s_given ? '#cf6679' : 'var(--border-color)', outline: 'none' }}
            />
            {results.errors.s_given && <div style={{ color: '#cf6679', fontSize: '0.75rem', marginTop: '4px' }}>{results.errors.s_given}</div>}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Межа 1 (a₁):</label>
              <input 
                type="number" 
                className="input" 
                value={params.a1} 
                onChange={(e) => handleParamChange('a1', e.target.value)} 
                min="0.01" max="0.99" step="0.05"
                style={{ borderColor: results.errors.a1 ? '#cf6679' : 'var(--border-color)', outline: 'none' }}
              />
              {results.errors.a1 && <div style={{ color: '#cf6679', fontSize: '0.75rem', marginTop: '4px' }}>{results.errors.a1}</div>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Межа 2 (a₂):</label>
              <input 
                type="number" 
                className="input" 
                value={params.a2} 
                onChange={(e) => handleParamChange('a2', e.target.value)} 
                min="0.01" max="0.99" step="0.05"
                style={{ borderColor: results.errors.a2 ? '#cf6679' : 'var(--border-color)', outline: 'none' }}
              />
              {results.errors.a2 && <div style={{ color: '#cf6679', fontSize: '0.75rem', marginTop: '4px' }}>{results.errors.a2}</div>}
            </div>
          </div>
        </div>

        {/* Results Panels */}
        <div style={{ flex: '2 1 450px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* S_max & Compatibility */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', 
                                              borderColor: results.impossible ? 'rgba(207, 102, 121, 0.4)' : 'rgba(3, 218, 198, 0.3)' }}>
            <div style={{ flex: '1 1 150px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Граничне прискорення (S_max):</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: results.impossible ? '#cf6679' : 'var(--teal)' }}>
                {results.s_max.toFixed(2)}x
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Стеля продуктивності (1/β)</div>
            </div>

            <div style={{ flex: '2 1 200px', paddingLeft: '24px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Для заданого S = {params.s_given}:</div>
              {results.impossible ? (
                <div>
                  <div style={{ color: '#cf6679', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px' }}>🛑 Запит нездійсненний</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Неможливо досягти {params.s_given}x. Максимум системи обмежений {results.s_max.toFixed(2)}x через частку послідовного коду.</div>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px' }}>✅ Достатньо {Math.ceil(results.l_calc)} процесорів</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Точна потреба l = {results.l_calc.toFixed(2)}. Будь-яка кількість процесорів вище цього значення забезпечить швидкість не нижче {params.s_given}x.</div>
                </div>
              )}
            </div>
          </div>

          {/* Efficiency targets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Для {params.a1 * 100}% від S_max ({(params.a1 * results.s_max).toFixed(1)}x):</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#00b0ff' }}>l ≥ {results.l_a1}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Після цієї кількості процесорів прискорення зростатиме дуже повільно.</div>
            </div>
            
            <div className="glass-card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Для {params.a2 * 100}% від S_max ({(params.a2 * results.s_max).toFixed(1)}x):</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#00e5ff' }}>l ≥ {results.l_a2}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Критичне уповільнення темпів зростання ефективності.</div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE AND PROPOSAL SECTION (TASKS 6-9) */}
      <div className="glass-card animate-slide-up" style={{ marginTop: '24px', padding: '32px' }}>
        <h2 className="section-title" style={{ marginTop: 0, marginBottom: '24px' }}>
          Аналіз варіанту та запропоноване рішення (Таблиця)
        </h2>
        
        <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Характеристика</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  № Заданий (Вхідний)
                </th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--accent)' }}>
                  № Запропонований (M)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Частка паралельних обчислень (1 - β)</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{params.parallel} ({(params.parallel*100).toFixed(1)}%)</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--accent)', fontWeight: 'bold' }}>
                  {results.altParallel.toFixed(4)} ({(results.altParallel*100).toFixed(1)}%)
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Макс можливе прискорення у випадку використання однакових процесорів (S)</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{params.s_given}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{params.s_given}</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Необхідно забезпечити від a₁ до a₂ від S_max</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{(params.a1*100).toFixed(0)}% - {(params.a2*100).toFixed(0)}%</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{(params.a1*100).toFixed(0)}% - {(params.a2*100).toFixed(0)}%</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Статус (S_max)</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: results.impossible ? '#cf6679' : 'var(--teal)' }}>
                  {results.impossible ? 'НЕСУМІСНИЙ (S_max = ' + results.s_max.toFixed(2) + ')' : 'СУМІСНИЙ (S_max = ' + results.s_max.toFixed(2) + ')' }
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: results.isOriginalCompatible ? '#cf6679' : 'var(--teal)' }}>
                  {results.isOriginalCompatible 
                    ? 'НЕСУМІСНИЙ (S_max = ' + (1/(1-results.altParallel)).toFixed(2) + ')'
                    : 'СУМІСНИЙ (S_max = ' + (1/(1-results.altParallel)).toFixed(2) + ')'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'white' }}>Обґрунтування оновленого варіанту:</h4>
          {results.impossible ? (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Оскільки початковий варіант виявився <b>несумісним</b> (задане прискорення S={params.s_given} перевищує теоретичну межу Smax={results.s_max.toFixed(2)}), 
              алгоритм не зможе досягти поставленої мети навіть при нескінченній кількості пристроїв через занадто велику частку послідовного коду (β={(results.beta*100).toFixed(1)}%).<br/><br/>
              <b>Вирішення:</b> Запропоновано модифікувати код алгоритму, щоб збільшити ступінь його розпаралелювання з {(params.parallel*100).toFixed(1)}% до <b>{(results.altParallel*100).toFixed(1)}%</b>. 
              Тепер нова гранична межа становить Smax={(1/(1-results.altParallel)).toFixed(2)}, що з запасом покриває задане S={params.s_given}. 
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Оскільки початковий варіант є <b>сумісним</b>, для навчальних цілей пропонується "погіршений" <b>несумісний варіант</b>.<br/><br/>
              Якщо внаслідок неефективного програмування частка паралельних обчислень впаде до <b>{(results.altParallel*100).toFixed(1)}%</b>, 
              то теоретичне граничне прискорення Smax обвалиться до {(1/(1-results.altParallel)).toFixed(2)}. 
              За таких умов досягти необхідного S={params.s_given} стане фізично неможливо, незалежно від потужності обчислювального кластера.
            </p>
          )}
        </div>
      </div>

      {/* AMDAHL'S LAW CHART */}
      <div className="glass-card animate-slide-up" style={{ marginTop: '24px', padding: '32px' }}>
        <h2 className="section-title" style={{ marginTop: 0, marginBottom: '24px' }}>Візуалізація кривої Амдала S(l)</h2>
        <AmdahlChart 
          beta={results.beta} 
          s_max={results.s_max} 
          s_given={params.s_given} 
          l_calc={results.l_calc} 
          impossible={results.impossible}
          a1={params.a1} l_a1={results.l_a1}
          a2={params.a2} l_a2={results.l_a2}
        />
      </div>
    </div>
  );
}

// Sub-component to render the Amdahl's Law curve dynamically using SVG
function AmdahlChart({ beta, s_max, s_given, l_calc, impossible, a1, l_a1, a2, l_a2 }) {
  // Determine X (Processors l) and Y (Speedup S) axis bounds 
  const yMax = impossible ? Math.max(s_max, s_given) * 1.2 : Math.max(s_max, s_given * 1.2);
  const xMax = Math.min(200, Math.max(30, (l_calc && !impossible) ? l_calc * 1.5 : l_a2 * 1.3));

  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 50, left: 60 };
  const graphW = width - padding.left - padding.right;
  const graphH = height - padding.top - padding.bottom;

  const mapX = (l) => padding.left + (l / xMax) * graphW;
  const mapY = (s) => padding.top + graphH - (s / yMax) * graphH;

  // Generate curve path
  const points = [];
  for (let l = 1; l <= xMax; l += (xMax/100)) {
    const s = l / (l * beta + (1 - beta));
    points.push(`${mapX(l)},${mapY(s)}`);
  }
  const pathD = `M ${mapX(1)},${mapY(1)} L ${points.join(' L ')}`;

  // Grid lines
  const gridLines = [];
  for (let i = 1; i <= 5; i++) {
    const s_val = (yMax / 5) * i;
    gridLines.push({ value: s_val.toFixed(1), y: mapY(s_val) });
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', textAlign: 'center' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: '900px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
        
        {/* Grid and Axis Labels */}
        {gridLines.map((gl, i) => (
          <g key={`grid-${i}`}>
            <line x1={padding.left} y1={gl.y} x2={width-padding.right} y2={gl.y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={gl.y + 4} fill="var(--text-muted)" fontSize="12" textAnchor="end">{gl.value}x</text>
          </g>
        ))}
        {/* Bottom axis marks (Processors) */}
        {[10, Math.floor(xMax/4), Math.floor(xMax/2), Math.floor(xMax*0.75), Math.floor(xMax)].map((lx, i) => (
          <g key={`xgrid-${i}`}>
            <line x1={mapX(lx)} y1={padding.top} x2={mapX(lx)} y2={height - padding.bottom} stroke="rgba(255,255,255,0.03)" />
            <text x={mapX(lx)} y={height - padding.bottom + 20} fill="var(--text-muted)" fontSize="12" textAnchor="middle">{lx}</text>
          </g>
        ))}
        <text x={width/2} y={height - 10} fill="var(--text-secondary)" fontSize="14" fontWeight="bold">Кількість процесорів (l)</text>
        <text x={20} y={height/2 - 20} fill="var(--text-secondary)" fontSize="14" fontWeight="bold" transform={`rotate(-90 20 ${height/2})`}>Прискорення (S)</text>

        {/* AXES */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="var(--text-secondary)" strokeWidth="2" />
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="var(--text-secondary)" strokeWidth="2" />

        {/* Asymptote S_max */}
        <line 
          x1={padding.left} y1={mapY(s_max)} 
          x2={width-padding.right} y2={mapY(s_max)} 
          stroke="#cf6679" strokeWidth="2" strokeDasharray="8 6" 
        />
        <text x={width-padding.right + 10} y={mapY(s_max) + 4} fill="#cf6679" fontSize="12" fontWeight="bold">S_max ({s_max.toFixed(1)})</text>

        {/* A1 Target */}
        <line 
          x1={padding.left} y1={mapY(s_max * a1)} 
          x2={width-padding.right} y2={mapY(s_max * a1)} 
          stroke="rgba(0, 176, 255, 0.4)" strokeWidth="1" strokeDasharray="4 4" 
        />
        <circle cx={mapX(Math.min(l_a1, xMax))} cy={mapY(s_max * a1)} r="5" fill="#00b0ff" />
        <text x={mapX(Math.min(l_a1, xMax))} y={mapY(s_max * a1) - 10} fill="#00b0ff" fontSize="12" textAnchor="middle">a₁ ({l_a1} шт)</text>

        {/* A2 Target */}
        <line 
          x1={padding.left} y1={mapY(s_max * a2)} 
          x2={width-padding.right} y2={mapY(s_max * a2)} 
          stroke="rgba(0, 229, 255, 0.4)" strokeWidth="1" strokeDasharray="4 4" 
        />
        <circle cx={mapX(Math.min(l_a2, xMax))} cy={mapY(s_max * a2)} r="5" fill="#00e5ff" />
        <text x={mapX(Math.min(l_a2, xMax))} y={mapY(s_max * a2) - 10} fill="#00e5ff" fontSize="12" textAnchor="middle">a₂ ({l_a2} шт)</text>

        {/* The Amdahl's Curve itself */}
        <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,229,255,0.4))', transition: 'd 0.5s ease-out' }} />

        {/* Target S_given */}
        {!impossible && (
          <g>
            <line x1={mapX(l_calc)} y1={mapY(s_given)} x2={padding.left} y2={mapY(s_given)} stroke="rgba(187, 134, 252, 0.3)" strokeDasharray="3 3"/>
            <line x1={mapX(l_calc)} y1={mapY(s_given)} x2={mapX(l_calc)} y2={height - padding.bottom} stroke="rgba(187, 134, 252, 0.3)" strokeDasharray="3 3"/>
            <circle cx={mapX(l_calc)} cy={mapY(s_given)} r="8" fill="var(--accent)" stroke="#1e1e2d" strokeWidth="2" />
            <text x={mapX(l_calc)} y={mapY(s_given) - 15} fill="var(--accent)" fontSize="13" fontWeight="bold" textAnchor="middle">
              Мета S={s_given} (l={(l_calc).toFixed(1)})
            </text>
          </g>
        )}

        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00b0ff" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
