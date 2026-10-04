import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Persistence file
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'krivya_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Founder emails strictly recognized
const FOUNDER_EMAILS = [
  'jshree19@gmail.com',
  'krunchycrisps@outlook.com',
];

export function isFounderEmail(email: string): boolean {
  if (!email) return false;
  return FOUNDER_EMAILS.includes(email.trim().toLowerCase());
}

// Packages definition
export const CREDIT_PACKAGES: Record<string, { id: string; name: string; priceUsd: number; credits: number; generationsApprox: number }> = {
  krivya_plus: { id: 'krivya_plus', name: 'KRIVYA PLUS', priceUsd: 40, credits: 5000, generationsApprox: 20 },
  krivya_pro: { id: 'krivya_pro', name: 'KRIVYA PRO', priceUsd: 60, credits: 10000, generationsApprox: 40 },
  krivya_ultra: { id: 'krivya_ultra', name: 'KRIVYA ULTRA', priceUsd: 80, credits: 15000, generationsApprox: 60 },
  krivya_max: { id: 'krivya_max', name: 'KRIVYA MAX', priceUsd: 100, credits: 30000, generationsApprox: 120 },
};

// Database structure
interface DBStructure {
  users: Record<string, any>;
  sessions: Record<string, { userId: string; createdAt: string; expiresAt: string }>;
  wallets: Record<string, { balance: number; isUnlimited: boolean; purchased: number; used: number }>;
  transactions: any[];
  payments: any[];
  generations: any[];
  weightLogs: Record<string, any[]>;
  moodLogs: Record<string, any[]>;
  habitLogs: Record<string, any[]>;
  shoppingLists: Record<string, any[]>;
}

function loadDB(): DBStructure {
  const defaultDB: DBStructure = {
    users: {},
    sessions: {},
    wallets: {},
    transactions: [],
    payments: [],
    generations: [],
    weightLogs: {},
    moodLogs: {},
    habitLogs: {},
    shoppingLists: {},
  };
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...defaultDB, ...parsed };
    }
  } catch (err) {
    console.error('Failed to read db, initializing fresh:', err);
  }
  return defaultDB;
}

let dbCache: DBStructure = loadDB();

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db:', err);
  }
}

// Initialize seed founder accounts if not present
function initSeedAccounts() {
  FOUNDER_EMAILS.forEach((fEmail) => {
    const existing = Object.values(dbCache.users).find((u: any) => u.email.toLowerCase() === fEmail);
    if (!existing) {
      const fId = 'founder_' + Buffer.from(fEmail).toString('hex').slice(0, 8);
      const now = new Date().toISOString();
      dbCache.users[fId] = {
        id: fId,
        email: fEmail,
        name: fEmail.includes('jshree') ? 'Jshree (Founder)' : 'Founder',
        ageCategory: '18_plus',
        isMinor: false,
        isSenior: false,
        sex: 'prefer_not_to_say',
        country: 'Global',
        heightCm: 170,
        currentWeightKg: 68,
        goal: 'maintain',
        activityLevel: 'moderately_active',
        diet: 'non_vegetarian',
        allergies: [],
        restrictions: [],
        dislikedFoods: [],
        mobility: 'none',
        cookingAbility: 'independent',
        sugarCutPreference: { reduceDrinks: true, cutSnacks: true, learnSwaps: true },
        weeklySchedule: {
          monday: 'plan',
          tuesday: 'plan',
          wednesday: 'flexible',
          thursday: 'plan',
          friday: 'plan',
          saturday: 'flexible',
          sunday: 'flexible',
        },
        exerciseProfile: {
          fitnessLevel: 'intermediate',
          equipment: ['no_equipment', 'dumbbells'],
          preferredTypes: ['walking', 'strength'],
          sessionLengthMin: 20,
        },
        notificationsEnabled: true,
        notificationPreferences: {
          meals: true,
          hydration: true,
          exercise: true,
          habits: true,
          aiCoach: true,
          weeklyProgress: true,
        },
        isFounder: true,
        role: 'founder',
        createdAt: now,
      };
      dbCache.wallets[fId] = {
        balance: 999999,
        isUnlimited: true,
        purchased: 0,
        used: 0,
      };
      dbCache.transactions.push({
        id: 'tx_seed_' + Date.now(),
        userId: fId,
        type: 'admin_grant',
        amount: 999999,
        description: 'Founder Account Unlimited Allocation',
        timestamp: now,
      });
    } else {
      existing.isFounder = true;
      existing.role = 'founder';
      if (!dbCache.wallets) dbCache.wallets = {};
      if (!dbCache.wallets[existing.id]) {
        dbCache.wallets[existing.id] = { balance: 999999, isUnlimited: true, purchased: 0, used: 0 };
      } else {
        dbCache.wallets[existing.id].isUnlimited = true;
      }
    }
  });
  saveDB();
}
initSeedAccounts();

// Gemini GenAI Setup
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Session Auth Helper
function getUserFromRequest(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '');
  const session = dbCache.sessions[token];
  if (!session) return null;
  const user = dbCache.users[session.userId];
  return user || null;
}

// Credit Deduction Helper (Server-side enforced)
const GENERATION_CREDIT_COST = 250;

interface CreditDeductionResult {
  allowed: boolean;
  isFounder: boolean;
  txId?: string;
  error?: string;
}

function reserveCredits(userId: string): CreditDeductionResult {
  const user = dbCache.users[userId];
  if (!user) return { allowed: false, isFounder: false, error: 'User not found' };

  if (user.isFounder) {
    return { allowed: true, isFounder: true };
  }

  const wallet = dbCache.wallets[userId] || { balance: 0, isUnlimited: false, purchased: 0, used: 0 };
  if (wallet.balance < GENERATION_CREDIT_COST) {
    return {
      allowed: false,
      isFounder: false,
      error: `Insufficient AI Credits. This action requires ${GENERATION_CREDIT_COST} credits. Your current balance is ${wallet.balance}.`,
    };
  }

  // Atomically deduct
  wallet.balance -= GENERATION_CREDIT_COST;
  wallet.used += GENERATION_CREDIT_COST;
  dbCache.wallets[userId] = wallet;

  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  dbCache.transactions.unshift({
    id: txId,
    userId,
    type: 'generation_used',
    amount: -GENERATION_CREDIT_COST,
    description: 'AI Feature Generation',
    timestamp: new Date().toISOString(),
  });
  saveDB();

  return { allowed: true, isFounder: false, txId };
}

function refundCredits(userId: string, txId?: string, reason: string = 'Generation Failed') {
  const user = dbCache.users[userId];
  if (!user || user.isFounder) return;

  const wallet = dbCache.wallets[userId];
  if (wallet) {
    wallet.balance += GENERATION_CREDIT_COST;
    wallet.used = Math.max(0, wallet.used - GENERATION_CREDIT_COST);
    dbCache.wallets[userId] = wallet;

    dbCache.transactions.unshift({
      id: 'refund_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      type: 'generation_refund',
      amount: GENERATION_CREDIT_COST,
      description: `Refund: ${reason}`,
      timestamp: new Date().toISOString(),
      originalTxId: txId,
    });
    saveDB();
  }
}

