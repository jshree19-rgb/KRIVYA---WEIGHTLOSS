import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { ShoppingItem } from '../types';
import { useApp } from '../context/AppContext';

interface ShoppingListViewProps {
  onClose: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({ onClose }) => {
  const { showNotification } = useApp();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('1 item');
  const [newItemCategory, setNewItemCategory] = useState<any>('Vegetables');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'Vegetables',
    'Fruits',
    'Grains',
    'Protein',
    'Dairy/Alternatives',
    'Pantry',
    'Spices',
    'Other',
  ];

  const loadList = async () => {
    setIsLoading(true);
    try {
      const res = await api.getShoppingList();
      setItems(res.items);
    } catch (err) {
      console.warn('Shopping list load:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const res = await api.addShoppingItems([
        {
          name: newItemName.trim(),
          amount: newItemAmount.trim() || '1 item',
          category: newItemCategory,
        },
      ]);
      setItems(res.items);
      setNewItemName('');
      setNewItemAmount('1 item');
      showNotification('Added to shopping list!', 'success');
    } catch (err) {
      showNotification('Failed to add item', 'warning');
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    try {
      const res = await api.updateShoppingItem(item.id, { checked: !item.checked });
      setItems(res.items);
    } catch (err) {
      console.warn('Update item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.deleteShoppingItem(id);
      setItems(res.items);
    } catch (err) {
      console.warn('Delete item:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 text-stone-900 dark:text-stone-100 text-left my-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
              Smart Shopping List
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

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="space-y-2 text-xs">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Item name (e.g. Baby spinach, Rolled oats)..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Qty (e.g. 1 bag)"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="w-24 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Grouped by Categories */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
          {items.length === 0 ? (
            <p className="text-center py-8 text-stone-400">
              Your shopping list is empty. Add items above or click "Send to Shopping List" from your Meal Plan!
            </p>
          ) : (
            categories.map((cat) => {
              const catItems = items.filter((i) => (i.category || 'Other') === cat);
              if (catItems.length === 0) return null;
              return (
                <div key={cat} className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold block">
                    {cat} ({catItems.length})
                  </span>
                  <div className="space-y-1">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                          item.checked
                            ? 'bg-stone-50/50 dark:bg-stone-950/40 border-stone-200/50 dark:border-stone-800/50 opacity-60'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <div
                          onClick={() => handleToggle(item)}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          {item.checked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-stone-400 shrink-0" />
                          )}
                          <span className={item.checked ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-stone-400 text-[11px]">{item.amount}</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-stone-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
