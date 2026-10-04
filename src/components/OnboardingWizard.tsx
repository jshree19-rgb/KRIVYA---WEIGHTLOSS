import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Heart,
  Activity,
  Calendar,
  Sparkles,
  Check,
  CheckCircle2,
  AlertTriangle,
  Smile,
  Apple,
  Clock,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DietaryPreference, Goal, ActivityLevel, MobilityLevel, ParalysisType, CookingAbility, DayScheduleType } from '../types';

interface OnboardingWizardProps {
  onCompleted: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onCompleted }) => {
  const { user, updateUserProfile, showNotification } = useApp();

  // Onboarding step tracker (Steps 4 through 15)
  // Step 4: Basic Info
  // Step 5: Dietary Preference
  // Step 6: Allergies & Restrictions & Dislikes
  // Step 7: Accessibility & Mobility
  // Step 8: Paralysis Mode / Senior Mode
  // Step 9: Body Information
  // Step 10: Goal
  // Step 11: Exercise Profile
  // Step 12: Cooking Ability
  // Step 13: Sugar-Cut Preference
  // Step 14: Flexible Diet Schedule
  // Step 15: Plan Generation & Summary
  const [currentStep, setCurrentStep] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMinor = user?.isMinor || user?.ageCategory === 'under_13' || user?.ageCategory === '13_17';
  const isChild = user?.ageCategory === 'under_13';

  // Form State
  const [language, setLanguage] = useState(user?.language || 'English');
  const [name, setName] = useState(user?.name || '');
  const [sex, setSex] = useState(user?.sex || 'prefer_not_to_say');
  const [country, setCountry] = useState(user?.country || 'United States');
  const [diet, setDiet] = useState<DietaryPreference>(user?.diet || 'non_vegetarian');

  // Allergies & Restrictions
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [customAllergy, setCustomAllergy] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>(user?.restrictions || []);
  const [customRestriction, setCustomRestriction] = useState('');
  const [dislikedFoods, setDislikedFoods] = useState<string[]>(user?.dislikedFoods || []);
  const [customDislike, setCustomDislike] = useState('');

  // Accessibility & Mobility
  const [mobility, setMobility] = useState<MobilityLevel>(user?.mobility || 'none');
  const [paralysisType, setParalysisType] = useState<ParalysisType>(user?.paralysisType || 'upper_body');
  const [isSenior, setIsSenior] = useState(user?.isSenior || false);

  // Body Info
  const [heightCm, setHeightCm] = useState(user?.heightCm || 170);
  const [currentWeightKg, setCurrentWeightKg] = useState(user?.currentWeightKg || 70);
  const [goalWeightKg, setGoalWeightKg] = useState(user?.goalWeightKg || 65);
  const [goal, setGoal] = useState<Goal>(isChild ? 'maintain' : (user?.goal || 'lose'));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(user?.activityLevel || 'lightly_active');
  const [weightLossDays, setWeightLossDays] = useState(user?.weightLossDays || 30);

  // Exercise Profile
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [equipment, setEquipment] = useState<string[]>(['no_equipment']);
  const [preferredExercise, setPreferredExercise] = useState<string[]>(['walking', 'mobility']);
  const [sessionLengthMin, setSessionLengthMin] = useState(15);

  // Cooking Ability
  const [cookingAbility, setCookingAbility] = useState<CookingAbility>('independent');

  // Sugar-Cut Preferences
  const [sugarReduceDrinks, setSugarReduceDrinks] = useState(true);
  const [sugarCutSnacks, setSugarCutSnacks] = useState(true);
  const [sugarLearnSwaps, setSugarLearnSwaps] = useState(true);

  // Flexible Schedule
  const [schedule, setSchedule] = useState({
    monday: 'plan' as DayScheduleType,
    tuesday: 'plan' as DayScheduleType,
    wednesday: 'flexible' as DayScheduleType,
    thursday: 'plan' as DayScheduleType,
    friday: 'plan' as DayScheduleType,
    saturday: 'flexible' as DayScheduleType,
    sunday: 'flexible' as DayScheduleType,
  });

  const allergyOptions = [
    'Milk / Dairy',
    'Eggs',
    'Peanuts',
    'Tree Nuts',
    'Wheat / Gluten',
    'Soy',
    'Fish',
    'Shellfish',
    'Sesame',
    'Mustard',
  ];

  const restrictionOptions = [
    'Lactose-free',
    'Gluten-free',
    'Dairy-free',
    'Egg-free',
    'Nut-free',
    'Soy-free',
    'Low-sodium',
    'Halal',
    'Kosher',
  ];

  const toggleAllergy = (a: string) => {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((i) => i !== a) : [...prev, a]));
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const toggleRestriction = (r: string) => {
    setRestrictions((prev) => (prev.includes(r) ? prev.filter((i) => i !== r) : [...prev, r]));
  };

  const addCustomRestriction = () => {
    if (customRestriction.trim() && !restrictions.includes(customRestriction.trim())) {
      setRestrictions([...restrictions, customRestriction.trim()]);
      setCustomRestriction('');
    }
  };

  const addCustomDislike = () => {
    if (customDislike.trim() && !dislikedFoods.includes(customDislike.trim())) {
      setDislikedFoods([...dislikedFoods, customDislike.trim()]);
      setCustomDislike('');
    }
  };

  const removeDislike = (item: string) => {
    setDislikedFoods(dislikedFoods.filter((i) => i !== item));
  };

  const toggleScheduleDay = (day: keyof typeof schedule) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day] === 'plan' ? 'flexible' : 'plan',
    }));
  };

  const handleNext = () => {
    console.log('Next step requested. Current step:', currentStep, 'User:', user);
    if (currentStep < 17) {
      setCurrentStep(prev => {
        const next = prev + 1;
        console.log('Setting next step to:', next);
        return next;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 3) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const finishOnboarding = async () => {
    if (goal === 'lose' && goalWeightKg && currentWeightKg > goalWeightKg) {
      const weightToLose = currentWeightKg - goalWeightKg;
      const weeks = weightLossDays / 7;
      const kgPerWeek = weightToLose / weeks;
      
      if (kgPerWeek > 7) {
         showNotification('That weight loss pace is too aggressive and unsafe. Please adjust your target weight or the number of days.', 'warning');
         return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        name,
        sex: sex as any,
        country,
        language,
        diet,
        allergies,
        restrictions,
        dislikedFoods,
        mobility,
        paralysisType: mobility === 'paralysis' ? paralysisType : undefined,
        isSenior,
        heightCm,
        currentWeightKg,
        goalWeightKg: isChild ? undefined : goalWeightKg,
        weightLossDays: goal === 'lose' ? weightLossDays : undefined,
        goal: isChild ? 'maintain' : goal,
        activityLevel,
        exerciseProfile: {
          fitnessLevel,
          equipment,
          preferredTypes: preferredExercise,
          sessionLengthMin,
        },
        cookingAbility,
        sugarCutPreference: {
          reduceDrinks: sugarReduceDrinks,
          cutSnacks: sugarCutSnacks,
          learnSwaps: sugarLearnSwaps,
        },
        weeklySchedule: schedule,
      });
      showNotification('KRIVYA Personalized Plan Created!', 'success');
      onCompleted();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save profile', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-3 sm:p-6 selection:bg-emerald-500/20">
      <div className="w-full max-w-2xl bg-stone-950/85 border border-stone-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Top Header & Progress */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800/80">
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-display">KRIVYA</span>
            <span className="text-xs text-stone-400 block">Personalized Setup</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-400 font-mono font-medium">
              STEP {currentStep} OF 17
            </span>
            <div className="w-24 sm:w-32 bg-stone-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 17) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* STEP 3: Language Preference */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                Preferred Language
              </h2>
              <p className="text-xs text-stone-400">
                Please select your preferred language for all AI interactions and guidance.
              </p>
            </div>

            <div className="text-left">
              <label className="text-xs font-medium text-stone-300 block mb-1">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. English, Español, हिन्दी"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Personal Information */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                Tell Us About Yourself
              </h2>
              <p className="text-xs text-stone-400">
                Basic details help personalize food portions, energy recommendations, and regional ingredients.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs font-medium text-stone-300 block mb-1">Preferred Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 block mb-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 block mb-1">Country or Region</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States, India, UK"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Used by Kitchen AI to suggest locally available produce and spices.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Dietary Preference */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                Dietary Preference
              </h2>
              <p className="text-xs text-stone-400">
                Choose your primary eating style. Every meal plan and recipe respects this strictly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-left">
              <button
                type="button"
                onClick={() => setDiet('vegetarian')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  diet === 'vegetarian'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                    : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Vegetarian</span>
                  <Apple className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-stone-400">
                  No meat, poultry, or fish. Includes wholesome plant foods, dairy, and eggs.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDiet('non_vegetarian')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  diet === 'non_vegetarian'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                    : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Non-Vegetarian</span>
                  <span className="text-xs text-stone-400 font-mono">Omnivore</span>
                </div>
                <p className="text-xs text-stone-400">
                  Includes chicken, fish, seafood, eggs, dairy, and wholesome plant foods.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDiet('vegan')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  diet === 'vegan'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                    : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Vegan</span>
                  <span className="text-xs text-emerald-400 font-mono">100% Plant-Based</span>
                </div>
                <p className="text-xs text-stone-400">
                  Exclusively plant-based. Strictly no meat, fish, eggs, dairy, or honey.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Allergies & Restrictions & Dislikes */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Allergies & Restrictions
                </h2>
              </div>
              <p className="text-xs text-stone-400">
                KRIVYA strictly checks every recipe, meal plan, and portion suggestion against these items.
              </p>
            </div>

            {/* Allergies */}
            <div className="text-left space-y-2">
              <span className="text-xs font-semibold text-stone-300 block">Food Allergies:</span>
              <div className="flex flex-wrap gap-1.5">
                {allergyOptions.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergy(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      allergies.includes(a)
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {allergies.includes(a) && <Check className="w-3 h-3 inline mr-1" />}
                    {a}
                  </button>
                ))}
              </div>

              {/* Custom allergy input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Other allergy (e.g. Avocado)..."
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-stone-900 border border-stone-800 text-white flex-1 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={addCustomAllergy}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs rounded-lg cursor-pointer"
                >
                  Add Allergy
                </button>
              </div>
            </div>

            {/* Restrictions */}
            <div className="text-left space-y-2 pt-2 border-t border-stone-800/80">
              <span className="text-xs font-semibold text-stone-300 block">Dietary Restrictions:</span>
              <div className="flex flex-wrap gap-1.5">
                {restrictionOptions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRestriction(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      restrictions.includes(r)
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {restrictions.includes(r) && <Check className="w-3 h-3 inline mr-1" />}
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Foods I Dislike */}
            <div className="text-left space-y-2 pt-2 border-t border-stone-800/80">
              <span className="text-xs font-semibold text-stone-300 block">Foods I Don't Like:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Cilantro, Olives, Mushrooms..."
                  value={customDislike}
                  onChange={(e) => setCustomDislike(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-stone-900 border border-stone-800 text-white flex-1 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addCustomDislike}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </div>
              {dislikedFoods.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dislikedFoods.map((f) => (
                    <span
                      key={f}
                      className="px-2.5 py-1 bg-stone-800 text-stone-300 text-xs rounded-md flex items-center gap-1.5"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeDislike(f)}
                        className="text-stone-500 hover:text-stone-300 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: Accessibility & Mobility */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                Accessibility & Mobility
              </h2>
              <p className="text-xs text-stone-400">
                KRIVYA adapts both cooking instructions and movement recommendations to your physical comfort.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {[
                { id: 'none', title: 'No Mobility Limitations', desc: 'Standard standing and active movement.' },
                { id: 'wheelchair', title: 'Wheelchair User', desc: 'Seated upper-body movement and accessible prep.' },
                { id: 'limited', title: 'Limited Mobility', desc: 'Gentle, joint-friendly, supported movements.' },
                { id: 'paralysis', title: 'Paralysis Mode', desc: 'Activates specialized low-cook nutrition and safe seated flows.' },
                { id: 'bedbound', title: 'Bedbound / Minimal Movement', desc: 'Restorative breathing, joint comfort, easy digestion.' },
                { id: 'other', title: 'Other Limitation', desc: 'Custom comfort adaptations.' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMobility(m.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    mobility === m.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className="font-semibold text-sm block mb-1">{m.title}</span>
                  <span className="text-xs text-stone-400 block">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: Paralysis Mode / Senior Mode Personalization */}
        {currentStep === 8 && (
          <div className="space-y-5 text-left">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                {mobility === 'paralysis' ? 'Paralysis Mode Personalization' : 'Senior & Age-Specific Support'}
              </h2>
              <p className="text-xs text-stone-400">
                Customizing energy expectations and safe physical flows.
              </p>
            </div>

            {mobility === 'paralysis' && (
              <div className="space-y-4">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 text-xs text-cyan-200 space-y-1.5">
                  <span className="font-semibold text-sm block text-white">Paralysis Mode Active</span>
                  <p>
                    Paralysis and reduced mobility alter lean muscle mass and resting metabolic rate. KRIVYA does not blindly prescribe extreme deficits, and prioritizes easy-prep nutrition.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">Specific Area (Optional)</label>
                  <select
                    value={paralysisType}
                    onChange={(e) => setParalysisType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="upper_body">Upper-body limitation</option>
                    <option value="lower_body">Lower-body / Paraplegia</option>
                    <option value="one_sided">One-sided (Hemiplegia)</option>
                    <option value="both_legs">Both legs</option>
                    <option value="both_arms">Both arms</option>
                    <option value="full_body">Quadriplegia / Full body</option>
                    <option value="wheelchair_user">Wheelchair mobility</option>
                  </select>
                </div>
              </div>
            )}

            {mobility !== 'paralysis' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-white block">Older Adult / Senior Mode</span>
                      <span className="text-xs text-stone-400">
                        Prioritizes protein adequacy, bone and joint health, fall prevention, and balance.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSenior}
                      onChange={(e) => setIsSenior(e.target.checked)}
                      className="w-5 h-5 rounded border-stone-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 text-xs text-stone-400">
                  <Info className="w-4 h-4 text-emerald-400 inline mr-1" />
                  We never assume frailty. KRIVYA adapts seated or supported options while preserving active vitality.
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 9: Body Information */}
        {currentStep === 9 && (
          <div className="space-y-5 text-left">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                Body Measurements
              </h2>
              <p className="text-xs text-stone-400">
                {isMinor
                  ? 'Used strictly for age-appropriate growth nutrition and hydration metrics. Adult BMI is never applied to youth.'
                  : 'Used for estimating baseline energy requirements and tracking gradual, healthy progress.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-300 block mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="80"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 block mb-1">Current Weight (kg)</label>
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {!isMinor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">Goal Weight (kg, Optional)</label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    value={goalWeightKg}
                    onChange={(e) => setGoalWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {goal === 'lose' && (
                  <div>
                    <label className="text-xs font-medium text-stone-300 block mb-1">Days to reach goal</label>
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={weightLossDays}
                      onChange={(e) => setWeightLossDays(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-stone-300 block mb-1">Daily Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="sedentary">Sedentary (mostly sitting)</option>
                <option value="lightly_active">Lightly active (light walking, everyday chores)</option>
                <option value="moderately_active">Moderately active (exercise 3-5 days/week)</option>
                <option value="very_active">Very active (daily hard movement/sports)</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 10: Goal Selection */}
        {currentStep === 10 && (
          <div className="space-y-5 text-left">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                Your Primary Goal
              </h2>
              <p className="text-xs text-stone-400">
                {isChild
                  ? 'Child Safety Mode is active. Focus is on balanced growth, vitality, and joyful habits.'
                  : 'Select your wellness objective. KRIVYA never prescribes crash dieting.'}
              </p>
            </div>

            <div className="space-y-3">
              {!isChild && (
                <button
                  type="button"
                  onClick={() => setGoal('lose')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    goal === 'lose'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className="font-semibold text-sm block mb-1">Sustainable Fat Loss</span>
                  <span className="text-xs text-stone-400 block">
                    Gentle calorie balance, high protein satiety, portion awareness, and sugar reduction.
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setGoal('maintain')}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  goal === 'maintain'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                }`}
              >
                <span className="font-semibold text-sm block mb-1">
                  {isChild ? 'Healthy Growth & Playful Vitality' : 'Maintain Weight & Boost Energy'}
                </span>
                <span className="text-xs text-stone-400 block">
                  Focus on steady stamina, wholesome nutritional variety, hydration, and restorative sleep.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGoal('gain')}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  goal === 'gain'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                }`}
              >
                <span className="font-semibold text-sm block mb-1">Build Lean Strength / Healthy Gain</span>
                <span className="text-xs text-stone-400 block">
                  Nutrient-dense calorie surplus, adequate protein, healthy fats, and progressive resistance.
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 11: Exercise & Fitness Profile */}
        {currentStep === 11 && (
          <div className="space-y-5 text-left">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                Exercise & Movement Profile
              </h2>
              <p className="text-xs text-stone-400">
                Personalized workouts matching your available equipment and session preferences.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-300 block mb-1">Experience Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFitnessLevel(lvl as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize cursor-pointer ${
                        fitnessLevel === lvl
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 block mb-1">Available Equipment</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'no_equipment', label: 'Bodyweight only' },
                    { id: 'chair', label: 'Sturdy chair' },
                    { id: 'resistance_bands', label: 'Resistance bands' },
                    { id: 'dumbbells', label: 'Dumbbells' },
                  ].map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => {
                        setEquipment((prev) =>
                          prev.includes(eq.id) ? prev.filter((i) => i !== eq.id) : [...prev, eq.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                        equipment.includes(eq.id)
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-stone-800 bg-stone-900 text-stone-400'
                      }`}
                    >
                      {equipment.includes(eq.id) && <Check className="w-3 h-3 inline mr-1" />}
                      {eq.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 block mb-1">
                  Preferred Session Length: <span className="text-emerald-400 font-mono">{sessionLengthMin} min</span>
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSessionLengthMin(mins)}
                      className={`flex-1 py-2 rounded-xl text-xs font-mono font-medium cursor-pointer ${
                        sessionLengthMin === mins
                          ? 'bg-emerald-500 text-stone-950 font-bold'
                          : 'bg-stone-900 border border-stone-800 text-stone-400'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 12: Cooking Ability */}
        {currentStep === 12 && (
          <div className="space-y-5 text-left">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display mb-1">
                Cooking Ability & Meal Prep
              </h2>
              <p className="text-xs text-stone-400">
                KRIVYA matches recipe complexity to your daily cooking circumstances.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'independent', title: 'I Cook Independently', desc: 'Comfortable preparing meals from scratch with simple kitchen appliances.' },
                { id: 'needs_assistance', title: 'I Need Some Assistance', desc: 'Prefer low-prep, minimal chopping, or simple one-pot meals.' },
                { id: 'caregiver_prepares', title: 'Someone Else Prepares My Meals', desc: 'Provides clear ingredient and portion guidelines for family or caregivers.' },
                { id: 'ready_to_eat', title: 'Mostly Ready-to-Eat / No-Cook', desc: 'Prioritizes nutrient-dense meals requiring zero or minimal heating.' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCookingAbility(c.id as any)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    cookingAbility === c.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className="font-semibold text-sm block mb-1">{c.title}</span>
                  <span className="text-xs text-stone-400 block">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 13: Sugar-Cut Preferences */}
        {currentStep === 13 && (
          <div className="space-y-5 text-left">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🍬</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Sugar-Cut Preferences
                </h2>
              </div>
              <p className="text-xs text-stone-400">
                Reduce free & added sugars sustainably without promoting fruit fear or obsessive counting.
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sugarReduceDrinks}
                  onChange={(e) => setSugarReduceDrinks(e.target.checked)}
                  className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500 mt-1"
                />
                <div>
                  <span className="font-semibold text-sm text-white block">Cut Sugary Beverages</span>
                  <span className="text-xs text-stone-400">
                    Replace sodas, sweet juices, and sugary iced teas with sparkling fruit infusions.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sugarCutSnacks}
                  onChange={(e) => setSugarCutSnacks(e.target.checked)}
                  className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500 mt-1"
                />
                <div>
                  <span className="font-semibold text-sm text-white block">Mindful Snack Sweets</span>
                  <span className="text-xs text-stone-400">
                    Swap processed candy and baked goods for natural sweet pairings like berries and dark cocoa.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sugarLearnSwaps}
                  onChange={(e) => setSugarLearnSwaps(e.target.checked)}
                  className="rounded border-stone-700 text-emerald-500 focus:ring-emerald-500 mt-1"
                />
                <div>
                  <span className="font-semibold text-sm text-white block">Hidden Sugar Awareness</span>
                  <span className="text-xs text-stone-400">
                    Learn to identify hidden syrups in sauces, yogurts, and packaged cereals.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 14: Flexible Diet Schedule */}
        {currentStep === 14 && (
          <div className="space-y-5 text-left">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Flexible Diet Schedule
                </h2>
              </div>
              <p className="text-xs text-stone-400">
                Choose which days you want structured KRIVYA nutrition guidance vs flexible days.
              </p>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-3 text-xs text-stone-300 space-y-1">
              <strong className="text-emerald-400 block font-semibold">KRIVYA Philosophy:</strong>
              <p className="text-[11px] text-stone-400">
                Flexible days are NOT "cheat days" or "binge days". They allow you to enjoy dining out or spontaneous meals with portion awareness and zero guilt.
              </p>
            </div>

            {/* Weekly Days Toggle Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => {
                const isPlan = schedule[day] === 'plan';
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleScheduleDay(day)}
                    className={`py-3 px-1 rounded-xl border text-center flex flex-col items-center justify-between cursor-pointer transition-all ${
                      isPlan
                        ? 'border-emerald-500 bg-emerald-500/15 text-white'
                        : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                    }`}
                  >
                    <span className="text-[11px] font-mono uppercase font-bold tracking-tight">
                      {day.slice(0, 3)}
                    </span>
                    <span className="text-base my-1">{isPlan ? '🥗' : '🌿'}</span>
                    <span className="text-[9px] font-mono uppercase tracking-tighter">
                      {isPlan ? 'PLAN' : 'FLEX'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400 px-1 pt-1">
              <span className="flex items-center gap-1.5">
                <span>🥗</span> <strong className="text-white">Plan Day:</strong> Structured recipes & reminders
              </span>
              <span className="flex items-center gap-1.5">
                <span>🌿</span> <strong className="text-white">Flex Day:</strong> Mindful freedom
              </span>
            </div>
          </div>
        )}

        {/* STEP 15: Plan Generation & Summary */}
        {currentStep === 15 && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block mb-1">
                Safety Profile Complete
              </span>
              <h2 className="text-2xl font-bold text-white font-display">
                Your KRIVYA Plan is Ready
              </h2>
              <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto leading-relaxed">
                We have tailored your nutrition, portion suggestions, sugar-awareness tools, and exercise routines to your personal safety profile.
              </p>
            </div>

            {/* Overview Summary */}
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 text-left space-y-2 text-xs text-stone-300">
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">Age Protection:</span>
                <span className="text-white font-medium capitalize">
                  {user?.ageCategory === 'under_13' ? 'Child Safety Mode' : user?.ageCategory === '13_17' ? 'Youth Safety Mode' : 'Adult Plan'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">Dietary Style:</span>
                <span className="text-emerald-400 font-medium capitalize">{diet}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">Allergies Protected:</span>
                <span className="text-white font-medium">
                  {allergies.length > 0 ? allergies.join(', ') : 'None Reported'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-400">Mobility Flow:</span>
                <span className="text-cyan-400 font-medium capitalize">{mobility}</span>
              </div>
            </div>

            <div className="text-[11px] text-stone-500 leading-relaxed max-w-sm mx-auto">
              Medical Disclaimer: KRIVYA provides general nutritional and lifestyle guidance and does not replace medical advice, diagnosis, or treatment.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-5 mt-4 border-t border-stone-800/80 gap-3">
          {currentStep > 4 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 text-xs font-semibold shadow-lg shadow-emerald-500/10 flex items-center gap-2 cursor-pointer ml-auto active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span>Finalizing Profile...</span>
            ) : currentStep === 15 ? (
              <>
                <span>Enter KRIVYA Home</span>
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
