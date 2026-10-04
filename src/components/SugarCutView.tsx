import React, { useState } from 'react';
import {
  Sparkles,
  Droplet,
  Info,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const SugarCutView: React.FC = () => {
  const { user, openCreditModal, showNotification } = useApp();

  const [sugaryDrinksCount, setSugaryDrinksCount] = useState(1);
  const [loggedDrinks, setLoggedDrinks] = useState<string[]>(['Sweetened Iced Coffee']);
  const [customDrink, setCustomDrink] = useState('');
  const [targetCraving, setTargetCraving] = useState('Afternoon Soda');
  const [guidance, setGuidance] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const curatedSwaps = [
    {
      original: 'Commercial Soda (12 oz)',
      addedSugarGrams: '39g',
      swap: 'Chilled sparkling water with fresh crushed berries & lime wedge',
      benefit: 'Crisp carbonated satisfaction with 0g added sugar.',
    },
    {
      original: 'Flavored Fruit Yogurt',
      addedSugarGrams: '18g',
      swap: 'Plain whole Greek yogurt with sliced honeycrisp apple & cinnamon',
      benefit: 'Delivers 18g muscle-preserving protein and natural prebiotic fiber.',
    },
    {
      original: 'Bottled Sweet BBQ Sauce',
      addedSugarGrams: '14g per 2 tbsp',
      swap: 'Smoked paprika, garlic powder, Dijon mustard & apple cider vinegar',
      benefit: 'Deep smoky savory depth without corn syrup spikes.',
    },
    {
      original: 'Store-bought Granola Bar',
      addedSugarGrams: '12g',
      swap: 'Handful of raw walnuts paired with two Medjool dates',
      benefit: 'Whole food satiety with magnesium, healthy omega-3s, and zero refined cane sugar.',
    },
  ];

  const hiddenSugarWatchlist = [
    { name: 'Ketchup & Condiments', detail: 'Up to 4 grams of added sugar per single tablespoon.' },
    { name: 'Low-Fat Salad Dressings', detail: 'Fat is often substituted with cane sugar or high fructose corn syrup for mouthfeel.' },
    { name: 'Plant Milks (Flavored)', detail: 'Vanilla or chocolate oat/almond milks often carry 12-16g added cane sugar.' },
    { name: 'Breakfast Cereals & Granola', detail: 'Many "heart healthy" packaged granolas pack over 15g of added brown sugar per cup.' },
  ];

  const handleAddDrink = () => {
    if (customDrink.trim()) {
      setLoggedDrinks([...loggedDrinks, customDrink.trim()]);
      setSugaryDrinksCount((prev) => prev + 1);
      setCustomDrink('');
      showNotification('Logged sweetened beverage', 'info');
    }
  };

  const handleGetAIGuidance = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSugarCutGuidance(loggedDrinks, targetCraving);
      setGuidance(res.sugarGuidance);
      showNotification('Sugar cut strategy personalized!', 'success');
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Guidance failed', 'warning');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍬</span>
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
            Sugar Cut Dashboard
          </h1>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Practical, sustainable reduction of free & added sugars. Never fruit fear or extreme carbohydrate starvation.
        </p>
      </div>

      {/* Natural vs Added Sugar Education Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-500" />
          <span>Understanding Your Sugar Types: Whole vs Free Sugars</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
              🍏 Naturally Occurring Sugars (Enjoy Freely)
            </span>
            <p className="text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed text-[11px]">
              Found inside whole apples, berries, oranges, and plain milk. Packed with water, dietary fiber, minerals, and polyphenols that slow digestion and keep blood glucose steady.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
            <span className="font-semibold text-amber-800 dark:text-amber-300 block">
              🥤 Added & Free Sugars (Target for Reduction)
            </span>
            <p className="text-amber-900/80 dark:text-amber-200/80 leading-relaxed text-[11px]">
              Found in soft drinks, sweet teas, syrups, candies, baked goods, and condiments. Absorbed rapidly without fiber, causing energy spikes and subsequent crashes.
            </p>
          </div>
        </div>
      </div>

      {/* Sugary Drink Tracker & Weekly Habit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drink Tracker */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              Today's Sweetened Beverage Log
            </h3>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              {sugaryDrinksCount} Logged
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Cola, Sweet iced tea, Energy drink..."
              value={customDrink}
              onChange={(e) => setCustomDrink(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddDrink}
              className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          </div>

          <div className="space-y-1">
            {loggedDrinks.map((d, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 text-xs flex justify-between"
              >
                <span>{d}</span>
                <span className="text-amber-500 font-mono text-[10px]">~30g Added Sugar</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Sugar Craving Interceptor */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            Craving Something Sweet Right Now?
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Tell KRIVYA what sweet treat you are craving to get instant, delicious whole-food swaps.
          </p>

          <input
            type="text"
            placeholder="e.g. Ice cream after dinner, Milk chocolate bar, Afternoon soda"
            value={targetCraving}
            onChange={(e) => setTargetCraving(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none"
          />

          <button
            type="button"
            onClick={handleGetAIGuidance}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Generating Swap...' : 'Get Personalized Swaps (250 Credits)'}</span>
          </button>
        </div>
      </div>

      {/* AI Strategy Result */}
      {guidance && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 space-y-4 shadow-sm text-xs">
          <div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold block mb-1">
              PERSONALIZED STRATEGY
            </span>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Craving Breakdown & Swaps
            </h3>
            <p className="text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
              {guidance.cravingAnalysis}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guidance.recommendedSwaps?.map((swap: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 space-y-1.5"
              >
                <div className="flex justify-between items-start">
                  <span className="line-through text-stone-400">{swap.original}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-bold">
                    Saves {swap.sugarSavedApproxGrams}
                  </span>
                </div>
                <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{swap.swap}</span>
                </div>
                <p className="text-stone-500 text-[11px]">{swap.whyItWorks}</p>
              </div>
            ))}
          </div>

          {guidance.weeklyActionStep && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-medium">
              🎯 Weekly Focus: {guidance.weeklyActionStep}
            </div>
          )}
        </div>
      )}

      {/* CURATED SMART SWAPS LIBRARY */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-stone-900 dark:text-white font-display">
          Classic Sugar-Cut Swaps Library
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {curatedSwaps.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-500 line-through">{item.original}</span>
                <span className="text-[10px] text-red-500 font-mono font-semibold">
                  {item.addedSugarGrams} added
                </span>
              </div>
              <div className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{item.swap}</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">{item.benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HIDDEN SUGAR WATCHLIST */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3 text-xs">
        <h2 className="text-sm font-bold text-stone-900 dark:text-white font-display">
          Hidden Sugars Watchlist
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {hiddenSugarWatchlist.map((h, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800"
            >
              <strong className="block text-stone-900 dark:text-white mb-0.5">{h.name}</strong>
              <span className="text-stone-500 leading-relaxed">{h.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
