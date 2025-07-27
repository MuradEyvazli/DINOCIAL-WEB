// app/error.js
'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
            500
          </h1>
          <h2 className="text-3xl font-bold text-white mb-4">
            Bir Şeyler Yanlış Gitti
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={reset}
            className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200 mr-4"
          >
            Tekrar Dene
          </button>
          
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  );
}