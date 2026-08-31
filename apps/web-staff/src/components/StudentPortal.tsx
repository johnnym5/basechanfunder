import React, { useState } from 'react';
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
  FileCheck2
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  // State management for Student Actions
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'documents' | 'certificate'>('overview');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(['Sponsor_Letter_Affidavit.pdf']);

  // Student Profile Context
  const student = {
    name: 'Chidi Ogunlesi',
    id: 'APP-2026-8941',
    visaRoute: 'UK Student Visa (Tier 4)',
    institution: 'University of Manchester',
    targetGBP: 13340.00,
    targetNGN: 19200000.00,
    currentNGN: 18450000.00,
    currentGBP: 13761.00,
    fxBufferPercent: 5.0,
    maturityDay: 19,
    totalMaturityDays: 28,
    readinessDate: 'Sept 24, 2026',
    status: 'COMPLIANT_HOLDING'
  };

  const accounts = [
    { id: 'ACC-1', bank: 'Guaranty Trust Bank (GTBank)', mask: '******4912', balanceNGN: 12500000, balanceGBP: 9320.00, type: 'Open Banking API', status: 'ACTIVE' },
    { id: 'ACC-2', bank: 'Zenith Bank PLC', mask: '******8019', balanceNGN: 5950000, balanceGBP: 4441.00, type: 'Encrypted SMS Parser', status: 'ACTIVE' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 font-sans selection:bg-[#F5B651] selection:text-slate-950">
      {/* 1. TOP HEADER & APPLICANT CONTEXT BAR */}
      <header className="sticky top-0 z-50 bg-[#0D111A]/90 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-full border-2 border-[#E5A635] p-0.5 overflow-hidden shadow-lg shadow-amber-500/10">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Student Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">Welcome back,</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-[#F5B651] border border-amber-500/20">
                STUDENT PORTAL
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-[#F3C77C]">{student.name}</h1>
          </div>
        </div>

        {/* Right Info Badges */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex flex-col items-end text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Target: {student.visaRoute} 🇬🇧</span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5">{student.institution}</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#003822] border border-[#00E676]/40 text-[#00E676] font-mono text-xs font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]">
            <CheckCircle2 className="w-4 h-4" />
            <span>{student.status}</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN NAVIGATION TABS (STUDENT USER FLOW) */}
      <div className="bg-[#0D111A] border-b border-white/5 px-8 py-3">
        <div className="max-w-6xl mx-auto flex space-x-3 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Proof of Funds Status', desc: 'Track 28-day window & balances' },
            { id: 'accounts', label: '🏦 Linked Bank Accounts', desc: 'Manage Open Banking & SMS' },
            { id: 'documents', label: '📂 Supporting Documents', desc: 'Upload Gift Deeds & Affidavits' },
            { id: 'certificate', label: '📜 UKVI Compliance Certificate', desc: 'Generate official PDF' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex flex-col items-start transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-normal ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-500'}`}>{tab.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN STUDENT WORKSPACE BODY */}
      <main className="max-w-6xl mx-auto p-8 space-y-8">
        {/* TAB 1: PROOF OF FUNDS OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Radial Ring & Target Card */}
            <div className="p-8 rounded-3xl bg-[#101522] border border-white/10 shadow-2xl text-center space-y-6">
              <span className="text-xs font-bold font-mono tracking-[0.2em] text-slate-400 uppercase">
                PROOF OF FUNDS TARGET (UKVI REQUIREMENT)
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
                    strokeDashoffset="45"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white">£{student.currentGBP.toLocaleString()}</span>
                  <span className="text-xs font-bold font-mono text-[#F5B651] mt-1">GBP Equiv.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 border-t border-white/10 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block">Current Local Balance</span>
                  <span className="text-lg font-bold text-white mt-1 block">₦{student.currentNGN.toLocaleString()}</span>
                </div>
                <div className="border-l border-white/10">
                  <span className="text-slate-400 block">Required Target</span>
                  <span className="text-lg font-bold text-white mt-1 block">₦{student.targetNGN.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#171D2D] border border-white/5 max-w-md mx-auto flex items-center justify-center space-x-2 font-mono text-xs text-[#F5B651]">
                <TrendingUp className="w-4 h-4 text-[#F5B651]" />
                <span>FX Volatility Safety Buffer: +{student.fxBufferPercent}% Applied</span>
              </div>
            </div>

            {/* 28-Day Maturity Progress */}
            <div className="p-6 rounded-3xl bg-[#101522] border border-white/10 space-y-4">
              <div className="flex justify-between items-center font-mono">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-white">28-Day Consecutive Holding Window</span>
                </div>
                <span className="px-3 py-1 rounded-lg bg-[#262118] border border-[#F5B651]/30 text-[#F5B651] text-xs font-bold">
                  Readiness Target: {student.readinessDate}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">
                Day {student.maturityDay} of {student.totalMaturityDays} Days Uninterrupted
              </h3>

              <div className="w-full bg-[#1E2638] h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#F5B651] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(student.maturityDay / student.totalMaturityDays) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Action Alert Banner */}
            <div className="p-6 rounded-3xl bg-[#101522] border-l-4 border-l-[#F5B651] border-y border-r border-white/10 space-y-4">
              <div className="flex items-center space-x-2 text-[#F5B651]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold">Action Required: Source of Funds Flag</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                An unverified single-day deposit of ₦3,500,000 was detected. To protect your 28-day continuous maturity status, upload a Deed of Gift or Sponsor Affidavit.
              </p>
              <button
                onClick={() => { setActiveTab('documents'); setShowUploadModal(true); }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Supporting Deed / Affidavit</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LINKED BANK ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Linked Financial Accounts</h2>
                <p className="text-xs text-slate-400 mt-1">Basechanfunder tracks daily closing balances via encrypted Open Banking & SMS.</p>
              </div>
              <button
                onClick={() => setShowAddBankModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#F5B651] text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Link New Bank Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-6 rounded-2xl bg-[#101522] border border-white/10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-[#182032] text-[#F5B651]">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{acc.bank}</h3>
                        <span className="text-xs font-mono text-slate-400">{acc.mask} • {acc.type}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-[#00E676] border border-emerald-500/30 text-[10px] font-mono font-bold">
                      {acc.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">Local Balance</span>
                      <span className="font-bold text-white">₦{acc.balanceNGN.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">Converted GBP</span>
                      <span className="font-bold text-[#F5B651]">£{acc.balanceGBP.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SUPPORTING DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Supporting Verification Documents</h2>
                <p className="text-xs text-slate-400 mt-1">Upload affidavits and deeds to justify large deposits or sponsor funding.</p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#F5B651] text-slate-950 font-bold text-xs flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Document</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#101522] border border-white/10 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Uploaded Document Repository</h3>
              {uploadedFiles.map((file, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#182032] border border-white/5 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-[#F5B651]" />
                    <span className="text-white font-bold">{file}</span>
                  </div>
                  <span className="text-[#00E676] font-bold">✓ VERIFIED BY AUDITOR</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: COMPLIANCE CERTIFICATE */}
        {activeTab === 'certificate' && (
          <div className="p-8 rounded-3xl bg-[#101522] border border-white/10 text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F5B651]/10 border border-[#F5B651]/30 flex items-center justify-center mx-auto text-[#F5B651]">
              <FileCheck2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">UKVI Official Proof of Funds Certificate</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Your 28-day continuous holding requirement is verified compliant. Generate a digitally-signed PDF report for submission to the Home Office.
              </p>
            </div>

            <button className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 font-black text-xs inline-flex items-center space-x-2 shadow-lg shadow-amber-500/20">
              <Download className="w-4 h-4" />
              <span>Download Signed Compliance Certificate (PDF)</span>
            </button>
          </div>
        )}
      </main>

      {/* MODAL: LINK BANK ACCOUNT */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl bg-[#101522] border border-white/10 max-w-md w-full space-y-5">
            <h3 className="text-base font-bold text-white">Link Bank Account (Mono / OAuth2)</h3>
            <p className="text-xs text-slate-400">Secure zero-knowledge tokenization. Your login PIN is never stored.</p>
            <div className="space-y-3">
              {['GTBank', 'Zenith Bank', 'Access Bank', 'FirstBank'].map((b) => (
                <button
                  key={b}
                  onClick={() => setShowAddBankModal(false)}
                  className="w-full p-3 rounded-xl bg-[#182032] hover:bg-[#1E2638] text-white text-xs font-bold flex justify-between items-center transition-all"
                >
                  <span>{b}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddBankModal(false)} className="w-full text-xs text-slate-400 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD DOCUMENT */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl bg-[#101522] border border-white/10 max-w-md w-full space-y-5">
            <h3 className="text-base font-bold text-white">Upload Affidavit or Deed of Gift</h3>
            <div
              onClick={() => {
                setUploadedFiles([...uploadedFiles, 'Gift_Deed_Notarized.pdf']);
                setShowUploadModal(false);
              }}
              className="p-8 border-2 border-dashed border-[#F5B651]/40 rounded-2xl bg-[#182032]/50 text-center cursor-pointer hover:border-[#F5B651]"
            >
              <Upload className="w-8 h-8 text-[#F5B651] mx-auto mb-2" />
              <span className="text-xs font-bold text-white block">Click to upload PDF or Image</span>
              <span className="text-[10px] text-slate-400 block mt-1">Maximum file size: 10MB</span>
            </div>
            <button onClick={() => setShowUploadModal(false)} className="w-full text-xs text-slate-400 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
