'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
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

      // Зберігаємо дані експерта в localStorage
      localStorage.setItem('expert', JSON.stringify(data));

      if (data.role === 'teacher') {
        router.push('/admin');
      } else {
        router.push('/vote');
      }
    } catch (err) {
      setError('Не вдалося з\'єднатися з сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="glass-card animate-scale" style={{ width: '100%', maxWidth: '440px' }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="brand" style={{ justifyContent: 'center' }}>
            <div className="brand-icon">🗳️</div>
          </div>
          <h1 className="page-title">ЛР1 - Експертне голосування</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Обери 3 найкращі на твою думку об'єкти серед множини
          </p>
        </div>

        {/* Описание предметной области */}
        <div style={{
          background: 'rgba(187, 134, 252, 0.06)',
          border: '1px solid rgba(187, 134, 252, 0.12)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 16px',
          marginBottom: '28px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: 'var(--accent)' }}>Предметна область:</strong> культові серіали
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
              placeholder="Наприклад: Іванов Іван"
              required
              autoComplete="off"
              autoFocus
            />
          </div>

          <button
            id="login-button"
            type="submit"
            className="btn btn-primary"
            disabled={loading || !name.trim()}
          >
            {loading ? '⏳ Вхід...' : '🚀 Увійти та голосувати'}
          </button>
        </form>

        {/* Кнопка адмін-входу */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            id="admin-link"
            className="btn btn-secondary btn-sm"
            onClick={() => router.push('/admin')}
            style={{ width: 'auto', padding: '8px 20px' }}
          >
            🔐 Панель викладача
          </button>
        </div>

        {/* Meta info */}
        <div style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <span>20 об&apos;єктів • 20 експертів + викладач</span>
          <span>ІОД — ЛР1</span>
        </div>
      </div>
    </div>
  );
}
