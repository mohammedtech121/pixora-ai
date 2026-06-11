'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Phone, ArrowRight, Loader2, Zap, Shield, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

type AuthStep = 'phone' | 'otp';

// Country code options (most common for India-centric app)
const countryCodes = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'GB', flag: '🇬🇧' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
];

export default function AuthPage() {
  const { sendPhoneOTP, verifyPhoneOTP, signInWithGoogle, phoneAuthLoading } = useAuth();

  const [step, setStep] = useState<AuthStep>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [verificationId, setVerificationId] = useState<string>('');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Full phone number with country code
  const fullPhoneNumber = `${countryCode}${phoneNumber}`;

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const timer = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpTimer]);

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Handle OTP input change
  const handleOtpChange = useCallback((index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newOtp.every(d => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  }, [otp]);

  // Handle OTP input backspace
  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  }, [otp]);

  // Handle OTP paste
  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otpInputRefs.current[5]?.focus();
      handleVerifyOtp(pastedData);
    } else if (pastedData.length > 0) {
      const newOtp = [...otp];
      pastedData.split('').forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
    }
  }, [otp]);

  // Send OTP
  const handleSendOtp = useCallback(async () => {
    setError('');
    if (phoneNumber.length < 8) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const vId = await sendPhoneOTP(fullPhoneNumber);
      setVerificationId(vId);
      setStep('otp');
      setOtpTimer(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '']);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      if (message.includes('too-many-requests')) {
        setError('Too many OTP requests. Please wait a few minutes and try again.');
      } else if (message.includes('invalid-phone-number')) {
        setError('Invalid phone number. Please check and try again.');
      } else if (message.includes('quota-exceeded')) {
        setError('SMS quota exceeded. Please try again later or use Google sign-in.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, fullPhoneNumber, sendPhoneOTP]);

  // Verify OTP
  const handleVerifyOtp = useCallback(async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await verifyPhoneOTP(verificationId, code);
      // Success — redirect to home
      window.location.href = '/';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [otp, verificationId, verifyPhoneOTP]);

  // Resend OTP
  const handleResendOtp = useCallback(async () => {
    if (otpTimer > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const vId = await sendPhoneOTP(fullPhoneNumber);
      setVerificationId(vId);
      setOtpTimer(60);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fullPhoneNumber, otpTimer, sendPhoneOTP]);

  // Google sign-in
  const handleGoogleSignIn = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      window.location.href = '/';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      if (message.includes('popup-closed')) {
        setError('Sign-in popup was closed');
      } else {
        setError(message);
      }
      setLoading(false);
    }
  }, [signInWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030014] relative overflow-hidden">
      {/* Aurora background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px] aurora-blob-1" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/15 blur-[100px] aurora-blob-2" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[80px] aurora-blob-3" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <Sparkles className="w-8 h-8 text-violet-400 group-hover:text-violet-300 transition-colors" />
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient-text">
              Pixora.ai
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl font-bold text-white mb-2">Welcome to Pixora</h1>
                <p className="text-gray-400 text-sm mb-6">Sign in with your phone number to get 50 free credits</p>

                {/* Anti-abuse badge */}
                <div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-300">One phone number = one account. No fake accounts, no credit abuse.</span>
                </div>

                {/* Free credits badge */}
                <div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm text-amber-300 font-medium">50 free credits on signup</span>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Phone number input */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">Phone Number</label>
                    <div className="flex gap-2">
                      {/* Country code selector */}
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer min-w-[90px]"
                      >
                        {countryCodes.map((cc) => (
                          <option key={cc.code} value={cc.code} className="bg-[#0a0a1a] text-white">
                            {cc.flag} {cc.code}
                          </option>
                        ))}
                      </select>

                      {/* Phone number input */}
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setPhoneNumber(val.slice(0, 15));
                          }}
                          placeholder="Enter phone number"
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-sm"
                          autoFocus
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1.5">We&apos;ll send you a 6-digit verification code via SMS</p>
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading || phoneAuthLoading || phoneNumber.length < 8}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 btn-generate disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading || phoneAuthLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    {loading || phoneAuthLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-[1px] bg-white/[0.06]" />
                  <span className="text-xs text-gray-500">or continue with</span>
                  <div className="flex-1 h-[1px] bg-white/[0.06]" />
                </div>

                {/* Google Sign In */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] transition-all duration-200 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl font-bold text-white mb-2">Verify OTP</h1>
                <p className="text-gray-400 text-sm mb-2">
                  We sent a 6-digit code to
                </p>
                <p className="text-violet-300 text-sm font-medium mb-6">{fullPhoneNumber}</p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* OTP Input */}
                <div className="mb-6">
                  <div className="flex justify-center gap-2.5 mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 text-center text-xl font-bold text-white bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                      />
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-500">Enter the 6-digit code sent to your phone</p>
                </div>

                {/* Verify Button */}
                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otp.some(d => !d)}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 btn-generate disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                {/* Resend OTP */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  {otpTimer > 0 ? (
                    <span className="text-xs text-gray-500">
                      Resend OTP in <span className="text-violet-400 font-medium">{otpTimer}s</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Change phone number */}
                <button
                  onClick={() => {
                    setStep('phone');
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                  }}
                  className="mt-3 w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Use a different phone number
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-gray-600 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
