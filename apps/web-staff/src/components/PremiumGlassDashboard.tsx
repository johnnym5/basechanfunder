import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Sun,
  Moon,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Globe,
  Calendar,
  MessageSquare,
  FileCheck2,
  TrendingUp,
  Check,
  BarChart3,
  Award
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

export const PremiumGlassDashboard: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [activeRole, setActiveRole] = useState<UserRole>('APPLICANT');
  const [activeTab, setActiveTab] = useState<'status' | 'banks' | 'documents' | 'support'>('status');

  const userProfiles: Record<UserRole, ActiveUser> = {
    APPLICANT: { name: 'Chidi', id: 'APP-8941', role: 'APPLICANT', roleTitle: 'UK Visa Applicant', email: 'chidi@basechanfunder.com' },
    STAFF_AUDITOR: { name: 'Julian Morgan', id: 'AUD-8842', role: 'STAFF_AUDITOR', roleTitle: 'Senior Compliance Auditor', email: 'j.morgan@basechanfunder.com' },
    ADMIN_GOVERNANCE: { name: 'Dr. Sarah Connor', id: 'ADM-0109', role: 'ADMIN_GOVERNANCE', roleTitle: 'Principal Governance Admin', email: 'admin@basechanfunder.com' }
  };

  const currentUser = userProfiles[activeRole];
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-amber-500 selection:text-slate-950 ${
      isDark
        ? 'bg-[#0A0D14] text-slate-100'
        : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Navbar Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-500 px-8 py-3.5 flex items-center justify-between ${
        isDark
          ? 'bg-[#0D111A]/90 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.6)]'
          : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-4">
          {/* User Avatar */}
          <div className="w-11 h-11 rounded-full border-2 border-[#E5A635] p-0.5 overflow-hidden shadow-lg shadow-amber-500/10">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div>
            <span className="text-[11px] font-mono text-slate-400 block tracking-wide">Hello, {currentUser.name}</span>
            <span className="text-xl font-black tracking-tight text-[#F3C77C] drop-shadow-sm">
              Basechanfunder
            </span>
          </div>
        </div>

        {/* Header Right Badges & Controls */}
        <div className="flex items-center space-x-5">
          {/* Target & Compliant Badge */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Target: UK Student Visa 🇬🇧</span>
            </div>
            <div className="mt-1 flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-[#003822] border border-[#00E676]/40 text-[#00E676] font-mono text-[10px] font-bold shadow-[0_0_12px_rgba(0,230,118,0.2)]">
              <CheckCircle2 className="w-3 h-3" />
              <span>COMPLIANT_HOLDING</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all duration-300 ${
              isDark
                ? 'bg-[#101522] border-white/10 text-amber-400 hover:border-amber-500/40'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Role Switcher Dropdown */}
          <div className={`flex items-center space-x-3 px-3.5 py-1.5 rounded-xl border backdrop-blur-md ${
            isDark ? 'bg-[#101522] border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-bold text-xs text-slate-950">
              {currentUser.name.charAt(0)}
            </div>

            <div className="flex flex-col text-left pr-1">
              <span className="text-xs font-bold">{currentUser.name}</span>
              <span className="text-[10px] text-amber-400 font-mono">{currentUser.roleTitle}</span>
            </div>

            <div className="relative">
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border appearance-none pr-7 focus:outline-none transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#0A0D14] border-white/10 text-amber-300 hover:border-amber-500/50'
                    : 'bg-slate-100 border-slate-200 text-amber-800'
                }`}
              >
                <option value="APPLICANT">Applicant (Normal User)</option>
                <option value="STAFF_AUDITOR">Staff Auditor</option>
                <option value="ADMIN_GOVERNANCE">Admin Governance</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Stitch Layout */}
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* 1. PROOF OF FUNDS TARGET CARD (Radial Ring) */}
        <div className={`p-8 rounded-3xl border text-center transition-all duration-500 shadow-2xl ${
          isDark
            ? 'bg-[#101522] border-white/10 shadow-black/60'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h2 className="text-xs font-bold font-mono tracking-[0.2em] text-slate-400 uppercase">
            PROOF OF FUNDS TARGET
          </h2>

          {/* Radial Ring Center */}
          <div className="my-8 relative w-52 h-52 mx-auto flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={isDark ? '#1E2638' : '#E2E8F0'}
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#F5B651"
                strokeWidth="7"
                strokeDasharray="263.8"
                strokeDashoffset="45"
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black tracking-tight text-white">£13,761</span>
              <span className="text-xs font-bold font-mono text-[#F5B651] mt-1">GBP Equiv.</span>
            </div>
          </div>

          {/* Current vs Required Rows */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2 border-t border-white/5 font-mono">
            <div className="text-center">
              <span className="text-slate-400 text-xs block">Current</span>
              <span className="text-lg font-bold text-white mt-1 block">₦18,450,000</span>
            </div>
            <div className="text-center border-l border-white/10">
              <span className="text-slate-400 text-xs block">Required</span>
              <span className="text-lg font-bold text-white mt-1 block">₦19,200,000</span>
            </div>
          </div>

          {/* FX Volatility Warning */}
          <div className={`mt-6 p-3 rounded-xl border max-w-md mx-auto flex items-center justify-center space-x-2 font-mono text-xs ${
            isDark ? 'bg-[#171D2D] border-white/5 text-[#F5B651]' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <TrendingUp className="w-4 h-4 text-[#F5B651]" />
            <span className="font-semibold">FX Volatility Warning: +5% Buffer Applied</span>
          </div>
        </div>

        {/* 2. 28-DAY MATURITY RULES CARD */}
        <div className={`p-6 rounded-3xl border transition-all duration-500 ${
          isDark ? 'bg-[#101522] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 font-mono">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-white">28-Day Maturity Rules</span>
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#262118] border border-[#F5B651]/30 text-[#F5B651] text-xs font-mono font-bold">
              Readiness: Sept 24, 2026
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-4">Day 19 of 28 Days Uninterrupted</h3>

          {/* Segmented Dual Bar */}
          <div className="w-full bg-[#1E2638] h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-[#F5B651] h-full rounded-full transition-all duration-500" style={{ width: '67.8%' }}></div>
          </div>
        </div>

        {/* 3. FINANCIAL INGESTION SOURCES LIST */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider px-1">
            Financial Ingestion Sources
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GTBank API Sync */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#101522] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#182032] text-[#F5B651]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">GTBank</h4>
                  <span className="text-[11px] font-mono text-slate-400">API Sync</span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]"></span>
            </div>

            {/* Zenith Parser SMS Agent */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#101522] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#182032] text-[#F5B651]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Zenith Parser</h4>
                  <span className="text-[11px] font-mono text-slate-400">SMS Agent</span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]"></span>
            </div>

            {/* MBS Ticket Statement */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#101522] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#182032] text-[#F5B651]">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">MBS Ticket</h4>
                  <span className="text-[11px] font-mono text-slate-400">Statement</span>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
            </div>
          </div>
        </div>

        {/* 4. SOURCE OF FUNDS FLAG ALERT BOX */}
        <div className={`p-6 rounded-3xl border-l-4 border-l-[#F5B651] border-y border-r border-white/10 space-y-4 ${
          isDark ? 'bg-[#101522]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 text-[#F5B651]">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold">Source of Funds Flag</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Unexplained Deposit Flagged (₦3,500,000). To maintain uninterrupted maturity status, source verification is required.
          </p>

          <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#F5B651] to-[#E5A635] hover:from-[#e0a240] hover:to-[#d4962b] text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all">
            <Upload className="w-4 h-4" />
            <span>Upload Deed / Gift Affidavit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
