import React, { useState } from 'react';
import {
  Utensils,
  Sparkles,
  ShieldAlert,
  Heart,
  Scale,
  Smile,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { PortionGuideResult } from '../types';

export const SmartPortionGuideView: React.FC = () => {
  const { user, todayScheduleType, openCreditModal, showNotification } = useApp();

  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('1 standard serving');
  const [extraNotes, setExtraNotes] = useState('');
  const [portionResult, setPortionResult] = useState<PortionGuideResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const quickPicks = [
    'Pizza (2 slices)',
    'Cheeseburger & Fries',
    'Vegetable Biryani',
    'Two Samosas',
    'Chocolate Fudge Cake',
    'Fried Chicken Pieces',
    'Creamy Pasta',
    'Ice Cream Bowl',
    'Crispy Potato Chips',
    'Sugary Bubble Tea',
  ];

  const handleSelectQuickPick = (item: string) => {
    setFoodName(item);
    setQuantity('1 serving');
  };

  const handleCalculatePortion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!foodName.trim()) {
      showNotification('Please enter what you are eating', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const isFlex = todayScheduleType === 'flexible';
      const res = await api.getPortionGuide(foodName, quantity, extraNotes, isFlex);
      setPortionResult(res.portion);
      showNotification('Portion guidance calculated!', 'success');
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Calculation failed', 'warning');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left">
      {/* View Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍔</span>
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
            Smart Portion Guide
          </h1>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Enter what you're eating — pizza, biryani, burgers, desserts, or snacks. The purpose is portion mindfulness, never food shaming.
        </p>
      </div>

      {/* Non-judgmental Philosophy Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
        <Heart className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold">KRIVYA Shame-Free Standard:</strong>
          <span>
            No food is labeled "bad", "toxic", "guilty", or "forbidden". Enjoy foods you love while learning realistic portions and wholesome pairings.
          </span>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleCalculatePortion}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm"
      >
        <div>
          <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-1.5">
            What Are You Eating?
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Pepperoni pizza, 2 samosas, French fries, Dark chocolate..."
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Quick Picks */}
        <div>
          <span className="text-[11px] font-mono uppercase text-stone-400 block mb-1.5 font-semibold">
            Common Quick Picks:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPicks.map((pick) => (
              <button
                key={pick}
                type="button"
                onClick={() => handleSelectQuickPick(pick)}
                className="px-2.5 py-1 rounded-lg text-xs bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              >
                {pick}
              </button>
            ))}
          </div>
        </div>

        {/* Serving size & notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">
              Reported Quantity / Units
            </label>
            <input
              type="text"
              placeholder="e.g. 2 slices, 1 bowl, 100 grams, 1 packet"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">
              Additional Details (Brand, drink, side dish)
            </label>
            <input
              type="text"
              placeholder="e.g. Restaurant style, had with diet soda"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isLoading ? 'Analyzing Portion Balance...' : 'Get Smart Portion Guide (250 Credits)'}
          </span>
        </button>
      </form>

      {/* PORTION RESULT CARD */}
      {portionResult && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-5 shadow-sm text-xs">
          {/* Top Result Banner */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">
                PORTION SUGGESTION
              </span>
              <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
                {portionResult.foodName}
              </h2>
              <span className="text-stone-500">Input: {portionResult.enteredQuantity}</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs">
              {portionResult.suggestedPortion}
            </div>
          </div>

          {/* Flexible Day note if applicable */}
          {portionResult.isFlexibleDayNote && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300">
              <span className="font-semibold block">🌿 Flexible Day Mindfulness:</span>
              <span>{portionResult.isFlexibleDayNote}</span>
            </div>
          )}

          {/* Allergy Alert */}
          {portionResult.allergyNotice && portionResult.allergyNotice !== 'None' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">ALLERGY SAFETY NOTICE:</strong>
                <span>{portionResult.allergyNotice}</span>
              </div>
            </div>
          )}

          {/* Visual Portion Comparison Guide */}
          <div>
            <span className="font-bold text-stone-800 dark:text-stone-200 block mb-2 font-display">
              Visual Portion Spectrum:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 space-y-1">
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                  Smaller Serving
                </span>
                <span className="text-stone-700 dark:text-stone-300 block">
                  {portionResult.visualScale?.smaller || 'Light appetizer'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-1">
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 uppercase font-bold block">
                  Moderate Serving (Ideal)
                </span>
                <span className="text-stone-800 dark:text-stone-200 block font-medium">
                  {portionResult.visualScale?.moderate || 'Standard balanced meal'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 space-y-1">
                <span className="text-[10px] font-mono text-stone-500 uppercase font-bold block">
                  Larger Serving
                </span>
                <span className="text-stone-700 dark:text-stone-300 block">
                  {portionResult.visualScale?.larger || 'Hearty celebration'}
                </span>
              </div>
            </div>
          </div>

          {/* Balance It (Additions) */}
          {portionResult.balancePairings && portionResult.balancePairings.length > 0 && (
            <div>
              <span className="font-bold text-stone-800 dark:text-stone-200 block mb-2">
                🥗 Balance It with These Simple Pairings:
              </span>
              <div className="space-y-1.5">
                {portionResult.balancePairings.map((pair, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{pair}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KRIVYA Tip */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 space-y-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
              💡 KRIVYA Mindset Tip:
            </span>
            <p className="leading-relaxed">{portionResult.krivyaTip}</p>
          </div>
        </div>
      )}
    </div>
  );
};