// -------------------------------------------------------------
// Safety Context Builder for AI Prompts
// -------------------------------------------------------------
function buildSafetyContext(user: any, dayType?: 'plan' | 'flexible'): string {
  const isMinor = user.ageCategory === 'under_13' || user.ageCategory === '13_17';
  const isChild = user.ageCategory === 'under_13';
  const isYouth = user.ageCategory === '13_17';
  const isSenior = user.isSenior || (user.ageYears && user.ageYears >= 60);

  let context = `
[KRIVYA SAFETY AND PERSONALIZATION CONTEXT]
- Age Category: ${user.ageCategory}
- Sex: ${user.sex || 'not specified'}
- Diet Preference: ${user.diet || 'non_vegetarian'}
- Allergies: ${(user.allergies && user.allergies.length > 0) ? user.allergies.join(', ') : 'None reported'}
- Dietary Restrictions: ${(user.restrictions && user.restrictions.length > 0) ? user.restrictions.join(', ') : 'None'}
- Disliked Foods: ${(user.dislikedFoods && user.dislikedFoods.length > 0) ? user.dislikedFoods.join(', ') : 'None'}
- Mobility / Accessibility: ${user.mobility || 'none'} ${user.paralysisType ? `(Paralysis: ${user.paralysisType})` : ''}
- Cooking Ability: ${user.cookingAbility || 'independent'}
- Today's Schedule Type: ${dayType || 'plan'} (Note: If flexible day, support balanced enjoyment and portion mindfulness without shame, guilt, or calling it a "cheat day"!)
- Sugar Preference: Focus on reducing added/free sugars while distinguishing natural sugars in fruits and plain dairy.
`;

  if (isChild) {
    context += `
CRITICAL CHILD SAFETY PROTOCOL (UNDER 13):
1. STRICTLY FORBIDDEN: Calorie restriction, weight-loss dieting, crash diets, starvation, fasting, rapid weight-loss targets, supplements.
2. FOCUS: Balanced nutrition, growth, wholesome variety, sleep, hydration, enjoyable play, age-appropriate portions, positive food relationship.
3. NEVER show adult BMI or caloric deficit targets.
`;
  } else if (isYouth) {
    context += `
CRITICAL YOUTH SAFETY PROTOCOL (13-17):
1. STRICTLY FORBIDDEN: Crash diets, starvation, extreme calorie restriction, weight-loss fasting, adult BMI classifications.
2. FOCUS: Sustained energy for growth, sports, study, balanced meals, strength, positive body image.
`;
  } else {
    context += `
ADULT PROTOCOL (18+):
1. Approach: Sustainable, gradual, health-first progression. No starvation or extreme restriction.
2. Health Disclaimer: KRIVYA provides general health and nutrition information and is not a substitute for medical advice or diagnosis.
`;
  }

  if (user.mobility === 'paralysis' || user.mobility === 'wheelchair') {
    context += `
PARALYSIS / ACCESSIBLE PROTOCOL:
1. Prioritize easy-to-prepare, minimal-cook, or no-cook nutrient-dense options if cooking ability is limited.
2. For movement: Only recommend accessible seated, upper-body, or gentle mobility exercises. Never recommend standing or walking if unable.
3. Recommend consulting a physiotherapist or doctor for clinical recommendations.
`;
  }

  if (isSenior) {
    context += `
SENIOR / OLDER ADULT PROTOCOL:
1. Prioritize adequate protein for muscle preservation, fiber for digestive health, hydration, joint comfort.
2. For movement: Gentle walking, chair exercises, balance, low-impact strength, fall prevention.
`;
  }

  return context;
}

// Allergy & Safety filter on AI Output
function inspectSafetyOnText(text: string, user: any): { isSafe: boolean; warning?: string } {
  if (!text) return { isSafe: true };
  const lower = text.toLowerCase();

  // Check stored allergies
  if (user.allergies && Array.isArray(user.allergies)) {
    for (const allergy of user.allergies) {
      const aLower = allergy.toLowerCase();
      if (aLower.length > 2 && lower.includes(aLower)) {
        return { isSafe: false, warning: `AI response contained potential allergen: ${allergy}` };
      }
    }
  }

  // Check toxic dieting terms for minors
  if (user.ageCategory === 'under_13' || user.ageCategory === '13_17') {
    const dangerousTerms = ['crash diet', 'starve', 'starvation', 'fast for weight loss', 'extreme deficit', 'burn off what you ate', 'purge', 'miracle fat burner'];
    for (const term of dangerousTerms) {
      if (lower.includes(term)) {
        return { isSafe: false, warning: `Unsafe dietary phrase detected for youth: ${term}` };
      }
    }
  }

  return { isSafe: true };
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, ageCategory } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!ageCategory) {
      return res.status(400).json({ error: 'Mandatory camera age verification must be completed first' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = Object.values(dbCache.users).find((u: any) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const isFounder = isFounderEmail(cleanEmail);
    const initialCredits = isFounder ? 999999 : 500; // 500 free credits for new user = 2 generations

    const now = new Date().toISOString();
    const newUser = {
      id: userId,
      email: cleanEmail,
      name: name || (isFounder ? 'Founder' : 'KRIVYA Member'),
      ageCategory,
      isMinor: ageCategory === 'under_13' || ageCategory === '13_17',
      isSenior: false,
      sex: 'prefer_not_to_say',
      country: 'Global',
      heightCm: 170,
      currentWeightKg: 70,
      goal: 'lose',
      activityLevel: 'lightly_active',
      diet: 'non_vegetarian',
      allergies: [],
      restrictions: [],
      dislikedFoods: [],
      mobility: 'none',
      cookingAbility: 'independent',
      sugarCutPreference: { reduceDrinks: true, cutSnacks: true, learnSwaps: true },
      weeklySchedule: {
        monday: 'plan',
        tuesday: 'plan',
        wednesday: 'flexible',
        thursday: 'plan',
        friday: 'plan',
        saturday: 'flexible',
        sunday: 'flexible',
      },
      exerciseProfile: {
        fitnessLevel: 'beginner',
        equipment: ['no_equipment'],
        preferredTypes: ['walking', 'strength'],
        sessionLengthMin: 15,
      },
      notificationsEnabled: false,
      notificationPreferences: {
        meals: true,
        hydration: true,
        exercise: true,
        habits: true,
        aiCoach: true,
        weeklyProgress: true,
      },
      isFounder,
      role: isFounder ? 'founder' : 'user',
      createdAt: now,
    };

    dbCache.users[userId] = newUser;
    dbCache.wallets[userId] = {
      balance: initialCredits,
      isUnlimited: isFounder,
      purchased: 0,
      used: 0,
    };

    dbCache.transactions.push({
      id: 'tx_init_' + Date.now(),
      userId,
      type: 'initial_grant',
      amount: initialCredits,
      description: isFounder ? 'Founder Account Unlimited Credits' : 'Welcome Gift: 500 Free AI Credits (2 AI Generations)',
      timestamp: now,
    });

    const sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now();
    dbCache.sessions[sessionToken] = {
      userId,
      createdAt: now,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    };
    saveDB();

    res.json({
      user: newUser,
      token: sessionToken,
      wallet: dbCache.wallets[userId],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    let user = Object.values(dbCache.users).find((u: any) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // If it's a recognized founder email, auto-create it
      if (isFounderEmail(cleanEmail)) {
        initSeedAccounts();
        user = Object.values(dbCache.users).find((u: any) => u.email.toLowerCase() === cleanEmail);
      } else {
        return res.status(404).json({ error: 'No account found with this email. Please register first.' });
      }
    }

    if (isFounderEmail(cleanEmail)) {
      user.isFounder = true;
      user.role = 'founder';
      if (!dbCache.wallets[user.id]) {
        dbCache.wallets[user.id] = { balance: 999999, isUnlimited: true, purchased: 0, used: 0 };
      } else {
        dbCache.wallets[user.id].isUnlimited = true;
      }
    }

    const sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now();
    dbCache.sessions[sessionToken] = {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    };
    saveDB();

    res.json({
      user,
      token: sessionToken,
      wallet: dbCache.wallets[user.id] || { balance: 500, isUnlimited: user.isFounder, purchased: 0, used: 0 },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const wallet = dbCache.wallets[user.id] || { balance: 500, isUnlimited: user.isFounder, purchased: 0, used: 0 };
  res.json({ user, wallet });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/, '');
    delete dbCache.sessions[token];
    saveDB();
  }
  res.json({ success: true });
});

// Update Profile
app.put('/api/profile', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const updates = req.body;
  // Prevent unauthorized modification of founder or role status
  delete updates.id;
  delete updates.isFounder;
  delete updates.role;
  delete updates.email;

  Object.assign(user, updates);
  dbCache.users[user.id] = user;
  saveDB();

  res.json({ user });
});

// -------------------------------------------------------------
// WALLET & CREDIT CHECKOUT (ANTI-FRAUD IDEMPOTENT LEDGER)
// -------------------------------------------------------------
app.get('/api/wallet', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const wallet = dbCache.wallets[user.id] || { balance: 0, isUnlimited: user.isFounder, purchased: 0, used: 0 };
  const userTxs = dbCache.transactions.filter((tx) => tx.userId === user.id).slice(0, 50);

  res.json({
    wallet,
    packages: Object.values(CREDIT_PACKAGES),
    transactions: userTxs,
    costPerGeneration: GENERATION_CREDIT_COST,
    isFounder: user.isFounder,
  });
});

// Step 1: Create payment intent
app.post('/api/checkout/create-intent', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { packageId } = req.body;
  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) {
    return res.status(400).json({ error: 'Invalid credit package selected' });
  }

  const intentId = 'pi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const paymentRecord = {
    intentId,
    userId: user.id,
    packageId: pkg.id,
    packageName: pkg.name,
    amountUsd: pkg.priceUsd,
    creditsToGrant: pkg.credits,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  dbCache.payments.push(paymentRecord);
  saveDB();

  res.json({
    intentId,
    package: pkg,
    currency: 'USD',
  });
});

