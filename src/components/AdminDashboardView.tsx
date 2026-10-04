import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  RefreshCw,
  X,
  Crown,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

interface AdminDashboardViewProps {
  onClose: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onClose }) => {
  const { user, showNotification } = useApp();
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Grant credits state
  const [targetUserId, setTargetUserId] = useState('');
  const [grantAmount, setGrantAmount] = useState('1000');
  const [grantReason, setGrantReason] = useState('Customer Support Promotion');
  const [isGranting, setIsGranting] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load admin telemetry', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !grantAmount) return;

    setIsGranting(true);
    try {
      await api.grantCredits(targetUserId, Number(grantAmount), grantReason);
      showNotification(`Granted ${Number(grantAmount).toLocaleString()} credits to user!`, 'success');
      setGrantAmount('1000');
      fetchStats();
    } catch (err: any) {
      showNotification(err.message || 'Grant failed', 'warning');
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl space-y-6 text-stone-900 dark:text-stone-100 text-left my-8 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
                  KRIVYA Founder Admin Console
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  CONFIDENTIAL
                </span>
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Server-verified transactions, user accounts, and AI generation telemetry.
              </span>
            </div>
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

        {isLoading ? (
          <div className="py-16 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
            <span>Loading admin ledger and telemetry...</span>
          </div>
        ) : stats ? (
          <div className="space-y-6 text-xs">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-stone-500 block text-[11px]">Total Members</span>
                <span className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
                  {stats.totalUsers}
                </span>
                <span className="text-[10px] text-emerald-500 font-mono">
                  {stats.activeUsers} active schedules
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-stone-500 block text-[11px]">Gross Revenue</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ${stats.totalRevenueUsd.toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Verified USD</span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-stone-500 block text-[11px]">AI Generations</span>
                <span className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
                  {stats.totalGenerations}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {stats.failedGenerationsCount} refunded
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-stone-500 block text-[11px]">Credits Consumed</span>
                <span className="text-2xl font-bold font-mono text-amber-500">
                  {stats.totalCreditsConsumed.toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {stats.creditsPurchased.toLocaleString()} bought
                </span>
              </div>
            </div>

            {/* Grant Promotional Credits Section */}
            <form
              onSubmit={handleGrantCredits}
              className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-3"
            >
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Grant Promotional AI Credits</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-stone-500 block mb-1">Target User</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none"
                  >
                    <option value="">Select a user...</option>
                    {stats.users?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) — Balance: {u.balance}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-stone-500 block mb-1">Credit Amount</label>
                  <input
                    type="number"
                    min="250"
                    step="250"
                    required
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-stone-500 block mb-1">Internal Reason</label>
                  <input
                    type="text"
                    required
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGranting || !targetUserId}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Execute Credit Grant</span>
              </button>
            </form>

            {/* Users Roster */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                Registered Member Accounts:
              </h3>
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-100 dark:bg-stone-950 text-stone-500 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Safety Mode</th>
                      <th className="p-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {stats.users?.map((u: any) => (
                      <tr key={u.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-950/40">
                        <td className="p-3">
                          <span className="font-semibold block text-stone-900 dark:text-white">
                            {u.name}
                          </span>
                          <span className="text-stone-400 font-mono text-[10px]">{u.email}</span>
                        </td>
                        <td className="p-3">
                          {u.isFounder ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold font-mono text-[10px]">
                              FOUNDER
                            </span>
                          ) : (
                            <span className="text-stone-500 capitalize">{u.role}</span>
                          )}
                        </td>
                        <td className="p-3 text-stone-500 capitalize">
                          {u.ageCategory.replace('_', ' ')}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-stone-900 dark:text-white">
                          {u.isFounder ? 'Unlimited' : u.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
