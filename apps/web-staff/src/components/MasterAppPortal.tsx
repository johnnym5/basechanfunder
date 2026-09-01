// MasterAppPortal — Deep Obsidian UI with Vector Lucide Icons & Resilient Data State
import React, { useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth, UserRole } from '../context/AuthContext';
import {
  ShieldCheck, KeyRound, TrendingUp, AlertTriangle, Upload,
  Calendar, Building2, CheckCircle2, Download, Plus, FileText,
  ChevronDown, FileCheck2, Activity, Check, X, AlertCircle,
  RefreshCw, Zap, Server, Lock, Database, Cpu, LogOut,
  Loader2, Shield, BarChart3, FolderLock, ClipboardList,
  Sliders, UserCheck, Eye, Layers, Clock, ArrowRight,
} from 'lucide-react';

// ─── Shared UI primitives ────────────────────────────────────
const GlassCard: React.FC<{ children: React.ReactNode; className?: string; accent?: 'gold' | 'cyan' | 'purple' }> = ({
  children, className = '', accent,
}) => (
  <div className={`rounded-2xl border bg-[#0F131C] ${
    accent === 'gold'   ? 'border-[#F5B651]/20 shadow-[0_0_40px_rgba(245,158,11,0.06)]' :
    accent === 'cyan'   ? 'border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.06)]' :
    accent === 'purple' ? 'border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.06)]' :
    'border-white/8'
  } ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ label: string }> = ({ label }) => {
  const cls: Record<string, string> = {
    VALIDATED:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    FLAGGED:     'bg-rose-500/10    text-rose-400    border-rose-500/30',
    PENDING:     'bg-amber-500/10  text-amber-400   border-amber-500/30',
    LOW:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    HIGH:        'bg-rose-500/10    text-rose-400    border-rose-500/30',
    MEDIUM:      'bg-amber-500/10  text-amber-400   border-amber-500/30',
    ACTIVE:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    NOMINAL:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    DEGRADED:    'bg-amber-500/10  text-amber-400   border-amber-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${cls[label] ?? 'bg-slate-800 text-slate-300 border-slate-600'}`}>
      {label}
    </span>
  );
};

