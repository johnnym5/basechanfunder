import React, { useState } from 'react';
import {
  ShieldCheck, UserCheck, KeyRound, TrendingUp, AlertTriangle, Upload, Globe,
  Calendar, Building2, CheckCircle2, Download, Plus, FileText, Lock, ChevronDown,
  FileCheck2, Sliders, Users, ClipboardList, Activity, Check, X, Search, Eye,
  MessageSquare, Settings, Bell, ChevronRight, ExternalLink, RefreshCw, Zap,
  BarChart3, Server, Shield, AlertCircle, Cpu, Database
} from 'lucide-react';

export type UserRole = 'STUDENT' | 'STAFF_AUDITOR' | 'ADMIN_GOVERNANCE';
type StudentTab = 'overview' | 'accounts' | 'documents' | 'certificate';
type StaffTab = 'queue' | 'forensics';
type AdminTab = 'params' | 'audit' | 'system';

interface Applicant {
  id: string; name: string; route: string; institution: string;
  targetGBP: number; min28Day: number; anomalyRatio: number;
  status: 'VALIDATED' | 'FLAGGED' | 'PENDING'; risk: 'LOW' | 'MEDIUM' | 'HIGH';
  ngn: number; linkedBanks: number; flags: string[];
}

const applicantData: Applicant[] = [
  {
    id: 'APP-2026-8941', name: 'Chidi Ogunlesi', route: 'UK Student Visa (Tier 4)',
    institution: 'University of Manchester', targetGBP: 13340, min28Day: 14850, anomalyRatio: 0.12,
    status: 'VALIDATED', risk: 'LOW', ngn: 18450000, linkedBanks: 2, flags: []
  },
  {
    id: 'APP-2026-9012', name: 'Chioma Nwosu', route: 'Skilled Worker Visa',
    institution: 'NHS Healthcare Trust', targetGBP: 18500, min28Day: 17200, anomalyRatio: 3.45,
    status: 'FLAGGED', risk: 'HIGH', ngn: 24300000, linkedBanks: 1,
    flags: ['Large single deposit: ₦5,000,000 on Day 3', 'No MBS eStatement provided']
  },
  {
    id: 'APP-2026-9155', name: 'Kowshik Rahman', route: 'Graduate Route Visa',
    institution: 'Imperial College London', targetGBP: 11200, min28Day: 12100, anomalyRatio: 1.80,
    status: 'PENDING', risk: 'MEDIUM', ngn: 16800000, linkedBanks: 2, flags: ['FX buffer shortfall: 3.2%']
  },
  {
    id: 'APP-2026-9301', name: 'Fatima Al-Rashid', route: 'UK Student Visa (Tier 4)',
    institution: 'King\'s College London', targetGBP: 13340, min28Day: 13900, anomalyRatio: 0.55,
    status: 'PENDING', risk: 'LOW', ngn: 19100000, linkedBanks: 3, flags: []
  }
];

// ──────────────────────────────────────────────────────────────
// Shared Glassmorphic Card Wrapper
// ──────────────────────────────────────────────────────────────
const GlassCard: React.FC<{ children: React.ReactNode; className?: string; glow?: 'gold' | 'cyan' | 'purple' }> = ({ children, className = '', glow }) => (
  <div className={`rounded-2xl border bg-[#0F131C] backdrop-blur-xl ${
    glow === 'gold' ? 'border-[#F5B651]/30 shadow-[0_0_40px_rgba(245,158,11,0.08)]' :
    glow === 'cyan' ? 'border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.08)]' :
    glow === 'purple' ? 'border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.08)]' :
    'border-white/8'
  } ${className}`}>
    {children}
  </div>
);

// ──────────────────────────────────────────────────────────────
// Status Badge
// ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    VALIDATED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    FLAGGED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${map[status] ?? 'bg-slate-800 text-slate-400 border-slate-600'}`}>
      {status}
    </span>
  );
};

