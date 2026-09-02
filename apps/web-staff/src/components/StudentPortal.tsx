import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
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
  CreditCard,
  Lock,
  Clock,
  ExternalLink,
  ChevronRight,
  FileCheck2,
  Loader2
} from 'lucide-react';
import { TopUpRequestModal } from './TopUpRequestModal';

export const StudentPortal: React.FC = () => {
  const { currentUser, appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'documents' | 'certificate'>('overview');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const [evaluation, setEvaluation] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // 1. Listen to linked accounts
    const accQ = query(
      collection(db, 'financial_accounts'),
      where('userId', '==', currentUser.uid)
    );
    const unsubAcc = onSnapshot(accQ, (snap) => {
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Listen to compliance evaluation
    const evalQ = query(
      collection(db, 'pof_evaluations'),
      where('userId', '==', currentUser.uid)
    );
    const unsubEval = onSnapshot(evalQ, (snap) => {
      if (!snap.empty) setEvaluation(snap.docs[0].data());
      setLoading(false);
    });

    return () => {
      unsubAcc();
      unsubEval();
    };
  }, [currentUser?.uid]);

  const totalGbp = useMemo(() =>
    accounts.reduce((sum, acc) => sum + (Number(acc.balanceGBP) || 0), 0)
  , [accounts]);

  const totalNgn = useMemo(() =>
    accounts.reduce((sum, acc) => sum + (Number(acc.balanceNGN) || 0), 0)
  , [accounts]);

  const daysElapsed = useMemo(() => {
    if (!evaluation?.startDate) return 0;
    const start = new Date(evaluation.startDate).getTime();
    return Math.min(Math.max(Math.floor((Date.now() - start) / 86400000) + 1, 1), 28);
  }, [evaluation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 font-sans selection:bg-[#F5B651] selection:text-slate-950">
      {/* 1. TOP HEADER & APPLICANT CONTEXT BAR */}
      <header className="sticky top-0 z-50 bg-[#0D111A]/90 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-full border-2 border-[#E5A635] p-0.5 overflow-hidden shadow-lg shadow-amber-500/10 flex items-center justify-center bg-slate-800 font-black text-amber-500">
            {appUser?.displayName?.[0] || 'U'}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Active Session:</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-[#F5B651] border border-amber-500/20 uppercase">
                STUDENT PORTAL
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-[#F3C77C] uppercase">{appUser?.displayName || 'Unknown Student'}</h1>
          </div>
        </div>

        {/* Right Info Badges */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex flex-col items-end text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-slate-300 uppercase">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Route: {evaluation?.visaRoute || 'General'}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5 uppercase tracking-tighter opacity-60">System Verified ID: {currentUser?.uid.substring(0, 8)}</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#003822] border border-[#00E676]/40 text-[#00E676] font-mono text-xs font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]">
            <CheckCircle2 className="w-4 h-4" />
            <span className="uppercase tracking-tight">NOMINAL STATUS</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN NAVIGATION TABS (STUDENT USER FLOW) */}
      <div className="bg-[#0D111A] border-b border-white/5 px-8 py-3">
        <div className="max-w-6xl mx-auto flex space-x-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: '📊 Compliance Status', desc: '28-Day Window' },
            { id: 'accounts', label: '🏦 Linked Sources', desc: 'Open Banking' },
            { id: 'documents', label: '📂 Digital Vault', desc: 'Affidavits & Deeds' },
            { id: 'certificate', label: '📜 Confirmation', desc: 'Export PDF' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex flex-col items-start transition-all min-w-[160px] ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="uppercase tracking-tighter">{tab.label}</span>
              <span className={`text-[10px] font-normal uppercase tracking-widest mt-0.5 opacity-60 ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-500'}`}>{tab.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN STUDENT WORKSPACE BODY */}
      <main className="max-w-6xl mx-auto p-8 space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="p-8 rounded-3xl bg-[#101522] border border-white/10 shadow-2xl text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16" />

              <span className="text-xs font-bold font-mono tracking-[0.2em] text-slate-400 uppercase">
                PROOF OF FUNDS EQUIVALENCY
              </span>

              <div className="relative w-52 h-52 mx-auto flex items-center justify-center my-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#1E2638" strokeWidth="7" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#F5B651"
                    strokeWidth="7"
                    strokeDasharray="263.8"
                    strokeDashoffset={263.8 - (263.8 * Math.min(totalGbp / (evaluation?.targetGBP || 13340), 1))}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white">£{totalGbp.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-amber-500 mt-1 uppercase tracking-widest">Liquid Assets</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-6 border-t border-white/5 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block uppercase tracking-tighter mb-1">Local Balance</span>
                  <span className="text-lg font-bold text-white block">₦{totalNgn.toLocaleString()}</span>
                </div>
                <div className="border-l border-white/5 pl-4">
                  <span className="text-slate-500 block uppercase tracking-tighter mb-1">Embassy Target</span>
                  <span className="text-lg font-bold text-white block">£{(evaluation?.targetGBP || 13340).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#171D2D] border border-white/5 max-w-md mx-auto flex items-center justify-between space-x-2 font-mono text-[10px] text-amber-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>FX Buffering Active (OANDA Live)</span>
                </div>
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg font-black hover:bg-amber-400 transition-all"
                >
                  Request Top-Up
                </button>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#101522] border border-white/10 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">UKVI 28-Day Maturity Window</span>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-tighter">
                   Continuous Tracking
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Day {daysElapsed} of 28 Days Compliance
                </h3>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Status: {daysElapsed >= 28 ? 'READY FOR CERTIFICATION' : 'MATURING'}</p>
              </div>

              <div className="w-full bg-[#1E2638] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(daysElapsed / 28) * 100}%` }}
                ></div>
              </div>
            </div>

            {evaluation?.anomalyRatio > 2.5 && (
              <div className="p-6 rounded-3xl bg-rose-500/10 border-l-4 border-l-rose-500 border-y border-r border-rose-500/20 space-y-4">
                <div className="flex items-center space-x-2 text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-base font-black uppercase tracking-tight">Compliance Anomaly Detected</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  A large deposit was identified which exceeds the median threshold. Please upload a Deed of Gift or Sponsor Affidavit in the Digital Vault to avoid a compliance break.
                </p>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="px-6 py-3 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/10"
                >
                  Go to Digital Vault
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LINKED BANK ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Financial Portfolio</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Verified Open Banking & Aggregator Sources</p>
              </div>
              <button
                onClick={() => setShowAddBankModal(true)}
                className="px-6 py-3 rounded-xl bg-[#F5B651] text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                <span>Link Source</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-8 rounded-3xl bg-[#101522] border border-white/10 space-y-6 hover:border-amber-500/30 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 rounded-2xl bg-[#182032] text-amber-500 border border-white/5">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-white uppercase tracking-tight">{acc.bankName}</h3>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{acc.accountMask} • ACTIVE NODE</span>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 font-mono text-xs">
                    <div>
                      <span className="text-slate-600 block uppercase tracking-widest mb-1">Local (NGN)</span>
                      <span className="text-lg font-bold text-white block">₦{(acc.balanceNGN || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-l border-white/5 pl-4">
                      <span className="text-slate-600 block uppercase tracking-widest mb-1">Equiv. (GBP)</span>
                      <span className="text-lg font-bold text-amber-500 block">£{(acc.balanceGBP || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="col-span-2 py-20 bg-slate-900/20 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center justify-center opacity-30">
                   <CreditCard className="w-12 h-12 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Sources Linked</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3 & 4 (Placeholders for now, cleaned up) */}
        {activeTab === 'documents' && (
          <div className="p-20 text-center space-y-4 opacity-40 animate-in fade-in duration-500">
             <FileText className="w-16 h-16 mx-auto text-slate-500" />
             <h2 className="text-xl font-black uppercase tracking-widest">Digital Vault</h2>
             <p className="text-xs font-bold uppercase tracking-tighter">Secure document repository coming online soon</p>
          </div>
        )}

        {activeTab === 'certificate' && (
          <div className="p-20 text-center space-y-4 opacity-40 animate-in fade-in duration-500">
             <FileCheck2 className="w-16 h-16 mx-auto text-slate-500" />
             <h2 className="text-xl font-black uppercase tracking-widest">Compliance Export</h2>
             <p className="text-xs font-bold uppercase tracking-tighter">Download center available after Day 28 verification</p>
          </div>
        )}
      </main>

      <TopUpRequestModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {}}
      />

    </div>
  );
};

export default StudentPortal;