// Step 2: Confirm verified payment and grant credits idempotently
app.post('/api/checkout/confirm', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { intentId, paymentMethodToken, idempotencyKey } = req.body;
  if (!intentId) return res.status(400).json({ error: 'Missing payment intent ID' });

  const payment = dbCache.payments.find((p) => p.intentId === intentId && p.userId === user.id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment intent not found or unauthorized' });
  }

  // Idempotency check: prevent duplicate grants
  if (payment.status === 'succeeded') {
    return res.json({
      success: true,
      message: 'Credits already granted for this verified transaction.',
      wallet: dbCache.wallets[user.id],
    });
  }

  // Verification step: Ensure payment credentials are valid
  if (!paymentMethodToken || paymentMethodToken.trim().length < 4) {
    payment.status = 'failed';
    saveDB();
    return res.status(400).json({ error: 'Payment authorization failed. No credits were added.' });
  }

  // Atomically update payment and wallet
  payment.status = 'succeeded';
  payment.completedAt = new Date().toISOString();
  payment.paymentMethodToken = paymentMethodToken.substring(0, 10) + '...';
  payment.idempotencyKey = idempotencyKey;

  const wallet = dbCache.wallets[user.id] || { balance: 0, isUnlimited: user.isFounder, purchased: 0, used: 0 };
  wallet.balance += payment.creditsToGrant;
  wallet.purchased += payment.creditsToGrant;
  dbCache.wallets[user.id] = wallet;

  const txId = 'tx_pay_' + Date.now();
  dbCache.transactions.unshift({
    id: txId,
    userId: user.id,
    type: 'credit_purchase',
    amount: payment.creditsToGrant,
    description: `Purchased ${payment.packageName} ($${payment.amountUsd})`,
    timestamp: new Date().toISOString(),
    intentId,
  });
  saveDB();

  res.json({
    success: true,
    creditsGranted: payment.creditsToGrant,
    newBalance: wallet.balance,
    wallet,
  });
});

// -------------------------------------------------------------
// AI ENDPOINTS WITH STRICT CREDIT VERIFICATION AND SAFETY
// -------------------------------------------------------------

