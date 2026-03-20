'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Lab2ResultsPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [adminPassword, setAdminPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setAdminPassword(password);
      setAuthenticated(true);
      await fetchResults(password);
    } catch { setError('Не вдалося з\'єднатися з сервером'); }
    finally { setLoading(false); }
  };

  const fetchResults = async (pwd) => {
    setLoading(true);
    try {
      const res = await fetch('/api/lab2/results', {
        headers: { 'x-admin-password': pwd || adminPassword }
      });
      const data = await res.json();
      if (res.ok) setResults(data);
      else setError(data.error);
    } catch { setError('Помилка завантаження'); }
    finally { setLoading(false); }
  };

  const downloadProtocol = (format) => {
    if (!results) return;
    let content, mime, ext;

    if (format === 'json') {
      content = JSON.stringify(results, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else {
      let csv = '\ufeff'; // BOM for Excel
      csv += 'ПРОТОКОЛ ЛАБОРАТОРНОЇ РОБОТИ №2\n';
      csv += 'Евристичне звуження підмножини об\'єктів\n\n';

      csv += '=== MOCK ДАНІ ЛР1: МНОЖИННІ ПОРІВНЯННЯ ЕКСПЕРТІВ ===\n';
      csv += 'Експерт,Об\'єкт 1 (1 місце),Об\'єкт 2 (2 місце),Об\'єкт 3 (3 місце)\n';
      results.mockVotes.forEach(v => {
        const picks = v.picks.sort((a, b) => a.rank - b.rank);
        const names = picks.map(p => {
          const obj = results.objectStats.find(o => o.id === p.objectId);
          return `"${obj?.name || p.objectId}"`;
        });
        csv += `"${v.expertName}",${names.join(',')}\n`;
      });

      csv += '\n=== СТАТИСТИКА ОБ\'ЄКТІВ ===\n';
      csv += 'Об\'єкт,Бали,1 місце,2 місце,3 місце,Згадувань\n';
      results.objectStats.forEach(s => {
        csv += `"${s.name}",${s.total_score},${s.first_place},${s.second_place},${s.third_place},${s.total_mentions}\n`;
      });

      csv += '\n=== ГОЛОСУВАННЯ ЗА ЕВРИСТИКИ (ЗВАЖЕНИЙ БАЛ) ===\n';
      csv += 'Евристика,Код,Голосів,Зважений бал,1 місце,2 місце,3 місце\n';
      results.heuristicFrequency.forEach(h => {
        csv += `"${h.description}","${h.code}",${h.vote_count},${h.weighted_score || 0},${h.first_place || 0},${h.second_place || 0},${h.third_place || 0}\n`;
      });

      csv += '\n=== ПРОТОКОЛ ГОЛОСУВАННЯ ЗА ЕВРИСТИКИ ===\n';
      csv += 'Експерт,1 місце (🥇),2 місце (🥈),3 місце (🥉),Дата\n';
      results.heuristicProtocol.forEach(p => {
        const sorted = [...p.heuristics].sort((a, b) => (a.rank || 1) - (b.rank || 1));
        const codes = sorted.map(h => typeof h === 'string' ? h : h.code);
        csv += `"${p.expert_name}","${codes[0] || ''}","${codes[1] || ''}","${codes[2] || ''}","${p.created_at}"\n`;
      });

      csv += '\n=== ЕТАПИ ФІЛЬТРАЦІЇ ===\n';
      results.filterResult.steps.forEach((step, i) => {
        csv += `\nЕтап ${i + 1}: ${step.heuristic} — ${step.description}\n`;
        csv += `До: ${step.before_count}, Видалено: ${step.eliminated.length}, Після: ${step.after_count}\n`;
        if (step.eliminated.length > 0) {
          csv += 'Видалені: ' + step.eliminated.map(e => `${e.name} (${e.reason})`).join('; ') + '\n';
        }
      });

      csv += '\n=== ФІНАЛЬНИЙ РЕЙТИНГ (Імітація відпалу) ===\n';
      csv += 'Місце,Об\'єкт,Бали,Згадувань\n';
      results.evolutionResult.ranking.forEach(r => {
        csv += `${r.rank},"${r.name}",${r.total_score},${r.total_mentions}\n`;
      });

      content = csv;
      mime = 'text/csv;charset=utf-8;';
      ext = 'csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab2_protocol.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Login screen ---
  if (!authenticated) {
    return (
      <div className="page-center">
        <div className="glass-card animate-scale" style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div className="brand" style={{ justifyContent: 'center' }}>
              <div className="brand-icon" style={{ background: 'var(--gradient-teal)' }}>🔬</div>
            </div>
            <h1 className="page-title">ЛР2 — Результати</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Введіть пароль для перегляду результатів
            </p>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password" className="input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль адміністратора..." required autoFocus
              />
            </div>
            <button type="submit" className="btn btn-teal" disabled={loading || !password}>
              {loading ? '⏳ Перевірка...' : '🔓 Увійти'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/')} style={{ width: 'auto' }}>
              ← Повернутися
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !results) {
    return (
      <div className="page-center">
        <div style={{ textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <p style={{ color: 'var(--text-secondary)' }}>Завантаження результатів...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📊 Огляд', icon: '📊' },
    { id: 'mock', label: '📋 Дані ЛР1', icon: '📋' },
    { id: 'heuristics', label: '🗳️ Голосування', icon: '🗳️' },
    { id: 'filter', label: '🔬 Фільтрація', icon: '🔬' },
    { id: 'evolution', label: '🧬 Алгоритм', icon: '🧬' },
    { id: 'protocol', label: '📥 Протокол', icon: '📥' }
  ];

  const maxObjScore = results.objectStats.length > 0
    ? Math.max(...results.objectStats.map(s => s.total_score)) : 1;

  const maxHeurScore = results.heuristicFrequency.length > 0
    ? Math.max(...results.heuristicFrequency.map(h => h.weighted_score || h.vote_count || 0)) : 1;

  return (
    <div className="container animate-fade">
      {/* Header */}
      <div className="header-bar">
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem' }}>🔬 ЛР2 — Результати</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Евристичне звуження підмножини об&apos;єктів
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => fetchResults()} className="btn btn-secondary btn-sm">🔄 Оновити</button>
          <button onClick={() => { setAuthenticated(false); setResults(null); setPassword(''); }}
            className="btn btn-secondary btn-sm">🚪 Вийти</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{results.stats.total_objects}</div>
          <div className="stat-label">Об&apos;єктів (підмножина)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{results.stats.total_lab1_experts}</div>
          <div className="stat-label">Експертів (ЛР1)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{results.stats.heuristic_voters}</div>
          <div className="stat-label">Проголосували (евр.)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{results.stats.final_objects}</div>
          <div className="stat-label">Фінальних об&apos;єктів</div>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '28px', overflowX: 'auto',
        paddingBottom: '4px', flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
          >
            {tab.id === 'mock' ? '📋 Дані ЛР1' : tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB: OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="animate-fade">
          <h2 className="section-title">📊 Загальний огляд ЛР2</h2>

          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="step-item">
                <span className="step-number">1</span>
                <div>
                  <strong>Вхідні дані:</strong> {results.stats.total_objects} об&apos;єктів (реєстр ЛР1), {results.stats.total_lab1_experts} експерт(ів), множинні порівняння (3 об&apos;єкти кожен)
                </div>
              </div>
              <div className="step-item">
                <span className="step-number">2</span>
                <div>
                  <strong>Голосування за евристики:</strong> Експерти обирають 3 евристики з рангуванням (1-ша=3б, 2-га=2б, 3-тя=1б). Проголосували: {results.stats.heuristic_voters}
                </div>
              </div>
              <div className="step-item">
                <span className="step-number">3</span>
                <div>
                  <strong>Фільтрація:</strong> Застосування топ-евристик, {results.filterResult.steps.length} етапів → {results.filterResult.finalObjects.length} об&apos;єктів
                </div>
              </div>
              <div className="step-item">
                <span className="step-number">4</span>
                <div>
                  <strong>Ранжування:</strong> Імітація відпалу (Simulated Annealing) для фінального рейтингу {results.evolutionResult.ranking.length} об&apos;єктів
                </div>
              </div>
            </div>
          </div>

          {/* Quick final ranking */}
          <h2 className="section-title">🏆 Фінальний рейтинг</h2>
          <div className="glass-card" style={{ padding: '24px' }}>
            {results.evolutionResult.ranking.map((r, idx) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0',
                borderBottom: idx < results.evolutionResult.ranking.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{
                  minWidth: '36px', textAlign: 'center', fontWeight: 700,
                  fontSize: idx < 3 ? '1.3rem' : '0.9rem',
                  color: idx === 0 ? '#ffc107' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'var(--text-muted)'
                }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </div>
                <div style={{ flex: '0 0 180px', fontWeight: 500 }}>{r.name}</div>
                <span className="score-value" style={{ flex: 1 }}>{r.total_score} балів</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB: MOCK DATA ==================== */}
      {activeTab === 'mock' && (
        <div className="animate-fade">
          <h2 className="section-title">📋 Реєстр даних ЛР1: Множинні порівняння</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
            {results.stats.total_lab1_experts} експертів, кожен обирає 3 об&apos;єкти. Ранг: 1=найкращий, 2=середній, 3=нижчий.
          </p>

          <div className="table-wrap" style={{ marginBottom: '32px' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Експерт</th>
                  <th>Об&apos;єкти (за рангом)</th>
                </tr>
              </thead>
              <tbody>
                {results.mockVotes.map((v, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td><strong>{v.expertName}</strong></td>
                    <td>
                      {v.picks.sort((a, b) => a.rank - b.rank).map((p, pi) => {
                        const obj = results.objectStats.find(o => o.id === p.objectId);
                        const badgeClass = p.rank === 1 ? 'badge-gold' : p.rank === 2 ? 'badge-purple' : 'badge-teal';
                        const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉';
                        return (
                          <span key={pi} className={`badge ${badgeClass}`} style={{ marginRight: '6px', marginBottom: '4px' }}>
                            {medal} {obj?.name || `ID:${p.objectId}`}
                          </span>
                        );
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="section-title">📊 Статистика об&apos;єктів</h2>
          <div className="glass-card" style={{ padding: '24px' }}>
            {results.objectStats.map((s, idx) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0',
                borderBottom: idx < results.objectStats.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {idx + 1}.
                </div>
                <div style={{ flex: '0 0 160px', fontWeight: 500, fontSize: '0.9rem' }}>{s.name}</div>
                <div className="score-bar-container" style={{ flex: 1 }}>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{
                      width: `${maxObjScore > 0 ? (s.total_score / maxObjScore) * 100 : 0}%`
                    }} />
                  </div>
                  <span className="score-value">{s.total_score}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', fontSize: '0.72rem' }}>
                  <span className="badge badge-gold">🥇{s.first_place}</span>
                  <span className="badge badge-purple">🥈{s.second_place}</span>
                  <span className="badge badge-teal">🥉{s.third_place}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB: HEURISTIC VOTING ==================== */}
      {activeTab === 'heuristics' && (
        <div className="animate-fade">
          <h2 className="section-title">🗳️ Результати голосування за евристики</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
            Зважений бал: 🥇1-ше місце = 3 бали, 🥈2-ге = 2, 🥉3-тє = 1. Впорядковано за спаданням.
          </p>

          <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
            {results.heuristicFrequency.map((h, idx) => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0',
                borderBottom: idx < results.heuristicFrequency.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <span className="badge badge-teal" style={{ minWidth: '40px', textAlign: 'center' }}>{h.code}</span>
                <div style={{ flex: '0 0 250px', fontSize: '0.88rem' }}>
                  {h.description}
                </div>
                <div className="score-bar-container" style={{ flex: 1 }}>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{
                      width: `${maxHeurScore > 0 ? ((h.weighted_score || 0) / maxHeurScore) * 100 : 0}%`,
                      background: 'var(--gradient-teal)'
                    }} />
                  </div>
                  <span className="score-value">{h.weighted_score || 0}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', fontSize: '0.72rem' }}>
                  <span className="badge badge-gold">🥇{h.first_place || 0}</span>
                  <span className="badge badge-purple">🥈{h.second_place || 0}</span>
                  <span className="badge badge-teal">🥉{h.third_place || 0}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Protocol */}
          {results.heuristicProtocol.length > 0 && (
            <>
              <h2 className="section-title">📋 Протокол голосування за евристики</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Експерт</th>
                      <th>🥇 1 місце</th>
                      <th>🥈 2 місце</th>
                      <th>🥉 3 місце</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.heuristicProtocol.map((p, i) => {
                      const sorted = [...p.heuristics].sort((a, b) => (a.rank || 1) - (b.rank || 1));
                      return (
                        <tr key={i}>
                          <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                          <td><strong>{p.expert_name}</strong></td>
                          <td>
                            <span className="badge badge-gold">{typeof sorted[0] === 'string' ? sorted[0] : sorted[0]?.code || '-'}</span>
                          </td>
                          <td>
                            <span className="badge badge-purple">{typeof sorted[1] === 'string' ? sorted[1] : sorted[1]?.code || '-'}</span>
                          </td>
                          <td>
                            <span className="badge badge-teal">{typeof sorted[2] === 'string' ? sorted[2] : sorted[2]?.code || '-'}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {new Date(p.created_at).toLocaleString('uk-UA')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {results.heuristicProtocol.length === 0 && (
            <div className="glass-card empty-state">
              <div className="empty-state-icon">🗳️</div>
              <p>Ще ніхто не проголосував за евристики</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: FILTERING PIPELINE ==================== */}
      {activeTab === 'filter' && (
        <div className="animate-fade">
          <h2 className="section-title">🔬 Етапи евристичної фільтрації</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '24px' }}>
            Послідовне застосування топ-евристик до множини з {results.stats.total_objects} об&apos;єктів.
            Мета: звузити до ≤10.
          </p>

          {results.filterResult.steps.map((step, idx) => (
            <div key={idx} className="glass-card animate-slide-up" style={{
              padding: '24px', marginBottom: '16px',
              borderLeft: `4px solid ${step.eliminated.length > 0 ? 'var(--accent)' : 'var(--teal)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="step-number">{idx + 1}</span>
                  <div>
                    <span className="badge badge-teal">{step.heuristic}</span>
                    <strong style={{ marginLeft: '8px' }}>{step.description}</strong>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {step.before_count} → {step.after_count}
                </div>
              </div>

              {step.eliminated.length > 0 ? (
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--accent)', marginBottom: '8px' }}>
                    ❌ Видалено {step.eliminated.length} об&apos;єктів:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {step.eliminated.map(e => (
                      <div key={e.id} style={{
                        background: 'rgba(207, 102, 121, 0.08)',
                        border: '1px solid rgba(207, 102, 121, 0.2)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span><strong>{e.name}</strong></span>
                        <span style={{ color: '#cf6679', fontSize: '0.78rem' }}>{e.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--teal)' }}>
                  ✅ Жоден об&apos;єкт не підходить під цю евристику — видалень немає
                </p>
              )}
            </div>
          ))}

          {/* Final subset */}
          <h2 className="section-title">✅ Фінальна підмножина ({results.filterResult.finalObjects.length} об&apos;єктів)</h2>
          <div className="glass-card" style={{ padding: '24px' }}>
            {results.filterResult.finalObjects.map((obj, idx) => (
              <div key={obj.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '8px 0',
                borderBottom: idx < results.filterResult.finalObjects.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700, color: 'var(--teal)' }}>{idx + 1}</span>
                <span style={{ fontWeight: 500 }}>{obj.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Бал: {obj.total_score} | Згадувань: {obj.total_mentions}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB: EVOLUTIONARY ALGORITHM ==================== */}
      {activeTab === 'evolution' && (
        <div className="animate-fade">
          <h2 className="section-title">🧬 Еволюційний алгоритм: Імітація відпалу</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
            Simulated Annealing оптимізує ранжування {results.evolutionResult.ranking.length} об&apos;єктів,
            мінімізуючи розбіжності з експертними перевагами (Kendall tau).
          </p>

          {/* Algorithm parameters */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent)', marginBottom: '12px' }}>⚙️ Параметри алгоритму</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                ['Початкова T', '100.0'],
                ['Коефіцієнт охолодження', '0.995'],
                ['Мін. T', '0.01'],
                ['Макс. ітерацій', '2000'],
                ['Операція', 'Random swap'],
                ['Fitness', 'Kendall tau']
              ].map(([label, value]) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px', fontSize: '0.85rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
                  <strong style={{ color: 'var(--teal)' }}>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Convergence log */}
          {results.evolutionResult.iterations && results.evolutionResult.iterations.length > 0 && (
            <>
              <h3 className="section-title" style={{ fontSize: '1rem' }}>📈 Збіжність алгоритму</h3>
              <div className="table-wrap" style={{ marginBottom: '24px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Ітерація</th>
                      <th>Температура</th>
                      <th>Поточний Fitness</th>
                      <th>Кращий Fitness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.evolutionResult.iterations.map((it, i) => (
                      <tr key={i}>
                        <td>{it.iteration}</td>
                        <td>{it.temperature}</td>
                        <td>{it.currentFitness}</td>
                        <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{it.bestFitness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Final ranking */}
          <h3 className="section-title" style={{ fontSize: '1rem' }}>🏆 Оптимальне ранжування</h3>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--teal)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
              Найкращий fitness (Kendall tau): {results.evolutionResult.bestFitness}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.5' }}>
              <strong>Примітка:</strong> Порядок у рейтингу визначається еволюційним алгоритмом, який максимізує узгодженість (Kendall tau) з парними порівняннями експертів. Тому об&apos;єкти з меншим загальним балом (з ЛР1) можуть займати вищі позиції, якщо вони частіше перемагали в прямих "дуелях" між собою.
            </p>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            {results.evolutionResult.ranking.map((r, idx) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0',
                borderBottom: idx < results.evolutionResult.ranking.length - 1 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{
                  minWidth: '36px', textAlign: 'center', fontWeight: 700,
                  fontSize: idx < 3 ? '1.4rem' : '1rem',
                  color: idx === 0 ? '#ffc107' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'var(--text-muted)'
                }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </div>
                <div style={{ flex: '0 0 180px', fontWeight: 600, fontSize: '1.05rem' }}>{r.name}</div>
                <div className="score-bar-container" style={{ flex: 1 }}>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{
                      width: `${maxObjScore > 0 ? (r.total_score / maxObjScore) * 100 : 0}%`,
                      background: idx < 3 ? 'var(--gradient-teal)' : 'var(--gradient-main)'
                    }} />
                  </div>
                  <span className="score-value">{r.total_score}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                  <span className="badge badge-teal">Згадувань: {r.total_mentions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB: PROTOCOL DOWNLOAD ==================== */}
      {activeTab === 'protocol' && (
        <div className="animate-fade">
          <h2 className="section-title">📥 Протокол опитування</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '24px' }}>
            Завантажте повний протокол опитування для всіх експертів.
          </p>

          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent)', marginBottom: '16px' }}>📄 Вміст протоколу</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> <span>Mock-дані ЛР1 (множинні порівняння експертів)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> <span>Статистика 14 об&apos;єктів (бали, місця, згадування)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> <span>Голосування за евристики (частота, протокол)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> <span>Етапи фільтрації (до/після, видалені об&apos;єкти)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> <span>Фінальний рейтинг (імітація відпалу)</span>
              </div>
            </div>
          </div>

          <div className="download-area">
            <button onClick={() => downloadProtocol('csv')} className="btn btn-primary btn-sm">
              📥 Завантажити CSV
            </button>
            <button onClick={() => downloadProtocol('json')} className="btn btn-secondary btn-sm">
              📥 Завантажити JSON
            </button>
          </div>

          {/* Summary table */}
          <h3 className="section-title" style={{ fontSize: '1rem' }}>📊 Зведена таблиця</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Параметр</th>
                  <th>Значення</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Кількість об\'єктів (підмножина ЛР1)', results.stats.total_objects],
                  ['Кількість експертів (mock)', results.stats.total_mock_experts],
                  ['Тип опитування', 'Відкрите, множинний вибір (2-3 об\'єкти)'],
                  ['Кількість евристик', '7 (Е1-Е5 базові + Е6, Е7 власні)'],
                  ['Проголосували за евристики', results.stats.heuristic_voters],
                  ['Етапів фільтрації', results.filterResult.steps.length],
                  ['Об\'єктів після фільтрації', results.stats.final_objects],
                  ['Алгоритм ранжування', 'Simulated Annealing (імітація відпалу)'],
                  ['Кращий fitness', results.evolutionResult.bestFitness]
                ].map(([param, value], i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{param}</td>
                    <td><strong style={{ color: 'var(--teal)' }}>{value}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '24px 0', marginTop: '24px',
        borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)'
      }}>
        ЛР2 — Евристичне звуження підмножини об&apos;єктів • ІОД • {results.stats.total_objects} → {results.stats.final_objects} об&apos;єктів
      </div>
    </div>
  );
}
