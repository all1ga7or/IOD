'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Lab2LoginPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Помилка авторизації');
        return;
      }

      localStorage.setItem('expert', JSON.stringify(data));
      router.push('/lab2/vote');
    } catch (err) {
      setError('Не вдалося з\'єднатися з сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="glass-card animate-scale" style={{ width: '100%', maxWidth: '480px' }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="brand" style={{ justifyContent: 'center' }}>
            <div className="brand-icon" style={{ background: 'var(--gradient-teal)' }}>🔬</div>
          </div>
          <h1 className="page-title">ЛР2 — Евристичне звуження</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Проголосуйте за 3 евристики для відсіювання найменш значимих об&apos;єктів
          </p>
        </div>

        {/* Context */}
        <div style={{
          background: 'rgba(3, 218, 198, 0.06)',
          border: '1px solid rgba(3, 218, 198, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 16px',
          marginBottom: '28px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: 'var(--teal)' }}>Предметна область:</strong> культові серіали
          <br/>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            14 об&apos;єктів • 7 евристик (Е1–Е7) • Рангове голосування
          </span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ваше ім&apos;я</label>
            <input
              id="expert-name-input"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Наприклад: Джефрі Епштейн"
              required
              autoComplete="off"
              autoFocus
            />
          </div>

          <button
            id="login-button"
            type="submit"
            className="btn btn-teal"
            disabled={loading || !name.trim()}
          >
            {loading ? '⏳ Вхід...' : '🚀 Увійти та голосувати за евристики'}
          </button>
        </form>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push('/')}
            style={{ width: 'auto', padding: '8px 16px' }}
          >
            ← Меню лабораторних
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push('/lab2/results')}
            style={{ width: 'auto', padding: '8px 16px' }}
          >
            📊 Результати ЛР2
          </button>
        </div>

        <div style={{
          marginTop: '28px', paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.72rem', color: 'var(--text-muted)'
        }}>
          <span>14 об&apos;єктів • 7 евристик • 21 експерт</span>
          <span>ІОД — ЛР2</span>
        </div>
      </div>
    </div>
  );
}
