/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AgeVerification } from './components/AgeVerification';
import { AuthModal } from './components/AuthModal';
import { NotificationPermissionModal } from './components/NotificationPermissionModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { MealPlanView } from './components/MealPlanView';
import { KitchenView } from './components/KitchenView';
import { ExerciseView } from './components/ExerciseView';
import { ProgressView } from './components/ProgressView';
import { AICoachView } from './components/AICoachView';
import { ProfileView } from './components/ProfileView';
import { KrivyaMindDashboard } from './components/KrivyaMind/KrivyaMindDashboard';
import { KrivyaChatModal } from './components/KrivyaMind/KrivyaChatModal';
import { SmartPortionGuideView } from './components/SmartPortionGuideView';
import { SugarCutView } from './components/SugarCutView';
import { FlexibleScheduleView } from './components/FlexibleScheduleView';
import { ImHungryModal } from './components/ImHungryModal';
import { ShoppingListView } from './components/ShoppingListView';
import { WalletModal } from './components/WalletModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AgeCategory } from './types';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

function MainAppFlow() {
  const {
    user,
    isLoadingAuth,
    ageVerifiedCategory,
    setAgeVerifiedCategory,
    activeTab,
    quickModal,
    setQuickModal,
    showCreditModal,
    closeCreditModal,
    notificationBanner,
    clearNotification,
  } = useApp();

  // Step 3 flag: whether notification permission screen was presented
  const [hasPromptedNotifications, setHasPromptedNotifications] = useState(() => {
    return localStorage.getItem('krivya_notif_prompted') === 'true';
  });

  // Step 4-15 flag: onboarding wizard completed
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('krivya_onboarding_done') === 'true';
  });

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl animate-pulse mb-3">
          K
        </div>
        <span className="font-display font-bold text-lg text-white">KRIVYA</span>
        <span className="text-xs text-stone-500 mt-1 font-mono">Initializing secure health workspace...</span>
      </div>
    );
  }

  // STEP 1: Mandatory Camera Age Verification (No bypass)
  if (!ageVerifiedCategory) {
    return (
      <AgeVerification
        onVerified={(cat: AgeCategory) => {
          setAgeVerifiedCategory(cat);
        }}
      />
    );
  }

  // STEP 2: Account Login / Sign-up
  if (!user) {
    return (
      <AuthModal
        verifiedAgeCategory={ageVerifiedCategory}
        onSuccess={() => {}}
      />
    );
  }

  // STEP 3: Notification Permission Modal
  if (!hasPromptedNotifications) {
    return (
      <NotificationPermissionModal
        onComplete={() => {
          localStorage.setItem('krivya_notif_prompted', 'true');
          setHasPromptedNotifications(true);
        }}
      />
    );
  }

  // STEP 4 - 15: Personalized Safety Onboarding Wizard
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingWizard
        onCompleted={() => {
          localStorage.setItem('krivya_onboarding_done', 'true');
          setHasCompletedOnboarding(true);
        }}
      />
    );
  }

  // STEP 16: KRIVYA Master Production Application Interface
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 transition-colors">
      {/* Top Navbar */}
      <Navbar />

      {/* Global Notification Banner */}
      {notificationBanner && (
        <div
          className={`sticky top-16 z-20 px-4 py-2 text-xs font-medium flex items-center justify-between transition-all ${
            notificationBanner.type === 'success'
              ? 'bg-emerald-500 text-stone-950 font-semibold'
              : notificationBanner.type === 'warning'
              ? 'bg-amber-500 text-stone-950 font-semibold'
              : 'bg-stone-800 text-white'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-1">
            {notificationBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : notificationBanner.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span>{notificationBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={clearNotification}
            className="text-stone-950 hover:opacity-75 cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content View by Active Tab */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'meal_plan' && <MealPlanView />}
        {activeTab === 'kitchen' && <KitchenView />}
        {activeTab === 'exercise' && <ExerciseView />}
        {activeTab === 'progress' && <ProgressView />}
        {activeTab === 'ai_coach' && <AICoachView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'mind' && <KrivyaMindDashboard />}
      </main>

      {/* QUICK ACTION MODALS (From Home or Navbar) */}
      {quickModal === 'im_hungry' && (
        <ImHungryModal onClose={() => setQuickModal(null)} />
      )}

      {quickModal === 'sugar_cut' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setQuickModal(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <SugarCutView />
          </div>
        </div>
      )}

      {quickModal === 'portion_guide' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setQuickModal(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <SmartPortionGuideView />
          </div>
        </div>
      )}

      {quickModal === 'flexible_schedule' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setQuickModal(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <FlexibleScheduleView />
          </div>
        </div>
      )}

      {quickModal === 'shopping' && (
        <ShoppingListView onClose={() => setQuickModal(null)} />
      )}

      {quickModal === 'admin' && (
        <AdminDashboardView onClose={() => setQuickModal(null)} />
      )}

      {quickModal === 'krivya_chat' && (
        <KrivyaChatModal />
      )}

      {/* Credit Wallet Modal */}
      {showCreditModal && <WalletModal />}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppFlow />
    </AppProvider>
  );
}