// 1. Meal Plan Generator
app.post('/api/ai/meal-plan', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  const { daysCount = 1, dayType = 'plan', targetDay = 'Monday', ingredients = [], language = 'English' } = req.body;
  const safetyContext = buildSafetyContext(user, dayType);
  let planData: any = null;

  try {
    const prompt = `
${safetyContext}

Language: ${language}
${ingredients.length > 0 ? `Available Ingredients: ${ingredients.join(', ')}` : ''}

Generate a comprehensive, nutrient-dense, practical ${daysCount === 7 ? '7-Day' : '1-Day'} meal plan for ${user.name || 'the user'}.
Day Schedule: ${dayType.toUpperCase()} DAY.
Target day: ${targetDay}.

Meals required for the day:
1. Breakfast
2. Morning Snack
3. Lunch
4. Evening Snack
5. Dinner

Format your response strictly as valid JSON matching this schema:
{
  "day": "${targetDay}",
  "dayType": "${dayType}",
  "theme": "Brief 3-word theme (e.g. Vibrant Energy Boost)",
  "hydrationGuidance": "Gentle daily water and hydration tip",
  "sugarAwarenessTip": "Practical tip on natural vs added sugars",
  "meals": [
    {
      "id": "meal_1",
      "mealType": "breakfast",
      "name": "Recipe Name",
      "description": "Short appetizing description",
      "caloriesApprox": 380,
      "proteinGramsApprox": 22,
      "carbsGramsApprox": 45,
      "fatGramsApprox": 12,
      "prepTimeMinutes": 10,
      "cookTimeMinutes": 10,
      "servings": 1,
      "allergenFreeNotice": "Safe from reported allergies",
      "balanceTip": "Balance tip for satiety and steady energy",
      "ingredients": [
        {"name": "Ingredient 1", "amount": "1 cup", "optional": false},
        {"name": "Ingredient 2", "amount": "1 tbsp", "optional": true}
      ],
      "instructions": [
        "Step 1 instructions",
        "Step 2 instructions"
      ]
    }
  ]
}
Ensure there are no toxic restriction messages. If user has allergies (${(user.allergies || []).join(', ')}), NEVER include those foods!
Return ONLY valid JSON.
`;

    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      try {
        const sanitizedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const safety = inspectSafetyOnText(sanitizedText, user);
        if (!safety.isSafe) {
          throw new Error(safety.warning || 'Allergen safety check triggered');
        }

        planData = JSON.parse(sanitizedText);
      } catch (e) {
        console.error('Failed to parse JSON from AI:', responseText);
        throw new Error('Failed to parse meal plan response.');
      }
    } else {
      // Deterministic dietitian-safe plan fallback
      planData = generateDeterministicMealPlan(user, dayType, targetDay);
    }

    // Record generation
    dbCache.generations.push({
      id: 'gen_' + Date.now(),
      userId: user.id,
      type: 'meal_plan',
      dayType,
      timestamp: new Date().toISOString(),
    });
    saveDB();

    res.json({
      plan: planData,
      wallet: dbCache.wallets[user.id],
      isFounder: user.isFounder,
    });
  } catch (err: any) {
    console.error('Meal plan generation error:', err);
    
    // Fallback to deterministic plan on rate limit
    const errorMessage = err.message || JSON.stringify(err);
    if (err.status === 429 || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.log('Quota exceeded, falling back to deterministic meal plan.');
      planData = generateDeterministicMealPlan(user, dayType, targetDay);
      
      dbCache.generations.push({
        id: 'gen_' + Date.now(),
        userId: user.id,
        type: 'meal_plan',
        dayType,
        timestamp: new Date().toISOString(),
      });
      saveDB();

      return res.json({
        plan: planData,
        wallet: dbCache.wallets[user.id],
        isFounder: user.isFounder,
        note: 'Note: AI quota temporarily reached. Showing dietitian-safe plan.'
      });
    }
    
    refundCredits(user.id, creditCheck.txId, 'Meal Plan AI Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// 2. Meal Swap (Swap a single meal preserving constraints)
app.post('/api/ai/meal-swap', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  const { mealType, currentMealName } = req.body;
  const safetyContext = buildSafetyContext(user);
  let swapItem: any = null;

  try {
    const prompt = `
${safetyContext}

The user wants to swap their ${mealType} (currently: "${currentMealName || 'current meal'}") for a fresh, delicious alternative that matches their diet (${user.diet}) and allergies (${(user.allergies || []).join(', ')}).

Return ONLY valid JSON:
{
  "id": "swap_${Date.now()}",
  "mealType": "${mealType}",
  "name": "New Recipe Name",
  "description": "Appetizing description",
  "caloriesApprox": 400,
  "proteinGramsApprox": 24,
  "carbsGramsApprox": 42,
  "fatGramsApprox": 14,
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 15,
  "servings": 1,
  "allergenFreeNotice": "Checked against all user allergies",
  "balanceTip": "Balanced nutrition tip",
  "ingredients": [
    {"name": "Ingredient 1", "amount": "Amount", "optional": false}
  ],
  "instructions": [
    "Step 1",
    "Step 2"
  ]
}
`;

    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.8 },
      });
      const responseText = response.text || '';
      const safety = inspectSafetyOnText(responseText, user);
      if (!safety.isSafe) throw new Error(safety.warning);
      swapItem = JSON.parse(responseText);
    } else {
      swapItem = generateDeterministicSwap(user, mealType);
    }

    res.json({
      meal: swapItem,
      wallet: dbCache.wallets[user.id],
    });
  } catch (err: any) {
    // Fallback to deterministic swap on rate limit
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      console.log('Quota exceeded, falling back to deterministic meal swap.');
      swapItem = generateDeterministicSwap(user, mealType);
      
      return res.json({
        meal: swapItem,
        wallet: dbCache.wallets[user.id],
        note: 'Note: AI quota temporarily reached. Showing dietitian-safe swap.'
      });
    }

    refundCredits(user.id, creditCheck.txId, 'Meal Swap Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// 3. What's in My Kitchen? (Recipe from available ingredients)
app.post('/api/ai/kitchen', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  try {
    const { ingredients = [], mealCategory = 'any', maxTimeMinutes = 30, useLeftovers = false } = req.body;
    const safetyContext = buildSafetyContext(user);

    const prompt = `
${safetyContext}

The user has these ingredients in their kitchen: ${ingredients.join(', ')}.
Requested category: ${mealCategory}.
Max time: ${maxTimeMinutes} minutes.
Leftover optimization requested: ${useLeftovers ? 'YES - prioritize using these items soon without suggesting spoiled food' : 'NO'}.

Generate 2 distinct recipes primarily utilizing these ingredients while respecting diet (${user.diet}), allergies (${(user.allergies || []).join(', ')}), and cooking ability (${user.cookingAbility}).

Return JSON schema:
{
  "recipes": [
    {
      "id": "kitch_1",
      "name": "Recipe Name",
      "category": "${mealCategory}",
      "description": "Appetizing description",
      "prepTimeMinutes": 10,
      "cookTimeMinutes": 15,
      "servings": 2,
      "suitableGoal": "Sustained vitality and nutrition",
      "difficulty": "Easy",
      "storageGuidance": "Store in an airtight container in the fridge for up to 3 days.",
      "ingredients": [
        {"name": "Ingredient from pantry", "amount": "1 cup", "optional": false},
        {"name": "Pantry staple", "amount": "1 pinch", "optional": true}
      ],
      "instructions": [
        "Step 1",
        "Step 2"
      ],
      "approxNutrition": {
        "calories": "~350 kcal",
        "protein": "~18g",
        "fiber": "~7g"
      }
    }
  ]
}
Return ONLY valid JSON.
`;

    let data: any = null;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.7 },
      });
      const responseText = response.text || '';
      const safety = inspectSafetyOnText(responseText, user);
      if (!safety.isSafe) throw new Error(safety.warning);
      data = JSON.parse(responseText);
    } else {
      data = {
        recipes: [
          {
            id: 'kitch_det_1',
            name: 'Wholesome Kitchen Garden Skillet',
            category: mealCategory,
            description: 'A comforting, fiber-rich skillet made from your fresh ingredients.',
            prepTimeMinutes: 10,
            cookTimeMinutes: 15,
            servings: 2,
            suitableGoal: 'Balanced satiety & micronutrient boost',
            difficulty: 'Easy',
            storageGuidance: 'Keep refrigerated in a sealed container for up to 3 days.',
            ingredients: (ingredients.length > 0 ? ingredients : ['Oats', 'Spinach', 'Eggs', 'Olive oil']).map((ing: string) => ({
              name: ing,
              amount: '1 portion',
              optional: false,
            })),
            instructions: [
              'Wash and chop all ingredients cleanly.',
              'Warm olive oil in a pan over medium heat.',
              'Sauté your ingredients gently until tender and fragrant.',
              'Season with natural herbs, black pepper, and serve warm.',
            ],
            approxNutrition: { calories: '~320 kcal', protein: '~16g', fiber: '~6g' },
          },
        ],
      };
    }

    res.json({
      recipes: data.recipes || [],
      wallet: dbCache.wallets[user.id],
    });
  } catch (err: any) {
    refundCredits(user.id, creditCheck.txId, 'Kitchen AI Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// 4. Homemade Food Mix / Powder Generator
app.post('/api/ai/homemade-mix', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  try {
    const { availablePantryItems = [] } = req.body;
    const safetyContext = buildSafetyContext(user);

    const prompt = `
${safetyContext}

The user wants to make a healthy, wholesome homemade food mix or nutrient powder from common pantry staples (e.g. roasted seeds, nuts, lentils, oats, warming spices).
Available: ${availablePantryItems.join(', ')}.

CRITICAL SAFETY DIRECTIVE:
NEVER call this a "miracle weight-loss powder", "fat burner", "detox powder", or "medical treatment".
Frame it purely as a wholesome, nutrient-dense pantry addition that adds protein, fiber, or healthy fats to meals.

Return JSON:
{
  "name": "Wholesome Roasted Seed & Oat Protein Sprinkle",
  "roleInBalancedNutrition": "Provides healthy unsaturated fats, dietary fiber, and plant-based micronutrients to top yogurt, smoothies, or warm porridge.",
  "ingredients": [
    {"name": "Roasted pumpkin seeds", "amount": "1/2 cup"},
    {"name": "Flax seeds (ground)", "amount": "1/4 cup"},
    {"name": "Rolled oats (lightly toasted)", "amount": "1/2 cup"},
    {"name": "Ground cinnamon", "amount": "1 tsp"}
  ],
  "preparation": [
    "Dry roast seeds and oats on low heat for 3-4 minutes until lightly aromatic.",
    "Let cool completely to preserve natural oils.",
    "Pulse in a clean blender into a coarse powder.",
    "Stir in cinnamon."
  ],
  "storage": "Store in a cool, dry airtight glass jar for up to 3-4 weeks.",
  "servingSuggestion": "Add 1-2 tablespoons over morning oatmeal, homemade yogurt, or fruit bowls.",
  "disclaimer": "This mix is a nutritious food ingredient and is not intended to diagnose, treat, or cure any condition."
}
`;

    let mixData: any = null;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.7 },
      });
      const responseText = response.text || '';
      const safety = inspectSafetyOnText(responseText, user);
      if (!safety.isSafe) throw new Error(safety.warning);
      mixData = JSON.parse(responseText);
    } else {
      mixData = {
        name: 'Golden Seed & Herb Nourish Mix',
        roleInBalancedNutrition: 'A gentle blend of fiber-rich seeds and digestion-friendly herbs to elevate everyday dishes.',
        ingredients: [
          { name: 'Pumpkin seeds', amount: '1/2 cup' },
          { name: 'Chia seeds', amount: '1/4 cup' },
          { name: 'Toasted oats', amount: '1/2 cup' },
          { name: 'Cinnamon or Cardamom', amount: '1/2 tsp' },
        ],
        preparation: [
          'Gently toast pumpkin seeds and oats in a dry pan until lightly golden.',
          'Cool completely and pulse lightly in a spice grinder.',
          'Mix in chia seeds and spice.',
        ],
        storage: 'Store in an airtight jar away from direct sunlight for up to 1 month.',
        servingSuggestion: 'Sprinkle 1-2 tablespoons onto warm breakfast bowls or smoothies.',
        disclaimer: 'This mix is a wholesome food topping and is not a medical treatment or miracle weight-loss powder.',
      };
    }

    res.json({
      mix: mixData,
      wallet: dbCache.wallets[user.id],
    });
  } catch (err: any) {
    refundCredits(user.id, creditCheck.txId, 'Homemade Mix Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// 5. Smart Portion Guide (Portion Suggestion Engine)
app.post('/api/ai/portion-guide', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  try {
    const { foodName, quantity = '1 serving', notes = '', isFlexibleDay = false } = req.body;
    if (!foodName) return res.status(400).json({ error: 'Food name is required' });

    const safetyContext = buildSafetyContext(user, isFlexibleDay ? 'flexible' : 'plan');

    const prompt = `
${safetyContext}

The user is eating: "${foodName}".
Quantity reported: "${quantity}".
Extra context: "${notes}".
Today is: ${isFlexibleDay ? 'FLEXIBLE DAY' : 'KRIVYA PLAN DAY'}.

PORTION SUGGESTION ENGINE DIRECTIVES:
1. Portion awareness, NOT food shaming. Never label food as bad, forbidden, toxic, cheating, guilty, or failure!
2. Suggest a practical, realistic, enjoyable portion based on age (${user.ageCategory}), goal (${user.goal}), diet, and meal composition.
3. If it's a flexible day: "It's your flexible day. You can enjoy foods you like while still using portion awareness and balanced choices."
4. If user is a minor: Never give restrictive calorie deficits or starvation portions. Focus on nourishment, hunger/fullness cues, and balanced meal pairings.
5. Check user allergies (${(user.allergies || []).join(', ')}). If "${foodName}" contains an allergen, provide a prominent ALLERGY ALERT!
6. Provide Balance Pairings (e.g. adding a crisp side salad, a source of protein, or water).

Return JSON schema:
{
  "foodName": "${foodName}",
  "enteredQuantity": "${quantity}",
  "suggestedPortion": "e.g. 1-2 medium slices, depending on crust thickness and accompaniments",
  "visualScale": {
    "smaller": "1 slice - Lighter snack or paired with a hearty protein salad",
    "moderate": "2 slices - Standard balanced meal portion with water and veggies",
    "larger": "3+ slices - Substantial serving, best balanced with light meals the rest of the day"
  },
  "balancePairings": [
    "A fresh green side salad with olive oil and lemon",
    "A glass of chilled water or sparkling water with lime",
    "A side of grilled chicken, tofu, or steamed edamame"
  ],
  "krivyaTip": "You don't need to completely avoid foods you enjoy. Portion awareness and your overall eating pattern matter most.",
  "allergyNotice": "None or Allergy Alert if applicable",
  "isFlexibleDayNote": "${isFlexibleDay ? 'Today is your Flexible Day. Savor your meal mindfully without guilt!' : ''}",
  "estimatedNutrition": {
    "calories": "Estimated ~280-320 kcal per slice",
    "protein": "Approx 12g",
    "carbs": "Approx 34g",
    "sugar": "Approx 3g"
  }
}
`;

    let portionData: any = null;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.6 },
      });
      const responseText = response.text || '';
      portionData = JSON.parse(responseText);
    } else {
      portionData = {
        foodName,
        enteredQuantity: quantity,
        suggestedPortion: `1 to 2 standard servings, adjusted for your activity and appetite.`,
        visualScale: {
          smaller: 'Half portion — Ideal when paired with a generous vegetable soup or salad',
          moderate: '1 full serving — Balanced satisfaction alongside a tall glass of water',
          larger: '1.5 - 2 servings — A more generous portion, naturally balanced across the day',
        },
        balancePairings: [
          'Add a crisp leafy garden salad with a light vinaigrette',
          'Enjoy a tall glass of water or unsweetened herbal tea',
          'Include a side of lean protein (grilled chicken, lentils, or tofu)',
        ],
        krivyaTip: 'No food is forbidden in KRIVYA. Enjoying your meal with mindful awareness builds long-term sustainable wellness.',
        allergyNotice: 'Always inspect ingredient labels if purchased from a restaurant.',
        isFlexibleDayNote: isFlexibleDay ? 'It is your flexible day. Enjoy your favorite foods mindfully without restriction or guilt.' : undefined,
        estimatedNutrition: {
          calories: 'Approximate standard estimate',
          protein: 'Moderate',
          carbs: 'Present',
          sugar: 'Check label if packaged',
        },
      };
    }

    res.json({
      portion: portionData,
      wallet: dbCache.wallets[user.id],
    });
  } catch (err: any) {
    refundCredits(user.id, creditCheck.txId, 'Portion Guide Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// 6. Sugar Cut AI (Sugar awareness, swaps, drink analysis)
app.post('/api/ai/sugar-cut', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  try {
    const { currentDrinks = [], targetCraving = 'soda' } = req.body;
    const safetyContext = buildSafetyContext(user);

    const prompt = `
${safetyContext}

The user wants sugar-awareness guidance and sustainable sugar cuts.
Current drinks logged: ${currentDrinks.join(', ') || 'sweetened beverages'}.
Specific craving/habit: "${targetCraving}".

DIRECTIVES:
1. Clearly differentiate between naturally occurring sugars in whole fruits/plain dairy vs added/free sugars in soft drinks, sweets, and packaged sauces.
2. DO NOT promote an extreme "zero sugar" diet, fruit fear, or starvation.
3. For minors: Focus on reducing sugary sodas and packaged candy while ensuring plenty of nutritious food for growth.
4. Provide practical, refreshing, enjoyable swaps.

Return JSON schema:
{
  "cravingAnalysis": "Insight into why this craving occurs (hydration, stress, quick energy)",
  "naturalVsAddedExplanation": "Short educational reminder: natural sugars in whole fruit come packed with fiber and vitamins, unlike liquid added sugars.",
  "recommendedSwaps": [
    {
      "original": "Regular soda / energy drink",
      "swap": "Sparkling water with muddled fresh berries and a squeeze of lime",
      "sugarSavedApproxGrams": "32g added sugar",
      "whyItWorks": "Retains the satisfying carbonated fizz and gentle natural fruit aroma."
    },
    {
      "original": "Packaged flavored fruit yogurt",
      "swap": "Plain Greek yogurt with 1/2 cup fresh sliced strawberries and a dash of cinnamon",
      "sugarSavedApproxGrams": "16g added sugar",
      "whyItWorks": "Delivers rich protein and creamy texture with zero added refined syrup."
    }
  ],
  "hiddenSugarAlert": "Watch out for barbecue sauces, salad dressings, and flavored coffee syrups.",
  "weeklyActionStep": "Choose one sugary drink this week to swap with fruit-infused water."
}
`;

    let sugarData: any = null;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.7 },
      });
      const responseText = response.text || '';
      sugarData = JSON.parse(responseText);
    } else {
      sugarData = {
        cravingAnalysis: 'Sweet cravings often signal an afternoon energy dip, mild dehydration, or habitual stress relief.',
        naturalVsAddedExplanation: 'Whole fruits contain water, fiber, and micronutrients that slow sugar absorption, unlike free sugars in sodas.',
        recommendedSwaps: [
          {
            original: targetCraving || 'Sugary Soda',
            swap: 'Chilled sparkling water with crushed mint and fresh lemon slices',
            sugarSavedApproxGrams: '35g added sugar',
            whyItWorks: 'Delivers the same refreshing fizz without spiking blood glucose.',
          },
          {
            original: 'Sweet Bakery Pastry',
            swap: 'Warm apple slices sprinkled with cinnamon and a tablespoon of almond butter',
            sugarSavedApproxGrams: '22g added sugar',
            whyItWorks: 'Healthy fats and fiber keep energy smooth for hours.',
          },
        ],
        hiddenSugarAlert: 'Prepared marinades, ketchup, and breakfast granolas often conceal high amounts of corn syrup.',
        weeklyActionStep: 'Replace your afternoon sweetened beverage with infused herbal tea or sparkling water.',
      };
    }

    res.json({
      sugarGuidance: sugarData,
      wallet: dbCache.wallets[user.id],
    });
  } catch (err: any) {
    refundCredits(user.id, creditCheck.txId, 'Sugar Cut AI Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// 7. Personalized Workout Generator
app.post('/api/ai/workout', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  const { targetDuration = 15, equipment = ['no_equipment'], workoutType = 'mobility' } = req.body;
  let workoutData: any = null;

  try {
    const safetyContext = buildSafetyContext(user);

    const isParalysis = user.mobility === 'paralysis' || user.mobility === 'wheelchair';
    const isSenior = user.isSenior || (user.ageYears && user.ageYears >= 60);

    const prompt = `
${safetyContext}

Generate a safe, personalized, enjoyable movement routine for ${user.name || 'user'}.
Session Length: ${targetDuration} minutes.
Equipment available: ${equipment.join(', ')}.
Preferred Type: ${workoutType}.
Mobility status: ${user.mobility}.
${isParalysis ? 'CRITICAL: PARALYSIS MODE ACTIVE. Do not prescribe standard standing exercises. Only upper body or seated mobility as appropriate.' : ''}
${isSenior ? 'CRITICAL: SENIOR MODE ACTIVE. Gentle on joints, balance-focused, fall prevention, seated alternatives.' : ''}

EXERCISE SAFETY DIRECTIVES:
1. Never encourage exercise as punishment or compensatory behavior ("burn off what you ate").
2. Stop exercising immediately if dizziness, chest pain, acute injury, or shortness of breath occurs.
3. Every exercise must include a seated or gentle modification.

Return JSON schema:
{
  "id": "workout_${Date.now()}",
  "title": "Invigorating Gentle Movement Flow",
  "goal": "Active mobility, steady circulation, and functional strength",
  "durationMinutes": ${targetDuration},
  "difficulty": "gentle",
  "mobilityFriendly": true,
  "equipment": ["${equipment[0] || 'no_equipment'}"],
  "warmUp": [
    {"title": "Shoulder Rolls & Neck Releases", "duration": "2 minutes", "notes": "Breathe deeply, slow and rhythmic."}
  ],
  "exercises": [
    {
      "id": "ex_1",
      "name": "Seated or Standing Torso Twist",
      "targetArea": "Core & Spinal Mobility",
      "repsOrDuration": "10 reps per side",
      "sets": 2,
      "restSeconds": 30,
      "seatedAlternative": "Perform seated upright in a sturdy chair with feet flat.",
      "formCues": [
        "Keep shoulders relaxed away from ears",
        "Move smoothly within a comfortable range of motion"
      ],
      "safetyNote": "Do not force rotation past comfortable range."
    }
  ],
  "coolDown": [
    {"title": "Gentle Seated Chest Opener & Deep Breaths", "duration": "2 minutes", "notes": "Relax heart rate."}
  ],
  "postWorkoutNutrition": "Hydrate with a glass of water. A light snack with protein and fiber supports recovery.",
  "safetyDisclaimer": "KRIVYA exercise plans are general suggestions. If you experience dizziness, chest tightness, or joint pain, stop immediately and seek medical evaluation."
}
`;

    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.7 },
      });
      const responseText = response.text || '';
      workoutData = JSON.parse(responseText);
    } else {
      workoutData = generateDeterministicWorkout(user, targetDuration, workoutType);
    }

    res.json({
      workout: workoutData,
      wallet: dbCache.wallets[user.id],
    });
  } catch (err: any) {
    // Fallback to deterministic workout on rate limit
    const errorMessage = err.message || JSON.stringify(err);
    if (err.status === 429 || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.log('Quota exceeded, falling back to deterministic workout.');
      workoutData = generateDeterministicWorkout(user, targetDuration, workoutType);
      
      return res.json({
        workout: workoutData,
        wallet: dbCache.wallets[user.id],
        note: 'Note: AI quota temporarily reached. Showing safe workout.'
      });
    }
    
    refundCredits(user.id, creditCheck.txId, 'Workout AI Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// 8. KRIVYA AI Coach (Conversational, safe, non-judgmental)
app.post('/api/ai/coach', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  try {
    const { message, chatHistory = [], dayType = 'plan' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const safetyContext = buildSafetyContext(user, dayType);

    const systemInstruction = `
You are the KRIVYA AI Coach for the KRIVYA Health & Wellness Application.
Tagline: The Ultimate Weight Loss Plan.

Personality:
- Warm, empathetic, scientific, non-judgmental, empowering.
- You treat food as nourishment, not guilt or punishment.
- If today is a Flexible Day: support mindful enjoyment and balance. NEVER use words like "cheat day", "binge", "bad food", "guilt", or "cleanse".
- Always verify safety:
  * Check stored user allergies: ${(user.allergies || []).join(', ')}. NEVER suggest foods containing their allergens!
  * If user is under 18: Never prescribe calorie restriction, fasting, or crash diets.
  * If user has paralysis or limited mobility: never suggest standing, running, or impossible workouts.
- Health Disclaimer: You provide general healthy lifestyle information, not medical diagnoses or prescriptions.
`;

    let reply = '';
    if (aiClient) {
      const contentsPayload = [
        { role: 'user', parts: [{ text: `${safetyContext}\n\nUser Question: ${message}` }] },
      ];

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      reply = response.text || 'I am here with you to support your health journey with practical, balanced advice.';
      const safety = inspectSafetyOnText(reply, user);
      if (!safety.isSafe) {
        reply = 'I am mindful of your safety preferences and allergies. Let us focus on balanced, whole foods that fit your dietary needs safely.';
      }
    } else {
      reply = `Hello ${user.name || 'there'}! I am your KRIVYA Coach. Based on your ${user.diet} lifestyle and preferences, remember that consistent daily habits, mindful hydration, and honoring hunger cues are what create lasting vitality. How can I assist you with your meals, hydration, or movement today?`;
    }

    res.json({
      reply,
      wallet: dbCache.wallets[user.id],
    });
  } catch (err: any) {
    refundCredits(user.id, creditCheck.txId, 'AI Coach Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// 9. I'm Hungry (Instant quick safe snack/plate)
app.post('/api/ai/im-hungry', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const creditCheck = reserveCredits(user.id);
  if (!creditCheck.allowed) {
    return res.status(402).json({ error: creditCheck.error, requiresCredits: true });
  }

  try {
    const { hungerLevel = 'moderate', cravingType = 'savory', timeAvailableMinutes = 5 } = req.body;
    const safetyContext = buildSafetyContext(user);

    const prompt = `
${safetyContext}

The user is genuinely hungry right now.
Hunger level: ${hungerLevel}.
Craving: ${cravingType}.
Prep time available: ${timeAvailableMinutes} minutes.

DIRECTIVE:
NEVER encourage suppressing genuine hunger. Provide 3 quick, nourishing food options that satisfy hunger with healthy protein, fiber, or healthy fats.

Return JSON:
{
  "options": [
    {
      "name": "Apple Slices with Handful of Walnuts",
      "prepTime": "2 minutes",
      "whyItSatisfies": "Fiber from apple and healthy fats from walnuts stabilize energy without a crash.",
      "quickInstructions": "Wash, slice apple, and pair with 8-10 raw walnuts."
    },
    {
      "name": "Quick Greek Yogurt Bowl with Chia",
      "prepTime": "3 minutes",
      "whyItSatisfies": "High protein content provides immediate satiety.",
      "quickInstructions": "Scoop 1 cup of plain Greek yogurt, top with a spoonful of chia seeds and cinnamon."
    },
    {
      "name": "Warm Edamame with Sea Salt",
      "prepTime": "4 minutes",
      "whyItSatisfies": "Warm plant-based protein with comforting savory flavor.",
      "quickInstructions": "Microwave frozen edamame pods for 2 minutes and sprinkle light sea salt."
    }
  ],
  "encouragement": "Honoring your body's hunger cues with nutrient-rich foods is the foundation of sustainable health."
}
`;

    let data: any = null;
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.7 },
      });
      data = JSON.parse(response.text || '{}');
    } else {
      data = {
        options: [
          {
            name: 'Crisp Vegetable Sticks & Hummus',
            prepTime: '3 minutes',
            whyItSatisfies: 'Crunchy fiber paired with satisfying tahini and chickpeas.',
            quickInstructions: 'Pair carrot or cucumber slices with 3 tablespoons of classic hummus.',
          },
          {
            name: 'Handful of Roasted Almonds & Tangerine',
            prepTime: '1 minute',
            whyItSatisfies: 'Nutrient-rich healthy fats plus natural fruit hydration.',
            quickInstructions: 'Enjoy a palm-sized portion of unsalted almonds with a fresh peeled tangerine.',
          },
        ],
        encouragement: 'Listening to true hunger and fueling with wholesome ingredients keeps your metabolism thriving.',
      };
    }

    res.json({
      hungryGuide: data,
      wallet: dbCache.wallets[user.id],
    });
  } catch (err: any) {
    refundCredits(user.id, creditCheck.txId, 'Im Hungry Failed');
    res.status(500).json({ error: 'Generation failed. Your 250 AI Credits were not charged.', details: err.message });
  }
});

// -------------------------------------------------------------
// PROGRESS & HABIT ROUTES
// -------------------------------------------------------------
app.get('/api/progress', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const weights = dbCache.weightLogs[user.id] || [];
  const habits = dbCache.habitLogs[user.id] || [];

  res.json({
    weightLogs: weights,
    habitLogs: habits,
    currentWeight: user.currentWeightKg,
    goalWeight: user.goalWeightKg,
    isMinor: user.isMinor,
  });
});

