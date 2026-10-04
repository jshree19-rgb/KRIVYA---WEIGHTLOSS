import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  User,
  Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export const AICoachView: React.FC = () => {
  const { user, todayScheduleType, openCreditModal, showNotification } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_welcome',
      sender: 'coach',
      text: `Hello ${user?.name || 'there'}! I am your KRIVYA AI Coach. I'm here to support your nutrition, safe movement, mindful portions, and daily hydration without guilt or judgment. How can I assist your health journey today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    'What should I eat for dinner tonight?',
    'Craving chocolate — any mindful swaps?',
    'How do I balance pizza slices?',
    'Quick 10-min seated mobility flow',
    'Explain natural vs added sugars',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || inputText).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await api.askAICoach(text, messages, todayScheduleType);
      const coachMsg: ChatMessage = {
        id: 'msg_res_' + Date.now(),
        sender: 'coach',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Coach is temporarily unavailable', 'warning');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Web Speech Recognition for voice input
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification('Voice input is not supported in this browser.', 'info');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
      };
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-3xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold font-display text-stone-900 dark:text-white">
              KRIVYA AI Coach
            </h1>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 block -mt-0.5">
              Empathetic, safety-aware, 250 AI credits per consultation
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
          {todayScheduleType === 'plan' ? '🥗 Plan Day Active' : '🌿 Flexible Day Active'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'coach' && (
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
              <span
                className={`block text-[9px] mt-1 font-mono ${
                  msg.sender === 'user' ? 'text-emerald-200 text-right' : 'text-stone-400 text-left'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-stone-400 text-xs pl-9">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            <span>Coach is formulating personalized advice...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none shrink-0">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 shrink-0 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-2 shrink-0 shadow-sm"
      >
        <button
          type="button"
          onClick={toggleVoiceInput}
          aria-label="Voice input"
          className={`p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer ${
            isListening ? 'text-red-500 bg-red-50 dark:bg-red-950/40 animate-pulse' : ''
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          placeholder="Ask about meals, recipes, cravings, workouts..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-transparent text-xs sm:text-sm text-stone-900 dark:text-white focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-stone-950 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
