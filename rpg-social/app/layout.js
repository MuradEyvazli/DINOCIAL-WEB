// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import ClientProviders from './ClientProviders';

const inter = Inter({ subsets: ['latin'] });

// Metadata for the app
export const metadata = {
  title: 'Dinocial - Sosyal Medya Macerası',
  description: 'RPG oyunu gibi sosyal medya deneyimi',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen antialiased`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}