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
import { toast } from 'sonner';

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
      toast.success('Global System Parameters Synced to Redis/PostgreSQL Cluster');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-8 font-sans selection:bg-amber-500/30 overflow-x-hidden relative">

      {/* Background Effect */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-10">

        {/* Header Section */}
        <header className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">Governance Console</h1>
              <div className="flex items-center space-x-2">
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Global Risk Control</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="group flex items-center space-x-3 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95"
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
          <div className="md:col-span-8 space-y-8">
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[3rem] backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-3">
                    <Sliders className="w-5 h-5 text-amber-500" /> Risk Parameter Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Configuring threshold constraints for Go PoF matrix evaluation.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* FX Buffer */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FX Volatility Buffer (%)</label>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Holding Period (Days)</label>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anomaly Threshold (R-Ratio)</label>
                      <span className="text-sm font-black text-rose-500">{config.anomalyThreshold}</span>
                   </div>
                   <input
                      type="range" min="1" max="10" step="0.1"
                      value={config.anomalyThreshold}
                      onChange={(e) => setConfig({...config, anomalyThreshold: parseFloat(e.target.value)})}
                      className="w-full accent-rose-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                   />
                   <div className="flex justify-between text-[8px] font-black text-slate-600">
                      <span>NOMINAL (1.0)</span>
                      <span>AGGRESSIVE (10.0)</span>
                   </div>
                </div>

                {/* Sync Interval */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bridge Sync Pulse (Sec)</label>
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
                  “Changes to the FX Volatility Buffer directly affect the liquid balance calculation in the Student Portal.
                  Increasing the buffer will require applicants to hold more local currency to maintain compliance.”
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
               <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-slate-400">Security & Compliance</h3>
               <div className="space-y-4">
                  {[
                    { label: 'AES-256-GCM Vault', status: 'NOMINAL', icon: Lock, color: 'text-emerald-400' },
                    { label: 'HMAC SMS Signature', status: 'ACTIVE', icon: Zap, color: 'text-amber-500' },
                    { label: 'UKVI Regulatory Map', status: 'SYNCED', icon: Activity, color: 'text-cyan-400' },
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
               <h3 className="text-sm font-black uppercase tracking-tight relative z-10">Emergency System Lockdown</h3>
               <p className="text-[10px] font-bold uppercase opacity-80 mt-1 relative z-10">Freeze all PoF evaluations</p>
               <div className="mt-8 flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest">Protocol 0-ALPHA</span>
                  <ChevronRight className="w-5 h-5" />
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
