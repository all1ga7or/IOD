'use client';

import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const router = useRouter();

  const labs = [
    {
      id: 'lab1',
      icon: '🗳️',
      title: 'Лабораторна робота №1',
      subtitle: 'Преференційне голосування',
      description: 'Експертне опитування: обери 3 найкращі серіали серед множини з 20 об\'єктів. Множинні порівняння для визначення ядра лідерів.',
      details: '20 об\'єктів • 21 експерт',
      path: '/lab1',
      gradient: 'var(--gradient-main)',
      glow: 'rgba(187, 134, 252, 0.2)'
    },
    {
      id: 'lab2',
      icon: '🔬',
      title: 'Лабораторна робота №2',
      subtitle: 'Евристичне звуження підмножини',
      description: 'Голосування за евристики відсіювання: обери 3 найкращі евристики для зменшення множини об\'єктів до ≤10. Фільтрація та еволюційне ранжування.',
      details: '14 об\'єктів • 7 евристик • 21 експерт',
      path: '/lab2',
      gradient: 'var(--gradient-teal)',
      glow: 'rgba(3, 218, 198, 0.2)'
    },
    {
      id: 'lab3',
      icon: '🏆',
      title: 'Лабораторна робота №3',
      subtitle: 'Колективне ранжування об\'єктів',
      description: 'Визначення колективного рейтингу через метрику Кука: матриці переваг, медіани суми та максимуму, евристики E1/E2, генетичний алгоритм і масштабування.',
      details: '10 об\'єктів • 11 експертів ЛР1 • Метод Кука',
      path: '/lab3',
      gradient: 'linear-gradient(135deg, #f9a825 0%, #e65100 100%)',
      glow: 'rgba(249, 168, 37, 0.2)'
    },
    {
      id: 'lab4',
      icon: '🛰️',
      title: 'Лабораторна робота №4',
      subtitle: 'Розподілені обчислення компромісів',
      description: 'Декомпозиція прямого перебору, індекси задоволеності експертів та порівняльний аналіз централізованих і розподілених еволюційних алгоритмів для n>>12.',
      details: 'Декомпозиція • n>>12 • Індекси задоволеності',
      path: '/lab4',
      gradient: 'linear-gradient(135deg, #00c853 0%, #00acc1 100%)',
      glow: 'rgba(0, 200, 83, 0.2)'
    },
    {
      id: 'lab5',
      icon: '⚡',
      title: 'Лабораторна робота №5',
      subtitle: 'Характеристики систем пристроїв',
      description: 'Оцінювання підсистем за законом Амдала: визначення реальної продуктивності, аналіз завантаженості, виявлення несумісності та візуалізація графа ФП.',
      details: 'ФП=1 • Закон Амдала • Несумісність',
      path: '/lab5',
      gradient: 'linear-gradient(135deg, #ff4081 0%, #d50000 100%)',
      glow: 'rgba(255, 64, 129, 0.2)'
    },
    {
      id: 'lab6',
      icon: '🚀',
      title: 'Лабораторна робота №6',
      subtitle: 'Характеристики систем (продовження)',
      description: 'Додатковий аналіз: обчислення загальної завантаженості системи (ρ) та прискорення (S). Вирівнювання несумісностей "донизу" та "догори".',
      details: 'Прискорення S • Завантаженість ρ • ФП=1',
      path: '/lab6',
      gradient: 'linear-gradient(135deg, #651fff 0%, #3d5afe 100%)',
      glow: 'rgba(101, 31, 255, 0.2)'
    },
    {
      id: 'lab7',
      icon: '⏱️',
      title: 'Лабораторна робота №7',
      subtitle: 'Максимальне прискорення і ефективність',
      description: 'Розрахунок прискорення, ефективності та граничного прискорення за законами Амдала для алгоритму заданої ширини (s) та кількості операцій (N, n).',
      details: 'Закони Амдала • N=20 • R_max',
      path: '/lab7',
      gradient: 'linear-gradient(135deg, #ff9100 0%, #ff3d00 100%)',
      glow: 'rgba(255, 145, 0, 0.2)'
    },
    {
      id: 'lab8',
      icon: '📈',
      title: 'Лабораторна робота №8',
      subtitle: 'Аналіз вимог до кількості процесорів',
      description: 'Визначення необхідної кількості процесорів (l) для досягнення заданого прискорення S та цільового відсотку від максимально можливого прискорення S_max.',
      details: 'Обернений з-н Амдала • Аналіз S_max',
      path: '/lab8',
      gradient: 'linear-gradient(135deg, #00b0ff 0%, #00e5ff 100%)',
      glow: 'rgba(0, 176, 255, 0.2)'
    }
  ];

  return (
    <div className="page-center" style={{ flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '12px', animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{
          width: '64px', height: '64px', margin: '0 auto 16px',
          background: 'var(--gradient-main)', borderRadius: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', boxShadow: '0 8px 32px rgba(187, 134, 252, 0.3)'
        }}>📊</div>
        <h1 className="page-title" style={{ fontSize: '2.2rem' }}>Інтелектуальна обробка даних</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Оберіть лабораторну роботу для продовження
        </p>
      </div>

      {/* Lab cards */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '16px',
        width: '100%', maxWidth: '560px', animation: 'slideUp 0.5s ease-out'
      }}>
        {labs.map(lab => (
          <div
            key={lab.id}
            className="glass-card lab-menu-card"
            onClick={() => router.push(lab.path)}
            style={{
              cursor: 'pointer', padding: '28px',
              borderLeft: `4px solid transparent`,
              backgroundImage: `linear-gradient(var(--bg-card), var(--bg-card)), ${lab.gradient}`,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', top: 0, right: 0, width: '150px', height: '150px',
              background: lab.glow, borderRadius: '50%', filter: 'blur(60px)',
              transform: 'translate(40%, -40%)', pointerEvents: 'none'
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
              <div style={{
                width: '52px', height: '52px', background: lab.gradient,
                borderRadius: '14px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0,
                boxShadow: `0 4px 16px ${lab.glow}`
              }}>{lab.icon}</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{lab.title}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 500, marginBottom: '8px' }}>
                  {lab.subtitle}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                  {lab.description}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lab.details}</span>
              </div>
              <div style={{
                color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '12px',
                transition: 'var(--transition)', flexShrink: 0
              }}>→</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
        ІОД — Інтелектуальна обробка даних в розподілених інформаційних середовищах 
      </div>
    </div>
  );
}
