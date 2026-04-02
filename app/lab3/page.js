'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ===== Helpers =====
const MEDAL = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;

function MatrixTable({ matrix, labels, title, colorFn }) {
  if (!matrix || !labels) return null;
  return (
    <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
      <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent)' }}>{title}</p>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem', minWidth: '100%' }}>
        <thead>
          <tr>
            <th style={{ padding: '4px 6px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}> </th>
            {labels.map((l, j) => (
              <th key={j} style={{ padding: '4px 6px', color: 'var(--teal)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                {l.split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: '4px 6px', color: 'var(--teal)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {labels[i].split(' ')[0]}
              </td>
              {row.map((val, j) => {
                const bg = colorFn ? colorFn(val, i, j) : 'transparent';
                return (
                  <td key={j} style={{
                    padding: '4px 8px', textAlign: 'center',
                    background: bg,
                    color: i === j ? 'var(--text-muted)' : 'var(--text-primary)',
                    borderRadius: '4px'
                  }}>
                    {i === j ? '·' : val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== Main Component =====
export default function Lab3ResultsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const fetchResults = useCallback(async (pwd) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lab3/results', {
        headers: { 'x-admin-password': pwd || password }
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Помилка'); return; }
      setResults(data);
      setAuthenticated(true);
    } catch {
      setError('Не вдалося отримати дані');
    } finally {
      setLoading(false);
    }
  }, [password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    await fetchResults(password);
  };

  // ---- Login screen ----
  if (!authenticated) {
    return (
      <div className="page-center">
        <div className="glass-card animate-scale" style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '60px', height: '60px', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #f9a825 0%, #e65100 100%)',
              borderRadius: '16px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.8rem',
              boxShadow: '0 8px 32px rgba(249,168,37,0.3)'
            }}>🏆</div>
            <h1 className="page-title">ЛР3 — Колективне ранжування</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Кількісний аналіз через метрику Кука
            </p>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Пароль адміністратора</label>
              <input type="password" className="input" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введіть пароль" required autoFocus />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !password}>
              {loading ? '⏳ Завантаження...' : '📊 Переглянути результати'}
            </button>
          </form>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}
            onClick={() => router.push('/')}>← Меню лабораторних</button>
        </div>
      </div>
    );
  }

  if (loading || !results) {
    return (
      <div className="page-center">
        <div style={{ textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚙️</div>
          <p style={{ color: 'var(--text-secondary)' }}>Обчислення ({results?.stats?.total_permutations?.toLocaleString?.() || '...'} перестановок)...</p>
        </div>
      </div>
    );
  }

  const { inputSummary, objNames, prefMatrix, binaryMatrix, stats,
    cookSumMedians, cookMaxMedians, bestSumD, bestMaxD,
    finalRanking, e1Ranking, e2Ranking, gaResult, scalingResults } = results;

  const tabs = [
    { id: 'overview', label: '📊 Огляд' },
    { id: 'input', label: '📋 Вхідні дані' },
    { id: 'matrix', label: '🔲 Матриці' },
    { id: 'medians', label: '🏆 Медіани Кука' },
    { id: 'heuristics', label: '🔧 Евристики' },
    { id: 'ga', label: '🧬 Алгоритм GA' },
    { id: 'scaling', label: '📈 Масштаб' }
  ];

  const prefColorFn = (val, i, j) => {
    if (i === j) return 'transparent';
    const maxVal = Math.max(...prefMatrix.flat().filter((_, k) => k % (prefMatrix.length + 1) !== 0));
    const intensity = maxVal > 0 ? val / maxVal : 0;
    return `rgba(187, 134, 252, ${intensity * 0.5})`;
  };

  const binColorFn = (val, i, j) => {
    if (i === j) return 'transparent';
    return val === 1 ? 'rgba(3, 218, 198, 0.2)' : 'rgba(207, 102, 121, 0.1)';
  };

  return (
    <div className="container animate-fade">
      {/* Header */}
      <div className="header-bar">
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem' }}>🏆 ЛР3 — Колективне ранжування</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
            Метод Кука: медіани суми та максимуму відстаней
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchResults()} className="btn btn-secondary btn-sm">🔄 Оновити</button>
          <button onClick={() => { setAuthenticated(false); setResults(null); setPassword(''); }}
            className="btn btn-secondary btn-sm">🚪 Вийти</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: '28px' }}>
        {[
          ['🎯', stats.n_objects, "Об'єктів"],
          ['👥', stats.n_experts, 'Експертів (ЛР1)'],
          ['🔄', stats.total_permutations?.toLocaleString?.(), 'Перестановок'],
          ['✅', bestSumD, 'Мін. сума відстаней'],
          ['⚡', bestMaxD, 'Мін. макс. відстань'],
        ].map(([icon, val, label]) => (
          <div key={label} className="stat-card">
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{icon} {val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeTab === 'overview' && (
        <div className="animate-fade">
          <h2 className="section-title">📊 Результати ЛР3</h2>

          {/* Final ranking */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '16px' }}>🥇 Фінальне ранжування (Медіана Кука — сума)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
              Перестановка, що мінімізує суму відстаней Кука до всіх експертних трійок. Мін. сума = <strong style={{ color: 'var(--teal)' }}>{bestSumD}</strong>
            </p>
            {finalRanking.map((name, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0', borderBottom: idx < finalRanking.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{
                  minWidth: '36px', textAlign: 'center', fontWeight: 700,
                  fontSize: idx < 3 ? '1.3rem' : '0.95rem',
                  color: idx === 0 ? '#ffc107' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'var(--text-muted)'
                }}>{MEDAL(idx)}</div>
                <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{name}</div>
              </div>
            ))}
          </div>

          {/* Algorithm steps overview */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '16px' }}>🔎 Кроки алгоритму</h3>
            {[
              ['1', 'Вхідні дані', `${stats.n_objects} об'єктів, ${stats.n_experts} трійок`],
              ['2', 'Матриця переваг NxN', `P[i][j] = кількість голосів за i>j`],
              ['3', 'Бінарна матриця переваг', 'D[i][j]=1 if P[i][j]>P[j][i]'],
              ['4', 'Підмножина кандидатів', `≤10 об'єктів (топ ЛР1)`],
              ['5', 'Перестановки', `${stats.total_permutations?.toLocaleString?.()} перестановок`],
              ['6', 'Метрика Кука', 'd = Σ|π(oᵢ) − r_exp(oᵢ)| для кожної трійки'],
              ['7', 'Агрегація', 'sumD та maxD для кожної перестановки'],
              ['8', 'Медіани Кука', `Знайдено ${cookSumMedians.length} sum-медіан, ${cookMaxMedians.length} max-медіан`],
              ['9', 'Фінальне ранжування', 'Перша sum-медіана'],
              ['10', 'Евристики', 'Е1 (поміркована взаємність), Е2 (максимальне задоволення)'],
              ['11', 'Еволюційний алгоритм', `GA отримав fit=${gaResult.bestFit}, розрив з оптимом=${gaResult.gap}`],
              ['12', 'Масштабування', '9 конфігурацій (20/50/100 об, 10/20/30 ек)'],
            ].map(([n, title, detail]) => (
              <div key={n} className="step-item" style={{ marginBottom: '10px' }}>
                <span className="step-number">{n}</span>
                <div>
                  <strong>{title}</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.83rem' }}>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== INPUT DATA ===== */}
      {activeTab === 'input' && (
        <div className="animate-fade">
          <h2 className="section-title">📋 Вхідні дані</h2>

          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>📌 Перелік об&apos;єктів ({stats.n_objects})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {inputSummary.objects.map((name, i) => (
                <span key={i} className="badge badge-teal" style={{ fontSize: '0.85rem' }}>
                  {i + 1}. {name}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>👥 Перелік експертів ({stats.n_experts})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {inputSummary.experts.map((name, i) => (
                <span key={i} className="badge badge-purple" style={{ fontSize: '0.85rem' }}>
                  {i + 1}. {name}
                </span>
              ))}
            </div>
          </div>

          <h2 className="section-title">🗳️ Результати опитування</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Експерт</th>
                  <th>🥇 1 місце</th><th>🥈 2 місце</th><th>🥉 3 місце</th>
                </tr>
              </thead>
              <tbody>
                {inputSummary.surveyData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td><strong>{row.expert}</strong></td>
                    {[0, 1, 2].map(r => (
                      <td key={r}>
                        <span className={`badge badge-${r === 0 ? 'gold' : r === 1 ? 'purple' : 'teal'}`}>
                          {row.picks[r]?.name || '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MATRICES ===== */}
      {activeTab === 'matrix' && (
        <div className="animate-fade">
          <h2 className="section-title">🔲 Матриці переваг</h2>
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
              <strong>P[i][j]</strong> — кількість експертів, які вважають об'єкт <em>i</em> кращим за <em>j</em>.
              Колір інтенсивності показує відносну перевагу.
            </p>
            <MatrixTable
              matrix={prefMatrix}
              labels={objNames}
              title="Матриця переваг (Preference Matrix)"
              colorFn={prefColorFn}
            />
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
              <strong>D[i][j] = 1</strong> якщо P[i][j] &gt; P[j][i], інакше 0.
              <span style={{ color: 'var(--teal)', marginLeft: '8px' }}>Зелений фон</span> = домінування,{' '}
              <span style={{ color: '#cf6679' }}>червоний</span> = підпорядкування.
            </p>
            <MatrixTable
              matrix={binaryMatrix}
              labels={objNames}
              title="Бінарна матриця домінування"
              colorFn={binColorFn}
            />
          </div>
        </div>
      )}

      {/* ===== MEDIANS ===== */}
      {activeTab === 'medians' && (
        <div className="animate-fade">
          <h2 className="section-title">🏆 Медіани Кука</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '24px' }}>
            Повний перебір <strong>{stats.total_permutations?.toLocaleString?.()}</strong> перестановок.
            Медіана — перестановка, яка мінімізує відповідну функцію відстані.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Sum-median */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--teal)', marginBottom: '8px' }}>∑ Медіана за сумою</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                мін. сума відстаней = <strong style={{ color: 'var(--teal)' }}>{bestSumD}</strong> &nbsp;|&nbsp;
                знайдено {cookSumMedians.length} рішень
              </p>
              {cookSumMedians.map((ranking, ri) => (
                <div key={ri} style={{
                  marginBottom: '12px', padding: '12px',
                  background: ri === 0 ? 'rgba(3,218,198,0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: ri === 0 ? '1px solid rgba(3,218,198,0.2)' : '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {ri === 0 ? '⭐ Оптимальне рішення' : `Рішення #${ri + 1}`}
                  </div>
                  {ranking.map((name, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <span style={{ minWidth: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}.</span>
                      <span style={{ fontWeight: i < 3 ? 600 : 400 }}>{name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Max-median */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginBottom: '8px' }}>⚡ Медіана за максимумом</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                мін. максимум відстаней = <strong style={{ color: 'var(--accent)' }}>{bestMaxD}</strong> &nbsp;|&nbsp;
                знайдено {cookMaxMedians.length} рішень
              </p>
              {cookMaxMedians.map((ranking, ri) => (
                <div key={ri} style={{
                  marginBottom: '12px', padding: '12px',
                  background: ri === 0 ? 'rgba(187,134,252,0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: ri === 0 ? '1px solid rgba(187,134,252,0.2)' : '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {ri === 0 ? '⭐ Оптимальне рішення' : `Рішення #${ri + 1}`}
                  </div>
                  {ranking.map((name, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <span style={{ minWidth: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}.</span>
                      <span style={{ fontWeight: i < 3 ? 600 : 400 }}>{name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Distance formula */}
          <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent)', marginBottom: '12px' }}>📐 Формула метрики Кука</h3>
            <div style={{
              fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '14px 18px',
              borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', color: 'var(--teal)'
            }}>
              d(π, exp) = Σ |π(oᵢ) − r_exp(oᵢ)|
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
              де π(oᵢ) — позиція об&apos;єкта в перестановці, r_exp(oᵢ) — місце в трійці експерта.
              Якщо об&apos;єкт не входить у трійку експерта, штраф = n (розмір множини).
            </p>
          </div>
        </div>
      )}

      {/* ===== HEURISTICS ===== */}
      {activeTab === 'heuristics' && (
        <div className="animate-fade">
          <h2 className="section-title">🔧 Евристики E1 та E2</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* E1 */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--teal)', marginBottom: '8px' }}>Е1 — Поміркована взаємність</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Зберігає попарні порядки, за якими більшість експертів згодна.
                Ранжує об'єкти за кількістю пар, де i переважає j (бінарні перемоги).
              </p>
              {e1Ranking.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '8px 0', borderBottom: i < e1Ranking.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}>
                  <span style={{ minWidth: '28px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{MEDAL(i)}</span>
                  <span style={{ flex: 1, fontWeight: i < 3 ? 600 : 400 }}>{item.name}</span>
                  <span className="badge badge-teal">{item.wins} перемог</span>
                </div>
              ))}
            </div>

            {/* E2 */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Е2 — Максимальне задоволення</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Максимально враховує побажання всіх. Ранжує за сумою попарних угод
                (Кондорсе-скор) з матриці переваг.
              </p>
              {e2Ranking.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '8px 0', borderBottom: i < e2Ranking.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}>
                  <span style={{ minWidth: '28px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{MEDAL(i)}</span>
                  <span style={{ flex: 1, fontWeight: i < 3 ? 600 : 400 }}>{item.name}</span>
                  <span className="badge badge-purple">{item.score} балів</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent)', marginBottom: '10px' }}>📎 Порівняння з медіаною Кука</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Позиція</th><th>Медіана Кука (sum)</th><th>Е1</th><th>Е2</th></tr>
                </thead>
                <tbody>
                  {finalRanking.map((name, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-muted)' }}>{MEDAL(i)}</td>
                      <td><strong>{name}</strong></td>
                      <td style={{ color: e1Ranking[i]?.name === name ? 'var(--teal)' : 'var(--text-primary)' }}>
                        {e1Ranking[i]?.name || '—'}
                      </td>
                      <td style={{ color: e2Ranking[i]?.name === name ? 'var(--teal)' : 'var(--text-primary)' }}>
                        {e2Ranking[i]?.name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== GA ===== */}
      {activeTab === 'ga' && (
        <div className="animate-fade">
          <h2 className="section-title">🧬 Генетичний алгоритм vs Повний перебір</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--teal)', marginBottom: '12px' }}>🔭 Повний перебір</h3>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--teal)' }}>{bestSumD}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>мін. сума відстаней (оптимум)</div>
              <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {stats.total_permutations?.toLocaleString?.()} перестановок перевірено
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>🧬 Генетичний алгоритм</h3>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: gaResult.gap === 0 ? 'var(--teal)' : 'var(--accent)' }}>
                {gaResult.bestFit}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>отриманий fit</div>
              <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Розрив з оптимом: <strong style={{ color: gaResult.gap === 0 ? 'var(--teal)' : '#cf6679' }}>{gaResult.gap}</strong>
                {gaResult.gap === 0 && ' ✅ Знайдено оптимум!'}
              </div>
            </div>
          </div>

          {/* GA Ranking */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '16px' }}>Ранжування GA</h3>
            {gaResult.ranking.map((name, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 0',
                borderBottom: i < gaResult.ranking.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <span style={{ minWidth: '28px', fontWeight: 700, fontSize: i < 3 ? '1.3rem' : '0.95rem',
                  color: i === 0 ? '#ffc107' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-muted)' }}>{MEDAL(i)}</span>
                <span style={{ flex: 1, fontWeight: i < 3 ? 600 : 400 }}>{name}</span>
                {finalRanking[i] === name
                  ? <span className="badge badge-teal">≡ Кук</span>
                  : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Кук: {finalRanking[i]}</span>}
              </div>
            ))}
          </div>

          {/* GA convergence log */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '12px' }}>📈 Збіжність GA</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Генерація</th><th>Кращий Fitness</th></tr></thead>
                <tbody>
                  {gaResult.log.map((row, i) => (
                    <tr key={i}>
                      <td>{row.generation}</td>
                      <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{row.bestFitness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GA params */}
          <div className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent)', marginBottom: '12px' }}>⚙️ Параметри GA</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {[['Розмір популяції', '100'], ['Генерацій', '500'], ['Кросовер', 'PMX (Partially Matched)'],
                ['Мутація', 'Random Swap'], ['ймовірність мутації', '10%'], ['Селекція', 'Top-50%']
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                  <strong style={{ color: 'var(--teal)' }}>{v}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== SCALING ===== */}
      {activeTab === 'scaling' && (
        <div className="animate-fade">
          <h2 className="section-title">📈 Масштабування алгоритму</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '24px' }}>
            Тестування GA на випадкових даних з різними розмірами задачі.
            Для n≤10 повний перебір є реальним; при n&gt;10 застосовуємо лише GA.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Об'єктів (n)</th><th>Експертів (k)</th>
                  <th>Час (мс)</th><th>GA Fitness</th><th>Примітка</th>
                </tr>
              </thead>
              <tbody>
                {(scalingResults || []).map((row, i) => (
                  <tr key={i}>
                    <td><strong>{row.nObjects}</strong></td>
                    <td>{row.nExperts}</td>
                    <td style={{ color: row.elapsedMs < 300 ? 'var(--teal)' : row.elapsedMs < 1000 ? '#ffc107' : '#cf6679' }}>
                      {row.elapsedMs}
                    </td>
                    <td style={{ color: 'var(--accent)' }}>{row.gaBestFit}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="glass-card" style={{ padding: '20px', marginTop: '20px', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent)', marginBottom: '10px' }}>💡 Висновки</h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.8, paddingLeft: '16px' }}>
              <li>Для <strong>n≤10</strong>: повний перебір (n!) можливий, GA підтверджує оптимум.</li>
              <li>Для <strong>n=20</strong>: 20!≈2.4×10¹⁸ — повний перебір неможливий. GA дає хорошу апроксимацію.</li>
              <li>Для <strong>n≥50</strong>: лише GA та інші метаевристики є практичними.</li>
              <li>Час GA зростає поліноміально з n і k, тоді як брутфорс — факторіально.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
