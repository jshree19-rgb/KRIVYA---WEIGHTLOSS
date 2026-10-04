import { UserProfile, CreditWallet, DailyMealPlan, MealItem, WorkoutRoutine, PortionGuideResult, HabitLog, WeightLog, ShoppingItem } from '../types';

const TOKEN_KEY = 'krivya_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error || data.details || `Request failed with status ${response.status}`;
    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.requiresCredits = data.requiresCredits;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  async register(params: { email: string; name?: string; ageCategory: string; password?: string }) {
    const res = await request<{ user: UserProfile; token: string; wallet: CreditWallet }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(email: string) {
    const res = await request<{ user: UserProfile; token: string; wallet: CreditWallet }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: UserProfile; wallet: CreditWallet }>('/api/auth/me');
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  // Profile
  async updateProfile(updates: Partial<UserProfile>) {
    return request<{ user: UserProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Wallet & Checkout
  async getWallet() {
    return request<{
      wallet: CreditWallet;
      packages: any[];
      transactions: any[];
      costPerGeneration: number;
      isFounder: boolean;
    }>('/api/wallet');
  },

  async createCheckoutIntent(packageId: string) {
    return request<{
      intentId: string;
      package: any;
      currency: string;
    }>('/api/checkout/create-intent', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    });
  },

  async confirmCheckout(intentId: string, paymentMethodToken: string, idempotencyKey: string) {
    return request<{
      success: boolean;
      creditsGranted: number;
      newBalance: number;
      wallet: CreditWallet;
    }>('/api/checkout/confirm', {
      method: 'POST',
      body: JSON.stringify({ intentId, paymentMethodToken, idempotencyKey }),
    });
  },

  // AI Features (Each cost 250 AI credits unless founder, refund on error)
  async generateMealPlan(options: { daysCount?: number; dayType?: 'plan' | 'flexible'; targetDay?: string; ingredients?: string[]; language?: string }) {
    return request<{ plan: DailyMealPlan; wallet: CreditWallet; isFounder: boolean }>('/api/ai/meal-plan', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  async swapMeal(mealType: string, currentMealName: string) {
    return request<{ meal: MealItem; wallet: CreditWallet }>('/api/ai/meal-swap', {
      method: 'POST',
      body: JSON.stringify({ mealType, currentMealName }),
    });
  },

  async generateKitchenRecipes(options: {
    ingredients: string[];
    mealCategory?: string;
    maxTimeMinutes?: number;
    useLeftovers?: boolean;
  }) {
    return request<{ recipes: any[]; wallet: CreditWallet }>('/api/ai/kitchen', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  async generateHomemadeMix(availablePantryItems: string[]) {
    return request<{ mix: any; wallet: CreditWallet }>('/api/ai/homemade-mix', {
      method: 'POST',
      body: JSON.stringify({ availablePantryItems }),
    });
  },

  async getPortionGuide(foodName: string, quantity: string, notes?: string, isFlexibleDay?: boolean) {
    return request<{ portion: PortionGuideResult; wallet: CreditWallet }>('/api/ai/portion-guide', {
      method: 'POST',
      body: JSON.stringify({ foodName, quantity, notes, isFlexibleDay }),
    });
  },

  async getSugarCutGuidance(currentDrinks: string[], targetCraving?: string) {
    return request<{ sugarGuidance: any; wallet: CreditWallet }>('/api/ai/sugar-cut', {
      method: 'POST',
      body: JSON.stringify({ currentDrinks, targetCraving }),
    });
  },

  async generateWorkout(options: { targetDuration?: number; equipment?: string[]; workoutType?: string }) {
    return request<{ workout: WorkoutRoutine; wallet: CreditWallet }>('/api/ai/workout', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  async askAICoach(message: string, chatHistory: any[] = [], dayType: 'plan' | 'flexible' = 'plan') {
    return request<{ reply: string; wallet: CreditWallet }>('/api/ai/coach', {
      method: 'POST',
      body: JSON.stringify({ message, chatHistory, dayType }),
    });
  },

  async getImHungryRecommendation(hungerLevel: string, cravingType: string, timeAvailableMinutes: number) {
    return request<{ hungryGuide: any; wallet: CreditWallet }>('/api/ai/im-hungry', {
      method: 'POST',
      body: JSON.stringify({ hungerLevel, cravingType, timeAvailableMinutes }),
    });
  },

  // Progress & Habits
  async getProgress() {
    return request<{
      weightLogs: WeightLog[];
      habitLogs: HabitLog[];
      currentWeight: number;
      goalWeight?: number;
      isMinor: boolean;
    }>('/api/progress');
  },

  async logWeight(weightKg: number, note?: string) {
    return request<{ success: boolean; log: WeightLog; logs: WeightLog[] }>('/api/progress/weight', {
      method: 'POST',
      body: JSON.stringify({ weightKg, note }),
    });
  },

  async logHabit(data: Partial<HabitLog>) {
    return request<{ success: boolean; habit: HabitLog }>('/api/progress/habit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logMood(mood: number, note?: string) {
    return request<{ success: boolean; log: any }>('/api/progress/mood', {
      method: 'POST',
      body: JSON.stringify({ mood, note }),
    });
  },

  async getMoodLogs() {
    return request<{ moodLogs: any[] }>('/api/progress/mood');
  },

  // Shopping List
  async getShoppingList() {
    return request<{ items: ShoppingItem[] }>('/api/shopping');
  },

  async addShoppingItems(items: { name: string; amount?: string; category?: string }[]) {
    return request<{ items: ShoppingItem[] }>('/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  async updateShoppingItem(id: string, updates: Partial<ShoppingItem>) {
    return request<{ items: ShoppingItem[] }>(`/api/shopping/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteShoppingItem(id: string) {
    return request<{ items: ShoppingItem[] }>(`/api/shopping/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin
  async getAdminStats() {
    return request<any>('/api/admin/stats');
  },

  async grantCredits(targetUserId: string, amount: number, reason: string) {
    return request<{ success: boolean; newBalance: number }>('/api/admin/grant-credits', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, amount, reason }),
    });
  },
};