// ──────────────────────────────────────────────────────────────
// STUDENT PORTAL VIEWS
// ──────────────────────────────────────────────────────────────
const StudentOverview: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Radial PoF Ring */}
      <GlassCard glow="gold" className="p-8 text-center space-y-4">
        <p className="text-[11px] font-mono tracking-[0.2em] text-slate-400 uppercase">Proof of Funds Target — UKVI Requirement</p>
        <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#1E2638" strokeWidth="6" fill="transparent"/>
            <circle cx="50" cy="50" r="40" stroke="#F5B651" strokeWidth="6"
              strokeDasharray="251.3" strokeDashoffset="42" strokeLinecap="round" fill="transparent"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-white">£13,761</span>
            <span className="text-xs font-mono text-[#F5B651] font-bold mt-1">GBP EQUIV.</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/8 text-xs font-mono">
          <div><p className="text-slate-400">Current Balance</p><p className="text-lg font-bold text-white mt-0.5">₦18,450,000</p></div>
          <div className="border-l border-white/8"><p className="text-slate-400">Required</p><p className="text-lg font-bold text-white mt-0.5">₦19,200,000</p></div>
        </div>
        <div className="flex items-center justify-center space-x-2 text-xs font-mono text-[#F5B651] py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <TrendingUp className="w-3.5 h-3.5"/>
          <span>+5% FX Volatility Buffer Applied by System</span>
        </div>
      </GlassCard>

      {/* 28-Day Bar */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Calendar className="w-4 h-4 text-slate-400"/>
            <span>28-Day Consecutive Holding Window</span>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-amber-500/10 text-[#F5B651] border border-amber-500/20 font-bold">
            Readiness: Sept 24, 2026
          </span>
        </div>
        <p className="text-xl font-black text-white">Day 19 of 28 Uninterrupted</p>
        <div className="relative w-full h-3 rounded-full bg-[#1E2638] overflow-hidden">
          <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#F5B651] to-[#E5A635]" style={{ width: '67.8%' }}/>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Day 1 · Aug 5, 2026</span>
          <span>Day 28 · Sept 2, 2026</span>
        </div>
      </GlassCard>

      {/* Alert Banner */}
      <GlassCard className="p-5 border-l-4 !border-l-[#F5B651] space-y-3">
        <div className="flex items-center space-x-2 text-[#F5B651]">
          <AlertTriangle className="w-5 h-5"/>
          <h3 className="font-bold text-sm">Action Required — Source of Funds Flag Raised</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          A single-day deposit of <strong className="text-white">₦3,500,000</strong> was detected on Day 3. The Go PoF Engine has flagged this as a potential cash injection.
          Upload a notarised <strong className="text-white">Deed of Gift or Sponsor Affidavit</strong> to clear this flag.
        </p>
        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 font-black text-xs flex items-center space-x-2">
          <Upload className="w-4 h-4"/>
          <span>Upload Supporting Document</span>
        </button>
      </GlassCard>
    </div>
  );
};

