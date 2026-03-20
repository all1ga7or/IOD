import './globals.css';

export const metadata = {
  title: 'ЛР2 — Евристичне звуження підмножини об\'єктів — ІОД',
  description: 'Експертне голосування за евристики відсіювання та еволюційне ранжування об\'єктів',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
