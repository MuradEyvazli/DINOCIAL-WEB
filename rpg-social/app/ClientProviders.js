// app/ClientProviders.js
'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser } from '@/lib/redux/slices/authSlice';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import LevelUpModal from '@/components/ui/LevelUpModal';

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

export default function ClientProviders({ children }) {
  return (
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
  );
}