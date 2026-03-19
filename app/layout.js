import './globals.css';

export const metadata = {
  title: 'Система преференційного голосування — ІОД',
  description: 'Анонімне експертне опитування для визначення ядра лідерів серед множини об\'єктів',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
