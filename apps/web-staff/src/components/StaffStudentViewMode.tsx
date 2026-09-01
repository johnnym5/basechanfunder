import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  X,
  ShieldAlert,
  Edit3,
  Plus,
  Trash2,
  Calendar,
  Building2,
  TrendingUp,
  Activity,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Settings2,
  Save,
  Zap,
  CreditCard
} from 'lucide-react';
import { StudentLightDashboard } from './StudentLightDashboard';

interface StaffStudentViewModeProps {
  studentId: string;
  onExit: () => void;
}

export const StaffStudentViewMode: React.FC<StaffStudentViewModeProps> = ({ studentId, onExit }) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTab, setModalTab] = useState<'balance' | 'days' | 'add_bank'>('balance');

  // Form States
  const [balanceAdjust, setBalanceAdjust] = useState('');
  const [holdingDays, setHoldingDays] = useState('');
  const [bankForm, setBankForm] = useState({ name: '', number: '', balance: '' });

  useEffect(() => {
    if (!studentId) return;

    // Listen to the specific student evaluation
    const unsub = onSnapshot(doc(db, 'pof_evaluations', studentId), (snap) => {
      if (snap.exists()) {
        setStudent({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [studentId]);

  const handleUpdateBalance = async () => {
    if (!student) return;
    const adjust = parseFloat(balanceAdjust) || 0;
    const current = student.currentBalanceNgn || 0;

    await updateDoc(doc(db, 'pof_evaluations', studentId), {
      currentBalanceNgn: current + adjust,
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'audit_logs'), {
      actor: 'Staff Inspector',
      action: 'BALANCE_ADJUST',
      detail: `${adjust >= 0 ? 'Credited' : 'Debited'} ₦${Math.abs(adjust)} for ${student.userName}`,
      studentId: studentId,
      createdAt: serverTimestamp()
    });

    setIsOverrideModalOpen(false);
    setBalanceAdjust('');
  };

  const handleUpdateDays = async () => {
    if (!student) return;
    const days = parseInt(holdingDays) || 0;

    // Calculate new startDate to reflect these days
    const newStart = new Date();
    newStart.setDate(newStart.getDate() - days + 1);

    await updateDoc(doc(db, 'pof_evaluations', studentId), {
      startDate: newStart.toISOString().split('T')[0],
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'audit_logs'), {
      actor: 'Staff Inspector',
      action: 'DAYS_OVERRIDE',
      detail: `Set holding counter to ${days} days for ${student.userName}`,
      studentId: studentId,
      createdAt: serverTimestamp()
    });

    setIsOverrideModalOpen(false);
    setHoldingDays('');
  };

  const handleAddBank = async () => {
    if (!student) return;
    const balance = parseFloat(bankForm.balance) || 0;

    await addDoc(collection(db, 'financial_accounts'), {
      userId: student.userId || studentId,
      userEmail: student.userEmail || '',
      bankName: bankForm.name,
      accountNumberMasked: `•••• ${bankForm.number.slice(-4)}`,
      accountType: 'SAVINGS',
      balanceNgn: balance,
      balanceGbp: balance / 1945.50,
      connectionMethod: 'MANUAL_DEPOSIT',
      status: 'VERIFIED',
      lastSyncedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    setIsOverrideModalOpen(false);
    setBankForm({ name: '', number: '', balance: '' });
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#030712] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Entering Inspector View...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] relative">
      {/* 1. Inspector Sticky Top Bar */}
      <div className="sticky top-0 z-[200] w-full bg-amber-500 text-slate-950 px-6 py-2 flex justify-between items-center shadow-2xl">
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 fill-slate-950/20" />
            <span className="text-[10px] font-black uppercase tracking-widest">Staff Inspector View Active</span>
          </div>
          <div className="h-4 w-px bg-slate-950/20" />
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase opacity-60 italic">Session Target:</span>
            <span className="text-[10px] font-black uppercase">{student?.userName} ({student?.id})</span>
          </div>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-2 bg-slate-950 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
        >
          <ArrowLeft className="w-3 h-3" />
          Exit Inspector
        </button>
      </div>

      {/* 2. Modified Student Dashboard */}
      {/* Note: We reuse StudentLightDashboard but pass in the student name and wrap it with our tools */}
      <div className="relative">
        <StudentLightDashboard name={student?.userName || 'Student'} />

        {/* Float Controls Layer (Absolutely positioned OVER the dashboard elements) */}
        {/* Balance Edit Trigger */}
        <div className="absolute top-[280px] right-[10%] z-50">
           <button
             onClick={() => { setModalTab('balance'); setIsOverrideModalOpen(true); }}
             className="bg-amber-500 text-slate-950 p-2 rounded-full shadow-xl hover:scale-110 transition-all group"
           >
             <Edit3 className="w-4 h-4" />
             <span className="absolute right-full mr-3 bg-slate-950 text-white text-[9px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Edit Balance</span>
           </button>
        </div>

        {/* Days Edit Trigger */}
        <div className="absolute top-[380px] right-[10%] z-50">
           <button
             onClick={() => { setModalTab('days'); setIsOverrideModalOpen(true); }}
             className="bg-amber-500 text-slate-950 p-2 rounded-full shadow-xl hover:scale-110 transition-all group"
           >
             <Calendar className="w-4 h-4" />
             <span className="absolute right-full mr-3 bg-slate-950 text-white text-[9px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Set Holding Days</span>
           </button>
        </div>

        {/* Bank Add Trigger */}
        <div className="absolute top-[600px] left-[50%] -translate-x-1/2 z-50">
           <button
             onClick={() => { setModalTab('add_bank'); setIsOverrideModalOpen(true); }}
             className="flex items-center gap-2 bg-amber-500 text-slate-950 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
           >
             <Plus className="w-4 h-4" />
             Add Bank Account to Profile
           </button>
        </div>
      </div>

      {/* 3. Global Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
           <div className="bg-[#0D111A] border border-amber-500/20 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-amber-500/5">
                 <div>
                    <h3 className="text-xl font-black text-amber-500 uppercase tracking-tight">Inspector Overrides</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manual ledger adjustment protocol</p>
                 </div>
                 <button onClick={() => setIsOverrideModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-slate-500" />
                 </button>
              </div>

              <div className="px-8 pt-6">
                 <div className="flex items-center space-x-2 bg-slate-950/50 p-1 rounded-2xl border border-white/5">
                    {['balance', 'days', 'add_bank'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setModalTab(tab as any)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all ${overrideTab === tab ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}
                      >
                        {tab.replace('_', ' ')}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="p-8">
                 {overrideTab === 'balance' && (
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Adjustment Amount (₦)</label>
                        <input
                          type="number"
                          placeholder="e.g. +500000 or -100000"
                          value={balanceAdjust}
                          onChange={e => setBalanceAdjust(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        onClick={handleUpdateBalance}
                        className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                         Apply Balance Change
                      </button>
                   </div>
                 )}

                 {overrideTab === 'days' && (
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Holding Days</label>
                        <input
                          type="number"
                          placeholder="0-28"
                          value={holdingDays}
                          onChange={e => setHoldingDays(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        onClick={handleUpdateDays}
                        className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                         Override Holding Counter
                      </button>
                   </div>
                 )}

                 {overrideTab === 'add_bank' && (
                   <div className="space-y-4">
                      <input
                        placeholder="Bank Name"
                        value={bankForm.name}
                        onChange={e => setBankForm({...bankForm, name: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none"
                      />
                      <input
                        placeholder="Account Number"
                        value={bankForm.number}
                        onChange={e => setBankForm({...bankForm, number: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Balance (₦)"
                        value={bankForm.balance}
                        onChange={e => setBankForm({...bankForm, balance: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none"
                      />
                      <button
                        onClick={handleAddBank}
                        className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                         Force Link Account
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
