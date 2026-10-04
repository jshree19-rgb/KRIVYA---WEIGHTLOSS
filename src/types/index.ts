export type AgeCategory = 'under_13' | '13_17' | '18_plus';

export type Sex = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export type DietaryPreference = 'vegetarian' | 'non_vegetarian' | 'vegan';

export type Goal = 'lose' | 'maintain' | 'gain';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';

export type MobilityLevel = 
  | 'none' 
  | 'wheelchair' 
  | 'limited' 
  | 'paralysis' 
  | 'bedbound' 
  | 'other';

export type ParalysisType = 
  | 'upper_body' 
  | 'lower_body' 
  | 'one_sided' 
  | 'both_legs' 
  | 'both_arms' 
  | 'full_body' 
  | 'wheelchair_user' 
  | 'other';

export type CookingAbility = 
  | 'independent' 
  | 'needs_assistance' 
  | 'caregiver_prepares' 
  | 'ready_to_eat';

export type DayScheduleType = 'plan' | 'flexible';

export interface WeeklySchedule {
  monday: DayScheduleType;
  tuesday: DayScheduleType;
  wednesday: DayScheduleType;
  thursday: DayScheduleType;
  friday: DayScheduleType;
  saturday: DayScheduleType;
  sunday: DayScheduleType;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  ageCategory: AgeCategory;
  isMinor: boolean;
  isSenior: boolean;
  ageYears?: number;
  sex: Sex;
  country: string;
  language: string;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg?: number;
  weightLossDays?: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  diet: DietaryPreference;
  allergies: string[];
  restrictions: string[];
  dislikedFoods: string[];
  mobility: MobilityLevel;
  paralysisType?: ParalysisType;
  cookingAbility: CookingAbility;
  sugarCutPreference: {
    reduceDrinks: boolean;
    cutSnacks: boolean;
    learnSwaps: boolean;
  };
  weeklySchedule: WeeklySchedule;
  exerciseProfile: {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    equipment: string[];
    preferredTypes: string[];
    sessionLengthMin: number;
  };
  notificationsEnabled: boolean;
  notificationPreferences: {
    meals: boolean;
    hydration: boolean;
    exercise: boolean;
    habits: boolean;
    aiCoach: boolean;
    weeklyProgress: boolean;
  };
  isFounder: boolean;
  role: 'user' | 'founder' | 'admin';
  createdAt: string;
}

export interface CreditWallet {
  balance: number;
  isUnlimited: boolean;
  purchased: number;
  used: number;
  transactions: CreditTransaction[];
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'initial_grant' | 'generation_used' | 'generation_refund' | 'credit_purchase' | 'admin_grant';
  amount: number;
  description: string;
  timestamp: string;
  idempotencyKey?: string;
}

export interface MealItem {
  id: string;
  mealType: 'breakfast' | 'morning_snack' | 'lunch' | 'evening_snack' | 'dinner';
  name: string;
  description: string;
  caloriesApprox?: number;
  proteinGramsApprox?: number;
  carbsGramsApprox?: number;
  fatGramsApprox?: number;
  ingredients: { name: string; amount: string; optional?: boolean }[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  allergenFreeNotice: string;
  safetyNote?: string;
  balanceTip?: string;
}

export interface DailyMealPlan {
  day: string;
  dayType: DayScheduleType;
  theme: string;
  meals: MealItem[];
  hydrationGuidance: string;
  sugarAwarenessTip: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  goal: string;
  durationMinutes: number;
  difficulty: 'gentle' | 'beginner' | 'moderate' | 'challenging';
  mobilityFriendly: boolean;
  equipment: string[];
  warmUp: { title: string; duration: string; notes: string }[];
  exercises: {
    id: string;
    name: string;
    targetArea: string;
    repsOrDuration: string;
    sets: number;
    restSeconds: number;
    seatedAlternative?: string;
    formCues: string[];
    safetyNote?: string;
  }[];
  coolDown: { title: string; duration: string; notes: string }[];
  postWorkoutNutrition: string;
  safetyDisclaimer: string;
}

export interface PortionGuideResult {
  foodName: string;
  enteredQuantity: string;
  suggestedPortion: string;
  visualScale: {
    smaller: string;
    moderate: string;
    larger: string;
  };
  balancePairings: string[];
  krivyaTip: string;
  allergyNotice?: string;
  isFlexibleDayNote?: string;
  estimatedNutrition?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    sugar?: string;
  };
}

export interface SugarCutLog {
  id: string;
  date: string;
  sugaryDrinksCount: number;
  freeSugarSnacksCount: number;
  swapsMade: string[];
  notes: string;
}

export interface HabitLog {
  id: string;
  date: string;
  waterGlasses: number;
  sleepHours: number;
  mealsLogged: number;
  fruitsVeggiesEaten: boolean;
  movementCompleted: boolean;
  sugarAwarenessFollowed: boolean;
  mindfulEatingPracticed: boolean;
}

export interface WeightLog {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
}

export interface MoodLog { id: string; date: string; mood: number; note?: string; }

export interface ShoppingItem {
  id: string;
  category: 'Vegetables' | 'Fruits' | 'Grains' | 'Protein' | 'Dairy/Alternatives' | 'Pantry' | 'Spices' | 'Other';
  name: string;
  amount: string;
  checked: boolean;
}

export interface PaymentPackage {
  id: 'krivya_plus' | 'krivya_pro' | 'krivya_ultra' | 'krivya_max';
  name: string;
  priceUsd: number;
  credits: number;
  generationsApprox: number;
  badge?: string;
}
