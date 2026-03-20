import './globals.css';

export const metadata = {
  title: 'Система експертного оцінювання культових серіалів',
  description: 'Експертне голосування за найкращий серіал',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
