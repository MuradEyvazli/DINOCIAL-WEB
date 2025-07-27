// app/(auth)/register/page.js
'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser } from '@/lib/redux/slices/authSlice';
import { CHARACTER_CLASSES } from '@/lib/constants';
import { 
  Mail, Lock, User, Loader2, Github, Chrome,
  ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle,
  Shield, Info
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    characterClass: null,
    acceptTerms: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (!formData.email) {
          newErrors.email = 'E-posta adresi gereklidir';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Geçerli bir e-posta adresi giriniz';
        } else {
          delete newErrors.email;
        }
        break;
      
      case 'username':
        if (!formData.username) {
          newErrors.username = 'Kullanıcı adı gereklidir';
        } else if (formData.username.length < 3) {
          newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
          newErrors.username = 'Sadece harf, rakam ve alt çizgi kullanabilirsiniz';
        } else {
          delete newErrors.username;
        }
        break;
      
      case 'password':
        if (!formData.password) {
          newErrors.password = 'Şifre gereklidir';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Şifre en az 8 karakter olmalıdır';
        } else {
          delete newErrors.password;
        }
        break;
      
      case 'confirmPassword':
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      
      case 'acceptTerms':
        if (!formData.acceptTerms) {
          newErrors.acceptTerms = 'Kullanım şartlarını kabul etmelisiniz';
        } else {
          delete newErrors.acceptTerms;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep1 = () => {
    const fields = ['email', 'username', 'password', 'confirmPassword', 'acceptTerms'];
    let isValid = true;
    
    fields.forEach(field => {
      setTouched(prev => ({ ...prev, [field]: true }));
      if (!validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleCharacterSelect = (characterClass) => {
    setFormData(prev => ({ ...prev, characterClass }));
    if (errors.characterClass) {
      setErrors(prev => ({ ...prev, characterClass: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.characterClass) {
      setErrors({ characterClass: 'Bir karakter sınıfı seçmelisiniz' });
      return;
    }
    
    try {
      await dispatch(registerUser(formData)).unwrap();
      router.push('/dashboard');
    } catch (err) {
      setErrors({ submit: err.message || 'Kayıt sırasında bir hata oluştu' });
      setCurrentStep(1); // Go back to first step to show error
    }
  };

  const handleSocialLogin = (provider) => {
    // Social login implementation
    console.log(`Register with ${provider}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 1 ? 'Hesap Oluştur' : 'Karakter Seç'}
          </h1>
          <p className="text-gray-600">
            {currentStep === 1 
              ? 'Maceraya başlamak için bilgilerini gir' 
              : 'Benzersiz karakterini seç ve güçlerini keşfet'}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                  currentStep >= 1 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Bilgiler</span>
              </div>
              
              <div className={`w-16 h-0.5 transition-colors ${
                currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                  currentStep >= 2 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Karakter</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8"
              >
                <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-5">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta Adresi
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('email')}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                          touched.email && errors.email 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="ornek@email.com"
                      />
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    </div>
                    {touched.email && errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Kullanıcı Adı
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('username')}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                          touched.username && errors.username 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="kullanici_adi"
                      />
                      <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    </div>
                    {touched.username && errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Şifre
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('password')}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                          touched.password && errors.password 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="••••••••"
                      />
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Şifre Tekrar
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('confirmPassword')}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                          touched.confirmPassword && errors.confirmPassword 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="••••••••"
                      />
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div>
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                        className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        <Link href="/terms" className="text-blue-600 hover:text-blue-700">Kullanım Şartları</Link> ve{' '}
                        <Link href="/privacy" className="text-blue-600 hover:text-blue-700">Gizlilik Politikası</Link>&apos;nı 
                        kabul ediyorum
                      </span>
                    </label>
                    {touched.acceptTerms && errors.acceptTerms && (
                      <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
                    )}
                  </div>

                  {/* Error Message */}
                  {errors.submit && (
                    <motion.div 
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      {errors.submit}
                    </motion.div>
                  )}

                  {/* Continue Button */}
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Devam Et</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">veya</span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleSocialLogin('google')}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3"
                  >
                    <Chrome className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700 font-medium">Google ile Devam Et</span>
                  </button>
                  
                  <button
                    onClick={() => handleSocialLogin('github')}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3"
                  >
                    <Github className="w-5 h-5 text-gray-900" />
                    <span className="text-gray-700 font-medium">GitHub ile Devam Et</span>
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center mt-6 pt-6 border-t border-gray-200">
                  <p className="text-gray-600">
                    Zaten hesabın var mı?{' '}
                    <Link 
                      href="/login" 
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Giriş Yap
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Character Selection */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Karakter Sınıfını Seç</h3>
                  <p className="text-sm text-gray-600">Her sınıfın kendine özgü yetenekleri var</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {CHARACTER_CLASSES.map((character) => {
                    const isSelected = formData.characterClass?.id === character.id;
                    
                    return (
                      <motion.button
                        key={character.id}
                        type="button"
                        onClick={() => handleCharacterSelect(character)}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-4xl mb-2">{character.icon}</div>
                        <p className="text-sm font-medium text-gray-900">{character.name}</p>
                        
                        {isSelected && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Selected Character Details */}
                {formData.characterClass && (
                  <motion.div 
                    className="p-4 bg-gray-50 rounded-lg mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-3xl">{formData.characterClass.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{formData.characterClass.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{formData.characterClass.description}</p>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 font-medium mb-1">Özel Yetenekler:</p>
                          <div className="space-y-1">
                            {formData.characterClass.abilities.map((ability, index) => (
                              <p key={index} className="text-xs text-gray-600">• {ability}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {errors.characterClass && (
                  <motion.div 
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6 flex items-center space-x-2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Info className="w-4 h-4" />
                    <span>{errors.characterClass}</span>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Geri</span>
                  </button>
                  
                  <motion.button
                    onClick={handleSubmit}
                    disabled={isLoading || !formData.characterClass}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Oluşturuluyor...</span>
                      </>
                    ) : (
                      <>
                        <span>Macerayı Başlat</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Security Badge */}
        <motion.div 
          className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Shield className="w-4 h-4" />
          <span>256-bit SSL şifreleme ile korunmaktadır</span>
        </motion.div>
      </div>
    </div>
  );
}