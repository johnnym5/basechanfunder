import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  BarChart3,
  AlertTriangle,
  FileCheck2,
  Award,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Lock,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Download,
  FileText,
  Building2,
  RefreshCcw,
  Check
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
  const [activeRole, setActiveRole] = useState<UserRole>('STAFF_AUDITOR');
  const [selectedApplicant, setSelectedApplicant] = useState<string>('APP-2026-8941');
  const [activeTab, setActiveTab] = useState<'matrix' | 'anomalies' | 'mbs' | 'certificate'>('matrix');

  const userProfiles: Record<UserRole, ActiveUser> = {
    STAFF_AUDITOR: { name: 'Julian Morgan', id: 'AUD-8842', role: 'STAFF_AUDITOR', roleTitle: 'Senior Compliance Officer', email: 'j.morgan@basechanfunder.com' },
    APPLICANT: { name: 'Adebayo Ogunlesi', id: 'APP-8941', role: 'APPLICANT', roleTitle: 'Visa Applicant (Tier 4)', email: 'a.ogunlesi@university.ac.uk' },
    ADMIN_GOVERNANCE: { name: 'Dr. Sarah Connor', id: 'ADM-0109', role: 'ADMIN_GOVERNANCE', roleTitle: 'Principal Governance Admin', email: 'admin@basechanfunder.com' }
  };

  const currentUser = userProfiles[activeRole];

  const applicants = [
    { id: 'APP-2026-8941', name: 'Adebayo Ogunlesi', route: 'UK Student Visa (Tier 4)', targetGBP: 13340, status: 'VALIDATED', risk: 'LOW', min28Day: 14850.00, anomalyRatio: 0.12, institution: 'University of Manchester' },
    { id: 'APP-2026-9012', name: 'Chioma Nwosu', route: 'Skilled Worker Visa', targetGBP: 18500, status: 'FLAGGED', risk: 'HIGH', min28Day: 17200.00, anomalyRatio: 3.45, institution: 'NHS Healthcare Trust' },
    { id: 'APP-2026-9155', name: 'Kowshik Rahman', route: 'Graduate Route', targetGBP: 11200, status: 'PENDING', risk: 'MEDIUM', min28Day: 12100.00, anomalyRatio: 1.80, institution: 'Imperial College London' }
  ];

  const currentApp = applicants.find(a => a.id === selectedApplicant) || applicants[0];

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-cyan-500 selection:text-white ${
      isDark
        ? 'bg-[#07090e] text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]'
        : 'bg-slate-50 text-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.08),rgba(255,255,255,0))]'
    }`}>
      {/* Top Navbar */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-500 px-8 py-3.5 flex items-center justify-between ${
        isDark
          ? 'bg-slate-950/70 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-white/70 border-slate-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.03)]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 rounded-xl bg-slate-950 border border-white/20 flex items-center justify-center font-bold text-lg text-white">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-base font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Basechanfunder
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md font-mono tracking-wider ${
                isDark
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                PRO ENTERPRISE
              </span>
            </div>
            <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              UKVI 28-Day Proof of Funds Compliance & Audit Platform
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-4">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all duration-300 flex items-center justify-center ${
              isDark
                ? 'bg-slate-900/80 border-white/10 text-amber-400 hover:border-white/20 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Trial User Role Switcher Dropdown */}
          <div className={`flex items-center space-x-3 px-3 py-1.5 rounded-xl border backdrop-blur-md ${
            isDark
              ? 'bg-slate-900/60 border-white/10 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
              {currentUser.name.charAt(0)}
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold tracking-tight">{currentUser.name}</span>
              <span className={`text-[10px] font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{currentUser.roleTitle}</span>
            </div>

            <div className="relative">
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border appearance-none pr-7 focus:outline-none transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-950 border-white/10 text-cyan-300 hover:border-cyan-500/50'
                    : 'bg-slate-100 border-slate-200 text-cyan-700 hover:border-cyan-400'
                }`}
              >
                <option value="STAFF_AUDITOR">Staff Auditor</option>
                <option value="APPLICANT">Applicant (Normal User)</option>
                <option value="ADMIN_GOVERNANCE">Admin Governance</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Permission Context Banner */}
      <div className={`px-8 py-2 border-b text-xs flex items-center justify-between font-mono backdrop-blur-md transition-colors duration-500 ${
        isDark
          ? 'bg-slate-950/40 border-white/5 text-slate-400'
          : 'bg-slate-100/60 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center space-x-2">
          {activeRole === 'STAFF_AUDITOR' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          ) : activeRole === 'ADMIN_GOVERNANCE' ? (
            <KeyRound className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>ROLE CONTEXT: <strong>{currentUser.role}</strong> ({currentUser.email})</span>
        </div>
        <span className="text-[11px] opacity-75">UKVI Regulation Standard v2.4 Compliant</span>
      </div>

      {/* Main Workspace Layout */}
      <div className="p-8 max-w-7xl mx-auto grid grid-cols-12 gap-8">
        {/* Left Side: Applicant Queue (Shown for Staff/Admin) */}
        {activeRole !== 'APPLICANT' && (
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className={`p-4 rounded-2xl border backdrop-blur-xl flex items-center justify-between ${
              isDark ? 'bg-slate-900/50 border-white/10 shadow-2xl' : 'bg-white/80 border-slate-200/80 shadow-sm'
            }`}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Applications Queue</h2>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                isDark ? 'bg-slate-800 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                3 Pending
              </span>
            </div>

            <div className="space-y-3">
              {applicants.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApplicant(app.id)}
                  className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                    selectedApplicant === app.id
                      ? isDark
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                        : 'bg-white border-blue-500/50 shadow-md ring-1 ring-blue-500/20'
                      : isDark
                      ? 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/70'
                      : 'bg-white/60 border-slate-200/60 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`font-bold text-sm transition-colors ${
                        selectedApplicant === app.id
                          ? isDark ? 'text-cyan-300' : 'text-blue-600'
                          : isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {app.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{app.id} • {app.institution}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider font-mono border ${
                      app.status === 'VALIDATED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : app.status === 'FLAGGED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className={`grid grid-cols-2 gap-3 pt-3 border-t text-xs font-mono ${
                    isDark ? 'border-white/5' : 'border-slate-100'
                  }`}>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">Required Target</span>
                      <span className="font-bold text-slate-300">£{app.targetGBP.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">28-Day Min Balance</span>
                      <span className={`font-bold ${app.min28Day >= app.targetGBP * 1.1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        £{app.min28Day.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Side: Main Detail & Matrix Workspace */}
        <div className={`col-span-12 ${activeRole === 'APPLICANT' ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {/* Header Applicant Info Glass Panel */}
          <div className={`p-6 rounded-3xl border backdrop-blur-xl transition-all duration-500 ${
            isDark
              ? 'bg-slate-900/50 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]'
              : 'bg-white/80 border-slate-200/80 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black tracking-tight">{activeRole === 'APPLICANT' ? currentUser.name : currentApp.name}</h2>
                  <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
                    isDark ? 'bg-slate-800 border-white/10 text-cyan-300' : 'bg-slate-100 border-slate-200 text-blue-700'
                  }`}>
                    {activeRole === 'APPLICANT' ? 'APP-8941' : currentApp.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeRole === 'APPLICANT' ? 'University of Manchester' : currentApp.institution}</span>
                  <span>•</span>
                  <span>{activeRole === 'APPLICANT' ? 'UK Student Visa (Tier 4)' : currentApp.route}</span>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl border text-right font-mono ${
                  isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase font-sans tracking-wider block">Risk Rating</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-end space-x-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>LOW RISK</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Tab Navigation Bar */}
            <div className="flex space-x-2 mt-6 pt-6 border-t border-white/5 overflow-x-auto">
              {[
                { id: 'matrix', label: '28-Day Matrix', icon: BarChart3 },
                { id: 'anomalies', label: 'Anomaly Detector', icon: AlertTriangle },
                { id: 'mbs', label: 'MBS PDF Forensic', icon: FileCheck2 },
                { id: 'certificate', label: 'UKVI Certificate', icon: Award }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all duration-300 ${
                      activeTab === tab.id
                        ? isDark
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                          : 'bg-blue-600 text-white shadow-md'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matrix Tab Content */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
                  isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className="text-xs text-slate-400 font-medium">28-Day Lowest Balance</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      £{(activeRole === 'APPLICANT' ? 14850 : currentApp.min28Day).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400/80 font-mono mt-1 block">✓ Compliant Threshold</span>
                </div>

                <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
                  isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className="text-xs text-slate-400 font-medium">Target + 10% FX Buffer</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-2xl font-black font-mono text-cyan-400">
                      £{((activeRole === 'APPLICANT' ? 13340 : currentApp.targetGBP) * 1.1).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">Target: £{(activeRole === 'APPLICANT' ? 13340 : currentApp.targetGBP).toLocaleString()}</span>
                </div>

                <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
                  isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className="text-xs text-slate-400 font-medium">UKVI Rule Status</span>
                  <div className="flex items-center space-x-2 mt-2 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-2xl font-black tracking-tight">PASSED</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">28 / 28 Consecutive Days</span>
                </div>
              </div>

              {/* Glass Bar Matrix Chart Visualizer */}
              <div className={`p-6 rounded-3xl border backdrop-blur-xl ${
                isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">28-Day Daily Closing Balance Timeline</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Automated GBP conversion via live OANDA spot rates</p>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    28 Days Verified
                  </span>
                </div>

                <div className="h-40 flex items-end justify-between space-x-2 pt-6">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const heightPercent = 65 + Math.sin(i * 0.5) * 20 + (i === 12 ? -15 : 0);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            heightPercent < 55
                              ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                              : 'bg-gradient-to-t from-cyan-600 to-blue-500 group-hover:from-cyan-400 group-hover:to-blue-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          }`}
                        />
                        <span className="text-[9px] text-slate-400 mt-2 font-mono">D{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Forensic Tab Content */}
          {activeTab === 'mbs' && (
            <div className={`p-6 rounded-3xl border backdrop-blur-xl space-y-5 ${
              isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center space-x-3">
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold">MyBankStatement (MBS) Forensic Audit Inspection</h3>
              </div>

              <div className={`p-4 rounded-2xl border font-mono text-xs space-y-3 ${
                isDark ? 'bg-slate-950/80 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Digital RSA-2048 Cryptographic Signature:</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>AUTHENTIC (GTBank RSA Root)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">PDF Embedded Vector Fonts Integrity:</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>UNMODIFIED (No Photoshop layers)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Transaction Balance Reconciliation:</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>100% MATCH (28/28 Snapshots)</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Certificate Tab */}
          {activeTab === 'certificate' && (
            <div className={`p-8 rounded-3xl border backdrop-blur-xl text-center space-y-6 ${
              isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold">Official UKVI Proof of Funds Certificate</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Generates an encrypted, digitally-signed PDF verification report compliant with Home Office Appendix Finance rules.
                </p>
              </div>

              <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 inline-flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Digitally Signed PDF Certificate</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
