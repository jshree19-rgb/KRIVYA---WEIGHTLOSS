import React from 'react';
import {
  Home,
  UtensilsCrossed,
  ChefHat,
  Dumbbell,
  LineChart,
  Bot,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'meal_plan', label: 'Meal Plan', icon: UtensilsCrossed },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'exercise', label: 'Exercise', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: LineChart },
    { id: 'ai_coach', label: 'AI Coach', icon: Bot },
    { id: 'profile', label: 'Profile', icon: UserCheck },
  ] as const;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 transition-colors shadow-lg">
      <div className="max-w-3xl mx-auto px-2 sm:px-4 flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/50 scale-105' : ''
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[50px] sm:max-w-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
