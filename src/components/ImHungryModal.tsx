import React, { useState } from 'react';
import {
  Apple,
  Sparkles,
  Clock,
  X,
  Heart,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface ImHungryModalProps {
  onClose: () => void;
}

export const ImHungryModal: React.FC<ImHungryModalProps> = ({ onClose }) => {
  const { user, todayScheduleType, openCreditModal, showNotification } = useApp();

  const [hungerLevel, setHungerLevel] = useState<'mild' | 'moderate' | 'very_hungry'>('moderate');
  const [cravingType, setCravingType] = useState('crunchy_savory');
  const [timeAvailableMinutes, setTimeAvailableMinutes] = useState(5);
  const [hungryData, setHungryData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cravingOptions = [
    { id: 'crunchy_savory', label: 'Crunchy & Savory' },
    { id: 'warm_comforting', label: 'Warm & Comforting' },
    { id: 'sweet_refreshing', label: 'Sweet & Refreshing (Natural)' },
    { id: 'protein_rich', label: 'High Protein Satiety' },
  ];

  const handleGetSnack = async () => {
    setIsLoading(true);
    try {
      const res = await api.getImHungryRecommendation(hungerLevel, cravingType, timeAvailableMinutes);
      setHungryData(res.hungryGuide);
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Recommendation failed', 'warning');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-stone-900 dark:text-stone-100 text-left my-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍎</span>
            <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
              I'm Hungry
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety banner: never suppress genuine hunger */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2">
          <Heart className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">KRIVYA Body Trust Protocol:</strong>
            <span>
              Never suppress true physical hunger. Nourishing your body with wholesome protein, fiber, or healthy fats keeps metabolism active and stops later binge cycles.
            </span>
          </div>
        </div>

        {/* Hunger level & Time input */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5">
              How hungry do you feel?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mild', label: 'Mild (Light Nibble)' },
                { id: 'moderate', label: 'Moderate (Standard Snack)' },
                { id: 'very_hungry', label: 'Very Hungry (Mini Meal)' },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHungerLevel(h.id as any)}
                  className={`p-2.5 rounded-xl border text-center font-medium cursor-pointer transition-all ${
                    hungerLevel === h.id
                      ? 'border-emerald-500 bg-emerald-500 text-stone-950 font-bold'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5">
              What texture or flavor are you craving?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cravingOptions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCravingType(c.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    cravingType === c.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5">
              Prep Time Available: <span className="text-emerald-600 font-mono">{timeAvailableMinutes} min</span>
            </label>
            <div className="flex gap-2">
              {[2, 5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTimeAvailableMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-semibold cursor-pointer ${
                    timeAvailableMinutes === mins
                      ? 'bg-emerald-500 text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetSnack}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Finding Best Nourishment...' : 'Get Instant Food Options (250 Credits)'}</span>
          </button>
        </div>

        {/* Results */}
        {hungryData && (
          <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">
              Nourishing Options Ready in Under {timeAvailableMinutes} Minutes:
            </h3>

            <div className="space-y-2.5">
              {hungryData.options?.map((opt: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                      {opt.name}
                    </h4>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {opt.prepTime}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300">{opt.whyItSatisfies}</p>
                  <div className="p-2 rounded-xl bg-white dark:bg-stone-900 text-stone-500 text-[11px]">
                    👉 {opt.quickInstructions}
                  </div>
                </div>
              ))}
            </div>

            {hungryData.encouragement && (
              <p className="text-[11px] text-stone-500 italic text-center pt-1">
                "{hungryData.encouragement}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
