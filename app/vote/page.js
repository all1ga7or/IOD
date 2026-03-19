'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VotePage() {
  const [expert, setExpert] = useState(null);
  const [objects, setObjects] = useState([]);
  const [rank1, setRank1] = useState('');
  const [rank2, setRank2] = useState('');
  const [rank3, setRank3] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Перевірка авторизації
    const storedExpert = localStorage.getItem('expert');
    if (!storedExpert) {
      router.push('/');
      return;
    }
    setExpert(JSON.parse(storedExpert));

    // Завантаження об'єктів
    fetch('/api/objects')
      .then(res => res.json())
      .then(data => {
        setObjects(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Не вдалося завантажити список об\'єктів');
        setLoading(false);
      });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rank1 || !rank2 || !rank3) {
      setError('Оберіть об\'єкт для кожної позиції');
      return;
    }

    if (new Set([rank1, rank2, rank3]).size < 3) {
      setError('Оберіть 3 РІЗНІ об\'єкти!');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: expert.id,
          rank1: parseInt(rank1),
          rank2: parseInt(rank2),
          rank3: parseInt(rank3)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Помилка при голосуванні');
        return;
      }

      router.push('/thanks');
    } catch (err) {
      setError('Не вдалося з\'єднатися з сервером');
    } finally {
      setSubmitting(false);
    }
  };

  // Фільтрація вже обраних об'єктів
  const getFilteredOptions = (currentValue, ...otherValues) => {
    const selected = otherValues.filter(v => v !== '');
    return objects.filter(o => !selected.includes(String(o.id)) || String(o.id) === currentValue);
  };

  if (loading) {
    return (
      <div className="page-center">
        <div style={{ textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗳️</div>
          <p style={{ color: 'var(--text-secondary)' }}>Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="page-title">Преференційне голосування</h1>
        <p className="page-subtitle" style={{ marginBottom: '8px' }}>
          Оберіть 3 найкращі серіали та розставте їх за пріоритетом
        </p>
        {expert && (
          <span className="badge badge-purple" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            👤 {expert.name}
          </span>
        )}
      </div>

      {/* Info Card */}
      <div style={{
        background: 'rgba(3, 218, 198, 0.06)',
        border: '1px solid rgba(3, 218, 198, 0.15)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px 18px',
        marginBottom: '28px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
        <span>
          Виберіть рівно 3 різні об&apos;єкти. 1-е місце — найвищий пріоритет (3 бали), 
          2-е — середній (2 бали), 3-є — нижчий (1 бал). Голосування анонімне.
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="glass-card animate-slide-up">
        <form onSubmit={handleSubmit}>
          {/* Rank 1 */}
          <div className="form-group">
            <label className="form-label">
              <span className="rank-indicator">🥇 1 місце — Найвищий пріоритет</span>
            </label>
            <select
              id="rank1-select"
              className="select"
              value={rank1}
              onChange={(e) => setRank1(e.target.value)}
              required
            >
              <option value="" disabled>Оберіть найкращий серіал...</option>
              {getFilteredOptions(rank1, rank2, rank3).map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
          </div>

          {/* Rank 2 */}
          <div className="form-group">
            <label className="form-label">
              <span className="rank-indicator">🥈 2 місце — Середній пріоритет</span>
            </label>
            <select
              id="rank2-select"
              className="select"
              value={rank2}
              onChange={(e) => setRank2(e.target.value)}
              required
            >
              <option value="" disabled>Оберіть серіал...</option>
              {getFilteredOptions(rank2, rank1, rank3).map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
          </div>

          {/* Rank 3 */}
          <div className="form-group">
            <label className="form-label">
              <span className="rank-indicator">🥉 3 місце — Нижчий пріоритет</span>
            </label>
            <select
              id="rank3-select"
              className="select"
              value={rank3}
              onChange={(e) => setRank3(e.target.value)}
              required
            >
              <option value="" disabled>Оберіть серіал...</option>
              {getFilteredOptions(rank3, rank1, rank2).map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
          </div>

          {/* Summary preview */}
          {rank1 && rank2 && rank3 && new Set([rank1, rank2, rank3]).size === 3 && (
            <div style={{
              background: 'rgba(187, 134, 252, 0.06)',
              border: '1px solid rgba(187, 134, 252, 0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '24px',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Ваш вибір:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                <span>🥇 {objects.find(o => String(o.id) === rank1)?.name}</span>
                <span>🥈 {objects.find(o => String(o.id) === rank2)?.name}</span>
                <span>🥉 {objects.find(o => String(o.id) === rank3)?.name}</span>
              </div>
            </div>
          )}

          <button
            id="submit-vote-button"
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !rank1 || !rank2 || !rank3}
          >
            {submitting ? '⏳ Зберігаємо...' : '✅ Відправити голос'}
          </button>
        </form>
      </div>

      {/* Footer info */}
      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        Ваш голос є конфіденційним • Результати доступні лише викладачу
      </div>
    </div>
  );
}
