import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  Heart,
  Save,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DayScheduleType } from '../types';

export const FlexibleScheduleView: React.FC = () => {
  const { user, updateUserProfile, showNotification } = useApp();

  const [schedule, setSchedule] = useState({
    monday: user?.weeklySchedule?.monday || ('plan' as DayScheduleType),
    tuesday: user?.weeklySchedule?.tuesday || ('plan' as DayScheduleType),
    wednesday: user?.weeklySchedule?.wednesday || ('flexible' as DayScheduleType),
    thursday: user?.weeklySchedule?.thursday || ('plan' as DayScheduleType),
    friday: user?.weeklySchedule?.friday || ('plan' as DayScheduleType),
    saturday: user?.weeklySchedule?.saturday || ('flexible' as DayScheduleType),
    sunday: user?.weeklySchedule?.sunday || ('flexible' as DayScheduleType),
  });

  const [isSaving, setIsSaving] = useState(false);

  const days: { key: keyof typeof schedule; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const toggleDay = (key: keyof typeof schedule) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: prev[key] === 'plan' ? 'flexible' : 'plan',
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        weeklySchedule: schedule,
      });
      showNotification('Flexible Diet Schedule updated successfully!', 'success');
    } catch (err) {
      showNotification('Failed to update schedule', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left">
      {/* View Header */}
      <div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
            Flexible Diet Schedule
          </h1>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Select which days you want structured meal plans and reminders, and which days you want mindful flexibility.
        </p>
      </div>

      {/* Safety & Shame-Free Philosophy Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Heart className="w-4 h-4" />
          <span>KRIVYA Flexible Day Standard</span>
        </div>
        <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
          We never call flexible days <span className="font-semibold text-stone-900 dark:text-white">"cheat days", "bad days", "binge days", or "guilt days"</span>.
          KRIVYA strictly discourages compensatory starvation before or after flexible days. Your flexible schedule alters guidance density, while all health protections remain 100% active.
        </p>
      </div>

      {/* 7-Day Interactive Toggle Grid */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider font-mono">
            Weekly 7-Day Calendar
          </span>
          <span className="text-xs text-stone-500">Tap any day to toggle mode</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {days.map(({ key, label }) => {
            const isPlan = schedule[key] === 'plan';
            return (
              <div
                key={key}
                onClick={() => toggleDay(key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isPlan
                    ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/30 text-stone-900 dark:text-white shadow-sm'
                    : 'border-cyan-500/40 bg-cyan-50/50 dark:bg-cyan-950/30 text-stone-900 dark:text-white'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isPlan ? '🥗' : '🌿'}</span>
                    <span className="font-bold text-sm">{label}</span>
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                    {isPlan
                      ? 'Structured nutrition, portion suggestions & reminders'
                      : 'Mindful enjoyment, portion awareness, no rigid plan'}
                  </span>
                </div>

                <div
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase shrink-0 ml-2 ${
                    isPlan
                      ? 'bg-emerald-500 text-stone-950'
                      : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {isPlan ? 'PLAN DAY' : 'FLEXIBLE'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Schedule...' : 'Save Weekly Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Feature comparison table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm text-xs space-y-3">
        <h3 className="text-sm font-bold text-stone-900 dark:text-white">
          What happens on each day type:
        </h3>

        <div className="space-y-2 text-stone-600 dark:text-stone-300">
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 flex items-start gap-2">
            <span className="text-base">🥗</span>
            <div>
              <strong className="block text-stone-900 dark:text-white">KRIVYA Plan Day:</strong>
              Provides your scheduled daily 5-meal plan, hydration checks, meal reminder notifications, and structured habit check-ins.
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 flex items-start gap-2">
            <span className="text-base">🌿</span>
            <div>
              <strong className="block text-stone-900 dark:text-white">Flexible Day:</strong>
              You still enjoy complete access to Kitchen AI, Smart Portion Guide, AI Coach, and Hydration tracking, but your structured diet plan is relaxed for that day.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
