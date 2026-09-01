import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';

// --- Types ---

interface MaturityData {
  currentDay: number;
  totalDays: number;
  percentage: number;
  status: 'COMPLIANT' | 'AT_RISK' | 'BROKEN';
}

// --- Component ---

export const StudentPortal: React.FC = () => {
  const [balance, setBalance] = useState(13761.50);
  const [target, setTarget] = useState(15000.00);
  const [maturity, setMaturity] = useState<MaturityData>({
    currentDay: 19,
    totalDays: 28,
    percentage: 67,
    status: 'COMPLIANT'
  });

  // Liquid Gauge calculation
  const fillPercentage = Math.min((balance / target) * 100, 100);

  return (
    <div className="h-screen w-full bg-[#07090e] text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest uppercase text-amber-500">Basechanfunder</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Student Portal</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full border border-white/10 bg-slate-800 flex items-center justify-center overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=Adebayo+Ogunlesi&background=f59e0b&color=0f172a" alt="User" />
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {/* Liquid Balance Gauge */}
        <section className="relative h-64 rounded-[2.5rem] bg-slate-900/40 border border-white/5 overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 z-0 transition-all duration-1000"
               style={{
                 background: `linear-gradient(0deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) ${fillPercentage}%, transparent ${fillPercentage}%)`
               }}>
            {/* Animated Wave Placeholder */}
            <div className="absolute w-[200%] h-full top-[-10%] left-[-50%] bg-amber-500/10 rounded-[40%] animate-spin-slow opacity-20"
                 style={{ top: `${100 - fillPercentage - 5}%` }} />
          </div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6">
            <TrendingUp className="w-6 h-6 text-amber-500 mb-2 opacity-50" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Liquid Balance (GBP)</p>
            <h2 className="text-4xl font-black tracking-tighter text-white">
              £{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <div className="mt-4 flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-full border border-white/5">
              <span className="text-[10px] font-bold text-slate-400">Target: £{target.toLocaleString()}</span>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <span className={`text-[10px] font-bold ${fillPercentage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {fillPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </section>

        {/* 28-Day Maturity Dial */}
        <section className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Holding Maturity</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">UKVI 28-Day Rule</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
              Active
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-800"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * maturity.percentage) / 100}
                  className="text-amber-500 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black">{maturity.currentDay}</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Day</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase mb-1">
                  <span>Progress</span>
                  <span>{maturity.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${maturity.percentage}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                “Hold funds for 9 more days to reach maturity. Avoid any withdrawals.”
              </p>
            </div>
          </div>
        </section>

        {/* Adjustment Triggers */}
        <section className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-start p-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-[2rem] text-slate-950 shadow-xl shadow-amber-500/10 active:scale-95 transition-all">
            <Zap className="w-6 h-6 mb-3" />
            <span className="text-xs font-black uppercase tracking-tight">Request Top-Up</span>
            <span className="text-[8px] font-bold uppercase opacity-60">Instant Liquidity</span>
          </button>

          <button className="flex flex-col items-start p-5 bg-slate-900 border border-white/10 rounded-[2rem] active:scale-95 transition-all">
            <Clock className="w-6 h-6 text-amber-500 mb-3" />
            <span className="text-xs font-black uppercase tracking-tight">Timeline Ext</span>
            <span className="text-[8px] font-bold uppercase text-slate-500 tracking-tighter">Grace Period</span>
          </button>
        </section>

        {/* Quick Actions / Alerts */}
        <section className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-3xl flex items-center space-x-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-rose-400 uppercase tracking-tight">FX Warning</h4>
            <p className="text-[10px] text-rose-500/80 font-medium">NGN volatility may affect your GBP target. Apply buffer soon.</p>
          </div>
          <button className="p-2 bg-slate-900 rounded-xl border border-white/5">
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </section>

      </main>

      {/* Bottom Nav Placeholder */}
      <nav className="px-8 pt-3 pb-8 bg-slate-950/80 backdrop-blur-3xl border-t border-white/5 flex justify-between items-center">
        <div className="flex flex-col items-center space-y-1 text-amber-500">
          <Zap className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase">Home</span>
        </div>
        <div className="flex flex-col items-center space-y-1 text-slate-500">
          <Clock className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase">History</span>
        </div>
        <div className="flex flex-col items-center space-y-1 text-slate-500">
          <Info className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase">Help</span>
        </div>
      </nav>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default StudentPortal;
