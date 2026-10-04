import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Droplet,
  Utensils,
  Dumbbell,
  CheckCircle2,
  Circle,
  ArrowRight,
  RefreshCw,
  Plus,
  Info,
  Clock,
  Flame,
  ShieldCheck,
  ChevronRight,
  Smile,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DailyMealPlan, MealItem } from '../types';

const MOODS = [
  { value: 5, emoji: '😄' },
  { value: 4, emoji: '🙂' },
  { value: 3, emoji: '😐' },
  { value: 2, emoji: '😕' },
  { value: 1, emoji: '😞' },
];

export const HomeDashboard: React.FC = () => {
  const {
    user,
    todayDayOfWeek,
    todayScheduleType,
    setActiveTab,
    setQuickModal,
    openCreditModal,
    showNotification,
  } = useApp();

  const [mealPlan, setMealPlan] = useState<DailyMealPlan | null>(null);
  const [isLoadingMealPlan, setIsLoadingMealPlan] = useState(false);
  const [swappingMealType, setSwappingMealType] = useState<string | null>(null);

  // Daily Water Intake (glasses, 250ml each)
  const [waterGlasses, setWaterGlasses] = useState(4);
  const targetGlasses = 8;

  // Daily Habits state
  const [habits, setHabits] = useState({
    fruitsVeggies: true,
    movement: false,
    sugarAwareness: true,
    mindfulEating: false,
    goodSleep: true,
  });

  // Mood state
  const [moodLogs, setMoodLogs] = useState<any[]>([]);

  // Load today's meal plan and mood logs on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingMealPlan(true);
      try {
        const [planRes, moodRes] = await Promise.all([
          api.generateMealPlan({
            daysCount: 1,
            dayType: todayScheduleType,
            targetDay: todayDayOfWeek.charAt(0).toUpperCase() + todayDayOfWeek.slice(1),
          }),
          api.getMoodLogs(),
        ]);
        setMealPlan(planRes.plan);
        setMoodLogs(moodRes.moodLogs);
      } catch (err: any) {
        console.warn('Initial data fetch:', err);
      } finally {
        setIsLoadingMealPlan(false);
      }
    };
    loadData();
  }, [todayScheduleType, todayDayOfWeek]);

  const handleLogMood = async (moodValue: number) => {
    try {
      await api.logMood(moodValue);
      const res = await api.getMoodLogs();
      setMoodLogs(res.moodLogs);
      showNotification('Mood logged!', 'success');
    } catch (err) {
      showNotification('Failed to log mood', 'warning');
    }
  };

  // Simple SVG Trend Line Chart
  const renderTrendLine = () => {
    const data = moodLogs.slice(-7);
    if (data.length < 2) return null;

    const width = 200;
    const height = 40;
    const points = data.map((m, i) => `${(i / (data.length - 1)) * width},${height - ((m.mood - 1) / 4) * height}`);
    return (
      <svg width={width} height={height} className="overflow-visible">
        <path d={`M ${points.join(' L ')}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-500" />
      </svg>
    );
  };

  // Handle single meal swap
  const handleSwapMeal = async (meal: MealItem) => {
    setSwappingMealType(meal.mealType);
    try {
      const res = await api.swapMeal(meal.mealType, meal.name);
      if (mealPlan) {
        setMealPlan({
          ...mealPlan,
          meals: mealPlan.meals.map((m) => (m.mealType === meal.mealType ? res.meal : m)),
        });
      }
      showNotification(`Swapped ${meal.mealType} successfully!`, 'success');
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Swap failed', 'warning');
      }
    } finally {
      setSwappingMealType(null);
    }
  };

  const addWater = () => {
    setWaterGlasses((prev) => Math.min(prev + 1, 16));
    api.logHabit({ waterGlasses: waterGlasses + 1 }).catch(() => {});
  };

  const toggleHabit = (key: keyof typeof habits) => {
    const updated = { ...habits, [key]: !habits[key] };
    setHabits(updated);
    api.logHabit({
      fruitsVeggiesEaten: updated.fruitsVeggies,
      movementCompleted: updated.movement,
      sugarAwarenessFollowed: updated.sugarAwareness,
      mindfulEatingPracticed: updated.mindfulEating,
    }).catch(() => {});
  };

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Body stats calculation
  const heightM = (user?.heightCm || 170) / 100;
  const currentKg = user?.currentWeightKg || 70;
  const bmi = (currentKg / (heightM * heightM)).toFixed(1);
  const isMinor = user?.isMinor || user?.ageCategory === 'under_13' || user?.ageCategory === '13_17';

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100">
      {/* Welcome Banner & Today's Schedule Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold block">
            {todayDayOfWeek.toUpperCase()} SCHEDULE
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-stone-900 dark:text-white">
            {greeting}, {user?.name || 'Friend'}
          </h1>
        </div>

        {/* Schedule Mode Badge */}
        <div
          onClick={() => setQuickModal('flexible_schedule')}
          className={`cursor-pointer px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-3 ${
            todayScheduleType === 'plan'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
              : 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-300'
          }`}
        >
          <span className="text-xl">{todayScheduleType === 'plan' ? '🥗' : '🌿'}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                {todayScheduleType === 'plan' ? 'KRIVYA Plan Day' : 'Flexible Day'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </div>
            <span className="text-[11px] opacity-80 block">
              {todayScheduleType === 'plan'
                ? 'Structured meals & sugar-awareness'
                : 'Mindful freedom & portion awareness'}
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS 4-ACTION CLUSTER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. I'm Hungry */}
        <button
          type="button"
          onClick={() => setQuickModal('im_hungry')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-transform">
            🍎
          </div>
          <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-white block">
            I'm Hungry
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
            Instant smart snacks
          </span>
        </button>

        {/* 2. Sugar Cut */}
        <button
          type="button"
          onClick={() => setQuickModal('sugar_cut')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-transform">
            🍬
          </div>
          <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-white block">
            Sugar Cut
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
            Natural vs added sugar
          </span>
        </button>

        {/* 3. Smart Portion Guide */}
        <button
          type="button"
          onClick={() => setQuickModal('portion_guide')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-transform">
            🍔
          </div>
          <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-white block">
            Portion Guide
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
            What are you eating?
          </span>
        </button>

        {/* 4. Flexible Diet Schedule */}
        <button
          type="button"
          onClick={() => setQuickModal('flexible_schedule')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-transform">
            📅
          </div>
          <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-white block">
            Flexible Schedule
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
            Weekly 7-day calendar
          </span>
        </button>
      </div>

      {/* Mood Logger Widget */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Smile className="w-4 h-4 text-emerald-500" />
              How are you feeling?
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Log your wellness to see your weekly trend.
            </p>
          </div>
          {renderTrendLine() && (
            <div className="text-emerald-500/80">
              {renderTrendLine()}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => handleLogMood(m.value)}
              className="flex-1 text-2xl py-3 rounded-2xl bg-stone-50 dark:bg-stone-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-stone-200 dark:border-stone-800 transition-all cursor-pointer active:scale-95"
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* TODAY'S MEAL PLAN PREVIEW */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold font-display text-stone-900 dark:text-white">
                Today's Nutrition Plan
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {mealPlan?.theme || 'Tailored to your dietary preferences and allergens'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('meal_plan')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoadingMealPlan ? (
          <div className="py-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Loading today's fresh plan...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {mealPlan?.meals.slice(0, 3).map((meal) => (
              <div
                key={meal.id || meal.mealType}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                      {meal.mealType.replace('_', ' ')}
                    </span>
                    {meal.caloriesApprox && (
                      <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                        ~{meal.caloriesApprox} kcal
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
                    {meal.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                    {meal.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={swappingMealType === meal.mealType}
                  onClick={() => handleSwapMeal(meal)}
                  className="self-end sm:self-center px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      swappingMealType === meal.mealType ? 'animate-spin text-emerald-500' : ''
                    }`}
                  />
                  <span>Swap Meal</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DUAL WIDGETS: HYDRATION & HABITS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hydration Widget */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">Daily Hydration</h3>
            </div>
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
              {waterGlasses * 250}ml / {targetGlasses * 250}ml
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 my-2">
            <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{ width: `${Math.min((waterGlasses / targetGlasses) * 100, 100)}%` }}
              />
            </div>
            <button
              type="button"
              onClick={addWater}
              className="py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+250ml</span>
            </button>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2">
            Drinking water before meals supports healthy digestion and natural satiety.
          </p>
        </div>

        {/* Daily Healthy Habits */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">Daily Consistency</h3>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              {Object.values(habits).filter(Boolean).length}/5 Completed
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              { id: 'fruitsVeggies', label: 'Ate colorful fruits / vegetables' },
              { id: 'movement', label: 'Completed daily movement / exercise' },
              { id: 'sugarAwareness', label: 'Practiced sugar-cut awareness' },
              { id: 'mindfulEating', label: 'Mindful meal away from screens' },
            ].map((h) => {
              const checked = habits[h.id as keyof typeof habits];
              return (
                <div
                  key={h.id}
                  onClick={() => toggleHabit(h.id as any)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors"
                >
                  <span className={checked ? 'line-through text-stone-400' : 'text-stone-700 dark:text-stone-300'}>
                    {h.label}
                  </span>
                  {checked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TODAY'S EXERCISE / MOVEMENT SHORTCUT */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white rounded-3xl p-5 sm:p-6 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              Daily Movement
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold font-display">
            {user?.mobility === 'paralysis' || user?.mobility === 'wheelchair'
              ? 'Seated Mobility & Spinal Release Flow'
              : 'Gentle 15-Minute Core & Vitality Routine'}
          </h3>
          <p className="text-xs text-stone-400">
            Safe, functional movements tailored to your joints and comfort.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('exercise')}
          className="self-start sm:self-center px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>Start Workout</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* BODY ANALYSIS CARD WITH SAFETY DISCLAIMER */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm text-left">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            {isMinor ? 'Youth Nutritional Guidelines' : 'Body Metric Overview'}
          </h3>
        </div>

        {isMinor ? (
          <div className="text-xs text-stone-600 dark:text-stone-300 space-y-2">
            <p>
              Under KRIVYA Youth Safety Mode, adult BMI tables are strictly omitted. Your program emphasizes adequate energy for growth, sports performance, positive body relationship, and restorative sleep.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">Current Weight</span>
                <span className="font-mono text-base font-bold text-stone-900 dark:text-white">
                  {currentKg} kg
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">Height</span>
                <span className="font-mono text-base font-bold text-stone-900 dark:text-white">
                  {user?.heightCm} cm
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">Screening BMI</span>
                <span className="font-mono text-base font-bold text-stone-900 dark:text-white">
                  {bmi}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">Goal Direction</span>
                <span className="font-medium text-xs text-emerald-600 dark:text-emerald-400 capitalize">
                  {user?.goal || 'Maintain'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
              Notice: BMI is a general screening indicator and is not a medical diagnosis. Individual muscularity, bone structure, and mobility influence these values.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
