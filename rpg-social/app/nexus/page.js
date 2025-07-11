'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Zap, 
  Terminal,
  Cpu,
  Database,
  Activity,
  AlertTriangle
} from 'lucide-react';

export default function NexusLoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    nexusKey: '',
    quantumCode: '',
    biometricHash: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [systemStatus, setSystemStatus] = useState('scanning');
  const [accessLevel, setAccessLevel] = useState(0);

  useEffect(() => {
    // Simulate system scanning
    const timer = setTimeout(() => {
      setSystemStatus('ready');
      setAccessLevel(1);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return credentials.nexusKey.length >= 8;
      case 2:
        return credentials.quantumCode.length >= 6;
      case 3:
        return credentials.biometricHash.length >= 12;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep()) {
      if (step < 3) {
        setStep(step + 1);
        setAccessLevel(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/nexus/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nexusKey: credentials.nexusKey,
          quantumCode: credentials.quantumCode,
          biometricHash: credentials.biometricHash,
          timestamp: Date.now(),
          clientSignature: btoa(navigator.userAgent)
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store nexus token
        localStorage.setItem('nexusToken', data.token);
        localStorage.setItem('nexusLevel', data.accessLevel);
        
        // Redirect to nexus dashboard
        router.push('/nexus/dashboard');
      } else {
        setError(data.message || 'Erişim reddedildi. Quantum anahtarları geçersiz.');
        setStep(1);
        setAccessLevel(0);
      }
    } catch (error) {
      console.error('Nexus authentication error:', error);
      setError('Sistem bağlantı hatası. Quantum köprüsü başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'NEXUS ANAHTARI';
      case 2: return 'QUANTUM KODU';
      case 3: return 'BİOMETRİK HASH';
      default: return 'SİSTEM HAZIR';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Ana güvenlik katmanını aşmak için nexus anahtarınızı girin';
      case 2: return 'Quantum şifreleme kodunuz ile kimliğinizi doğrulayın';
      case 3: return 'Son güvenlik katmanı: biometrik hash imzanız';
      default: return 'Tüm güvenlik katmanları aşıldı';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Clean Geometric Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-12 grid-rows-12 h-full">
          {Array.from({ length: 144 }, (_, i) => (
            <motion.div
              key={i}
              className="border border-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{
                duration: 3,
                delay: (i * 0.02),
                repeat: Infinity,
                repeatDelay: 5
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* System Status Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-4">
              <motion.div
                animate={{ 
                  scale: systemStatus === 'scanning' ? [1, 1.2, 1] : 1,
                  color: systemStatus === 'ready' ? '#2563eb' : '#3b82f6'
                }}
                transition={{ repeat: systemStatus === 'scanning' ? Infinity : 0, duration: 1 }}
              >
                <Cpu className="w-4 h-4" />
              </motion.div>
              <span className="text-gray-700 text-sm font-mono">
                {systemStatus === 'scanning' ? 'TARAMA...' : 'SİSTEM HAZIR'}
              </span>
            </div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-bold text-gray-900 mb-2"
            >
              NEXUS
            </motion.h1>
            <p className="text-gray-600 text-sm font-mono">
              Quantum Security Interface v2.7.3
            </p>
          </motion.div>

          {/* Access Level Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex space-x-2">
              {[1, 2, 3].map((level) => (
                <motion.div
                  key={level}
                  className={`w-3 h-3 rounded-full border-2 ${
                    accessLevel >= level 
                      ? 'bg-blue-500 border-blue-500 shadow-blue-500/30 shadow-md' 
                      : 'border-gray-300'
                  }`}
                  animate={{
                    scale: accessLevel >= level ? [1, 1.2, 1] : 1
                  }}
                  transition={{ repeat: accessLevel >= level ? Infinity : 0, duration: 2 }}
                />
              ))}
            </div>
          </div>

          {/* Login Form */}
          <motion.div
            layout
            className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Step Header */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 font-mono">
                    {getStepTitle()}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {getStepDescription()}
                  </p>
                </div>

                {/* Input Field */}
                <div className="space-y-4">
                  {step === 1 && (
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                      <input
                        type="text"
                        value={credentials.nexusKey}
                        onChange={(e) => handleInputChange('nexusKey', e.target.value)}
                        placeholder="NEXUS-XXXX-XXXX-XXXX"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                        autoFocus
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={credentials.quantumCode}
                        onChange={(e) => handleInputChange('quantumCode', e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="relative">
                      <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                      <input
                        type="text"
                        value={credentials.biometricHash}
                        onChange={(e) => handleInputChange('biometricHash', e.target.value)}
                        placeholder="SHA256-HASH-SIGNATURE"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Button */}
                <motion.button
                  onClick={handleNextStep}
                  disabled={!validateStep() || isLoading}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    validateStep() && !isLoading
                      ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  whileHover={validateStep() && !isLoading ? { scale: 1.02 } : {}}
                  whileTap={validateStep() && !isLoading ? { scale: 0.98 } : {}}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full"
                      />
                      <span>Doğrulanıyor...</span>
                    </div>
                  ) : step < 3 ? (
                    'Sonraki Katman'
                  ) : (
                    'NEXUS\'A ERİŞ'
                  )}
                </motion.button>

                {/* Security Notice */}
                <div className="text-center">
                  <p className="text-gray-600 text-xs font-mono">
                    Bu sistem quantum şifreleme ile korunmaktadır.<br />
                    Tüm erişim denemeleri kaydedilir ve izlenir.
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* System Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 text-center text-gray-600 text-xs font-mono space-y-1"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>Quantum Bridge: Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Encryption: AES-256</span>
              </div>
            </div>
            <p>Nexus Protocol © 2024 - Quantum Security Division</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}