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
  Info,
  Key,
  ShieldCheck,
  Bell,
  Clock
} from 'lucide-react';

// --- Types ---

type SettingTab = 'risk' | 'destinations' | 'api' | 'security';

interface RiskConfig {
  fxBuffer: number;
  holdingDays: number;
  anomalyThreshold: number;
  gracePeriodHours: number;
}

interface ApiConfig {
  monoKey: string;
  okraToken: string;
  oandaRefresh: number;
}

interface SecurityConfig {
  emailAlerts: boolean;
  smsGraceTrigger: boolean;
  sessionTimeout: number;
}

// --- Main Component ---

export const SettingsConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingTab>('risk');
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [risk, setRisk] = useState<RiskConfig>({
    fxBuffer: 10.5,
    holdingDays: 28,
    anomalyThreshold: 2.5,
    gracePeriodHours: 24
  });

  const [api, setApi] = useState<ApiConfig>({
    monoKey: 'sk_live_********************',
    okraToken: 'tok_live_******************',
    oandaRefresh: 900
  });

  const [security, setSecurity] = useState<SecurityConfig>({
    emailAlerts: true,
    smsGraceTrigger: false,
    sessionTimeout: 60
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // In a real app, this would update Firestore system_config
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans">

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase text-white">System Settings</h2>
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Global Governance & Parameter Management</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="group flex items-center space-x-3 px-6 py-4 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save System Settings</span>
        </button>
      </header>

      {/* Interactive Tabs */}
      <div className="flex items-center space-x-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 w-fit backdrop-blur-md overflow-x-auto no-scrollbar">
        {[
          { id: 'risk', label: 'Risk & FX Buffers', icon: Sliders },
          { id: 'destinations', label: 'Destination Rules', icon: Globe },
          { id: 'api', label: 'API & Banking Keys', icon: Key },
          { id: 'security', label: 'Security & Alerts', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingTab)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-slate-900/20 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl">

        {activeTab === 'risk' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-white uppercase tracking-wider">FX Volatility Buffer (%)</label>
                  <span className="text-sm font-black text-amber-500 font-mono">{risk.fxBuffer}%</span>
                </div>
                <input
                  type="range" min="1" max="25" step="0.5"
                  value={risk.fxBuffer}
                  onChange={(e) => setRisk({...risk, fxBuffer: parseFloat(e.target.value)})}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic">Safety margin applied over statutory GBP requirements to insulate against NGN/GHS devaluation.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-white uppercase tracking-wider">Min. Holding Period (Days)</label>
                  <span className="text-sm font-black text-amber-500 font-mono">{risk.holdingDays} Days</span>
                </div>
                <input
                  type="range" min="7" max="90" step="1"
                  value={risk.holdingDays}
                  onChange={(e) => setRisk({...risk, holdingDays: parseInt(e.target.value)})}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic">Global evaluation window. Standard UKVI requirement is 28 continuous days.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-white uppercase tracking-wider">Anomaly Threshold (R-Ratio)</label>
                  <span className="text-sm font-black text-rose-500 font-mono">{risk.anomalyThreshold}</span>
                </div>
                <input
                  type="range" min="1" max="10" step="0.1"
                  value={risk.anomalyThreshold}
                  onChange={(e) => setRisk({...risk, anomalyThreshold: parseFloat(e.target.value)})}
                  className="w-full accent-rose-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic">Triggers deposit flag if (Deposit - Median) / Median exceeds this ratio. Detects "Parked Money".</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-white uppercase tracking-wider">Grace Period (Hours)</label>
                  <span className="text-sm font-black text-cyan-400 font-mono">{risk.gracePeriodHours}h</span>
                </div>
                <input
                  type="range" min="4" max="72" step="4"
                  value={risk.gracePeriodHours}
                  onChange={(e) => setRisk({...risk, gracePeriodHours: parseInt(e.target.value)})}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic">Time allowed for students to respond to top-up alerts before a compliance break is logged.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'destinations' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { code: "GBR", country: "United Kingdom", cost: "£1,334 /mo", rule: "28 Days Continuous" },
              { code: "CAN", country: "Canada", cost: "$20,635 Min", rule: "30 Days Continuous" },
              { code: "DEU", country: "Germany", cost: "€11,208 Total", rule: "90 Days Prior" },
              { code: "USA", country: "United States", cost: "I-20 Coverage", rule: "30 Days Proof" },
            ].map((d) => (
              <div key={d.code} className="bg-slate-950/40 border border-white/5 p-6 rounded-3xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-black text-amber-500">{d.code}</div>
                <h4 className="font-black text-white">{d.country}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase"><span className="text-slate-500">Living Expense</span><span className="text-slate-300">{d.cost}</span></div>
                  <div className="flex justify-between text-[10px] font-bold uppercase"><span className="text-slate-500">Embassy Rule</span><span className="text-slate-300 text-right">{d.rule}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mono Open Banking Key</label>
              <div className="relative">
                <input
                  type="password" value={api.monoKey} readOnly
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-4 text-xs font-mono text-emerald-400 focus:outline-none"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 uppercase">Rotate</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Okra Aggregator Secret</label>
              <div className="relative">
                <input
                  type="password" value={api.okraToken} readOnly
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-4 text-xs font-mono text-emerald-400 focus:outline-none"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 uppercase">Rotate</button>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 space-y-4">
               <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-white uppercase tracking-wider">OANDA Rate Sync (Pulse)</label>
                  <span className="text-sm font-black text-cyan-400 font-mono">{api.oandaRefresh}s</span>
               </div>
               <input
                  type="range" min="300" max="3600" step="300"
                  value={api.oandaRefresh}
                  onChange={(e) => setApi({...api, oandaRefresh: parseInt(e.target.value)})}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic">Interval at which the backend fetches live GBP/NGN spot rates to update student ledgers.</p>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-950/40 border border-white/5 rounded-3xl">
              <div>
                <h4 className="text-sm font-black text-white">Email Balance Alerts</h4>
                <p className="text-[10px] text-slate-500 mt-1">Notify students instantly if a daily closing balance drop occurs.</p>
              </div>
              <button
                onClick={() => setSecurity({...security, emailAlerts: !security.emailAlerts})}
                className={`w-12 h-6 rounded-full transition-all relative ${security.emailAlerts ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${security.emailAlerts ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-950/40 border border-white/5 rounded-3xl">
              <div>
                <h4 className="text-sm font-black text-white">SMS Grace Triggers</h4>
                <p className="text-[10px] text-slate-500 mt-1">Send priority SMS for student-initiated top-up requests.</p>
              </div>
              <button
                onClick={() => setSecurity({...security, smsGraceTrigger: !security.smsGraceTrigger})}
                className={`w-12 h-6 rounded-full transition-all relative ${security.smsGraceTrigger ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${security.smsGraceTrigger ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-white uppercase tracking-wider">Admin Session TTL</label>
                <span className="text-sm font-black text-amber-500 font-mono">{security.sessionTimeout}m</span>
              </div>
              <input
                type="range" min="15" max="240" step="15"
                value={security.sessionTimeout}
                onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 font-medium italic">Duration of administrative inactivity before automated logout is enforced.</p>
            </div>
          </div>
        )}

      </div>

      {/* Global Status Footer */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex items-start space-x-4">
          <Activity className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-tight">OANDA Bridge</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Status: Nominal (1,945.50)</p>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex items-start space-x-4">
          <Lock className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-tight">Vault Encryption</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">AES-256-GCM Active</p>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex items-start space-x-4">
          <Clock className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-tight">System Pulse</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Last Sync: 12s ago</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default SettingsConsole;
