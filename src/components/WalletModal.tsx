import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CreditCard,
  Crown,
  CheckCircle2,
  Lock,
  X,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const WalletModal: React.FC = () => {
  const { user, wallet, closeCreditModal, refreshWallet, refreshUser, showNotification } = useApp();

  const [packages, setPackages] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);

  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState<'packages' | 'payment_form' | 'success' | 'error'>('packages');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [currentIntentId, setCurrentIntentId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isFounder = user?.isFounder;
  const isUnlimited = wallet?.isUnlimited || isFounder;
  const balance = wallet?.balance ?? 500;

  useEffect(() => {
    const loadWalletInfo = async () => {
      try {
        const res = await api.getWallet();
        setPackages(res.packages);
        setTransactions(res.transactions);
      } catch (err) {
        console.warn('Wallet load:', err);
      }
    };
    loadWalletInfo();
  }, []);

  const handleStartCheckout = async (pkg: any) => {
    setSelectedPkg(pkg);
    setErrorMessage('');
    setIsProcessingPayment(true);
    try {
      const res = await api.createCheckoutIntent(pkg.id);
      setCurrentIntentId(res.intentId);
      setCheckoutStep('payment_form');
    } catch (err: any) {
      showNotification(err.message || 'Failed to initialize checkout', 'warning');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentIntentId) return;

    // Basic format validation
    if (cardNumber.replace(/\s/g, '').length < 15) {
      setErrorMessage('Please enter a valid card number');
      return;
    }

    setIsProcessingPayment(true);
    setErrorMessage('');

    try {
      // Simulate secure tokenization (client generates opaque token without transmitting raw sensitive card to our server)
      const simulatedToken = 'tok_' + Math.random().toString(36).substring(2, 12) + Date.now();
      const idempotencyKey = 'idemp_' + currentIntentId + '_' + Date.now();

      // Send to server verification endpoint
      const res = await api.confirmCheckout(currentIntentId, simulatedToken, idempotencyKey);
      await refreshWallet();
      await refreshUser();
      setCheckoutStep('success');
      showNotification(`Successfully added ${res.creditsGranted.toLocaleString()} AI Credits!`, 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment authorization was rejected. No credits were added.');
      setCheckoutStep('error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-6 text-stone-900 dark:text-stone-100 text-left my-8 relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeCreditModal}
          aria-label="Close modal"
          className="absolute right-5 top-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
                KRIVYA Credit Wallet
              </h2>
              {isFounder && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  FOUNDER
                </span>
              )}
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              250 AI Credits = 1 Full AI Generation
            </span>
          </div>
        </div>

        {/* Balance Card */}
        <div
          className={`p-5 rounded-3xl border ${
            isUnlimited
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300'
              : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider block opacity-75">
                Current Available Balance
              </span>
              <span className="text-3xl font-extrabold font-mono tracking-tight block mt-0.5">
                {isUnlimited ? 'UNLIMITED' : `${balance.toLocaleString()} Credits`}
              </span>
            </div>

            {isUnlimited ? (
              <Crown className="w-8 h-8 text-amber-500 shrink-0" />
            ) : (
              <div className="text-right">
                <span className="text-xs font-mono text-stone-500 block">
                  ≈ {Math.floor(balance / 250)} Generations
                </span>
              </div>
            )}
          </div>

          {isFounder ? (
            <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs font-medium">
              FOUNDER ACCOUNT — UNLIMITED CREDITS · Free access across all AI features.
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs flex justify-between text-stone-600 dark:text-stone-400">
              <span>Cost per feature: 250 credits</span>
              <span>Automatic refund if any AI generation fails</span>
            </div>
          )}
        </div>

        {/* STEP 1: PACKAGES SELECTION */}
        {checkoutStep === 'packages' && !isFounder && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider font-mono">
              Purchase Verified Credit Packages:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(packages.length > 0 ? packages : [
                { id: 'krivya_plus', name: 'KRIVYA PLUS', priceUsd: 40, credits: 5000, generationsApprox: 20 },
                { id: 'krivya_pro', name: 'KRIVYA PRO', priceUsd: 60, credits: 10000, generationsApprox: 40 },
                { id: 'krivya_ultra', name: 'KRIVYA ULTRA', priceUsd: 80, credits: 15000, generationsApprox: 60 },
                { id: 'krivya_max', name: 'KRIVYA MAX', priceUsd: 100, credits: 30000, generationsApprox: 120 },
              ]).map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-3 bg-white dark:bg-stone-900 shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-stone-900 dark:text-white">
                        {pkg.name}
                      </span>
                      <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                        ${pkg.priceUsd}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-stone-500 block mt-1">
                      {pkg.credits.toLocaleString()} AI Credits
                    </span>
                    <span className="text-[11px] text-stone-400 block">
                      ≈ {pkg.generationsApprox} AI generations
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartCheckout(pkg)}
                    disabled={isProcessingPayment}
                    className="w-full py-2 px-3 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-stone-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>Select Package</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Anti-fraud & Security note */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                Encrypted checkout with server-verified idempotency. Credits are never awarded on unverified transactions.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: SECURE PAYMENT CHECKOUT FORM */}
        {checkoutStep === 'payment_form' && selectedPkg && (
          <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div>
                <span className="font-bold text-sm text-stone-900 dark:text-white">
                  Checkout: {selectedPkg.name}
                </span>
                <span className="text-stone-500 block text-[11px]">
                  {selectedPkg.credits.toLocaleString()} AI Credits
                </span>
              </div>
              <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                ${selectedPkg.priceUsd}.00
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Card Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="4242 ···· ···· 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">MM / YY</label>
                  <input
                    type="text"
                    required
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">CVC</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="90210"
                    value={cardZip}
                    onChange={(e) => setCardZip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutStep('packages')}
                className="w-1/3 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <span>Verifying Transaction...</span>
                ) : (
                  <span>Authorize & Pay ${selectedPkg.priceUsd}.00</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {checkoutStep === 'success' && selectedPkg && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Transaction Verified & Approved
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Granted {selectedPkg.credits.toLocaleString()} AI Credits to your wallet.
              </p>
            </div>
            <button
              type="button"
              onClick={closeCreditModal}
              className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && checkoutStep === 'packages' && (
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2 text-xs">
            <h4 className="font-bold text-stone-800 dark:text-stone-200 uppercase font-mono text-[10px]">
              Recent Credit Ledger:
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {transactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800/80 flex justify-between items-center"
                >
                  <div>
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
