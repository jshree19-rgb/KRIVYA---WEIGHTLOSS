import React from 'react';
import {
  Sparkles,
  Crown,
  Moon,
  Sun,
  Eye,
  Plus,
  ShieldCheck,
  LayoutDashboard,
  ShoppingCart,
  Brain,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    user,
    wallet,
    theme,
    setTheme,
    openCreditModal,
    setQuickModal,
    activeTab,
    setActiveTab,
  } = useApp();

  const isFounder = user?.isFounder;
  const isUnlimited = wallet?.isUnlimited || isFounder;
  const creditBalance = wallet?.balance ?? 500;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 8 0 8-5 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C6 19 6 21 6 21"/></svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-stone-900 dark:text-white">
                KRIVYA
              </span>
              {isFounder && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Crown className="w-3 h-3" />
                  FOUNDER — UNLIMITED CREDITS
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 block tracking-tight -mt-0.5">
              The Ultimate Weight Loss Plan
            </span>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Dashboard shortcut for Founders */}
          {isFounder && (
            <button
              type="button"
              onClick={() => setQuickModal('admin')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
              <span>Admin Stats</span>
            </button>
          )}

          {/* Shopping List Quick Icon */}
          <button
            type="button"
            onClick={() => setActiveTab('mind')}
            title="KRIVYA MIND"
            aria-label="KRIVYA MIND"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'mind'
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setQuickModal('shopping')}
            title="Smart Shopping List"
            aria-label="Smart Shopping List"
            className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>

          {/* Credit Wallet Button */}
          <button
            type="button"
            onClick={openCreditModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              isUnlimited
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 hover:border-emerald-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="font-mono font-bold">
                {isUnlimited ? 'Unlimited' : `${creditBalance.toLocaleString()}`}
              </span>
              <span className="hidden sm:inline text-[11px] opacity-80">Credits</span>
            </div>
            {!isUnlimited && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] ml-0.5">
                <Plus className="w-2.5 h-2.5" />
              </span>
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