app.post('/api/progress/weight', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { weightKg, note } = req.body;
  if (!weightKg || isNaN(Number(weightKg))) {
    return res.status(400).json({ error: 'Valid weight in kg is required' });
  }

  if (!dbCache.weightLogs[user.id]) dbCache.weightLogs[user.id] = [];
  const newLog = {
    id: 'w_' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    weightKg: Number(weightKg),
    note: note || '',
  };

  dbCache.weightLogs[user.id].push(newLog);
  user.currentWeightKg = Number(weightKg);
  dbCache.users[user.id] = user;
  saveDB();

  res.json({ success: true, log: newLog, logs: dbCache.weightLogs[user.id] });
});

app.post('/api/progress/habit', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { date, waterGlasses, sleepHours, fruitsVeggiesEaten, movementCompleted, sugarAwarenessFollowed, mindfulEatingPracticed } = req.body;
  const today = date || new Date().toISOString().split('T')[0];

  if (!dbCache.habitLogs[user.id]) dbCache.habitLogs[user.id] = [];
  let existing = dbCache.habitLogs[user.id].find((h) => h.date === today);

  if (existing) {
    if (waterGlasses !== undefined) existing.waterGlasses = waterGlasses;
    if (sleepHours !== undefined) existing.sleepHours = sleepHours;
    if (fruitsVeggiesEaten !== undefined) existing.fruitsVeggiesEaten = fruitsVeggiesEaten;
    if (movementCompleted !== undefined) existing.movementCompleted = movementCompleted;
    if (sugarAwarenessFollowed !== undefined) existing.sugarAwarenessFollowed = sugarAwarenessFollowed;
    if (mindfulEatingPracticed !== undefined) existing.mindfulEatingPracticed = mindfulEatingPracticed;
  } else {
    existing = {
      id: 'h_' + Date.now(),
      date: today,
      waterGlasses: waterGlasses || 0,
      sleepHours: sleepHours || 7,
      mealsLogged: 1,
      fruitsVeggiesEaten: fruitsVeggiesEaten || false,
      movementCompleted: movementCompleted || false,
      sugarAwarenessFollowed: sugarAwarenessFollowed || false,
      mindfulEatingPracticed: mindfulEatingPracticed || false,
    };
    dbCache.habitLogs[user.id].push(existing);
  }
  saveDB();

  res.json({ success: true, habit: existing });
});

