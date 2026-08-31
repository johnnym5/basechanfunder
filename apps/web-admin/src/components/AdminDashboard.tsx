import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  UserCheck,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Settings,
  Users,
  ClipboardList,
  Lock,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Activity,
  CheckCircle2
} from 'lucide-react';

export type UserRole = 'APPLICANT' | 'STAFF_AUDITOR' | 'ADMIN_GOVERNANCE';
export type ThemeMode = 'dark' | 'light';

export interface ActiveUser {
  name: string;
  id: string;
  role: UserRole;
  roleTitle: string;
  email: string;
}

export const AdminDashboard: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN_GOVERNANCE');
  const [bufferPercent, setBufferPercent] = useState<number>(10.0);
  const [activeTab, setActiveTab] = useState<'params' | 'roles' | 'audit' | 'vault'>('params');

  const userProfiles: Record<UserRole, ActiveUser> = {
    ADMIN_GOVERNANCE: { name: 'Dr. Sarah Connor', id: 'ADM-0109', role: 'ADMIN_GOVERNANCE', roleTitle: 'Principal Governance Admin', email: 'admin@basechanfunder.com' },
    STAFF_AUDITOR: { name: 'Julian Morgan', id: 'AUD-8842', role: 'STAFF_AUDITOR', roleTitle: 'Senior Compliance Officer', email: 'j.morgan@basechanfunder.com' },
    APPLICANT: { name: 'Adebayo Ogunlesi', id: 'APP-8941', role: 'APPLICANT', roleTitle: 'Visa Applicant (Tier 4)', email: 'a.ogunlesi@university.ac.uk' }
  };

  const currentUser = userProfiles[activeRole];

  const auditLogs = [
    { id: 'LOG-9941', user: 'admin@basechanfunder.com', action: 'UPDATE_FX_SAFETY_BUFFER', detail: 'Changed FX Buffer from 8.5% to 10.0%', ip: '197.210.64.12', time: '10 mins ago' },
    { id: 'LOG-9940', user: 'system_cron', action: 'FETCH_OANDA_SPOT_RATES', detail: 'Updated GBP/NGN rate: 1945.50', ip: '10.0.4.1', time: '25 mins ago' },
    { id: 'LOG-9939', user: 'auditor.smith@ukvi.gov', action: 'EXPORT_COMPLIANCE_CERTIFICATE', detail: 'Exported Certificate for APP-2026-8941', ip: '185.12.14.99', time: '1 hour ago' },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-purple-500 selection:text-white ${
      isDark
        ? 'bg-[#07090e] text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.15),rgba(255,255,255,0))]'
        : 'bg-slate-50 text-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(147,51,234,0.08),rgba(255,255,255,0))]'
    }`}>
      {/* Top Navbar */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-500 px-8 py-3.5 flex items-center justify-between ${
        isDark
          ? 'bg-slate-950/70 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-white/70 border-slate-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.03)]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 rounded-xl bg-slate-950 border border-white/20 flex items-center justify-center font-bold text-lg text-white">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-base font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Basechanfunder Admin
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md font-mono tracking-wider ${
                isDark
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                GOVERNANCE CONTROL
              </span>
            </div>
            <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              System Parameter Management & Immutable Security Audit Stream
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Light/Dark Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all duration-300 flex items-center justify-center ${
              isDark
                ? 'bg-slate-900/80 border-white/10 text-amber-400 hover:border-white/20 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Role Switcher */}
          <div className={`flex items-center space-x-3 px-3 py-1.5 rounded-xl border backdrop-blur-md ${
            isDark ? 'bg-slate-900/60 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
              {currentUser.name.charAt(0)}
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold tracking-tight">{currentUser.name}</span>
              <span className={`text-[10px] font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{currentUser.roleTitle}</span>
            </div>

            <div className="relative">
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border appearance-none pr-7 focus:outline-none transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-950 border-white/10 text-purple-300 hover:border-purple-500/50'
                    : 'bg-slate-100 border-slate-200 text-purple-700 hover:border-purple-400'
                }`}
              >
                <option value="ADMIN_GOVERNANCE">Admin Governance</option>
                <option value="STAFF_AUDITOR">Staff Auditor</option>
                <option value="APPLICANT">Applicant (Normal User)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="p-8 max-w-7xl mx-auto grid grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className={`p-4 rounded-2xl border backdrop-blur-xl ${
            isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-3">Controls</h2>
            {[
              { id: 'params', label: 'System Parameters', icon: Sliders },
              { id: 'roles', label: 'RBAC User Management', icon: Users },
              { id: 'audit', label: 'Immutable Audit Stream', icon: ClipboardList },
              { id: 'vault', label: 'Vault Encryption Engine', icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all duration-300 ${
                    activeTab === tab.id
                      ? isDark
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-purple-600 text-white shadow-md'
                      : isDark
                      ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9">
          <div className={`p-6 rounded-3xl border backdrop-blur-xl transition-all duration-500 ${
            isDark ? 'bg-slate-900/40 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {activeTab === 'params' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">UKVI Risk Parameters & Dynamic FX Safety Buffers</h2>
                  <p className="text-xs text-slate-400 mt-1">Global mathematical constraints applied across Go PoF matrix calculations.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className={`p-5 rounded-2xl border ${
                    isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <label className="text-xs font-bold text-slate-300 block">Default FX Volatility Safety Buffer (%)</label>
                    <div className="flex items-center space-x-3 mt-3">
                      <input
                        type="number"
                        value={bufferPercent}
                        onChange={(e) => setBufferPercent(parseFloat(e.target.value) || 0)}
                        className={`px-4 py-2 rounded-xl text-sm font-mono border focus:outline-none transition-all w-32 ${
                          isDark ? 'bg-slate-900 border-white/10 text-purple-300 focus:border-purple-500' : 'bg-white border-slate-300 text-purple-700'
                        }`}
                      />
                      <span className="text-xs text-slate-400">Current: {bufferPercent}%</span>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border font-mono text-xs space-y-2 ${
                    isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-xs font-bold text-slate-300 font-sans block">OANDA Live Spot Rate Feed</span>
                    <p className="text-emerald-400 flex items-center space-x-1">
                      <Activity className="w-3.5 h-3.5" />
                      <span>CONNECTED (1,945.50 GBP/NGN)</span>
                    </p>
                    <p className="text-slate-400">Redis Cache: TTL 900s</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-4">
                <h2 className="text-xl font-extrabold tracking-tight">Immutable System Audit Stream</h2>
                <div className={`border rounded-2xl overflow-hidden font-mono text-xs ${
                  isDark ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
                }`}>
                  <table className="w-full text-left">
                    <thead className={`border-b ${isDark ? 'border-white/10 bg-slate-900/80 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                      <tr>
                        <th className="p-3">Log ID</th>
                        <th className="p-3">Actor</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Details</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className={isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-100/50'}>
                          <td className="p-3 text-purple-400">{log.id}</td>
                          <td className="p-3 text-slate-300">{log.user}</td>
                          <td className="p-3 font-semibold text-slate-200">{log.action}</td>
                          <td className="p-3 text-slate-400">{log.detail}</td>
                          <td className="p-3 text-slate-500">{log.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