const StudentAccounts: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const accounts = [
    { bank: 'Guaranty Trust Bank (GTBank)', mask: '••••4912', ngn: 12500000, gbp: 9320.00, type: 'Open Banking · Mono API', status: 'ACTIVE', connected: 'Aug 1, 2026' },
    { bank: 'Zenith Bank PLC', mask: '••••8019', ngn: 5950000, gbp: 4441.00, type: 'Encrypted SMS Agent', status: 'ACTIVE', connected: 'Aug 1, 2026' },
  ];
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Linked Financial Accounts</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">Daily closing balances ingested via Open Banking OAuth2 & SMS decryption.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2.5 rounded-xl bg-[#F5B651] text-slate-950 font-black text-xs flex items-center space-x-2">
          <Plus className="w-4 h-4"/><span>Link Bank Account</span>
        </button>
      </div>
      <div className="space-y-4">
        {accounts.map((a, i) => (
          <GlassCard key={i} glow="gold" className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-[#182032] border border-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#F5B651]"/>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{a.bank}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{a.mask} · {a.type}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Connected: {a.connected}</p>
                </div>
              </div>
              <StatusBadge status={a.status}/>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/6 text-xs font-mono">
              <div>
                <p className="text-slate-400 text-[10px] font-sans">Local Balance (NGN)</p>
                <p className="text-base font-bold text-white mt-0.5">₦{a.ngn.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-sans">Converted GBP</p>
                <p className="text-base font-bold text-[#F5B651] mt-0.5">£{a.gbp.toLocaleString()}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="p-6 rounded-2xl bg-[#101522] border border-white/10 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white">Connect via Open Banking (OAuth2)</h3>
            <p className="text-xs text-slate-400">Your credentials are never stored. Zero-knowledge token exchange.</p>
            <div className="space-y-2">
              {['GTBank', 'Zenith Bank', 'Access Bank', 'UBA', 'FirstBank'].map(b => (
                <button key={b} onClick={() => setShowModal(false)} className="w-full p-3.5 rounded-xl bg-[#181B25] hover:bg-[#1E2638] border border-white/5 text-sm font-semibold text-white flex justify-between items-center">
                  <span>{b}</span><ChevronRight className="w-4 h-4 text-slate-500"/>
                </button>
              ))}
            </div>
            <button onClick={() => setShowModal(false)} className="w-full text-xs text-slate-500 py-1 hover:text-slate-300">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentDocuments: React.FC = () => {
  const [files, setFiles] = useState([
    { name: 'GTBank_eStatement_Aug2026.pdf', type: 'Bank Statement', status: 'VERIFIED', date: 'Aug 5, 2026' },
    { name: 'Sponsor_Gift_Affidavit_Notarised.pdf', type: 'Deed of Gift', status: 'VERIFIED', date: 'Aug 12, 2026' },
  ]);
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Supporting Verification Documents</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">All documents are RSA-hash verified for authenticity.</p>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <GlassCard glow="gold" className="p-8">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-500/30 rounded-xl p-8 cursor-pointer hover:border-amber-500/60 transition-all bg-amber-500/3">
          <Upload className="w-8 h-8 text-[#F5B651] mb-3"/>
          <span className="text-sm font-bold text-white">Drop files here or click to upload</span>
          <span className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 10MB per file</span>
          <input type="file" className="hidden" onChange={() => setFiles([...files, { name: 'New_Document.pdf', type: 'Uploaded File', status: 'PENDING', date: 'Today' }])}/>
        </label>
      </GlassCard>

      {/* File Repository */}
      <GlassCard className="divide-y divide-white/6">
        {files.map((f, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#182032] flex items-center justify-center border border-white/6">
                <FileText className="w-4 h-4 text-[#F5B651]"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.name}</p>
                <p className="text-[11px] font-mono text-slate-400">{f.type} · {f.date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <StatusBadge status={f.status}/>
              <button className="p-2 rounded-lg bg-[#181B25] hover:bg-[#1E2638] text-slate-400 hover:text-white">
                <Download className="w-4 h-4"/>
              </button>
            </div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
};

const StudentCertificate: React.FC = () => (
  <div className="max-w-2xl mx-auto">
    <GlassCard glow="gold" className="p-10 text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
        <FileCheck2 className="w-10 h-10 text-[#F5B651]"/>
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">UKVI Compliance Certificate</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed font-mono">
          Your 28-day continuous holding window is currently <strong className="text-[#F5B651]">67% complete</strong>. Full certificate available on Day 28.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left text-xs font-mono">
        <div className="p-4 rounded-xl bg-[#181B25] border border-white/6">
          <p className="text-slate-400">Applicant ID</p><p className="font-bold text-white mt-1">APP-2026-8941</p>
        </div>
        <div className="p-4 rounded-xl bg-[#181B25] border border-white/6">
          <p className="text-slate-400">Visa Route</p><p className="font-bold text-white mt-1">UK Student Visa (Tier 4)</p>
        </div>
        <div className="p-4 rounded-xl bg-[#181B25] border border-white/6">
          <p className="text-slate-400">Verified GBP Balance</p><p className="font-bold text-[#F5B651] mt-1">£13,761.00</p>
        </div>
        <div className="p-4 rounded-xl bg-[#181B25] border border-white/6">
          <p className="text-slate-400">Certifying Engine</p><p className="font-bold text-white mt-1">Go PoF Matrix v2.4.1</p>
        </div>
      </div>

      <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20">
        <Download className="w-5 h-5"/>
        <span>Download Digitally Signed PDF Certificate</span>
      </button>
      <p className="text-[10px] text-slate-500 font-mono">Certificate validity: 31 days from issuance · SHA-256 RSA signed</p>
    </GlassCard>
  </div>
);

// ──────────────────────────────────────────────────────────────
// STAFF AUDITOR VIEWS
// ──────────────────────────────────────────────────────────────
const StaffAuditQueue: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>(applicantData);
  const [selectedId, setSelectedId] = useState('APP-2026-8941');
  const selected = applicants.find(a => a.id === selectedId)!;

  const approve = () => setApplicants(applicants.map(a => a.id === selectedId ? { ...a, status: 'VALIDATED', risk: 'LOW', flags: [] } : a));
  const flag = () => setApplicants(applicants.map(a => a.id === selectedId ? { ...a, status: 'FLAGGED', risk: 'HIGH' } : a));

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Queue Panel */}
      <div className="col-span-12 lg:col-span-4">
        <GlassCard glow="cyan" className="overflow-hidden">
          <div className="p-4 border-b border-white/8 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Audit Queue</h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">{applicants.length} Applications</span>
          </div>
          <div className="p-3 space-y-2">
            {applicants.map(app => (
              <div key={app.id} onClick={() => setSelectedId(app.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedId === app.id
                    ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/20'
                    : 'bg-[#181B25] border-white/5 hover:border-white/15'
                }`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold text-white">{app.name}</p>
                  <StatusBadge status={app.status}/>
                </div>
                <p className="text-[10px] font-mono text-slate-400">{app.id}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{app.institution}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Right Detail Panel */}
      <div className="col-span-12 lg:col-span-8 space-y-5">
        {/* Header */}
        <GlassCard glow="cyan" className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-2xl font-black text-white">{selected.name}</h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{selected.id} · {selected.route}</p>
              <p className="text-xs text-slate-500 mt-0.5">{selected.institution}</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={approve} className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition-all">
                <Check className="w-4 h-4"/><span>Approve & Validate</span>
              </button>
              <button onClick={flag} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center space-x-1.5 transition-all">
                <X className="w-4 h-4"/><span>Raise Flag</span>
              </button>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            {[
              { label: 'Target GBP', value: `£${selected.targetGBP.toLocaleString()}`, color: 'text-white' },
              { label: '28-Day Min Balance', value: `£${selected.min28Day.toLocaleString()}`, color: selected.min28Day >= selected.targetGBP ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Anomaly Ratio (R)', value: selected.anomalyRatio.toFixed(2), color: selected.anomalyRatio > 2.5 ? 'text-rose-400' : 'text-emerald-400' },
              { label: 'Linked Banks', value: `${selected.linkedBanks} Accounts`, color: 'text-cyan-400' },
            ].map((m, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#181B25] border border-white/6">
                <p className="text-slate-400 text-[10px] font-sans">{m.label}</p>
                <p className={`text-lg font-black mt-1 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Flags Panel */}
        {selected.flags.length > 0 && (
          <GlassCard className="p-5 border-l-4 !border-l-rose-500 space-y-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400"/>
              <h4 className="text-sm font-bold text-rose-400">System Flags Raised ({selected.flags.length})</h4>
            </div>
            <div className="space-y-2">
              {selected.flags.map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-rose-500/8 border border-rose-500/20 text-xs text-rose-300 font-mono flex items-center space-x-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0"/><span>{f}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

const StaffForensics: React.FC = () => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <GlassCard glow="cyan" className="p-6 space-y-4">
      <div className="flex items-center space-x-3 pb-4 border-b border-white/8">
        <Shield className="w-5 h-5 text-cyan-400"/>
        <div>
          <h2 className="text-lg font-bold text-white">eStatement RSA Forensic Inspector</h2>
          <p className="text-xs text-slate-400 font-mono">Validates PDF digital signatures, font-layer tampering, and metadata integrity.</p>
        </div>
      </div>

      {/* File Upload Area */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/30 rounded-xl p-8 cursor-pointer hover:border-cyan-500/60 transition-all bg-cyan-500/3">
        <Upload className="w-7 h-7 text-cyan-400 mb-2"/>
        <span className="text-sm font-bold text-white">Upload eStatement for Forensic Inspection</span>
        <span className="text-xs text-slate-400 mt-1 font-mono">Accepts PDF · Max 20MB</span>
        <input type="file" className="hidden"/>
      </label>

      {/* Pre-loaded Forensics Report */}
      <div className="space-y-2">
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Forensic Report — GTBank_eStatement_Aug2026.pdf</p>
        {[
          { check: 'RSA-2048 Digital Signature', result: 'VALID', pass: true },
          { check: 'PDF Font Editing Layers Detected', result: 'NONE FOUND', pass: true },
          { check: 'Metadata Timestamps Consistent', result: 'CONSISTENT', pass: true },
          { check: 'Balance Figure OCR Match', result: 'MATCH — ₦12,500,000.00', pass: true },
          { check: 'Anomaly Ratio (R) Score', result: 'R = 0.12 (Within threshold)', pass: true },
        ].map((item, i) => (
          <div key={i} className={`p-3.5 rounded-xl flex justify-between items-center text-xs font-mono ${item.pass ? 'bg-emerald-500/6 border border-emerald-500/20' : 'bg-rose-500/6 border border-rose-500/20'}`}>
            <span className="text-slate-300">{item.check}</span>
            <span className={`font-bold flex items-center space-x-1.5 ${item.pass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {item.pass ? <Check className="w-3.5 h-3.5"/> : <X className="w-3.5 h-3.5"/>}
              <span>{item.result}</span>
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  </div>
);

// ──────────────────────────────────────────────────────────────
// ADMIN GOVERNANCE VIEWS
// ──────────────────────────────────────────────────────────────
const AdminParams: React.FC = () => {
  const [fxBuffer, setFxBuffer] = useState(10.0);
  const [minMaturityDays, setMinMaturityDays] = useState(28);
  const [anomalyThreshold, setAnomalyThreshold] = useState(2.5);
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <GlassCard glow="purple" className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Global UKVI Risk Parameters</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">Changes are applied immediately to the Go PoF Matrix Engine and propagated to all active applications.</p>
        </div>

        <div className="space-y-4">
          {[
            { label: 'FX Volatility Safety Buffer (%)', desc: 'Multiplied over the raw UKVI GBP target to absorb currency drops.', value: fxBuffer, set: setFxBuffer, step: 0.5 },
            { label: 'Minimum Consecutive Holding Days', desc: 'UKVI requires 28 days. Do not reduce below this threshold.', value: minMaturityDays, set: setMinMaturityDays, step: 1 },
            { label: 'Cash Deposit Anomaly Ratio Threshold (R)', desc: 'Deposits with R above this value are automatically flagged for auditor review.', value: anomalyThreshold, set: setAnomalyThreshold, step: 0.1 },
          ].map((param, i) => (
            <div key={i} className="p-5 rounded-xl bg-[#181B25] border border-white/6 space-y-3">
              <div>
                <p className="text-sm font-bold text-white">{param.label}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{param.desc}</p>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={param.value}
                  step={param.step}
                  onChange={e => param.set(parseFloat(e.target.value))}
                  className="w-32 bg-[#0A0D14] border border-purple-500/40 text-purple-200 text-sm font-mono px-4 py-2 rounded-lg focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs font-mono text-purple-400 font-bold">Current: {param.value}</span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={save} className={`w-full py-3.5 rounded-xl font-black text-sm transition-all ${saved ? 'bg-emerald-500 text-slate-950' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20'}`}>
          {saved ? '✓ Parameters Saved & Propagated' : 'Save & Apply System Parameters'}
        </button>
      </GlassCard>
    </div>
  );
};

const AdminAuditLog: React.FC = () => {
  const logs = [
    { id: 'LOG-10041', actor: 'admin@basechanfunder.com', action: 'UPDATE_FX_BUFFER', detail: 'Set global FX buffer: 10.0%', ts: 'Just now', severity: 'INFO' },
    { id: 'LOG-10040', actor: 'system_cron', action: 'OANDA_RATE_FETCH', detail: 'GBP/NGN spot: 1,945.50', ts: '25 min ago', severity: 'INFO' },
    { id: 'LOG-10039', actor: 'j.morgan@basechanfunder.com', action: 'ISSUE_COMPLIANCE_CERTIFICATE', detail: 'Certificate for APP-2026-8941', ts: '1 hr ago', severity: 'SUCCESS' },
    { id: 'LOG-10038', actor: 'pof-engine@internal', action: 'FLAG_ANOMALOUS_DEPOSIT', detail: 'R=3.45 exceeds threshold for APP-2026-9012', ts: '2 hrs ago', severity: 'WARN' },
    { id: 'LOG-10037', actor: 'ingestion@internal', action: 'SMS_PARSE_COMPLETE', detail: 'Zenith SMS — ₦5,950,000 balance confirmed', ts: '3 hrs ago', severity: 'SUCCESS' },
  ];

  const colors: Record<string, string> = {
    INFO: 'text-slate-400',
    SUCCESS: 'text-emerald-400',
    WARN: 'text-amber-400',
    ERROR: 'text-rose-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Immutable Audit Log Stream</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">Cryptographically signed, append-only. Cannot be edited or deleted.</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-[#181B25] border border-white/10 text-xs text-slate-300 flex items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5"/><span>Refresh</span>
        </button>
      </div>

      <GlassCard glow="purple" className="overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead className="bg-[#181B25] border-b border-white/8">
            <tr>
              {['Log ID', 'Actor', 'Action', 'Detail', 'Severity', 'Timestamp'].map(h => (
                <th key={h} className="p-3.5 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-white/3 transition-colors">
                <td className="p-3.5 text-purple-400 font-bold">{log.id}</td>
                <td className="p-3.5 text-slate-300">{log.actor}</td>
                <td className="p-3.5 text-white font-bold">{log.action}</td>
                <td className="p-3.5 text-slate-400">{log.detail}</td>
                <td className="p-3.5"><span className={`font-bold ${colors[log.severity]}`}>{log.severity}</span></td>
                <td className="p-3.5 text-slate-500">{log.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};

const AdminSystem: React.FC = () => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <h2 className="text-xl font-bold text-white">System Infrastructure Status</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[
        { label: 'Go PoF Engine', port: ':8080', status: 'NOMINAL', latency: '12ms', icon: Zap },
        { label: 'NestJS Ingestion', port: ':3000', status: 'NOMINAL', latency: '28ms', icon: Server },
        { label: 'PostgreSQL 16', port: ':5432', status: 'NOMINAL', latency: '3ms', icon: Database },
        { label: 'Redis Cache', port: ':6379', status: 'NOMINAL', latency: '0.8ms', icon: Cpu },
        { label: 'OANDA FX Stream', port: 'API', status: 'DEGRADED', latency: '840ms', icon: TrendingUp },
        { label: 'HashiCorp Vault', port: ':8200', status: 'NOMINAL', latency: '6ms', icon: Lock },
      ].map((svc, i) => {
        const Icon = svc.icon;
        return (
          <GlassCard key={i} glow="purple" className="p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-purple-400"/>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{svc.label}</p>
                  <p className="text-[10px] font-mono text-slate-500">{svc.port}</p>
                </div>
              </div>
              <StatusBadge status={svc.status}/>
            </div>
            <div className="pt-3 border-t border-white/6 font-mono text-xs">
              <p className="text-slate-400">Latency</p>
              <p className={`font-black text-base mt-0.5 ${svc.status === 'DEGRADED' ? 'text-amber-400' : 'text-white'}`}>{svc.latency}</p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// MASTER APP PORTAL — ROOT COMPONENT
// ──────────────────────────────────────────────────────────────
export const MasterAppPortal: React.FC = () => {
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [studentTab, setStudentTab] = useState<StudentTab>('overview');
  const [staffTab, setStaffTab] = useState<StaffTab>('queue');
  const [adminTab, setAdminTab] = useState<AdminTab>('params');

  const users: Record<UserRole, { name: string; title: string; id: string; avatar: string }> = {
    STUDENT: { name: 'Chidi Ogunlesi', title: 'Visa Applicant · APP-2026-8941', id: 'APP-2026-8941', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop' },
    STAFF_AUDITOR: { name: 'Julian Morgan', title: 'Senior Compliance Officer · AUD-8842', id: 'AUD-8842', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop' },
    ADMIN_GOVERNANCE: { name: 'Dr. Sarah Connor', title: 'Principal Governance Admin · ADM-0109', id: 'ADM-0109', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop' },
  };
  const user = users[role];

  const roleBadgeClass = role === 'STUDENT'
    ? 'bg-amber-500/10 text-[#F5B651] border-amber-500/30'
    : role === 'STAFF_AUDITOR'
    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    : 'bg-purple-500/10 text-purple-400 border-purple-500/30';

  const tabActive = role === 'STUDENT'
    ? 'bg-[#F5B651] text-slate-950'
    : role === 'STAFF_AUDITOR'
    ? 'bg-cyan-500 text-slate-950'
    : 'bg-purple-600 text-white';

  return (
    <div className="min-h-screen bg-[#090D16] text-[#DFE2EF] font-['Inter',sans-serif]"
      style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(245,158,11,0.03) 0%, #090D16 60%)' }}>

      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-50 bg-[#0D111A]/95 backdrop-blur-2xl border-b border-white/8 px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/logo.svg" alt="Logo" className="w-9 h-9 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"/>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-base font-black tracking-tight text-[#FFC174]">BASECHANFUNDER</span>
              <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded border ${roleBadgeClass}`}>
                {role === 'STUDENT' ? 'STUDENT PORTAL' : role === 'STAFF_AUDITOR' ? 'AUDIT CONSOLE' : 'ADMIN GOVERNANCE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">UKVI 28-Day Proof of Funds Compliance Platform</p>
          </div>
        </div>

        {/* User Identity + Role Switcher */}
        <div className="flex items-center space-x-3">
          <img src={user.avatar} alt="" className="w-9 h-9 rounded-xl object-cover border-2 border-[#F5B651]/40"/>
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-white leading-none">{user.name}</p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{user.title}</p>
          </div>
          <div className="relative ml-2">
            <select
              value={role}
              onChange={e => {
                const r = e.target.value as UserRole;
                setRole(r);
                if (r === 'STUDENT') setStudentTab('overview');
                else if (r === 'STAFF_AUDITOR') setStaffTab('queue');
                else setAdminTab('params');
              }}
              className="appearance-none bg-[#181B25] border border-white/10 hover:border-[#F5B651]/40 text-[#F5B651] text-xs font-bold font-mono px-3 py-2 rounded-xl pr-8 focus:outline-none cursor-pointer"
            >
              <option value="STUDENT">🎓 Student Applicant</option>
              <option value="STAFF_AUDITOR">🛡️ Staff Auditor</option>
              <option value="ADMIN_GOVERNANCE">🔑 Admin Governance</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none text-slate-400"/>
          </div>
        </div>
      </header>

      {/* ── SUB NAV TABS ── */}
      <div className="bg-[#0D111A] border-b border-white/5 px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto">
          {role === 'STUDENT' && (
            <>
              {([['overview','📊 Status & Target'],['accounts','🏦 Bank Accounts'],['documents','📂 Documents'],['certificate','📜 Certificate']] as [StudentTab,string][]).map(([id,label]) => (
                <button key={id} onClick={() => setStudentTab(id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${studentTab === id ? tabActive : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{label}</button>
              ))}
            </>
          )}
          {role === 'STAFF_AUDITOR' && (
            <>
              {([['queue','📋 Applications Queue'],['forensics','🔬 eStatement Forensics']] as [StaffTab,string][]).map(([id,label]) => (
                <button key={id} onClick={() => setStaffTab(id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${staffTab === id ? tabActive : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{label}</button>
              ))}
            </>
          )}
          {role === 'ADMIN_GOVERNANCE' && (
            <>
              {([['params','⚙️ System Parameters'],['audit','📋 Audit Log'],['system','🖥️ Infrastructure']] as [AdminTab,string][]).map(([id,label]) => (
                <button key={id} onClick={() => setAdminTab(id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${adminTab === id ? tabActive : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{label}</button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto p-8">
        {role === 'STUDENT' && studentTab === 'overview' && <StudentOverview/>}
        {role === 'STUDENT' && studentTab === 'accounts' && <StudentAccounts/>}
        {role === 'STUDENT' && studentTab === 'documents' && <StudentDocuments/>}
        {role === 'STUDENT' && studentTab === 'certificate' && <StudentCertificate/>}

        {role === 'STAFF_AUDITOR' && staffTab === 'queue' && <StaffAuditQueue/>}
        {role === 'STAFF_AUDITOR' && staffTab === 'forensics' && <StaffForensics/>}

        {role === 'ADMIN_GOVERNANCE' && adminTab === 'params' && <AdminParams/>}
        {role === 'ADMIN_GOVERNANCE' && adminTab === 'audit' && <AdminAuditLog/>}
        {role === 'ADMIN_GOVERNANCE' && adminTab === 'system' && <AdminSystem/>}
      </main>
    </div>
  );
};
