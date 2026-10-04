import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
  Scale,
  Plus,
  Calendar,
  CheckCircle2,
  Smile,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { WeightLog, HabitLog } from '../types';

export const ProgressView: React.FC = () => {
  const { user, showNotification } = useApp();

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);

  const isMinor = user?.isMinor || user?.ageCategory === 'under_13' || user?.ageCategory === '13_17';
  const currentWeight = user?.currentWeightKg || 70;
  const goalWeight = user?.goalWeightKg || 65;

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const res = await api.getProgress();
        setWeightLogs(res.weightLogs);
        setHabitLogs(res.habitLogs);
      } catch (err) {
        console.warn('Progress load:', err);
      }
    };
    loadProgress();
  }, []);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) {
      showNotification('Please enter a valid weight in kg', 'warning');
      return;
    }

    setIsLoggingWeight(true);
    try {
      const res = await api.logWeight(Number(newWeight), newNote);
      setWeightLogs(res.logs);
      setNewWeight('');
      setNewNote('');
      showNotification('Weight logged safely!', 'success');
    } catch (err: any) {
      showNotification('Failed to log weight', 'warning');
    } finally {
      setIsLoggingWeight(false);
    }
  };

  // Difference calculations
  const weightChange = (currentWeight - goalWeight).toFixed(1);
  const isLoss = Number(weightChange) > 0;

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <LineChartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
            Progress & Consistency Hub
          </h1>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          {isMinor
            ? 'Tracking wholesome habits, restful sleep, and positive body relationship.'
            : 'Long-term sustainable progression. We discourage obsessive daily weigh-ins.'}
        </p>
      </div>

      {/* Minor Safety Mode Alert */}
      {isMinor && (
        <div className="p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-800 dark:text-cyan-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-cyan-900 dark:text-cyan-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Youth Healthy Growth Focus</span>
          </div>
          <p className="leading-relaxed">
            Your body is growing and developing natural bone and muscle density. In accordance with KRIVYA Youth Protection, progress is measured through consistent hydration, colorful nutrition, joyful play, and sleep, rather than adult scale targets.
          </p>
        </div>
      )}

      {/* ADULT STATS CARDS */}
      {!isMinor && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-stone-500 block text-[11px]">Current Weight</span>
            <span className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
              {currentWeight} kg
            </span>
            <span className="text-[10px] text-stone-400 block font-mono">Latest logged</span>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-stone-500 block text-[11px]">Target Weight</span>
            <span className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
              {goalWeight} kg
            </span>
            <span className="text-[10px] text-stone-400 block font-mono">Safe milestone</span>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-stone-500 block text-[11px]">Target Difference</span>
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {Math.abs(Number(weightChange))} kg
            </span>
            <span className="text-[10px] text-stone-400 block font-mono">
              {isLoss ? 'To target' : 'Gradual progression'}
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-stone-500 block text-[11px]">Habit Consistency</span>
            <span className="text-2xl font-bold font-mono text-amber-500">
              88%
            </span>
            <span className="text-[10px] text-stone-400 block font-mono">Weekly score</span>
          </div>
        </div>
      )}

      {/* Log Weight Form (For Adults) */}
      {!isMinor && (
        <form
          onSubmit={handleLogWeight}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">
              Record a Weight Check-in (Recommended: Once Weekly)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-stone-500 block mb-1 font-medium">Weight in Kilograms (kg)</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                required
                placeholder="e.g. 68.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-stone-500 block mb-1 font-medium">Reflection Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Feeling energetic, well hydrated"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingWeight}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Entry</span>
          </button>
        </form>
      )}

      {/* Visual Weight Trend / Bar Chart */}
      {!isMinor && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">
              Weekly Weight History
            </h3>
            <span className="text-[11px] text-stone-400 font-mono">Last 5 check-ins</span>
          </div>

          {/* Simple Visual Bar Chart */}
          <div className="space-y-2 pt-2">
            {[
              { date: 'Week 1', kg: currentWeight + 1.8 },
              { date: 'Week 2', kg: currentWeight + 1.2 },
              { date: 'Week 3', kg: currentWeight + 0.5 },
              { date: 'Week 4', kg: currentWeight },
            ].map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-16 font-mono text-stone-500 text-[11px] shrink-0">
                  {entry.date}
                </span>
                <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((entry.kg / 100) * 100, 100)}%` }}
                  />
                </div>
                <span className="w-14 text-right font-mono font-bold text-stone-900 dark:text-white shrink-0">
                  {entry.kg.toFixed(1)} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEALTHY HABIT STREAK SNAPSHOT */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-sm text-stone-900 dark:text-white">
          7-Day Healthy Habit Consistency
        </h3>
        <p className="text-stone-500 text-[11px]">
          Consistency over perfection. A flexible day or missed workout is an ordinary part of sustainable health.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { label: '💧 Hydration Goal', streak: '6 / 7 Days' },
            { label: '🥗 Whole Food Variety', streak: '7 / 7 Days' },
            { label: '🍬 Sugar-Cut Awareness', streak: '5 / 7 Days' },
            { label: '🏃 Movement Completed', streak: '5 / 7 Days' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 space-y-1"
            >
              <span className="font-semibold text-stone-800 dark:text-stone-200 block text-[11px]">
                {item.label}
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block text-sm">
                {item.streak}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
