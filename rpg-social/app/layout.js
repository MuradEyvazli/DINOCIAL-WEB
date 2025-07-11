// app/layout.js
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import { loadUser } from '@/lib/redux/slices/authSlice';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import LevelUpModal from '@/components/ui/LevelUpModal';

const inter = Inter({ subsets: ['latin'] });

function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Try to load user from token on app start
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return children;
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <title>Dinocial - Sosyal Medya Macerası</title>
        <meta name="description" content="RPG oyunu gibi sosyal medya deneyimi" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen antialiased`}>
        <Provider store={store}>
          <AuthInitializer>
            <AuthGuard>
              <Navbar />
              <main className="min-h-screen pt-20">
                {children}
              </main>
              <LevelUpModal />
            </AuthGuard>
          </AuthInitializer>
        </Provider>
      </body>
    </html>
  );
}