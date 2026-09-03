import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Plus,
  Clock,
  TrendingUp,
  Calendar,
  Lock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ApprovedTopUpCardProps {
  account: {
    id: string;
    bankName: string;
    accountNumberMasked: string;
    balanceNgn: number;
    balanceGbp: number;
    connectedAt: string; // Used as Request Date
    lastSyncedAt: string;
  };
  evaluation: {
    expirationDate: string | null;
    startDate: string | null;
  };
  onSync: (id: string) => void;
  onAdditionalTopUp: () => void;
  isSyncing: boolean;
}

export const ApprovedTopUpCard: React.FC<ApprovedTopUpCardProps> = ({
  account,
  evaluation,
  onSync,
  onAdditionalTopUp,
  isSyncing
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number } | null>(null);

  // 1. Calculate Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (!evaluation.expirationDate) return;

      const now = new Date().getTime();
      const expiry = new Date(evaluation.expirationDate).getTime();
      const diff = expiry - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [evaluation.expirationDate]);

  const formattedRequestDate = useMemo(() => {
    return new Date(account.connectedAt).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [account.connectedAt]);

  const formattedExpirationDate = useMemo(() => {
    if (!evaluation.expirationDate) return 'N/A';
    return new Date(evaluation.expirationDate).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [evaluation.expirationDate]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-[2.5rem] p-8 relative overflow-hidden transition-all hover:border-amber-500/50 depth-card-gold">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)] text-depth-gold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Approved Top Up Request</span>
        </div>

        <button
          onClick={() => onSync(account.id)}
          disabled={isSyncing}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-amber-500 hover:bg-amber-500/5 transition-all active:scale-95 disabled:opacity-50 depth-btn-glass"
          title="Sync Account Status"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-white/5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Requested On: {formattedRequestDate}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-amber-500 font-mono text-depth-header">₦{account.balanceNgn.toLocaleString()}</h3>
            <span className="text-xs font-bold text-slate-400">/ £{account.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Compliance Timer</span>
          </div>
          {timeLeft ? (
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white leading-none">{timeLeft.days}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Days</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white leading-none">{timeLeft.hours}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Hours</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white leading-none">{timeLeft.mins}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Mins</span>
              </div>
              <div className="ml-auto text-right">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Expires On</p>
                 <p className="text-xs font-black text-white">{formattedExpirationDate}</p>
              </div>
            </div>
          ) : (
            <div className="h-10 flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-tight">System Liquidity Node</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase">Parallex Sub-Ledger Integration</p>
          </div>
        </div>

        <button
          onClick={onAdditionalTopUp}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Additional Top Up</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