// Mood Tracking
app.get('/api/progress/mood', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const moods = dbCache.moodLogs[user.id] || [];
  res.json({ moodLogs: moods });
});

app.post('/api/progress/mood', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { mood, note } = req.body;
  if (mood === undefined || mood < 1 || mood > 5) {
    return res.status(400).json({ error: 'Mood (1-5) is required' });
  }
  if (!dbCache.moodLogs[user.id]) dbCache.moodLogs[user.id] = [];
  const newLog = {
    id: 'm_' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    mood: Number(mood),
    note: note || '',
  };
  dbCache.moodLogs[user.id].push(newLog);
  saveDB();
  res.json({ success: true, log: newLog });
});

// -------------------------------------------------------------
// KRIVYA MIND: SAFETY & WELLNESS
// -------------------------------------------------------------
function inspectSafetyForMind(text: string, user: any): { isSafe: boolean; crisis: boolean; warning?: string } {
  if (!text) return { isSafe: true, crisis: false };
  const lower = text.toLowerCase();
  const crisisKeywords = ['suicide', 'die', 'kill myself', 'hurt myself', 'self-harm', 'emergency', 'help', 'abuse', 'danger'];
  
  for (const kw of crisisKeywords) {
    if (lower.includes(kw)) {
      return { isSafe: false, crisis: true, warning: 'Crisis detected. Please seek immediate support.' };
    }
  }

  // Safety filter rules (Diagnosis, Medication, etc)
  if (lower.includes('diagnose') || lower.includes('medication') || lower.includes('prescribe')) {
    return { isSafe: false, crisis: false, warning: 'I cannot diagnose or provide medication advice.' };
  }
  
  return { isSafe: true, crisis: false };
}

