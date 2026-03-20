'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Lab2ThanksPage() {
  const [expert, setExpert] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('expert');
    if (stored) setExpert(JSON.parse(stored));
  }, []);

  return (
    <div className="page-center">
      <div className="glass-card animate-scale" style={{ textAlign: 'center', maxWidth: '520px', width: '100%' }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: 'var(--gradient-teal)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          boxShadow: '0 8px 32px rgba(3, 218, 198, 0.25)'
        }}>
          ✅
        </div>

        <h1 className="page-title" style={{ marginBottom: '12px' }}>Дякуємо за голос!</h1>
        
        {expert && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '8px' }}>
            {expert.name}, ваш голос за евристики успішно збережено
          </p>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '32px', lineHeight: '1.6' }}>
          Результати голосування за евристики будуть використані для відсіювання найменш популярних 
          об&apos;єктів та формування фінальної підмножини (≤10 об&apos;єктів).
        </p>

        <div style={{
          background: 'rgba(3, 218, 198, 0.06)',
          border: '1px solid rgba(3, 218, 198, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          marginBottom: '28px',
          fontSize: '0.82rem',
          color: 'var(--teal)'
        }}>
          📋 Ваші дані збережено для подальшого аналізу евристик та фільтрації
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              localStorage.removeItem('expert');
              router.push('/');
            }}
            style={{ flex: 1 }}
          >
            🔙 На головну
          </button>
        </div>

        <div style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          ІОД — ЛР2
        </div>
      </div>
    </div>
  );
}
