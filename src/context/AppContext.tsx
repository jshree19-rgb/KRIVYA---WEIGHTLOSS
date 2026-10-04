import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, CreditWallet, AgeCategory, DayScheduleType } from '../types';
import { api, getStoredToken } from '../services/api';

interface AppContextType {
  user: UserProfile | null;
  wallet: CreditWallet | null;
  isLoadingAuth: boolean;
  ageVerifiedCategory: AgeCategory | null;
  setAgeVerifiedCategory: (cat: AgeCategory | null) => void;
  isAgeVerified: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  fontSizeMultiplier: number;
  setFontSizeMultiplier: (val: number) => void;
  activeTab: 'home' | 'meal_plan' | 'kitchen' | 'exercise' | 'progress' | 'ai_coach' | 'profile' | 'mind';
  setActiveTab: (tab: 'home' | 'meal_plan' | 'kitchen' | 'exercise' | 'progress' | 'ai_coach' | 'profile' | 'mind') => void;
  quickModal: 'im_hungry' | 'sugar_cut' | 'portion_guide' | 'flexible_schedule' | 'wallet' | 'shopping' | 'admin' | 'krivya_chat' | null;
  setQuickModal: (modal: 'im_hungry' | 'sugar_cut' | 'portion_guide' | 'flexible_schedule' | 'wallet' | 'shopping' | 'admin' | 'krivya_chat' | null) => void;
  krivyaMindContext: string | null;
  setKrivyaMindContext: (context: string | null) => void;
  refreshUser: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  showCreditModal: boolean;
  openCreditModal: () => void;
  closeCreditModal: () => void;
  todayDayOfWeek: string;
  todayScheduleType: DayScheduleType;
  notificationBanner: { message: string; type: 'info' | 'success' | 'warning' } | null;
  showNotification: (message: string, type?: 'info' | 'success' | 'warning') => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [ageVerifiedCategory, setAgeVerifiedCategory] = useState<AgeCategory | null>(() => {
    return (localStorage.getItem('krivya_age_verified') as AgeCategory) || null;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);

  const [activeTab, setActiveTab] = useState<'home' | 'meal_plan' | 'kitchen' | 'exercise' | 'progress' | 'ai_coach' | 'profile' | 'mind'>('home');
  const [quickModal, setQuickModal] = useState<'im_hungry' | 'sugar_cut' | 'portion_guide' | 'flexible_schedule' | 'wallet' | 'shopping' | 'admin' | 'krivya_chat' | null>(null);
  const [krivyaMindContext, setKrivyaMindContext] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const [notificationBanner, setNotificationBanner] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotificationBanner({ message, type });
    setTimeout(() => {
      setNotificationBanner((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const clearNotification = () => setNotificationBanner(null);

  // Sync dark theme class on document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync high contrast
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Sync font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontSizeMultiplier}px`;
  }, [fontSizeMultiplier]);

  // Load session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }
      try {
        const res = await api.getMe();
        setUser(res.user);
        setWallet(res.wallet);
        if (res.user.ageCategory) {
          setAgeVerifiedCategory(res.user.ageCategory);
          localStorage.setItem('krivya_age_verified', res.user.ageCategory);
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    initAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setWallet(res.wallet);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const refreshWallet = async () => {
    try {
      const res = await api.getWallet();
      setWallet(res.wallet);
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
    showNotification('Profile updated successfully', 'success');
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setWallet(null);
    setAgeVerifiedCategory(null);
    localStorage.removeItem('krivya_age_verified');
    setActiveTab('home');
    showNotification('Logged out safely', 'info');
  };

  const openCreditModal = () => setShowCreditModal(true);
  const closeCreditModal = () => setShowCreditModal(false);

  // Compute today day of week and schedule type
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const dayIndex = new Date().getDay();
  const todayDayOfWeek = daysOfWeek[dayIndex];

  let todayScheduleType: DayScheduleType = 'plan';
  if (user?.weeklySchedule) {
    todayScheduleType = user.weeklySchedule[todayDayOfWeek as keyof typeof user.weeklySchedule] || 'plan';
  }

  return (
    <AppContext.Provider
      value={{
        user,
        wallet,
        isLoadingAuth,
        ageVerifiedCategory,
        setAgeVerifiedCategory: (cat) => {
          setAgeVerifiedCategory(cat);
          if (cat) localStorage.setItem('krivya_age_verified', cat);
          else localStorage.removeItem('krivya_age_verified');
        },
        isAgeVerified: !!ageVerifiedCategory,
        theme,
        setTheme,
        highContrast,
        setHighContrast,
        reducedMotion,
        setReducedMotion,
        fontSizeMultiplier,
        setFontSizeMultiplier,
        activeTab,
        setActiveTab,
        quickModal,
        setQuickModal,
        krivyaMindContext,
        setKrivyaMindContext,
        refreshUser,
        refreshWallet,
        updateUserProfile,
        logout,
        showCreditModal,
        openCreditModal,
        closeCreditModal,
        todayDayOfWeek,
        todayScheduleType,
        notificationBanner,
        showNotification,
        clearNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