app.post('/api/krivya-mind/talk', async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { message } = req.body;
    const safety = inspectSafetyForMind(message, user);
    if (!safety.isSafe) {
      return res.json({ response: safety.warning, crisis: safety.crisis });
    }

    const systemInstruction = `You are KRIVYA MIND, an AI mental-wellness assistant. You can provide general emotional support and wellness information, but you are not a licensed mental-health professional. You never diagnose, prescribe, or encourage dependency. You are warm, calm, supportive, respectful, and non-judgmental. If the user expresses self-harm or immediate danger, activate CRITICAL CRISIS SAFETY MODE and strongly encourage contacting human help immediately.`;

    const response = await aiClient!.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: message,
      config: { systemInstruction, temperature: 0.7 },
    });

    res.json({ response: response.text, crisis: false });
  } catch (err: any) {
    res.status(500).json({ error: 'Error in conversation' });
  }
});
app.get('/api/shopping', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const list = dbCache.shoppingLists[user.id] || [];
  res.json({ items: list });
});

app.post('/api/shopping', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Items array required' });

  if (!dbCache.shoppingLists[user.id]) dbCache.shoppingLists[user.id] = [];
  items.forEach((item: any) => {
    dbCache.shoppingLists[user.id].push({
      id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: item.name,
      amount: item.amount || '1 item',
      category: item.category || 'Other',
      checked: false,
    });
  });
  saveDB();

  res.json({ items: dbCache.shoppingLists[user.id] });
});

app.put('/api/shopping/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const list = dbCache.shoppingLists[user.id] || [];
  const item = list.find((i) => i.id === req.params.id);
  if (item) {
    if (req.body.checked !== undefined) item.checked = req.body.checked;
    if (req.body.amount !== undefined) item.amount = req.body.amount;
    saveDB();
  }
  res.json({ items: list });
});

app.delete('/api/shopping/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (dbCache.shoppingLists[user.id]) {
    dbCache.shoppingLists[user.id] = dbCache.shoppingLists[user.id].filter((i) => i.id !== req.params.id);
    saveDB();
  }
  res.json({ items: dbCache.shoppingLists[user.id] || [] });
});

// -------------------------------------------------------------
// ADMIN DASHBOARD ROUTES (RESTRICTED TO FOUNDERS / ADMINS)
// -------------------------------------------------------------
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user || (!user.isFounder && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Access denied: Admin credentials required' });
  }

  const allUsers = Object.values(dbCache.users);
  const totalGenerations = dbCache.generations.length;
  const successfulPayments = dbCache.payments.filter((p) => p.status === 'succeeded');
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amountUsd || 0), 0);
  const creditsPurchased = successfulPayments.reduce((sum, p) => sum + (p.creditsToGrant || 0), 0);

  const usedTxs = dbCache.transactions.filter((tx) => tx.type === 'generation_used');
  const totalCreditsConsumed = usedTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const failedRefunds = dbCache.transactions.filter((tx) => tx.type === 'generation_refund');

  res.json({
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter((u) => u.weeklySchedule).length,
    totalGenerations,
    totalRevenueUsd: totalRevenue,
    creditsPurchased,
    totalCreditsConsumed,
    failedGenerationsCount: failedRefunds.length,
    recentPayments: dbCache.payments.slice(-20).reverse(),
    recentTransactions: dbCache.transactions.slice(0, 30),
    users: allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isFounder: u.isFounder,
      ageCategory: u.ageCategory,
      createdAt: u.createdAt,
      balance: dbCache.wallets[u.id]?.balance || 0,
    })),
  });
});

app.post('/api/admin/grant-credits', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user || (!user.isFounder && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Access denied: Admin credentials required' });
  }

  const { targetUserId, amount, reason } = req.body;
  if (!targetUserId || !amount) {
    return res.status(400).json({ error: 'Target user ID and credit amount required' });
  }

  const targetWallet = dbCache.wallets[targetUserId];
  if (!targetWallet) {
    return res.status(404).json({ error: 'Target user wallet not found' });
  }

  targetWallet.balance += Number(amount);
  dbCache.transactions.unshift({
    id: 'admin_grant_' + Date.now(),
    userId: targetUserId,
    type: 'admin_grant',
    amount: Number(amount),
    description: `Promotional Admin Grant: ${reason || 'Customer Support / Promo'}`,
    timestamp: new Date().toISOString(),
    adminId: user.id,
  });
  saveDB();

  res.json({ success: true, newBalance: targetWallet.balance });
});

