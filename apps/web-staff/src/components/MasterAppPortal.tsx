import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  TrendingUp,
  AlertTriangle,
  Upload,
  Globe,
  Calendar,
  Building2,
  CheckCircle2,
  Download,
  Plus,
  ArrowRight,
  FileText,
  Lock,
  ChevronDown,
  FileCheck2,
  Sliders,
  Users,
  ClipboardList,
  Activity,
  Check,
  X,
  Search,
  Eye
} from 'lucide-react';

export type UserRole = 'STUDENT' | 'STAFF_AUDITOR' | 'ADMIN_GOVERNANCE';

export interface UserProfile {
  name: string;
  id: string;
  role: UserRole;
  roleTitle: string;
  email: string;
  avatar: string;
}

export const MasterAppPortal: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>('STUDENT');
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'documents' | 'certificate' | 'queue' | 'forensics' | 'params' | 'audit'>('overview');

  // Admin Configurable States
  const [fxBufferPercent, setFxBufferPercent] = useState<number>(10.0);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>('APP-2026-8941');

  // User Profiles Map
  const userProfiles: Record<UserRole, UserProfile> = {
    STUDENT: {
      name: 'Chidi Ogunlesi',
      id: 'APP-2026-8941',
      role: 'STUDENT',
      roleTitle: 'Visa Applicant (Student)',
      email: 'chidi@basechanfunder.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    STAFF_AUDITOR: {
      name: 'Julian Morgan',
      id: 'AUD-8842',
      role: 'STAFF_AUDITOR',
      roleTitle: 'Senior Compliance Officer',
      email: 'j.morgan@basechanfunder.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    ADMIN_GOVERNANCE: {
      name: 'Dr. Sarah Connor',
      id: 'ADM-0109',
      role: 'ADMIN_GOVERNANCE',
      roleTitle: 'Principal Governance Admin',
      email: 'admin@basechanfunder.com',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    }
  };

  const currentUser = userProfiles[activeRole];

  // Applicants Queue for Staff/Admin
  const [applicants, setApplicants] = useState([
    { id: 'APP-2026-8941', name: 'Chidi Ogunlesi', route: 'UK Student Visa', targetGBP: 13340, status: 'VALIDATED', risk: 'LOW', min28Day: 14850.00, anomalyRatio: 0.12, institution: 'University of Manchester' },
    { id: 'APP-2026-9012', name: 'Chioma Nwosu', route: 'Skilled Worker Visa', targetGBP: 18500, status: 'FLAGGED', risk: 'HIGH', min28Day: 17200.00, anomalyRatio: 3.45, institution: 'NHS Healthcare Trust' },
    { id: 'APP-2026-9155', name: 'Kowshik Rahman', route: 'Graduate Route', targetGBP: 11200, status: 'PENDING', risk: 'MEDIUM', min28Day: 12100.00, anomalyRatio: 1.80, institution: 'Imperial College London' }
  ]);

  const selectedApp = applicants.find(a => a.id === selectedApplicantId) || applicants[0];

  const auditLogs = [
    { id: 'LOG-9941', actor: 'admin@basechanfunder.com', action: 'UPDATE_FX_SAFETY_BUFFER', detail: `Set global FX buffer to ${fxBufferPercent}%`, timestamp: '10 mins ago' },
    { id: 'LOG-9940', actor: 'system_cron', action: 'FETCH_OANDA_SPOT_RATES', detail: 'Updated GBP/NGN rate: 1,945.50', timestamp: '25 mins ago' },
    { id: 'LOG-9939', actor: 'j.morgan@basechanfunder.com', action: 'EXPORT_COMPLIANCE_CERTIFICATE', detail: 'Issued PDF Certificate for APP-2026-8941', timestamp: '1 hour ago' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP NAVBAR WITH DYNAMIC ROLE SWITCHER */}
      <header className="sticky top-0 z-50 bg-[#0D111A]/95 backdrop-blur-xl border-b border-white/10 px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <img src="/logo.svg" alt="Basechanfunder Logo" className="w-9 h-9 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-base font-black tracking-tight text-[#FFC174]">
                BASECHANFUNDER
              </span>
              <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded border ${
                activeRole === 'STUDENT'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : activeRole === 'STAFF_AUDITOR'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              }`}>
                {activeRole === 'STUDENT' ? 'STUDENT PORTAL' : activeRole === 'STAFF_AUDITOR' ? 'STAFF AUDIT CONSOLE' : 'ADMIN GOVERNANCE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">UKVI 28-Day Proof of Funds Verification System</p>
          </div>
        </div>

        {/* Right User Role Switcher Dropdown */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 px-3.5 py-1.5 rounded-xl bg-[#101522] border border-white/10">
            <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-lg object-cover border border-amber-500/40" />

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold tracking-tight text-white">{currentUser.name}</span>
              <span className="text-[10px] font-mono text-amber-400">{currentUser.roleTitle}</span>
            </div>

            {/* Interactive Role Selector */}
            <div className="relative">
              <select
                value={activeRole}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  setActiveRole(r);
                  if (r === 'STUDENT') setActiveTab('overview');
                  else if (r === 'STAFF_AUDITOR') setActiveTab('queue');
                  else setActiveTab('params');
                }}
                className="bg-[#0A0D14] border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg px-2.5 py-1.5 appearance-none pr-7 focus:outline-none cursor-pointer hover:border-amber-400"
              >
                <option value="STUDENT">🎓 Switch to: Student (Applicant)</option>
                <option value="STAFF_AUDITOR">🛡️ Switch to: Staff Auditor</option>
                <option value="ADMIN_GOVERNANCE">🔑 Switch to: Admin Governance</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* ROLE CONTEXT BANNER */}
      <div className={`px-8 py-2 border-b text-xs flex items-center justify-between font-mono ${
        activeRole === 'STUDENT'
          ? 'bg-amber-950/40 border-amber-500/20 text-amber-300'
          : activeRole === 'STAFF_AUDITOR'
          ? 'bg-cyan-950/40 border-cyan-500/20 text-cyan-300'
          : 'bg-purple-950/40 border-purple-500/20 text-purple-300'
      }`}>
        <div className="flex items-center space-x-2">
          {activeRole === 'STUDENT' ? <UserCheck className="w-4 h-4" /> : activeRole === 'STAFF_AUDITOR' ? <ShieldCheck className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
          <span>ROLE: <strong>{currentUser.role}</strong> ({currentUser.email})</span>
        </div>
        <span>Active Permissions: {activeRole === 'STUDENT' ? 'Self-Service Track & Upload' : activeRole === 'STAFF_AUDITOR' ? 'Auditor Queue & Validate' : 'Global System Parameters'}</span>
      </div>

      {/* 2. SUB-NAVIGATION TABS PER ROLE */}
      <div className="bg-[#0D111A] border-b border-white/5 px-8 py-3">
        <div className="max-w-7xl mx-auto flex space-x-3 overflow-x-auto">
          {/* STUDENT TABS */}
          {activeRole === 'STUDENT' && (
            <>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'overview' ? 'bg-[#F5B651] text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                📊 28-Day Target & Status
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'accounts' ? 'bg-[#F5B651] text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                🏦 Linked Bank Accounts
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'documents' ? 'bg-[#F5B651] text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                📂 Supporting Documents
              </button>
              <button
                onClick={() => setActiveTab('certificate')}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'certificate' ? 'bg-[#F5B651] text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                📜 UKVI Certificate
              </button>
            </>
          )}

          {/* STAFF AUDITOR TABS */}
          {activeRole === 'STAFF_AUDITOR' && (
            <>
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'queue' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                📋 Applicants Audit Queue
              </button>
              <button
                onClick={() => setActiveTab('forensics')}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'forensics' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                📑 eStatement RSA Forensic Auditor
              </button>
            </>
          )}

          {/* ADMIN GOVERNANCE TABS */}
          {activeRole === 'ADMIN_GOVERNANCE' && (
            <>
              <button
                onClick={() => setActiveTab('params')}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'params' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                ⚙️ Global System Parameters
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'audit' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                📋 Immutable Audit Log Stream
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* ========================================== */}
        {/* STUDENT ROLE VIEWS */}
        {/* ========================================== */}
        {activeRole === 'STUDENT' && activeTab === 'overview' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Target Radial Ring */}
            <div className="p-8 rounded-3xl bg-[#101522] border border-white/10 text-center space-y-6">
              <span className="text-xs font-bold font-mono text-slate-400 tracking-[0.2em]">PROOF OF FUNDS TARGET</span>
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#1E2638" strokeWidth="7" fill="transparent" />
                  <circle cx="50" cy="50" r="42" stroke="#F5B651" strokeWidth="7" strokeDasharray="263.8" strokeDashoffset="45" strokeLinecap="round" fill="transparent" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">£13,761</span>
                  <span className="text-xs font-bold font-mono text-[#F5B651] mt-1">GBP Equiv.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 font-mono text-xs">
                <div>
                  <span className="text-slate-400">Current Local</span>
                  <span className="text-base font-bold text-white block mt-1">₦18,450,000</span>
                </div>
                <div className="border-l border-white/10">
                  <span className="text-slate-400">Required Target</span>
                  <span className="text-base font-bold text-white block mt-1">₦19,200,000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STAFF AUDITOR ROLE VIEWS */}
        {/* ========================================== */}
        {activeRole === 'STAFF_AUDITOR' && activeTab === 'queue' && (
          <div className="grid grid-cols-12 gap-8">
            {/* Applicant Queue List */}
            <div className="col-span-12 lg:col-span-5 bg-[#101522] border border-white/10 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Visa Applicants Queue</h3>
                <span className="text-xs font-mono text-cyan-400">{applicants.length} Applications</span>
              </div>

              <div className="space-y-3">
                {applicants.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApplicantId(app.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedApplicantId === app.id
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg ring-1 ring-cyan-500/30'
                        : 'bg-[#181B25] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{app.name}</h4>
                        <span className="text-xs font-mono text-slate-400">{app.id} • {app.institution}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        app.status === 'VALIDATED' ? 'bg-emerald-500/10 text-[#00E676]' : app.status === 'FLAGGED' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Applicant Detail & Auditor Decision Controls */}
            <div className="col-span-12 lg:col-span-7 bg-[#101522] border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedApp.name}</h3>
                  <span className="text-xs font-mono text-slate-400">{selectedApp.id} • {selectedApp.route}</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setApplicants(applicants.map(a => a.id === selectedApp.id ? { ...a, status: 'VALIDATED', risk: 'LOW' } : a));
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Validate</span>
                  </button>
                  <button
                    onClick={() => {
                      setApplicants(applicants.map(a => a.id === selectedApp.id ? { ...a, status: 'FLAGGED', risk: 'HIGH' } : a));
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>Flag Deposit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#181B25] border border-white/5">
                  <span className="text-slate-400 block font-sans">28-Day Min Balance</span>
                  <span className="text-lg font-bold text-white mt-1 block">£{selectedApp.min28Day.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-xl bg-[#181B25] border border-white/5">
                  <span className="text-slate-400 block font-sans">Anomaly Ratio (R)</span>
                  <span className={`text-lg font-bold mt-1 block ${selectedApp.anomalyRatio > 2.5 ? 'text-rose-400' : 'text-[#00E676]'}`}>
                    {selectedApp.anomalyRatio}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* ADMIN GOVERNANCE ROLE VIEWS */}
        {/* ========================================== */}
        {activeRole === 'ADMIN_GOVERNANCE' && activeTab === 'params' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-[#101522] border border-white/10 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">UKVI Risk Parameters & FX Safety Buffers</h3>
                <p className="text-xs text-slate-400 mt-1">Global mathematical constraints enforced by the Go PoF Matrix Engine.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#181B25] border border-white/5 space-y-4">
                <label className="text-xs font-bold text-slate-300 block">Default FX Volatility Safety Buffer (%)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={fxBufferPercent}
                    onChange={(e) => setFxBufferPercent(parseFloat(e.target.value) || 0)}
                    className="bg-[#0A0D14] border border-purple-500/40 text-purple-300 text-sm font-mono px-4 py-2 rounded-xl w-32 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">Current: {fxBufferPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeRole === 'ADMIN_GOVERNANCE' && activeTab === 'audit' && (
          <div className="p-8 rounded-3xl bg-[#101522] border border-white/10 space-y-4">
            <h3 className="text-xl font-bold text-white">Immutable System Audit Log Stream</h3>
            <div className="border border-white/10 rounded-2xl overflow-hidden font-mono text-xs bg-[#181B25]">
              <table className="w-full text-left">
                <thead className="bg-[#1C1F29] border-b border-white/10 text-slate-400">
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
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="p-3 text-purple-400">{log.id}</td>
                      <td className="p-3 text-slate-300">{log.actor}</td>
                      <td className="p-3 text-white font-bold">{log.action}</td>
                      <td className="p-3 text-slate-400">{log.detail}</td>
                      <td className="p-3 text-slate-500">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
