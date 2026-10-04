import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, Crown } from 'lucide-react';
import { api } from '../services/api';
import { AgeCategory } from '../types';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  verifiedAgeCategory: AgeCategory;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ verifiedAgeCategory, onSuccess }) => {
  const { refreshUser, showNotification } = useApp();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your email');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      if (isLogin) {
        await api.login(email);
        showNotification('Welcome back to KRIVYA!', 'success');
      } else {
        await api.register({
          email,
          name: name || undefined,
          ageCategory: verifiedAgeCategory,
          password: password || undefined,
        });
        showNotification('Account created successfully! 500 Free AI Credits granted.', 'success');
      }
      await refreshUser();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectQuickAccount = (quickEmail: string, quickName: string) => {
    setEmail(quickEmail);
    setName(quickName);
    setIsLogin(false);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/20">
      <div className="w-full max-w-md bg-stone-950/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white font-display">KRIVYA</span>
            <span className="text-xs text-emerald-400 font-mono">STEP 2 OF 16</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Age Verified</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display">
            {isLogin ? 'Log into KRIVYA' : 'Create Your Account'}
          </h1>
          <p className="text-xs text-stone-400 leading-relaxed">
            {isLogin
              ? 'Access your personalized nutrition, flexible diet schedule, and AI Coach.'
              : 'Sign up to receive 500 FREE AI Credits and your tailored wellness plan.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-medium text-stone-300">Your Name (Optional)</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Maya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-xs font-medium text-stone-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-medium text-stone-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400 text-left bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] mt-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isLogin ? 'Log In' : 'Create Account & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage('');
            }}
            className="text-xs text-emerald-400 hover:underline cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up here" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};
