// app/global-error.js
'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                500
              </h1>
              <h2 className="text-3xl font-bold text-white mb-4">
                Global Error
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Ciddi bir sistem hatası oluştu.
              </p>
            </div>
            
            <button
              onClick={reset}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200"
            >
              Uygulamayı Yeniden Başlat
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}