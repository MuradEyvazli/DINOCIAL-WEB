// components/auth/AuthGuard.js
'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Routes that authenticated users shouldn't access (sadece bu sayfalar yasak)
    const restrictedForAuthUsers = ['/login', '/register'];
    
    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile', '/settings', '/guilds', '/quests', '/leaderboard', '/messages', '/map'];

    // If user is authenticated and trying to access restricted routes, redirect to dashboard
    if (isAuthenticated && restrictedForAuthUsers.includes(pathname)) {
      router.push('/dashboard');
      return;
    }

    // If user is not authenticated and trying to access protected routes, redirect to login
    if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
      router.push('/login');
      return;
    }

    // Ana sayfa (/) ve diğer public sayfalar için herhangi bir kısıtlama yok
    // Authenticated user'lar da gidebilir, anonymous user'lar da

  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          {/* Simple Logo */}
          <Image 
            src="/DinocialWhite.png" 
            alt="Logo" 
            width={80} 
            height={80} 
            priority
            className="mx-auto mb-4 rounded-full" 
          />
          
          {/* Simple Loading Dots */}
          <div className="flex justify-center space-x-1 mb-4">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2
                }}
              />
            ))}
          </div>
          
          {/* Simple Text */}
          <p className="text-slate-600 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return children;
}