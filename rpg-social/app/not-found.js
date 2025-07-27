// app/not-found.js
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white mb-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            Ana Sayfaya Dön
          </Link>
          
          <div className="mt-4">
            <Link 
              href="/dashboard"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Dashboard&apos;a Git
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}