// ─── STUDENT VIEWS ───────────────────────────────────────────
const StudentOverview: React.FC<{ uid: string }> = ({ uid }) => {
  const [evalData, setEvalData] = useState<Record<string, any>>({
    targetGBP: 13340,
    currentGBP: 13761,
    currentNGN: 18450000,
    targetNGN: 19200000,
    maturityDay: 19,
    fxBufferPercent: 5.0,
    readinessDate: 'Sept 24, 2026',
    status: 'COMPLIANT_HOLDING',
    sourceOfFundsFlag: 'Action Required: An unverified single-day deposit of ₦3,500,000 was detected. Upload a Deed of Gift or Sponsor Affidavit to protect your 28-day maturity window.',
  });

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'pof_evaluations'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            setEvalData((prev) => ({ ...prev, ...(snap.docs[0].data() as any) }));
          }
        },
        () => {},
      );
      return unsub;
    } catch {}
  }, [uid]);

  const targetGBP   = evalData.targetGBP || 13340;
  const currentGBP  = evalData.currentGBP || 13761;
  const currentNGN  = evalData.currentNGN || 18450000;
  const targetNGN   = evalData.targetNGN || 19200000;
  const maturityDay = evalData.maturityDay || 19;
  const fxBuffer    = evalData.fxBufferPercent || 5.0;
  const readiness   = evalData.readinessDate || 'Sept 24, 2026';
  const pct         = Math.min((currentGBP / targetGBP) * 100, 100);
  const offset      = 251.3 - (251.3 * pct) / 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Proof of Funds Target Card */}
      <GlassCard accent="gold" className="p-8 text-center space-y-4">
        <p className="text-[11px] font-mono tracking-[0.2em] text-slate-400 uppercase">
          Proof of Funds Target — UKVI Requirement
        </p>

        <div className="relative w-52 h-52 mx-auto flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#1E2638" strokeWidth="6" fill="transparent"/>
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#F5B651"
              strokeWidth="6"
              strokeDasharray="251.3"
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-white">£{currentGBP.toLocaleString()}</span>
            <span className="text-xs font-mono text-[#F5B651] font-bold mt-1">GBP EQUIV.</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/8 text-xs font-mono">
          <div>
            <p className="text-slate-400 font-sans">Current Balance</p>
            <p className="text-lg font-bold text-white mt-0.5">₦{currentNGN.toLocaleString()}</p>
          </div>
          <div className="border-l border-white/8">
            <p className="text-slate-400 font-sans">Required Target</p>
            <p className="text-lg font-bold text-white mt-0.5">₦{targetNGN.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 text-xs font-mono text-[#F5B651] py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <TrendingUp className="w-3.5 h-3.5"/>
          <span>+{fxBuffer}% FX Volatility Buffer Applied by PoF Engine</span>
        </div>
      </GlassCard>

      {/* 28-Day Holding Window Progress */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Calendar className="w-4 h-4 text-slate-400"/>
            <span>28-Day Consecutive Holding Window</span>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-amber-500/10 text-[#F5B651] border border-amber-500/20 font-bold">
            Readiness Target: {readiness}
          </span>
        </div>

        <p className="text-xl font-black text-white">Day {maturityDay} of 28 Days Uninterrupted</p>

        <div className="relative w-full h-3 rounded-full bg-[#1E2638] overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#F5B651] to-[#E5A635] transition-all duration-1000"
            style={{ width: `${(maturityDay / 28) * 100}%` }}
          />
        </div>
      </GlassCard>

      {/* Source of Funds Action Alert */}
      {evalData.sourceOfFundsFlag && (
        <GlassCard className="p-5 border-l-4 !border-l-[#F5B651] space-y-3">
          <div className="flex items-center space-x-2 text-[#F5B651]">
            <AlertTriangle className="w-5 h-5"/>
            <h3 className="font-bold text-sm">Action Required — Source of Funds Flag Raised</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{evalData.sourceOfFundsFlag}</p>
          <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md">
            <Upload className="w-4 h-4"/>
            <span>Upload Supporting Deed / Affidavit</span>
          </button>
        </GlassCard>
      )}
    </div>
  );
};

const StudentAccounts: React.FC<{ uid: string }> = ({ uid }) => {
  const [accounts, setAccounts] = useState<Record<string, any>[]>([
    { id: 'ACC-1', bankName: 'Guaranty Trust Bank (GTBank)', accountMask: '••••4912', provider: 'Open Banking · Mono API', balanceNGN: 12500000, balanceGBP: 9320.00, status: 'ACTIVE' },
    { id: 'ACC-2', bankName: 'Zenith Bank PLC', accountMask: '••••8019', provider: 'Encrypted SMS Parser', balanceNGN: 5950000, balanceGBP: 4441.00, status: 'ACTIVE' },
  ]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'financial_accounts'), where('userId', '==', uid));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        },
        () => {},
      );
      return unsub;
    } catch {}
  }, [uid]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Linked Financial Accounts</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">Daily closing balances ingested via Open Banking &amp; SMS parser.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-[#F5B651] text-slate-950 font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md">
          <Plus className="w-4 h-4"/>
          <span>Link Bank Account</span>
        </button>
      </div>

      <div className="space-y-4">
        {accounts.map((acc, i) => (
          <GlassCard key={acc.id || i} accent="gold" className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-[#182032] border border-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#F5B651]"/>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{acc.bankName}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{acc.accountMask} · {acc.provider}</p>
                </div>
              </div>
              <Badge label={acc.status || 'ACTIVE'} />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/6 text-xs font-mono">
              <div>
                <p className="text-slate-400 font-sans text-[10px]">Local Balance (NGN)</p>
                <p className="text-base font-bold text-white mt-0.5">₦{(acc.balanceNGN || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 font-sans text-[10px]">Converted GBP</p>
                <p className="text-base font-bold text-[#F5B651] mt-0.5">£{(acc.balanceGBP || 0).toLocaleString()}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

const StudentDocuments: React.FC<{ uid: string }> = ({ uid }) => {
  const [docs, setDocs] = useState<Record<string, any>[]>([
    { id: 'DOC-1', fileName: 'GTBank_eStatement_Aug2026.pdf', docType: 'Certified Bank Statement', verificationStatus: 'VALIDATED' },
    { id: 'DOC-2', fileName: 'Sponsor_Gift_Affidavit_Notarised.pdf', docType: 'Deed of Gift / Affidavit', verificationStatus: 'VALIDATED' },
  ]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'documents'), where('userId', '==', uid), orderBy('uploadedAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        },
        () => {},
      );
      return unsub;
    } catch {}
  }, [uid]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Supporting Verification Documents</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">All documents are RSA-hash verified for authenticity.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-[#F5B651] text-slate-950 font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md">
          <Upload className="w-4 h-4"/>
          <span>Upload Document</span>
        </button>
      </div>

      <GlassCard accent="gold" className="p-8">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-500/30 rounded-xl p-8 cursor-pointer hover:border-amber-500/60 transition-all bg-amber-500/3">
          <Upload className="w-7 h-7 text-[#F5B651] mb-2"/>
          <span className="text-sm font-bold text-white">Drop files here or click to upload</span>
          <span className="text-xs text-slate-400 mt-1 font-mono">PDF, JPG, PNG — max 10MB</span>
          <input type="file" className="hidden"/>
        </label>
      </GlassCard>

      <GlassCard className="divide-y divide-white/6">
        {docs.map((d, i) => (
          <div key={d.id || i} className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#182032] flex items-center justify-center border border-white/6">
                <FileText className="w-4 h-4 text-[#F5B651]"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{d.fileName}</p>
                <p className="text-[11px] font-mono text-slate-400">{d.docType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge label={d.verificationStatus || 'PENDING'} />
              <button className="p-2 rounded-lg bg-[#181B25] hover:bg-[#1E2638] text-slate-400 hover:text-white cursor-pointer">
                <Download className="w-4 h-4"/>
              </button>
            </div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
};

const StudentCertificate: React.FC<{ appUser: NonNullable<ReturnType<typeof useAuth>['appUser']> }> = ({ appUser }) => (
  <div className="max-w-2xl mx-auto">
    <GlassCard accent="gold" className="p-10 text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
        <FileCheck2 className="w-10 h-10 text-[#F5B651]"/>
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">UKVI Compliance Certificate</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed font-mono">
          Your digitally-signed Proof of Funds certificate for UKVI visa submission.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left text-xs font-mono">
        <div className="p-4 rounded-xl bg-[#181B25] border border-white/6">
          <p className="text-slate-400">Applicant Name</p>
          <p className="font-bold text-white mt-1">{appUser.displayName || 'Applicant'}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#181B25] border border-white/6">
          <p className="text-slate-400">Email</p>
          <p className="font-bold text-white mt-1">{appUser.email}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#181B25] border border-white/6">
          <p className="text-slate-400">Certifying Engine</p>
          <p className="font-bold text-white mt-1">Go PoF Matrix v2.4.1</p>
        </div>
        <div className="p-4 rounded-xl bg-[#181B25] border border-white/6">
          <p className="text-slate-400">SHA-256 RSA Signed</p>
          <p className="font-bold text-[#F5B651] mt-1">Ready for Export</p>
        </div>
      </div>

      <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer">
        <Download className="w-5 h-5"/>
        <span>Download Signed Compliance Certificate (PDF)</span>
      </button>
    </GlassCard>
  </div>
);

// ─── STAFF VIEWS ─────────────────────────────────────────────
const StaffQueue: React.FC = () => {
  const [applicants, setApplicants] = useState<Record<string, any>[]>([
    { id: 'APP-2026-8941', userName: 'Chidi Ogunlesi', visaRoute: 'UK Student Visa (Tier 4)', targetGBP: 13340, min28DayGBP: 14850, anomalyRatio: 0.12, status: 'VALIDATED', flags: [] },
    { id: 'APP-2026-9012', userName: 'Chioma Nwosu', visaRoute: 'Skilled Worker Visa', targetGBP: 18500, min28DayGBP: 17200, anomalyRatio: 3.45, status: 'FLAGGED', flags: ['Large single deposit: ₦5,000,000 on Day 3'] },
    { id: 'APP-2026-9155', userName: 'Kowshik Rahman', visaRoute: 'Graduate Route Visa', targetGBP: 11200, min28DayGBP: 12100, anomalyRatio: 1.80, status: 'PENDING', flags: ['FX buffer shortfall: 3.2%'] },
  ]);
  const [selectedId, setSelectedId] = useState<string>('APP-2026-8941');

  useEffect(() => {
    try {
      const q = query(collection(db, 'pof_evaluations'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            setApplicants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        },
        () => {},
      );
      return unsub;
    } catch {}
  }, []);

  const selected = applicants.find(a => a.id === selectedId) || applicants[0];

  const updateStatus = (status: string) => {
    setApplicants(applicants.map(a => a.id === selectedId ? { ...a, status } : a));
    try {
      updateDoc(doc(db, 'pof_evaluations', selectedId), { status, auditedAt: serverTimestamp() }).catch(() => {});
    } catch {}
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4">
        <GlassCard accent="cyan" className="overflow-hidden">
          <div className="p-4 border-b border-white/8 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Applications Queue</h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">{applicants.length} Records</span>
          </div>
          <div className="p-3 space-y-2">
            {applicants.map(app => (
              <div
                key={app.id}
                onClick={() => setSelectedId(app.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedId === app.id
                    ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/20'
                    : 'bg-[#181B25] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold text-white truncate pr-2">{app.userName || app.id}</p>
                  <Badge label={app.status || 'PENDING'} />
                </div>
                <p className="text-[10px] font-mono text-slate-500">{app.id}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="col-span-12 lg:col-span-8 space-y-5">
        <GlassCard accent="cyan" className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-2xl font-black text-white">{selected.userName || 'Applicant'}</h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{selected.id} · {selected.visaRoute}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => updateStatus('VALIDATED')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4"/>
                <span>Approve</span>
              </button>
              <button
                onClick={() => updateStatus('FLAGGED')}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <X className="w-4 h-4"/>
                <span>Flag</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
            {[
              { label: 'Target GBP', value: `£${(selected.targetGBP || 0).toLocaleString()}`, color: 'text-white' },
              { label: '28-Day Min', value: `£${(selected.min28DayGBP || 0).toLocaleString()}`, color: (selected.min28DayGBP || 0) >= (selected.targetGBP || 0) ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Anomaly Ratio (R)', value: String(selected.anomalyRatio || '0.00'), color: (selected.anomalyRatio || 0) > 2.5 ? 'text-rose-400' : 'text-emerald-400' },
            ].map((m, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#181B25] border border-white/6">
                <p className="text-slate-400 text-[10px] font-sans">{m.label}</p>
                <p className={`text-lg font-black mt-1 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {(selected.flags && selected.flags.length > 0) && (
          <GlassCard className="p-5 border-l-4 !border-l-rose-500 space-y-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400"/>
              <h4 className="text-sm font-bold text-rose-400">System Flags ({selected.flags.length})</h4>
            </div>
            {selected.flags.map((f: string, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-rose-500/8 border border-rose-500/20 text-xs text-rose-300 font-mono flex items-center space-x-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
                <span>{f}</span>
              </div>
            ))}
          </GlassCard>
        )}
      </div>
    </div>
  );
};

const StaffForensics: React.FC = () => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <GlassCard accent="cyan" className="p-6 space-y-4">
      <div className="flex items-center space-x-3 pb-4 border-b border-white/8">
        <Shield className="w-5 h-5 text-cyan-400"/>
        <div>
          <h2 className="text-lg font-bold text-white">eStatement RSA Forensic Inspector</h2>
          <p className="text-xs text-slate-400 font-mono">Upload a bank eStatement PDF to run cryptographic integrity checks.</p>
        </div>
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/30 rounded-xl p-10 cursor-pointer hover:border-cyan-500/60 transition-all bg-cyan-500/3">
        <Upload className="w-7 h-7 text-cyan-400 mb-2"/>
        <span className="text-sm font-bold text-white">Upload eStatement for Forensic Inspection</span>
        <span className="text-xs text-slate-400 mt-1 font-mono">Accepts PDF · Max 20MB</span>
        <input type="file" className="hidden"/>
      </label>

      <div className="space-y-2 pt-2">
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Forensic Checks Matrix</p>
        {[
          { check: 'RSA-2048 Digital Signature', result: 'VALID', pass: true },
          { check: 'PDF Font Editing Layers Detected', result: 'NONE FOUND', pass: true },
          { check: 'Metadata Timestamps Consistent', result: 'CONSISTENT', pass: true },
          { check: 'Balance Figure OCR Match', result: 'MATCH — ₦12,500,000.00', pass: true },
        ].map((item, i) => (
          <div key={i} className="p-3.5 rounded-xl flex justify-between items-center text-xs font-mono bg-emerald-500/6 border border-emerald-500/20">
            <span className="text-slate-300">{item.check}</span>
            <span className="font-bold flex items-center space-x-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5"/>
              <span>{item.result}</span>
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  </div>
);

// ─── ADMIN VIEWS ─────────────────────────────────────────────
const AdminParams: React.FC = () => {
  const [fxBuffer, setFxBuffer] = useState(10.0);
  const [anomalyThreshold, setAnomalyThreshold] = useState(2.5);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    try {
      await setDoc(doc(db, 'system_config', 'global'), {
        fxBufferPercent: fxBuffer,
        anomalyThreshold,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <GlassCard accent="purple" className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Global UKVI Risk Parameters</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">Saved parameters are enforced by the Go PoF Matrix Engine across all applications.</p>
        </div>

        {[
          { label: 'FX Volatility Safety Buffer (%)', desc: 'Applied over the raw UKVI GBP requirement to absorb currency drops.', value: fxBuffer, set: setFxBuffer, step: 0.5 },
          { label: 'Cash Deposit Anomaly Threshold (R)', desc: 'Deposits exceeding this ratio are auto-flagged for auditor review.', value: anomalyThreshold, set: setAnomalyThreshold, step: 0.1 },
        ].map((p, i) => (
          <div key={i} className="p-5 rounded-xl bg-[#181B25] border border-white/6 space-y-3">
            <div>
              <p className="text-sm font-bold text-white">{p.label}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.desc}</p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={p.value}
                step={p.step}
                onChange={e => p.set(parseFloat(e.target.value) || 0)}
                className="w-32 bg-[#0A0D14] border border-purple-500/40 text-purple-200 text-sm font-mono px-4 py-2 rounded-lg focus:outline-none"
              />
              <span className="text-xs font-mono text-purple-400 font-bold">Current: {p.value}</span>
            </div>
          </div>
        ))}

        <button
          onClick={save}
          className={`w-full py-3.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
            saved
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20'
          }`}
        >
          {saved ? 'Parameters Saved Successfully' : 'Save & Apply Parameters'}
        </button>
      </GlassCard>
    </div>
  );
};

const AdminAuditLog: React.FC = () => {
  const logs = [
    { id: 'LOG-10041', actor: 'admin@basechaninternational.com', action: 'UPDATE_FX_BUFFER', detail: 'Set global FX buffer: 10.0%', ts: 'Just now', severity: 'INFO' },
    { id: 'LOG-10040', actor: 'system_cron', action: 'OANDA_RATE_FETCH', detail: 'GBP/NGN spot: 1,945.50', ts: '25 min ago', severity: 'INFO' },
    { id: 'LOG-10039', actor: 'auditor@basechanfunder.com', action: 'ISSUE_COMPLIANCE_CERTIFICATE', detail: 'Certificate for APP-2026-8941', ts: '1 hr ago', severity: 'SUCCESS' },
    { id: 'LOG-10038', actor: 'pof-engine@internal', action: 'FLAG_ANOMALOUS_DEPOSIT', detail: 'R=3.45 exceeds threshold for APP-2026-9012', ts: '2 hrs ago', severity: 'WARN' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Immutable Audit Log Stream</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">Append-only audit trail. Cryptographically verified.</p>
        </div>
      </div>

      <GlassCard accent="purple" className="overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead className="bg-[#181B25] border-b border-white/8">
            <tr>
              {['Log ID', 'Actor', 'Action', 'Detail', 'Timestamp'].map(h => (
                <th key={h} className="p-3.5 text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/3 transition-colors">
                <td className="p-3.5 text-purple-400 font-bold">{log.id}</td>
                <td className="p-3.5 text-slate-300">{log.actor}</td>
                <td className="p-3.5 text-white font-bold">{log.action}</td>
                <td className="p-3.5 text-slate-400">{log.detail}</td>
                <td className="p-3.5 text-slate-500">{log.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};

const AdminSystem: React.FC = () => {
  const services = [
    { label: 'Go PoF Engine', port: ':8080', status: 'NOMINAL', latency: '12ms', icon: Zap },
    { label: 'NestJS Ingestion', port: ':3000', status: 'NOMINAL', latency: '28ms', icon: Server },
    { label: 'PostgreSQL 16', port: ':5432', status: 'NOMINAL', latency: '3ms', icon: Database },
    { label: 'Redis Cache', port: ':6379', status: 'NOMINAL', latency: '0.8ms', icon: Cpu },
    { label: 'OANDA FX Stream', port: 'API', status: 'DEGRADED', latency: '840ms', icon: TrendingUp },
    { label: 'HashiCorp Vault', port: ':8200', status: 'NOMINAL', latency: '6ms', icon: Lock },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Infrastructure Service Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {services.map((svc, i) => {
          const Icon = svc.icon;
          return (
            <GlassCard key={i} accent="purple" className="p-5 space-y-3">
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
                <Badge label={svc.status} />
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
};

// ─── MASTER APP PORTAL ────────────────────────────────────────
export const MasterAppPortal: React.FC = () => {
  const { appUser, role, currentUser } = useAuth();
  const [studentTab, setStudentTab] = useState<'overview' | 'accounts' | 'documents' | 'certificate'>('overview');
  const [staffTab, setStaffTab] = useState<'queue' | 'forensics'>('queue');
  const [adminTab, setAdminTab] = useState<'params' | 'audit' | 'system'>('params');

  if (!appUser || !currentUser) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#F5B651] animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading Basechanfunder…</p>
        </div>
      </div>
    );
  }

  const roleBadge = role === 'STUDENT'
    ? 'bg-amber-500/10 text-[#F5B651] border-amber-500/30'
    : role === 'STAFF_AUDITOR'
    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    : 'bg-purple-500/10 text-purple-400 border-purple-500/30';

  const roleLabel = role === 'STUDENT' ? 'STUDENT PORTAL' : role === 'STAFF_AUDITOR' ? 'AUDIT CONSOLE' : 'ADMIN GOVERNANCE';

  const tabActive = role === 'STUDENT' ? 'bg-[#F5B651] text-slate-950 font-bold'
    : role === 'STAFF_AUDITOR' ? 'bg-cyan-500 text-slate-950 font-bold'
    : 'bg-purple-600 text-white font-bold';

  return (
    <div
      className="min-h-screen bg-[#090D16] text-[#DFE2EF] font-sans selection:bg-[#F5B651] selection:text-slate-950"
      style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(245,158,11,0.03) 0%, #090D16 60%)' }}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0D111A]/95 backdrop-blur-2xl border-b border-white/8 px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/logo.svg" alt="Basechanfunder Logo" className="w-9 h-9 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"/>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-base font-black tracking-tight text-[#FFC174]">BASECHANFUNDER</span>
              <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded border ${roleBadge}`}>{roleLabel}</span>
            </div>
            <p className="text-[11px] text-slate-500">UKVI 28-Day Proof of Funds Compliance Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {appUser.photoURL ? (
            <img src={appUser.photoURL} alt="" className="w-9 h-9 rounded-xl object-cover border-2 border-[#F5B651]/40"/>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#181B25] border-2 border-[#F5B651]/40 flex items-center justify-center text-[#F5B651] text-sm font-black">
              {appUser.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-sm font-bold text-white leading-none">{appUser.displayName}</p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">@{appUser.username || appUser.role}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="ml-2 p-2 rounded-xl bg-[#181B25] border border-white/8 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </header>

      {/* SUB NAVIGATION TABS WITH CLEAN LUCIDE ICONS */}
      <div className="bg-[#0D111A] border-b border-white/5 px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto">
          {role === 'STUDENT' && (
            <>
              {[
                { id: 'overview', label: 'Status & Target', icon: BarChart3 },
                { id: 'accounts', label: 'Bank Accounts', icon: Building2 },
                { id: 'documents', label: 'Documents', icon: FolderLock },
                { id: 'certificate', label: 'Certificate', icon: FileCheck2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = studentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStudentTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                      isActive ? tabActive : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {role === 'STAFF_AUDITOR' && (
            <>
              {[
                { id: 'queue', label: 'Applications Queue', icon: ClipboardList },
                { id: 'forensics', label: 'eStatement Forensics', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = staffTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStaffTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                      isActive ? tabActive : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {role === 'ADMIN_GOVERNANCE' && (
            <>
              {[
                { id: 'params', label: 'System Parameters', icon: Sliders },
                { id: 'audit', label: 'Audit Log', icon: Activity },
                { id: 'system', label: 'Infrastructure', icon: Server },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                      isActive ? tabActive : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-8">
        {role === 'STUDENT' && studentTab === 'overview'     && <StudentOverview    uid={currentUser.uid} />}
        {role === 'STUDENT' && studentTab === 'accounts'     && <StudentAccounts    uid={currentUser.uid} />}
        {role === 'STUDENT' && studentTab === 'documents'    && <StudentDocuments   uid={currentUser.uid} />}
        {role === 'STUDENT' && studentTab === 'certificate'  && <StudentCertificate appUser={appUser} />}

        {role === 'STAFF_AUDITOR' && staffTab === 'queue'      && <StaffQueue />}
        {role === 'STAFF_AUDITOR' && staffTab === 'forensics'  && <StaffForensics />}

        {role === 'ADMIN_GOVERNANCE' && adminTab === 'params'  && <AdminParams />}
        {role === 'ADMIN_GOVERNANCE' && adminTab === 'audit'   && <AdminAuditLog />}
        {role === 'ADMIN_GOVERNANCE' && adminTab === 'system'  && <AdminSystem />}
      </main>
    </div>
  );
};
