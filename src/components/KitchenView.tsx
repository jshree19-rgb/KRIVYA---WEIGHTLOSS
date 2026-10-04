import React, { useState } from 'react';
import {
  ChefHat,
  Sparkles,
  Plus,
  Clock,
  Archive,
  AlertCircle,
  ShieldCheck,
  Check,
  CookingPot,
  Flame,
  Leaf,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const KitchenView: React.FC = () => {
  const { user, openCreditModal, showNotification } = useApp();

  const [activeTab, setActiveTab] = useState<'recipe' | 'homemade_mix'>('recipe');

  // Recipe Generator State
  const [ingredients, setIngredients] = useState<string[]>([
    'Eggs',
    'Oats',
    'Spinach',
    'Olive Oil',
    'Garlic',
    'Tomatoes',
  ]);
  const [newIngredient, setNewIngredient] = useState('');
  const [mealCategory, setMealCategory] = useState('High-protein meal');
  const [maxTimeMinutes, setMaxTimeMinutes] = useState(25);
  const [useLeftovers, setUseLeftovers] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);

  // Homemade Mix State
  const [pantryItems, setPantryItems] = useState<string[]>([
    'Pumpkin Seeds',
    'Flax Seeds',
    'Rolled Oats',
    'Ground Cinnamon',
  ]);
  const [newPantryItem, setNewPantryItem] = useState('');
  const [homemadeMix, setHomemadeMix] = useState<any | null>(null);
  const [isGeneratingMix, setIsGeneratingMix] = useState(false);

  const categories = [
    'Quick meal (under 15m)',
    'High-protein meal',
    'Light meal',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Family meal',
  ];

  const addIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (name: string) => {
    setIngredients(ingredients.filter((i) => i !== name));
  };

  const addPantryItem = () => {
    if (newPantryItem.trim() && !pantryItems.includes(newPantryItem.trim())) {
      setPantryItems([...pantryItems, newPantryItem.trim()]);
      setNewPantryItem('');
    }
  };

  const removePantryItem = (name: string) => {
    setPantryItems(pantryItems.filter((i) => i !== name));
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) {
      showNotification('Please add at least 1 ingredient from your kitchen', 'warning');
      return;
    }
    setIsGeneratingRecipe(true);
    try {
      const res = await api.generateKitchenRecipes({
        ingredients,
        mealCategory,
        maxTimeMinutes,
        useLeftovers,
      });
      setRecipes(res.recipes);
      showNotification('Generated delicious kitchen recipes!', 'success');
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Recipe generation failed', 'warning');
      }
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleGenerateMix = async () => {
    if (pantryItems.length === 0) {
      showNotification('Please add available pantry seeds, nuts, or grains', 'warning');
      return;
    }
    setIsGeneratingMix(true);
    try {
      const res = await api.generateHomemadeMix(pantryItems);
      setHomemadeMix(res.mix);
      showNotification('Created wholesome homemade pantry mix!', 'success');
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Generation failed', 'warning');
      }
    } finally {
      setIsGeneratingMix(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left">
      {/* View Header */}
      <div>
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
            What's In My Kitchen?
          </h1>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Enter what you have at home. KRIVYA crafts nutrient-dense meals respecting your diet ({user?.diet}) and allergies.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('recipe')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'recipe'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          🍳 Cook with What I Have
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('homemade_mix')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'homemade_mix'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          🥣 Wholesome Homemade Mix / Powder
        </button>
      </div>

      {/* TAB 1: KITCHEN RECIPE GENERATOR */}
      {activeTab === 'recipe' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            {/* Ingredients Input */}
            <div>
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-2">
                Available Ingredients in Your Kitchen:
              </label>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Bell peppers, Tofu, Brown rice, Lentils..."
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addIngredient}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2"
                  >
                    {ing}
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing)}
                      className="text-stone-400 hover:text-red-500 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Filter Row: Category & Max Time & Leftover mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 dark:border-stone-800/80 text-xs">
              <div>
                <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Meal Type</label>
                <select
                  value={mealCategory}
                  onChange={(e) => setMealCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Max Time</label>
                <select
                  value={maxTimeMinutes}
                  onChange={(e) => setMaxTimeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none"
                >
                  <option value={15}>Under 15 minutes</option>
                  <option value={25}>Under 25 minutes</option>
                  <option value={40}>Under 40 minutes</option>
                </select>
              </div>

              <div className="flex items-center sm:justify-center pt-4 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLeftovers}
                    onChange={(e) => setUseLeftovers(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                      Leftover Saver Mode
                    </span>
                    <span className="text-[10px] text-stone-500">Prioritize using opened items</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateRecipe}
                disabled={isGeneratingRecipe}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGeneratingRecipe ? 'Formulating Custom Recipes...' : 'Generate Recipes with My Ingredients (250 Credits)'}
                </span>
              </button>
            </div>
          </div>

          {/* Generated Recipes Display */}
          {recipes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold font-display text-stone-900 dark:text-white">
                Recipes Crafted for Your Kitchen:
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 space-y-3 shadow-sm text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                        {rec.category || 'Kitchen Creation'}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 dark:text-white mt-1">
                        {rec.name}
                      </h3>
                      <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                        {rec.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-stone-500">
                      <span>⏱️ Prep: {rec.prepTimeMinutes}m</span>
                      <span>🔥 Cook: {rec.cookTimeMinutes}m</span>
                      <span>🍽️ {rec.servings} Servings</span>
                    </div>

                    {/* Ingredients */}
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-1">
                        Ingredients:
                      </span>
                      <ul className="space-y-1 text-stone-600 dark:text-stone-300 list-disc list-inside">
                        {rec.ingredients?.map((ing: any, idx: number) => (
                          <li key={idx}>
                            {ing.name} <span className="text-stone-400">({ing.amount})</span>
                            {ing.optional && <span className="text-stone-400 italic"> - optional</span>}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Instructions */}
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-1">
                        Instructions:
                      </span>
                      <ol className="space-y-1 text-stone-600 dark:text-stone-300 list-decimal list-inside">
                        {rec.instructions?.map((step: string, idx: number) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Storage Guidance */}
                    {rec.storageGuidance && (
                      <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 text-[11px] text-stone-500">
                        <Archive className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                        <span>Storage: {rec.storageGuidance}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOMEMADE FOOD MIX / POWDER */}
      {activeTab === 'homemade_mix' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm text-xs">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white font-display mb-1">
                Homemade Nutrient Sprinkle or Porridge Blend
              </h2>
              <p className="text-stone-500 dark:text-stone-400">
                Craft a wholesome topping mix from dry pantry seeds, grains, or gentle herbs.
              </p>
            </div>

            {/* Strict Safety Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
              <strong className="block font-semibold">Strict KRIVYA Transparency Protocol:</strong>
              <span>
                KRIVYA never promotes "miracle weight-loss powders", "fat burner powders", or medical cures. This feature provides delicious, nutrient-dense pantry food blends to elevate everyday meals naturally.
              </span>
            </div>

            {/* Available Pantry Items */}
            <div>
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-2">
                Available Seeds, Grains, or Spices:
              </label>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Chia seeds, Roasted chickpeas, Cardamom, Toasted oats..."
                  value={newPantryItem}
                  onChange={(e) => setNewPantryItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPantryItem();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addPantryItem}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {pantryItems.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removePantryItem(item)}
                      className="text-stone-400 hover:text-red-500 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateMix}
              disabled={isGeneratingMix}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingMix ? 'Formulating Blend...' : 'Generate Wholesome Mix (250 Credits)'}
              </span>
            </button>
          </div>

          {/* Homemade Mix Result */}
          {homemadeMix && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-sm text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                  Pantry Food Formulation
                </span>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mt-1">
                  {homemadeMix.name}
                </h3>
                <p className="text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  {homemadeMix.roleInBalancedNutrition}
                </p>
              </div>

              {/* Ingredients */}
              <div>
                <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-2">
                  Proportions:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {homemadeMix.ingredients?.map((ing: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 flex justify-between"
                    >
                      <span className="text-stone-700 dark:text-stone-300 font-medium">{ing.name}</span>
                      <span className="font-mono text-stone-500">{ing.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prep steps */}
              <div>
                <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-1">
                  Preparation & Roasting:
                </span>
                <ol className="space-y-1 list-decimal list-inside text-stone-600 dark:text-stone-300">
                  {homemadeMix.preparation?.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Serving & Storage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800">
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-0.5">
                    Serving Suggestion:
                  </span>
                  <span className="text-stone-500">{homemadeMix.servingSuggestion}</span>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800">
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-0.5">
                    Storage:
                  </span>
                  <span className="text-stone-500">{homemadeMix.storage}</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-400 italic">
                {homemadeMix.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
