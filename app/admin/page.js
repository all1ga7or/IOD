'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

      if (!res.ok) {
        setError(data.error || 'Помилка входу');
        setLoading(false);
        return;
      }

      setAdminPassword(password);
      setAuthenticated(true);
      await fetchResults(password);
    } catch (err) {
      setError('Не вдалося з\'єднатися з сервером');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (pwd) => {
    try {
      const res = await fetch('/api/results', {
        headers: { 'x-admin-password': pwd || adminPassword }
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Помилка завантаження результатів');
    }
  };

  const downloadCSV = () => {
    if (!results) return;

    // Протокол
    let csv = 'Експерт,1 Місце,2 Місце,3 Місце,Дата\n';
    results.protocol.forEach(v => {
      csv += `"${v.expert_name}","${v.rank1_name}","${v.rank2_name}","${v.rank3_name}","${v.created_at}"\n`;
    });

    csv += '\n\nОб\'єкт,Бали,1 місце,2 місце,3 місце,Загальних згадувань\n';
    results.scores.forEach(s => {
      csv += `"${s.name}",${s.total_score},${s.first_place},${s.second_place},${s.third_place},${s.total_mentions}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voting_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voting_results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Login Screen ---
  if (!authenticated) {
    return (
      <div className="page-center">
        <div className="glass-card animate-scale" style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div className="brand" style={{ justifyContent: 'center' }}>
              <div className="brand-icon" style={{ background: 'var(--gradient-teal)' }}>🔐</div>
            </div>
            <h1 className="page-title">Панель Викладача</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Введіть пароль для перегляду протоколу голосування
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Пароль адміністратора</label>
              <input
                id="admin-password-input"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль..."
                required
                autoFocus
              />
            </div>
            <button
              id="admin-login-button"
              type="submit"
              className="btn btn-teal"
              disabled={loading || !password}
            >
              {loading ? '⏳ Перевірка...' : '🔓 Увійти'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => router.push('/')}
              style={{ width: 'auto' }}
            >
              ← Повернутися
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Admin Dashboard ---
  const maxScore = results?.scores?.length > 0
    ? Math.max(...results.scores.map(s => parseInt(s.total_score)))
    : 1;

  return (
    <div className="container animate-fade">
      {/* Header */}
      <div className="header-bar">
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem' }}>📊 Панель Викладача</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Протокол преференційного голосування
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => fetchResults()}
            className="btn btn-secondary btn-sm"
            title="Оновити дані"
          >
            🔄 Оновити
          </button>
          <button
            onClick={() => { setAuthenticated(false); setResults(null); setPassword(''); }}
            className="btn btn-secondary btn-sm"
          >
            🚪 Вийти
          </button>
        </div>
      </div>

      {/* Stats */}
      {results?.stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{results.stats.voted_count || 0}</div>
            <div className="stat-label">Проголосували</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{results.stats.total_experts || 0}</div>
            <div className="stat-label">Зареєстровано експертів</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{results.stats.total_votes || 0}</div>
            <div className="stat-label">Усього голосів</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">20</div>
            <div className="stat-label">Об&apos;єктів</div>
          </div>
        </div>
      )}

      {/* Download buttons */}
      <div className="download-area">
        <button onClick={downloadCSV} className="btn btn-primary btn-sm">
          📥 Завантажити CSV
        </button>
        <button onClick={downloadJSON} className="btn btn-secondary btn-sm">
          📥 Завантажити JSON
        </button>
      </div>

      {/* Ranking: aggregated scores */}
      <h2 className="section-title">🏆 Рейтинг об&apos;єктів (Ядро лідерів)</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
        Бали: 1-е місце = 3 бали, 2-е = 2, 3-є = 1. Об&apos;єкти відсортовані за загальним балом.
      </p>

      {results?.scores && results.scores.length > 0 ? (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
          {results.scores.map((s, index) => (
            <div key={s.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 0',
              borderBottom: index < results.scores.length - 1 ? '1px solid var(--border-color)' : 'none'
            }}>
              <div style={{
                minWidth: '32px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: index < 3 ? '1.3rem' : '0.9rem',
                color: index === 0 ? '#ffc107' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--text-muted)'
              }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </div>
              <div style={{ flex: '0 0 180px', fontWeight: 500 }}>
                {s.name}
              </div>
              <div className="score-bar-container" style={{ flex: 1 }}>
                <div className="score-bar">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${maxScore > 0 ? (parseInt(s.total_score) / maxScore) * 100 : 0}%`,
                      background: index < 3 ? 'var(--gradient-teal)' : 'var(--gradient-main)'
                    }}
                  />
                </div>
                <span className="score-value">{s.total_score}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                <span className="badge badge-gold">🥇{s.first_place}</span>
                <span className="badge badge-purple">🥈{s.second_place}</span>
                <span className="badge badge-teal">🥉{s.third_place}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📊</div>
          <p>Ще немає даних для відображення</p>
        </div>
      )}

      {/* Protocol: individual votes */}
      <h2 className="section-title">📋 Протокол голосування (Бюлетені)</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
        Індивідуальні множинні порівняння (МП) кожного експерта. Конфіденційна інформація.
      </p>

      {results?.protocol && results.protocol.length > 0 ? (
        <div className="table-wrap" style={{ marginBottom: '32px' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Експерт</th>
                <th>🥇 1 Місце</th>
                <th>🥈 2 Місце</th>
                <th>🥉 3 Місце</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {results.protocol.map((vote, index) => (
                <tr key={index}>
                  <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td><strong>{vote.expert_name}</strong></td>
                  <td>
                    <span className="badge badge-gold">{vote.rank1_name}</span>
                  </td>
                  <td>
                    <span className="badge badge-purple">{vote.rank2_name}</span>
                  </td>
                  <td>
                    <span className="badge badge-teal">{vote.rank3_name}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(vote.created_at).toLocaleString('uk-UA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📋</div>
          <p>Голосів ще немає. Очікуємо на експертів...</p>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '24px 0',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        Система преференційного голосування — ІОД • 20 об&apos;єктів • 20 експертів + викладач
      </div>
    </div>
  );
}
