'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Lab2VotePage() {
  const [expert, setExpert] = useState(null);
  const [heuristics, setHeuristics] = useState([]);
  const [rank1, setRank1] = useState('');
  const [rank2, setRank2] = useState('');
  const [rank3, setRank3] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedExpert = localStorage.getItem('expert');
    if (!storedExpert) {
      router.push('/lab2');
      return;
    }
    setExpert(JSON.parse(storedExpert));

    fetch('/api/lab2/heuristics')
      .then(res => res.json())
      .then(data => {
        setHeuristics(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Не вдалося завантажити список евристик');
        setLoading(false);
      });
  }, [router]);

  const getFilteredOptions = (currentValue, ...otherValues) => {
    const selected = otherValues.filter(v => v !== '');
    return heuristics.filter(h => !selected.includes(String(h.id)) || String(h.id) === currentValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rank1 || !rank2 || !rank3) {
      setError('Оберіть евристику для кожної позиції');
      return;
    }

    if (new Set([rank1, rank2, rank3]).size < 3) {
      setError('Оберіть 3 РІЗНІ евристики!');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/lab2/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: expert.id,
          heuristicIds: [
            { id: parseInt(rank1), rank: 1 },
            { id: parseInt(rank2), rank: 2 },
            { id: parseInt(rank3), rank: 3 }
          ]
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Помилка при голосуванні');
        return;
      }

      router.push('/lab2/thanks');
    } catch (err) {
      setError('Не вдалося з\'єднатися з сервером');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <div style={{ textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔬</div>
          <p style={{ color: 'var(--text-secondary)' }}>Завантаження евристик...</p>
        </div>
      </div>
    );
  }

  const getHeuristicLabel = (id) => {
    const h = heuristics.find(x => String(x.id) === id);
    return h ? `${h.code}: ${h.description}` : '';
  };

  return (
    <div className="container animate-fade">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="page-title">ЛР2 — Голосування за евристики</h1>
        <p className="page-subtitle" style={{ marginBottom: '8px' }}>
          Оберіть 3 евристики та розставте їх за пріоритетом (1-ша = найкраща)
        </p>
        {expert && (
          <span className="badge badge-teal" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            👤 {expert.name}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{
        background: 'rgba(3, 218, 198, 0.06)',
        border: '1px solid rgba(3, 218, 198, 0.15)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px 18px',
        marginBottom: '12px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
        <span>
          З 14 об&apos;єктів потрібно звузити множину до ≤10. Оберіть 3 евристики,
          які найкраще допоможуть відфільтрувати найменш значимих претендентів.
          1-е місце — найвищий пріоритет (3 бали), 2-е — середній (2 бали), 3-є — нижчий (1 бал).
        </span>
      </div>

      {/* Heuristics reference */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--accent)', marginBottom: '14px' }}>
          📋 Перелік евристик для вибору
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {heuristics.map(h => (
            <div key={h.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}>
              <span className="badge badge-teal" style={{ flexShrink: 0, marginTop: '2px' }}>{h.code}</span>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{h.description}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{h.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="glass-card animate-slide-up">
        <form onSubmit={handleSubmit}>
          {/* Rank 1 */}
          <div className="form-group">
            <label className="form-label">
              <span className="rank-indicator">🥇 1 місце</span>
            </label>
            <select
              id="rank1-select"
              className="select"
              value={rank1}
              onChange={(e) => setRank1(e.target.value)}
              required
            >
              <option value="" disabled>Оберіть найкращу евристику...</option>
              {getFilteredOptions(rank1, rank2, rank3).map(h => (
                <option key={h.id} value={h.id}>{h.code}: {h.description}</option>
              ))}
            </select>
          </div>

          {/* Rank 2 */}
          <div className="form-group">
            <label className="form-label">
              <span className="rank-indicator">🥈 2 місце</span>
            </label>
            <select
              id="rank2-select"
              className="select"
              value={rank2}
              onChange={(e) => setRank2(e.target.value)}
              required
            >
              <option value="" disabled>Оберіть другу евристику...</option>
              {getFilteredOptions(rank2, rank1, rank3).map(h => (
                <option key={h.id} value={h.id}>{h.code}: {h.description}</option>
              ))}
            </select>
          </div>

          {/* Rank 3 */}
          <div className="form-group">
            <label className="form-label">
              <span className="rank-indicator">🥉 3 місце</span>
            </label>
            <select
              id="rank3-select"
              className="select"
              value={rank3}
              onChange={(e) => setRank3(e.target.value)}
              required
            >
              <option value="" disabled>Оберіть третю евристику...</option>
              {getFilteredOptions(rank3, rank1, rank2).map(h => (
                <option key={h.id} value={h.id}>{h.code}: {h.description}</option>
              ))}
            </select>
          </div>

          {/* Summary preview */}
          {rank1 && rank2 && rank3 && new Set([rank1, rank2, rank3]).size === 3 && (
            <div style={{
              background: 'rgba(3, 218, 198, 0.06)',
              border: '1px solid rgba(3, 218, 198, 0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '24px',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Ваш вибір:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                <span>🥇 {getHeuristicLabel(rank1)}</span>
                <span>🥈 {getHeuristicLabel(rank2)}</span>
                <span>🥉 {getHeuristicLabel(rank3)}</span>
              </div>
            </div>
          )}

          <button
            id="submit-lab2-vote"
            type="submit"
            className="btn btn-teal"
            disabled={submitting || !rank1 || !rank2 || !rank3}
          >
            {submitting ? '⏳ Зберігаємо...' : '✅ Відправити голос'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        ІОД — ЛР2
      </div>
    </div>
  );
}