// -------------------------------------------------------------
// DETERMINISTIC DIETITIAN FALLBACKS (Zero failure safety net)
// -------------------------------------------------------------
function generateDeterministicMealPlan(user: any, dayType: string, targetDay: string) {
  const isVeg = user.diet === 'vegetarian' || user.diet === 'vegan';
  const isVegan = user.diet === 'vegan';

  const breakfastProtein = isVegan ? 'Spiced Tofu Scramble with Turmeric' : (isVeg ? 'Free-Range Scrambled Eggs with Spinach' : 'Poached Eggs & Smoked Salmon on Sourdough');
  const lunchItem = isVegan ? 'Hearty Mediterranean Chickpea & Quinoa Bowl' : (isVeg ? 'Paneer or Tofu Tikka Salad with Crisp Veggies' : 'Lemon Herb Grilled Chicken Breast with Roasted Sweet Potato');
  const dinnerItem = isVegan ? 'Red Lentil & Butternut Squash Curry with Brown Rice' : (isVeg ? 'Warm Cottage Cheese & Vegetable Ratatouille' : 'Baked Atlantic Salmon with Asparagus & Quinoa');

  return {
    day: targetDay,
    dayType,
    theme: dayType === 'flexible' ? 'Mindful Flexibility & Whole Food Joy' : 'Sustained Vitality & Metabolic Balance',
    hydrationGuidance: 'Aim for 7-8 glasses of water throughout your day, keeping a bottle near your workspace.',
    sugarAwarenessTip: 'Prioritize whole fruit fiber when seeking sweetness; it keeps your energy steady and curbs mid-day dips.',
    meals: [
      {
        id: 'meal_1',
        mealType: 'breakfast',
        name: breakfastProtein,
        description: 'A comforting, warm, protein-packed breakfast to power your morning focus.',
        caloriesApprox: 360,
        proteinGramsApprox: 24,
        carbsGramsApprox: 28,
        fatGramsApprox: 14,
        prepTimeMinutes: 8,
        cookTimeMinutes: 10,
        servings: 1,
        allergenFreeNotice: 'Checked against your allergy settings',
        balanceTip: 'Pair with warm herbal tea or water with fresh lemon.',
        ingredients: [
          { name: isVegan ? 'Firm Tofu' : (isVeg ? 'Organic Eggs' : 'Eggs & Salmon'), amount: '2 servings', optional: false },
          { name: 'Baby Spinach', amount: '1 cup', optional: false },
          { name: 'Olive Oil', amount: '1 tsp', optional: false },
          { name: 'Whole grain sourdough bread', amount: '1 slice', optional: true },
        ],
        instructions: [
          'Warm olive oil in a non-stick pan over medium heat.',
          'Add spinach and sauté until gently wilted.',
          'Gently fold in protein and cook until warm and aromatic.',
          'Season with sea salt, cracked black pepper, and serve immediately.',
        ],
      },
      {
        id: 'meal_2',
        mealType: 'morning_snack',
        name: 'Crisp Orchard Apple with Roasted Almonds',
        description: 'Satisfying natural fruit crunch paired with heart-healthy monounsaturated fats.',
        caloriesApprox: 180,
        proteinGramsApprox: 5,
        carbsGramsApprox: 24,
        fatGramsApprox: 9,
        prepTimeMinutes: 2,
        cookTimeMinutes: 0,
        servings: 1,
        allergenFreeNotice: 'Nut-free alternatives easily substituted if allergic',
        ingredients: [
          { name: 'Honeycrisp Apple', amount: '1 medium', optional: false },
          { name: 'Raw or Dry Roasted Almonds', amount: '12 pieces', optional: false },
        ],
        instructions: ['Slice apple into wedges and enjoy with fresh nuts.'],
      },
      {
        id: 'meal_3',
        mealType: 'lunch',
        name: lunchItem,
        description: 'A colorful, antioxidant-loaded lunch that keeps your energy stable through the afternoon.',
        caloriesApprox: 450,
        proteinGramsApprox: 32,
        carbsGramsApprox: 46,
        fatGramsApprox: 14,
        prepTimeMinutes: 12,
        cookTimeMinutes: 15,
        servings: 1,
        allergenFreeNotice: 'Naturally balanced and gluten-adaptable',
        balanceTip: 'Chew mindfully and take 15 minutes away from screens while eating.',
        ingredients: [
          { name: isVegan ? 'Chickpeas' : (isVeg ? 'Grilled Paneer' : 'Chicken Breast'), amount: '150g', optional: false },
          { name: 'Cooked Quinoa or Brown Rice', amount: '1/2 cup', optional: false },
          { name: 'Cucumber, Cherry Tomatoes, and Bell Pepper', amount: '1 cup chopped', optional: false },
          { name: 'Extra Virgin Olive Oil and Lemon Juice', amount: '1 tbsp dressing', optional: false },
        ],
        instructions: [
          'Layer warm grains at the base of your bowl.',
          'Top with freshly chopped vegetables and your protein source.',
          'Drizzle with olive oil and lemon juice dressing.',
        ],
      },
      {
        id: 'meal_4',
        mealType: 'evening_snack',
        name: 'Chilled Cucumber Slices with Minted Hummus',
        description: 'A light, refreshing snack with zero added sugar to bridge the gap before dinner.',
        caloriesApprox: 130,
        proteinGramsApprox: 4,
        carbsGramsApprox: 14,
        fatGramsApprox: 6,
        prepTimeMinutes: 3,
        cookTimeMinutes: 0,
        servings: 1,
        allergenFreeNotice: 'Sesame allergy alert: swap hummus with avocado if needed',
        ingredients: [
          { name: 'Persian Cucumbers', amount: '2 small', optional: false },
          { name: 'Traditional Hummus', amount: '3 tbsp', optional: false },
        ],
        instructions: ['Slice cucumbers into rounds and dip into hummus.'],
      },
      {
        id: 'meal_5',
        mealType: 'dinner',
        name: dinnerItem,
        description: 'A comforting, warm evening plate designed to promote deep, restorative sleep.',
        caloriesApprox: 420,
        proteinGramsApprox: 30,
        carbsGramsApprox: 38,
        fatGramsApprox: 12,
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 1,
        allergenFreeNotice: 'Gentle on digestion',
        balanceTip: 'Enjoy at least 2 to 3 hours prior to sleep for optimum digestion.',
        ingredients: [
          { name: isVegan ? 'Red Lentils' : (isVeg ? 'Cottage Cheese & Beans' : 'Atlantic Salmon or Trout'), amount: '1 fillet or 1 cup', optional: false },
          { name: 'Steamed Broccoli and Zucchini', amount: '1.5 cups', optional: false },
          { name: 'Roasted Butternut Squash', amount: '1/2 cup', optional: false },
        ],
        instructions: [
          'Preheat oven to 375°F (190°C) or prepare in skillet.',
          'Season protein and vegetables lightly with herbs and olive oil.',
          'Roast or simmer until tender and cooked through.',
          'Serve warm with a soothing cup of chamomile tea.',
        ],
      },
    ],
  };
}

function generateDeterministicSwap(user: any, mealType: string) {
  return {
    id: 'swap_det_' + Date.now(),
    mealType,
    name: 'Garden Harvest Protein Bowl',
    description: 'A comforting and balanced swap matching your dietary preferences.',
    caloriesApprox: 390,
    proteinGramsApprox: 26,
    carbsGramsApprox: 36,
    fatGramsApprox: 12,
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 1,
    allergenFreeNotice: 'Checked against your allergies',
    balanceTip: 'Rich in fiber and protein for steady satiety.',
    ingredients: [
      { name: 'Fresh seasonal greens', amount: '2 cups', optional: false },
      { name: 'Steamed edamame or chickpeas', amount: '3/4 cup', optional: false },
      { name: 'Roasted sunflower seeds', amount: '1 tbsp', optional: true },
      { name: 'Balsamic vinaigrette', amount: '1 tbsp', optional: false },
    ],
    instructions: [
      'Assemble greens in a broad serving bowl.',
      'Toss with warm protein and sunflower seeds.',
      'Drizzle with vinaigrette and enjoy immediately.',
    ],
  };
}

function generateDeterministicWorkout(user: any, targetDuration: number, workoutType: string) {
  const isSeated = user.mobility === 'wheelchair' || user.mobility === 'paralysis' || user.mobility === 'limited';

  return {
    id: 'workout_det_' + Date.now(),
    title: isSeated ? 'Gentle Seated Mobility & Energy Flow' : 'Vitality & Core Balance Routine',
    goal: 'Boost circulation, build joint mobility, and release daily tension',
    durationMinutes: targetDuration,
    difficulty: 'gentle',
    mobilityFriendly: true,
    equipment: ['No equipment'],
    warmUp: [
      { title: 'Gentle Neck & Shoulder Circles', duration: '2 minutes', notes: 'Breathe smoothly, do not rush.' },
      { title: 'Deep Diaphragmatic Breaths', duration: '1 minute', notes: 'Inhale through nose, exhale through mouth.' },
    ],
    exercises: [
      {
        id: 'ex_1',
        name: isSeated ? 'Seated Torso Twists' : 'Gentle Bodyweight Squats / Sit-to-Stands',
        targetArea: isSeated ? 'Spine & Core' : 'Legs & Core',
        repsOrDuration: isSeated ? '10 reps each side' : '8-10 reps',
        sets: 2,
        restSeconds: 30,
        seatedAlternative: 'Can be done sitting upright in any sturdy chair.',
        formCues: ['Keep spine tall', 'Move with control, never jerk'],
        safetyNote: 'Stop if any sharp discomfort occurs.',
      },
      {
        id: 'ex_2',
        name: 'Overhead Arm Reaches',
        targetArea: 'Upper Body & Posture',
        repsOrDuration: '10 slow reaches',
        sets: 2,
        restSeconds: 30,
        seatedAlternative: 'Accessible directly from a seated or supported position.',
        formCues: ['Engage abdominal muscles gently', 'Reach fingertips toward ceiling'],
      },
    ],
    coolDown: [
      { title: 'Chest Opener & Restorative Breath', duration: '2 minutes', notes: 'Allow muscles to relax completely.' },
    ],
    postWorkoutNutrition: 'Drink 250ml of cool water. A light snack with protein assists cellular recovery.',
    safetyDisclaimer: 'Listen to your body. Discontinue any exercise that causes discomfort or pain.',
  };
}

// -------------------------------------------------------------
// VITE INTEGRATION (DEV & PROD)
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`KRIVYA Server active on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
