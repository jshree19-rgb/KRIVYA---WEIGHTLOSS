import React, { useState } from 'react';
import { Bell, ShieldCheck, Check, Clock, Droplet, Utensils, Activity, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationPermissionModalProps {
  onComplete: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({ onComplete }) => {
  const { updateUserProfile, showNotification } = useApp();
  const [preferences, setPreferences] = useState({
    meals: true,
    hydration: true,
    exercise: true,
    habits: true,
    aiCoach: true,
    weeklyProgress: true,
  });

  const handleAllow = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          showNotification('Notifications enabled! We will keep you gently on track.', 'success');
        }
      }
      await updateUserProfile({
        notificationsEnabled: true,
        notificationPreferences: preferences,
      });
    } catch (err) {
      console.warn('Notification permission error:', err);
    } finally {
      onComplete();
    }
  };

  const handleNotNow = async () => {
    try {
      await updateUserProfile({
        notificationsEnabled: false,
      });
    } finally {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/20">
      <div className="w-full max-w-md bg-stone-950/80 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white font-display">KRIVYA</span>
            <span className="text-xs text-emerald-400 font-mono">STEP 3 OF 16</span>
          </div>
          <span className="text-xs text-stone-400">Daily Reminders</span>
        </div>

        {/* Bell Graphic */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
          <Bell className="w-8 h-8 stroke-[1.75]" />
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">
            Stay on Track with KRIVYA
          </h1>
          <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
            Allow KRIVYA to send you gentle notifications for helpful daily reminders, meal-plan updates, hydration checks, movement, and habit consistency.
          </p>
        </div>

        {/* Notification Privacy Commitment */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 mb-5 text-left text-xs text-stone-300 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Privacy & Shame-Free Guarantee</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            We never display sensitive personal numbers or body weights on lock screens. Notifications are encouraging, gentle, and private (e.g., <span className="text-stone-200 italic">"Time for a hydration check 💧"</span>).
          </p>
        </div>

        {/* Customizable Categories */}
        <div className="space-y-2 mb-6 text-left">
          <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block">
            Customize notification categories:
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.meals}
                onChange={(e) => setPreferences({ ...preferences, meals: e.target.checked })}
                className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
              />
              <Utensils className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="text-stone-200">Meals</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.hydration}
                onChange={(e) => setPreferences({ ...preferences, hydration: e.target.checked })}
                className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
              />
              <Droplet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-stone-200">Hydration</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.exercise}
                onChange={(e) => setPreferences({ ...preferences, exercise: e.target.checked })}
                className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
              />
              <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-stone-200">Movement</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.aiCoach}
                onChange={(e) => setPreferences({ ...preferences, aiCoach: e.target.checked })}
                className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
              />
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-stone-200">AI Coach</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleAllow}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            ALLOW NOTIFICATIONS
          </button>

          <button
            type="button"
            onClick={handleNotNow}
            className="w-full py-2.5 px-4 text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            NOT NOW
          </button>
        </div>
      </div>
    </div>
  );
};
