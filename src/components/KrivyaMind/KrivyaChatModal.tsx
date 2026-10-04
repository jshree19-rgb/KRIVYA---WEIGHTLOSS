import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Brain } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const KrivyaChatModal: React.FC = () => {
  const { setQuickModal, krivyaMindContext, setKrivyaMindContext } = useApp();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (krivyaMindContext) {
      setMessages([{ role: 'ai', text: `KRIVYA MIND activated: ${krivyaMindContext.replace('_', ' ')}. How can I support you with this today?` }]);
    }
  }, [krivyaMindContext]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/krivya-mind/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'ai', text: data.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-stone-950 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col h-[80vh]">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Brain className="w-6 h-6" />
            <h2 className="font-bold text-lg">KRIVYA MIND</h2>
          </div>
          <button onClick={() => { setQuickModal(null); setKrivyaMindContext(null); }} className="text-stone-500 hover:text-stone-900">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-2xl ${m.role === 'user' ? 'bg-emerald-600 text-white self-end' : 'bg-stone-100 dark:bg-stone-800 self-start'}`}>
              {m.text}
            </div>
          ))}
          {isLoading && <div className="text-sm text-stone-500">KRIVYA MIND is thinking...</div>}
        </div>
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            className="flex-1 p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border-none"
            placeholder="Type your message..."
          />
          <button onClick={() => sendMessage(input)} className="p-2 bg-emerald-600 text-white rounded-xl">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
