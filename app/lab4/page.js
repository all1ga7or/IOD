'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ===== Helpers =====
const MEDAL = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;

function WorkerCard({ worker }) {
  return (
    <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <strong style={{ color: 'var(--accent)' }}>Ворккер #{worker.workerId}</strong>
        <span className="badge badge-teal">{worker.elapsedMs} мс</span>
      </div>
      <div style={{ fontSize: '0.82rem', marginBottom: '10px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Фіксований об'єкт: </span>
        <strong>{worker.fixedFirst}</strong>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        Найкраща сума: <strong style={{ color: 'var(--teal)' }}>{worker.bestSumD}</strong> 
        &nbsp;|&nbsp; {worker.permutations.toLocaleString()} перестановок
      </div>
    </div>
  );
}

// ===== Main Component =====
export default function Lab4ResultsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('distributed');
  const router = useRouter();

  const fetchResults = useCallback(async (pwd) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lab4/results', {
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

  if (!authenticated) {
    return (
      <div className="page-center">
        <div className="glass-card animate-scale" style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '60px', height: '60px', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #00c853 0%, #00acc1 100%)',
              borderRadius: '16px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.8rem',
              boxShadow: '0 8px 32px rgba(0,200,83,0.3)'
            }}>🌐</div>
            <h1 className="page-title">ЛР4 — Розподілені обчислення</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Декомпозиція задач та аналіз задоволеності
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
            <button type="submit" className="btn btn-primary" disabled={loading || !password} style={{ background: 'var(--gradient-teal)' }}>
              {loading ? '⏳ Обчислення...' : '📊 Запустити аналіз'}
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
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⛓️</div>
          <p style={{ color: 'var(--text-secondary)' }}>Розподілене обчислення в процесі...</p>
        </div>
      </div>
    );
  }

  const { distributedBF, chosenRanking, satisfaction, situationB, stats, matchesLab3 } = results;

  const tabs = [
    { id: 'distributed', label: '⛓️ Розподілений брутфорс' },
    { id: 'satisfaction', label: '😊 Задоволеність експертів' },
    { id: 'situationB', label: '🎲 Ситуація Б (n>>12)' }
  ];

  return (
    <div className="container animate-fade">
      <div className="header-bar">
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem' }}>🛰️ ЛР4 — Розподілені обчислення</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
            Обчислення компромісів та індекси задоволеності
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchResults()} className="btn btn-secondary btn-sm">🔄 Перерахувати</button>
          <button onClick={() => { setAuthenticated(false); setResults(null); setPassword(''); }}
            className="btn btn-secondary btn-sm">🚪 Вийти</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '28px' }}>
        {[
          ['🤖', stats.distributed_workers, "Воркерів (Node)"],
          ['🔄', stats.total_permutations?.toLocaleString(), 'Перевірено'],
          ['💯', `${stats.avg_satisfaction}%`, 'Сер. задоволеність'],
          ['⏱️', `${distributedBF.totalElapsedMs} мс`, 'Загальний час'],
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
            style={{ 
              whiteSpace: 'nowrap', 
              fontSize: '0.8rem',
              background: activeTab === t.id ? 'var(--gradient-teal)' : ''
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== DISTRIBUTED BRUTEFORCE ===== */}
      {activeTab === 'distributed' && (
        <div className="animate-fade">
          <h2 className="section-title">🔗 Декомпозиція та паралельне обчислення</h2>
          
          <div className="alert alert-info" style={{ marginBottom: '24px' }}>
            <strong>Схема декомпозиції:</strong> Весь простір перестановок <em>n!</em> розділено на <em>n</em> блоків за першим елементом. Кожен блок <em>(n-1)!</em> обробляється незалежним «воркером».
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {distributedBF.workers.map(w => <WorkerCard key={w.workerId} worker={w} />)}
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '16px' }}>🏆 Глобальний компроміс (Результат злиття)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
               <div className={`badge ${matchesLab3 ? 'badge-teal' : 'badge-error'}`}>
                 {matchesLab3 ? '✅ Валідовано: збікається з ЛР3' : '⚠️ Попередження: розбіжність з ЛР3'}
               </div>
               <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Мін. сума Кука: <strong>{distributedBF.globalBestSumD}</strong></span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem' }}>🥇 Топ рішення:</strong>
                {chosenRanking.map((name, i) => (
                  <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: '10px' }}>{i + 1}.</span> {name}
                  </div>
                ))}
              </div>
              <div style={{ opacity: 0.8 }}>
                <strong style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>🌐 Інші медіани:</strong>
                {distributedBF.globalSumMedians.slice(1).map((ranking, ri) => (
                  <div key={ri} style={{ fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    #{ri + 2}: {ranking.join(' → ')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SATISFACTION ===== */}
      {activeTab === 'satisfaction' && (
        <div className="animate-fade">
          <h2 className="section-title">😊 Рівень задоволеності експертів</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.85rem' }}>
            Індекс обчислюється як зворотна величина до відстані між індивідуальною трійкою експерта та колективним ранжуванням. 
            <code style={{ marginLeft: '10px', color: 'var(--accent)' }}>{satisfaction.formula}</code>
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Експерт</th>
                  <th>Відстань (dⱼ)</th>
                  <th>Графік</th>
                  <th>Задоволеність</th>
                </tr>
              </thead>
              <tbody>
                {satisfaction.indices.map((idx, i) => (
                  <tr key={i}>
                    <td><strong>{idx.expertName}</strong></td>
                    <td><span className="badge badge-purple">{idx.distance}</span></td>
                    <td style={{ width: '40%' }}>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${idx.satisfaction}%`, 
                          height: '100%', 
                          background: idx.satisfaction > 70 ? 'var(--teal)' : idx.satisfaction > 40 ? '#ffc107' : '#cf6679',
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: idx.satisfaction > 70 ? 'var(--teal)' : idx.satisfaction > 40 ? '#ffc107' : '#cf6679' }}>
                      {idx.satisfaction}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== SITUATION B ===== */}
      {activeTab === 'situationB' && (
        <div className="animate-fade">
          <h2 className="section-title">🎲 Ситуація Б: Велика кількість альтернатив (n &gt;&gt; 12)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.85rem' }}>
            Порівняння швидкості та якості централізованого GA проти розподіленого підходу (K вузлів).
          </p>

          <div style={{ display: 'grid', gap: '24px' }}>
            {situationB.map((sim, si) => (
              <div key={si} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>📊 Сценарій: n={sim.params.nObjects}, k={sim.params.nExperts}</h3>
                  <span className="badge badge-teal" style={{ fontSize: '1rem' }}>Прискорення: x{sim.comparison.speedup}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--accent)', marginTop: 0 }}>Централізовано</h4>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sim.comparison.centralizedTime} мс</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Best Fit: {sim.comparison.centralFit}</div>
                  </div>
                  <div style={{ background: 'rgba(3, 218, 198, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(3, 218, 198, 0.2)' }}>
                    <h4 style={{ color: 'var(--teal)', marginTop: 0 }}>Розподілено ({sim.params.workers} вузлів)</h4>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sim.comparison.distributedTime} мс</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Best Fit (Refined): {sim.comparison.distributedFit}</div>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <details>
                    <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Показати деталі збіжності та ранжування</summary>
                    <div style={{ paddingTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ fontSize: '0.75rem' }}>
                        <strong>Централізований топ-10:</strong><br/>
                        {sim.centralized.ranking.join(', ')}
                      </div>
                      <div style={{ fontSize: '0.75rem' }}>
                        <strong>Розподілений топ-10:</strong><br/>
                        {sim.distributed.refinedRanking.join(', ')}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
