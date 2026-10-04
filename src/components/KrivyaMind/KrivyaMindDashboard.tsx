import React from 'react';
import {
  MessageCircle,
  Smile,
  Wind,
  Brain,
  BookOpen,
  Moon,
  Zap,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const KrivyaMindDashboard: React.FC = () => {
  const { setQuickModal, setKrivyaMindContext } = useApp();

  const menuItems = [
    { name: 'Talk to KRIVYA MIND', icon: MessageCircle, id: 'talk' },
    { name: 'Mood Check-in', icon: Smile, id: 'mood' },
    { name: 'Calm Down', icon: Wind, id: 'breathing' },
    { name: 'Mindfulness', icon: Brain, id: 'mindfulness' },
    { name: 'Journal', icon: BookOpen, id: 'journal' },
    { name: 'Sleep Support', icon: Moon, id: 'sleep' },
    { name: 'Daily Reset', icon: Zap, id: 'reset' },
    { name: 'Mental Wellness', icon: HelpCircle, id: 'education' },
  ];

  return (
    <div className="space-y-6 pb-24 px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100">
      <div className="bg-gradient-to-br from-emerald-500/10 to-stone-500/10 p-6 rounded-3xl border border-emerald-500/20">
        <h1 className="text-2xl font-bold font-display text-emerald-900 dark:text-emerald-50">
          🧠 KRIVYA MIND
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
          Your space for healthier thoughts, emotions, and everyday well-being.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setKrivyaMindContext(item.id);
              setQuickModal('krivya_chat');
            }}
            className="flex flex-col items-center p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/60 transition-all shadow-sm text-center cursor-pointer"
          >
            <item.icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3" />
            <span className="text-sm font-semibold text-stone-900 dark:text-white">{item.name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => {}}
        className="w-full p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/20 transition-all"
      >
        <AlertTriangle className="w-5 h-5" />
        🆘 GET HUMAN HELP
      </button>

      <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed">
        KRIVYA MIND provides general mental-wellness information and emotional support. It is not a licensed psychologist, psychiatrist, therapist, or doctor and does not diagnose or treat mental-health conditions. If you are experiencing serious or persistent distress, speak with a qualified professional. If you are in immediate danger, contact local emergency or crisis services.
      </div>
    </div>
  );
};
