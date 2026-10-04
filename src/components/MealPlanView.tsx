import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  RefreshCw,
  Clock,
  Flame,
  ShieldCheck,
  ShoppingCart,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DailyMealPlan, MealItem, WeeklySchedule } from '../types';

export const MealPlanView: React.FC = () => {
  const { user, todayScheduleType, todayDayOfWeek, openCreditModal, showNotification } = useApp();

  const [selectedDay, setSelectedDay] = useState(
    todayDayOfWeek.charAt(0).toUpperCase() + todayDayOfWeek.slice(1)
  );
  const [dayType, setDayType] = useState(todayScheduleType);
  const [plan, setPlan] = useState<DailyMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ingredients, setIngredients] = useState('');
  const [swappingMealType, setSwappingMealType] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchPlan = async (targetDay: string, forcedDayType?: 'plan' | 'flexible') => {
    setIsLoading(true);
    setAddedToCart(false);
    try {
      const dayKey = targetDay.toLowerCase() as keyof WeeklySchedule;
      const computedDayType = forcedDayType || (user?.weeklySchedule ? user.weeklySchedule[dayKey] : 'plan') || 'plan';
      setDayType(computedDayType);

      const res = await api.generateMealPlan({
        daysCount: 1,
        dayType: computedDayType,
        targetDay,
        ingredients: ingredients.split(',').map((i) => i.trim()).filter(Boolean),
        language: user?.language || 'English',
      });
      setPlan(res.plan);
      if (res.plan.meals.length > 0) {
        setExpandedMeal(res.plan.meals[0].mealType);
      }
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Failed to generate meal plan', 'warning');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan(selectedDay);
  }, [selectedDay]);

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
  };

  const handleSwap = async (meal: MealItem) => {
    setSwappingMealType(meal.mealType);
    try {
      const res = await api.swapMeal(meal.mealType, meal.name);
      if (plan) {
        setPlan({
          ...plan,
          meals: plan.meals.map((m) => (m.mealType === meal.mealType ? res.meal : m)),
        });
      }
      showNotification(`Swapped ${meal.mealType.replace('_', ' ')}!`, 'success');
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

  const handleAddAllToShoppingList = async () => {
    if (!plan) return;
    const itemsToAdd: { name: string; amount: string; category: string }[] = [];
    plan.meals.forEach((m) => {
      m.ingredients.forEach((ing) => {
        itemsToAdd.push({
          name: ing.name,
          amount: ing.amount,
          category: 'Pantry',
        });
      });
    });

    try {
      await api.addShoppingItems(itemsToAdd);
      setAddedToCart(true);
      showNotification(`Added ${itemsToAdd.length} items to your Smart Shopping List!`, 'success');
    } catch (err: any) {
      showNotification('Failed to add to shopping list', 'warning');
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
              AI Meal Planner
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Balanced recipes strictly verified against your allergies ({user?.allergies?.join(', ') || 'None'}) and diet ({user?.diet}).
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">Available Ingredients (optional, comma-separated)</label>
          <input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border-none text-sm text-stone-900 dark:text-white"
            placeholder="e.g., spinach, chicken, sweet potato"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddAllToShoppingList}
            disabled={!plan || addedToCart}
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {addedToCart ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            <span>{addedToCart ? 'Added to List' : 'Send to Shopping List'}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchPlan(selectedDay)}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate New Plan (250 Credits)</span>
          </button>
        </div>
      </div>

      {/* Days Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {daysOfWeek.map((day) => {
          const isSelected = selectedDay === day;
          const dayKey = day.toLowerCase() as keyof WeeklySchedule;
          const isPlanDay = (user?.weeklySchedule ? user.weeklySchedule[dayKey] : 'plan') === 'plan';

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayChange(day)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500 text-stone-950 font-bold shadow-sm'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300'
              }`}
            >
              <span>{isPlanDay ? '🥗' : '🌿'}</span>
              <span>{day}</span>
            </button>
          );
        })}
      </div>

      {/* Day Schedule Notice */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
          dayType === 'plan'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
            : 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-300'
        }`}
      >
        <span className="text-xl">{dayType === 'plan' ? '🥗' : '🌿'}</span>
        <div>
          <strong className="block font-semibold">
            {selectedDay} is a {dayType === 'plan' ? 'KRIVYA Plan Day' : 'Flexible Day'}
          </strong>
          <span className="opacity-90">
            {dayType === 'plan'
              ? 'Enjoy structured nutrient timing, portion balance, and sugar-cut mindfulness.'
              : 'You can enjoy foods you like while still using portion awareness and balanced choices. Never guilt or compensation.'}
          </span>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="py-16 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          <span>Formulating personalized, allergen-safe recipes...</span>
        </div>
      )}

      {/* Meal Items List */}
      {!isLoading && plan && (
        <div className="space-y-4">
          {plan.meals.map((meal) => {
            const isExpanded = expandedMeal === meal.mealType;
            return (
              <div
                key={meal.id || meal.mealType}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm transition-all"
              >
                {/* Meal Header */}
                <div
                  onClick={() => setExpandedMeal(isExpanded ? null : meal.mealType)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                        {meal.mealType.replace('_', ' ')}
                      </span>
                      {meal.caloriesApprox && (
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                          ~{meal.caloriesApprox} kcal
                        </span>
                      )}
                      {meal.proteinGramsApprox && (
                        <span className="text-xs text-stone-400 font-mono">
                          · {meal.proteinGramsApprox}g Protein
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-white">
                      {meal.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {meal.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwap(meal);
                      }}
                      disabled={swappingMealType === meal.mealType}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-emerald-500 text-xs text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          swappingMealType === meal.mealType ? 'animate-spin text-emerald-500' : ''
                        }`}
                      />
                      <span>Swap</span>
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                {/* Expanded Details: Ingredients, Preparation, Tips */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-stone-100 dark:border-stone-800/80 space-y-4 text-xs">
                    {/* Timing & Allergen Note */}
                    <div className="flex flex-wrap items-center gap-4 text-stone-500 dark:text-stone-400 pt-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Prep: {meal.prepTimeMinutes}m | Cook: {meal.cookTimeMinutes}m</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{meal.allergenFreeNotice || 'Allergens Checked'}</span>
                      </span>
                    </div>

                    {/* Ingredients List */}
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-2">
                        Ingredients ({meal.servings} serving):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {meal.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 flex justify-between"
                          >
                            <span className="text-stone-700 dark:text-stone-300">{ing.name}</span>
                            <span className="font-mono text-stone-500">{ing.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-step Instructions */}
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-2">
                        Preparation Steps:
                      </span>
                      <ol className="space-y-1.5 list-decimal list-inside text-stone-600 dark:text-stone-300">
                        {meal.instructions.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Balance Tip */}
                    {meal.balanceTip && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                        <strong className="block font-semibold">KRIVYA Balance Tip:</strong>
                        <span>{meal.balanceTip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
