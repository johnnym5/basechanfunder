import React, { useState } from 'react';
import {
  ShieldAlert,
  Sliders,
  Database,
  RefreshCw,
  Globe,
  Zap,
  Lock,
  Activity,
  ChevronRight,
  Save,
  Info
} from 'lucide-react';

// --- Types ---

interface RiskConfig {
  fxBuffer: number;
  holdingDays: number;
  anomalyThreshold: number;
  syncInterval: number;
}

// --- Main Component ---

export const AdminConsole: React.FC = () => {
  const [config, setConfig] = useState<RiskConfig>({
    fxBuffer: 10.5,
    holdingDays: 28,
    anomalyThreshold: 2.5,
    syncInterval: 900
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // In a real app, this would update Firestore
    }, 1500);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Header Section with Action */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase text-white">Settings Console</h2>
          <div className="flex items-center space-x-2">
             <span className="text-[9px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest">Global Settings</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="group flex items-center justify-center space-x-2 md:space-x-3 px-4 py-2.5 md:px-6 md:py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
          )}
          <span>Commit Configuration</span>
        </button>
      </header>

      {/* Global Parameters Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Main Controls */}
        <div className="md:col-span-8 space-y-6 md:space-y-8">
          <div className="bg-slate-900/40 border border-white/5 p-5 md:p-8 rounded-3xl md:rounded-[3rem] backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div>
                <h2 className="text-base md:text-lg font-black flex items-center gap-2 md:gap-3">
                  <Sliders className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> Rule Settings
                </h2>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1">Configuring rules for automatic student checks.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {/* FX Buffer */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exchange rate room (%)</label>
                    <span className="text-sm font-black text-amber-500">{config.fxBuffer}%</span>
                 </div>
                 <input
                    type="range" min="1" max="25" step="0.5"
                    value={config.fxBuffer}
                    onChange={(e) => setConfig({...config, fxBuffer: parseFloat(e.target.value)})}
                    className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-[8px] font-black text-slate-600">
                    <span>MIN (1%)</span>
                    <span>MAX (25%)</span>
                 </div>
              </div>

              {/* Holding Period */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Holding Time (Days)</label>
                    <span className="text-sm font-black text-amber-500">{config.holdingDays} Days</span>
                 </div>
                 <input
                    type="range" min="7" max="90" step="1"
                    value={config.holdingDays}
                    onChange={(e) => setConfig({...config, holdingDays: parseInt(e.target.value)})}
                    className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-[8px] font-black text-slate-600">
                    <span>MIN (7D)</span>
                    <span>MAX (90D)</span>
                 </div>
              </div>

              {/* Anomaly R */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Large deposit warning level</label>
                    <span className="text-sm font-black text-rose-500">{config.anomalyThreshold}</span>
                 </div>
                 <input
                    type="range" min="1" max="10" step="0.1"
                    value={config.anomalyThreshold}
                    onChange={(e) => setConfig({...config, anomalyThreshold: parseFloat(e.target.value)})}
                    className="w-full accent-rose-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-[8px] font-black text-slate-600">
                    <span>LOW (1.0)</span>
                    <span>HIGH (10.0)</span>
                 </div>
              </div>

              {/* Sync Interval */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update frequency (Sec)</label>
                    <span className="text-sm font-black text-emerald-500">{config.syncInterval}s</span>
                 </div>
                 <input
                    type="range" min="300" max="3600" step="300"
                    value={config.syncInterval}
                    onChange={(e) => setConfig({...config, syncInterval: parseInt(e.target.value)})}
                    className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-[8px] font-black text-slate-600">
                    <span>5 MIN</span>
                    <span>1 HOUR</span>
                 </div>
              </div>
            </div>

            <div className="mt-10 p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start space-x-4">
              <Info className="w-5 h-5 text-amber-500 mt-0.5" />
              <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                “Changes to the exchange rate safety room directly affect the balance calculation in the Student Portal.
                Increasing this room will require applicants to hold more local currency.”
              </p>
            </div>
          </div>

          {/* Ingestion Node Health */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3 text-cyan-400">
                    <Globe className="w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">OANDA API Bridge</h3>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Current GBP/NGN Rate</p>
                  <p className="text-xl font-black text-slate-200 font-mono">1,945.50</p>
                </div>
             </div>

             <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3 text-purple-400">
                    <Database className="w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Ingestion Cluster</h3>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Aggregated TPS</p>
                  <p className="text-xl font-black text-slate-200 font-mono">14.8 req/s</p>
                </div>
             </div>
          </div>
        </div>

        {/* Infrastructure Summary / Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-xl">
             <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-slate-400">Security & Rules</h3>
             <div className="space-y-4">
                {[
                  { label: 'Secure data', status: 'WORKING', icon: Lock, color: 'text-emerald-400' },
                  { label: 'Verified messages', status: 'ACTIVE', icon: Zap, color: 'text-amber-500' },
                  { label: 'Visa Rules', status: 'UPDATED', icon: Activity, color: 'text-cyan-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-950/40 border border-white/5 rounded-2xl">
                     <div className="flex items-center space-x-3">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter">{item.label}</span>
                     </div>
                     <span className={`text-[9px] font-black ${item.color}`}>{item.status}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-[2.5rem] text-slate-950 shadow-2xl shadow-amber-500/10 group cursor-pointer overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-24 h-24" />
             </div>
             <h3 className="text-sm font-black uppercase tracking-tight relative z-10">Emergency Stop</h3>
             <p className="text-[10px] font-bold uppercase opacity-80 mt-1 relative z-10">Stop all student checks</p>
             <div className="mt-8 flex items-center justify-between relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest">Level 1 Alert</span>
                <ChevronRight className="w-5 h-5" />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
