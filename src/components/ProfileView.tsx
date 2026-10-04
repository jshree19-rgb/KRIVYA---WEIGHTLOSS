import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Crown,
  LogOut,
  Sparkles,
  Save,
  AlertTriangle,
  Heart,
  Settings,
  Bell,
  Sliders,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DietaryPreference, Goal, MobilityLevel } from '../types';

export const ProfileView: React.FC = () => {
  const {
    user,
    wallet,
    updateUserProfile,
    logout,
    openCreditModal,
    showNotification,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
  } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [diet, setDiet] = useState<DietaryPreference>(user?.diet || 'non_vegetarian');
  const [heightCm, setHeightCm] = useState(user?.heightCm || 170);
  const [currentWeightKg, setCurrentWeightKg] = useState(user?.currentWeightKg || 70);
  const [goalWeightKg, setGoalWeightKg] = useState(user?.goalWeightKg || 65);
  const [goal, setGoal] = useState<Goal>(user?.goal || 'lose');
  const [mobility, setMobility] = useState<MobilityLevel>(user?.mobility || 'none');
  const [language, setLanguage] = useState(user?.language || 'English');
  const [isSenior, setIsSenior] = useState(user?.isSenior || false);
  const [isSaving, setIsSaving] = useState(false);

  const isFounder = user?.isFounder;
  const isMinor = user?.isMinor || user?.ageCategory === 'under_13' || user?.ageCategory === '13_17';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        name,
        diet,
        heightCm,
        currentWeightKg,
        goalWeightKg: isMinor ? undefined : goalWeightKg,
        goal: isMinor ? 'maintain' : goal,
        mobility,
        language,
        isSenior,
      });
      showNotification('Profile and preferences updated!', 'success');
    } catch (err) {
      showNotification('Failed to update profile', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
            Profile & Safety Preferences
          </h1>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Manage your dietary styles, stored allergies, mobility flows, and account access.
        </p>
      </div>

      {/* Account Status Badge Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
              {name ? name.charAt(0).toUpperCase() : 'K'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  {name || 'KRIVYA Member'}
                </h2>
                {isFounder && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    FOUNDER
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-400 font-mono">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreditModal}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold cursor-pointer"
            >
              {isFounder ? 'Unlimited Credits' : `${wallet?.balance?.toLocaleString() || 500} Credits`}
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:border-red-500 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {isFounder && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 font-medium">
            FOUNDER ACCOUNT — UNLIMITED CREDITS · Exempt from credit billing and transaction charges.
          </div>
        )}
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm text-xs"
      >
        <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
          Personal Information & Dietary Preferences:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">
              Dietary Preference (Profile → Dietary Preferences)
            </label>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
            >
              <option value="vegetarian">Vegetarian (Dairy, Eggs allowed)</option>
              <option value="non_vegetarian">Non-Vegetarian (Chicken, Fish, Eggs allowed)</option>
              <option value="vegan">Vegan (100% Plant-Based)</option>
            </select>
          </div>

          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Height (cm)</label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Current Weight (kg)</label>
            <input
              type="number"
              value={currentWeightKg}
              onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
            />
          </div>

          {!isMinor && (
            <div>
              <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Goal Weight (kg)</label>
              <input
                type="number"
                value={goalWeightKg}
                onChange={(e) => setGoalWeightKg(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Preferred Language</label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Primary Goal</label>
            <select
              value={goal}
              disabled={isMinor}
              onChange={(e) => setGoal(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none disabled:opacity-60"
            >
              <option value="lose">Sustainable Fat Loss</option>
              <option value="maintain">Maintain Vitality & Energy</option>
              <option value="gain">Build Strength & Muscle</option>
            </select>
          </div>

          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Mobility & Accessibility</label>
            <select
              value={mobility}
              onChange={(e) => setMobility(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
            >
              <option value="none">No mobility limitations</option>
              <option value="wheelchair">Wheelchair user</option>
              <option value="limited">Limited mobility</option>
              <option value="paralysis">Paralysis Mode</option>
              <option value="bedbound">Bedbound / very limited movement</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSenior}
                onChange={(e) => setIsSenior(e.target.checked)}
                className="w-4 h-4 rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                Senior / Older Adult Mode (Joint comfort & balance)
              </span>
            </label>
          </div>
        </div>

        {/* Accessibility Toggles */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
          <span className="font-bold text-stone-800 dark:text-stone-200 block">
            Display Accessibility Settings:
          </span>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span>High Contrast Mode (WCAG AAA)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span>Reduced Motion</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ml-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>
      </form>

      {/* COMPREHENSIVE MEDICAL DISCLAIMER */}
      <div className="p-5 rounded-3xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 space-y-2 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>KRIVYA Health & Medical Disclaimer</span>
        </div>
        <p>
          KRIVYA provides general health and nutrition information and is not a substitute for medical advice, diagnosis, or treatment. KRIVYA must never diagnose medical conditions, promise guaranteed results, encourage dangerous dieting or eating disorders, recommend unsafe medication use or dangerous supplements, or replace professional medical care. Always consult a qualified physician or healthcare provider regarding any health condition or dietary changes.
        </p>
      </div>
    </div>
  );
};
