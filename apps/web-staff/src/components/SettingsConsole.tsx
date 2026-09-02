import React, { useState, useEffect } from 'react';
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
  Clock,
  TrendingUp
} from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';

import { MAJOR_CURRENCIES } from '../constants';

// --- Types ---

type SettingTab = 'risk' | 'destinations' | 'api' | 'security';

interface RiskConfig {
  fxBuffer: number;
  holdingDays: number;
  anomalyThreshold: number;
  gracePeriodHours: number;
}

interface ApiConfig {
  monoPublicKey: string;
  okraToken: string;
  oandaRefresh: number;
}

interface SecurityConfig {
  emailAlerts: boolean;
  smsGraceTrigger: boolean;
  errorAuditLog: boolean;
  sessionTimeout: number;
}

// --- Main Component ---

export const SettingsConsole: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingTab>('risk');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form States
  const [risk, setRisk] = useState<RiskConfig>({
    fxBuffer: 10.5,
    holdingDays: 28,
    anomalyThreshold: 2.5,
    gracePeriodHours: 24
  });

  const [api, setApi] = useState<ApiConfig>({
    monoPublicKey: 'test_pk_********************',
    okraToken: 'tok_live_******************',
    oandaRefresh: 900
  });

  const [security, setSecurity] = useState<SecurityConfig>({
    emailAlerts: true,
    smsGraceTrigger: false,
    errorAuditLog: true,
    sessionTimeout: 60
  });

  const [defaultCurrency, setDefaultCurrency] = useState('NGN');

  // Global App Params (Rate etc)
  const [globalParams, setGlobalParams] = useState({
    fxRate: 1945.50,
    lastUpdate: 'Just now'
  });

  // 1. Listen for Live Config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRisk({
          fxBuffer: data.fxBuffer || 10.5,
          holdingDays: data.holdingDays || 28,
          anomalyThreshold: data.anomalyThreshold || 2.5,
          gracePeriodHours: data.gracePeriodHours || 24
        });
        setApi({
          monoPublicKey: data.monoPublicKey || 'test_pk_********************',
          okraToken: data.okraToken || 'tok_live_******************',
          oandaRefresh: data.oandaRefresh || 900
        });
        setSecurity({
          emailAlerts: data.emailAlerts ?? true,
          smsGraceTrigger: data.smsGraceTrigger ?? false,
          errorAuditLog: data.errorAuditLog ?? true,
          sessionTimeout: data.sessionTimeout || 60
        });
        setDefaultCurrency(data.defaultCurrency || 'NGN');
        setGlobalParams({
          fxRate: data.fxRate || 1945.50,
          lastUpdate: data.updatedAt?.seconds
            ? new Date(data.updatedAt.seconds * 1000).toLocaleTimeString()
            : 'Recently'
        });
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'system_config', 'global'), {
        ...risk,
        ...api,
        ...security,
        defaultCurrency,
        fxRate: globalParams.fxRate,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Success feedback
      setTimeout(() => setIsSaving(false), 800);
    } catch (e) {
      console.error('Save settings error:', e);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className={`text-2xl font-black tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>System Settings</h2>
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
      <div className={`flex items-center space-x-2 p-1.5 rounded-2xl border w-fit backdrop-blur-md overflow-x-auto no-scrollbar ${
        theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {[
          { id: 'risk', label: 'Risk & FX Buffers', icon: Sliders },
          { id: 'destinations', label: 'Destination Rules', icon: Globe },
          { id: 'api', label: 'API & Banking Keys', icon: Key },
          { id: 'security', label: 'Security & Alerts', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingTab)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={`border rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200'
      }`}>

        {activeTab === 'risk' && (
          <div className="space-y-10">
            {/* Live Rate Override (New) */}
            <div className={`p-6 rounded-3xl border-2 border-dashed ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <h4 className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Live FX Exchange Protocol</h4>
                  </div>
                  <span className="text-[10px] font-mono text-blue-500 font-bold uppercase">Manual Master Override</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Base Rate (£1.00 = ₦?)</label>
                    <input
                      type="number"
                      value={globalParams.fxRate}
                      onChange={(e) => setGlobalParams({...globalParams, fxRate: parseFloat(e.target.value)})}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className={`px-6 py-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Effective Pulse</p>
                    <p className="text-xs font-mono font-bold text-blue-500">₦{globalParams.fxRate.toLocaleString()}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Default Local Currency</label>
                <div className="grid grid-cols-3 gap-2">
                  {MAJOR_CURRENCIES.slice(0, 15).map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => setDefaultCurrency(curr.code)}
                      className={`py-3 rounded-xl border text-[10px] font-black transition-all ${
                        defaultCurrency === curr.code
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                          : theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-500 hover:text-white' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {curr.code} ({curr.symbol})
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium italic uppercase tracking-tight">Set the default operational currency for new student evaluations.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>FX Volatility Buffer (%)</label>
                  <span className="text-sm font-black text-amber-500 font-mono">{risk.fxBuffer}%</span>
                </div>
                <input
                  type="range" min="1" max="25" step="0.5"
                  value={risk.fxBuffer}
                  onChange={(e) => setRisk({...risk, fxBuffer: parseFloat(e.target.value)})}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic uppercase tracking-tight">Safety margin applied over statutory GBP requirements to insulate against NGN/GHS devaluation.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Min. Holding Period (Days)</label>
                  <span className="text-sm font-black text-amber-500 font-mono">{risk.holdingDays} Days</span>
                </div>
                <input
                  type="range" min="7" max="90" step="1"
                  value={risk.holdingDays}
                  onChange={(e) => setRisk({...risk, holdingDays: parseInt(e.target.value)})}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic uppercase tracking-tight">Global evaluation window. Standard UKVI requirement is 28 continuous days.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Anomaly Threshold (R-Ratio)</label>
                  <span className="text-sm font-black text-rose-500 font-mono">{risk.anomalyThreshold}</span>
                </div>
                <input
                  type="range" min="1" max="10" step="0.1"
                  value={risk.anomalyThreshold}
                  onChange={(e) => setRisk({...risk, anomalyThreshold: parseFloat(e.target.value)})}
                  className="w-full accent-rose-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic uppercase tracking-tight">Triggers deposit flag if (Deposit - Median) / Median exceeds this ratio. Detects "Parked Money".</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Grace Period (Hours)</label>
                  <span className="text-sm font-black text-cyan-500 font-mono">{risk.gracePeriodHours}h</span>
                </div>
                <input
                  type="range" min="4" max="72" step="4"
                  value={risk.gracePeriodHours}
                  onChange={(e) => setRisk({...risk, gracePeriodHours: parseInt(e.target.value)})}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-medium italic uppercase tracking-tight">Time allowed for students to respond to top-up alerts before a compliance break is logged.</p>
              </div>
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
              <div key={d.code} className={`border p-6 rounded-3xl space-y-4 ${
                theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-amber-500 ${
                  theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>{d.code}</div>
                <h4 className={`font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{d.country}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase"><span className="text-slate-500">Living Expense</span><span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{d.cost}</span></div>
                  <div className="flex justify-between text-[10px] font-bold uppercase"><span className="text-slate-500">Embassy Rule</span><span className={`text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{d.rule}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mono Public Key (Sandbox/Live)</label>
              <div className="relative">
                <input
                  type="text"
                  value={api.monoPublicKey}
                  onChange={(e) => setApi({...api, monoPublicKey: e.target.value})}
                  className={`w-full border rounded-2xl px-4 py-4 text-xs font-mono text-emerald-500 focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="test_pk_..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Okra Aggregator Secret</label>
              <div className="relative">
                <input
                  type="password" value={api.okraToken} readOnly
                  className={`w-full border rounded-2xl px-4 py-4 text-xs font-mono text-emerald-500 focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 uppercase hover:text-amber-600">Rotate</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            <div className={`flex items-center justify-between p-6 border rounded-3xl ${
              theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div>
                <h4 className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Email Balance Alerts</h4>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Notify students instantly if a daily closing balance drop occurs.</p>
              </div>
              <button
                onClick={() => setSecurity({...security, emailAlerts: !security.emailAlerts})}
                className={`w-12 h-6 rounded-full transition-all relative ${security.emailAlerts ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${security.emailAlerts ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className={`flex items-center justify-between p-6 border rounded-3xl ${
              theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div>
                <h4 className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SMS Grace Triggers</h4>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Send priority SMS for student-initiated top-up requests.</p>
              </div>
              <button
                onClick={() => setSecurity({...security, smsGraceTrigger: !security.smsGraceTrigger})}
                className={`w-12 h-6 rounded-full transition-all relative ${security.smsGraceTrigger ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${security.smsGraceTrigger ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className={`flex items-center justify-between p-6 border rounded-3xl ${
              theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div>
                <h4 className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Error Audit Log</h4>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Enable forensic tracking of UI/API reference errors.</p>
              </div>
              <button
                onClick={() => setSecurity({...security, errorAuditLog: !security.errorAuditLog})}
                className={`w-12 h-6 rounded-full transition-all relative ${security.errorAuditLog ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${security.errorAuditLog ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Global Status Footer */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Activity, label: "OANDA Bridge", status: `Nominal (₦${globalParams.fxRate})`, color: "text-cyan-500" },
          { icon: Lock, label: "Vault Encryption", status: "AES-256-GCM Active", color: "text-amber-500" },
          { icon: Clock, label: "System Pulse", status: `Last Update: ${globalParams.lastUpdate}`, color: "text-emerald-500" },
        ].map((item, i) => (
          <div key={i} className={`border p-6 rounded-3xl flex items-start space-x-4 transition-colors ${
            theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <item.icon className={`w-5 h-5 ${item.color} mt-0.5`} />
            <div>
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.label}</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{item.status}</p>
            </div>
          </div>
        ))}
      </footer>

    </div>
  );
};

export default SettingsConsole;
