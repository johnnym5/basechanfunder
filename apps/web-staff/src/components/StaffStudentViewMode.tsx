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
import { MAJOR_CURRENCIES } from '../constants';

interface StaffStudentViewModeProps {
  studentId: string;
  onExit: () => void;
}

export const StaffStudentViewMode: React.FC<StaffStudentViewModeProps> = ({ studentId, onExit }) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTab, setModalTab] = useState<'balance' | 'days' | 'pricing'>('balance');

  // Form States
  const [balanceAdjust, setBalanceAdjust] = useState('');
  const [holdingDays, setHoldingDays] = useState('');
  const [targetGbpInput, setTargetGbpInput] = useState('');
  const [localCurrency, setLocalCurrency] = useState('NGN');
  const [timerStartInput, setTimerStartInput] = useState('');

  // Pricing States
  const [pricingForm, setPricingForm] = useState({
    feePercentage: 2.5,
    maxLimit: 150000000
  });

  useEffect(() => {
    if (!studentId) return;

    // Listen to the specific student evaluation
    const unsub = onSnapshot(doc(db, 'pof_evaluations', studentId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStudent({ id: snap.id, ...data });
        // Pre-fill setup fields if they exist
        if (data.targetGBP) setTargetGbpInput(data.targetGBP.toString());
        if (data.localCurrency) setLocalCurrency(data.localCurrency);
        if (data.startDate) setTimerStartInput(data.startDate);
        if (data.topUpPricingConfig) {
          setPricingForm({
            feePercentage: data.topUpPricingConfig.topUpFeePercentage || 2.5,
            maxLimit: data.topUpPricingConfig.maxAllowedTopUpNgn || 150000000
          });
        }
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

    const updates: any = {
      updatedAt: serverTimestamp()
    };

    let detailParts = [];

    if (holdingDays) {
      const days = parseInt(holdingDays) || 0;
      const newStart = new Date();
      newStart.setDate(newStart.getDate() - days + 1);
      updates.startDate = newStart.toISOString().split('T')[0];
      detailParts.push(`counter: ${days} days`);
    } else if (timerStartInput) {
      updates.startDate = timerStartInput;
      detailParts.push(`start date: ${timerStartInput}`);
    }

    if (targetGbpInput) {
      updates.targetGBP = parseFloat(targetGbpInput) || 0;
      detailParts.push(`target: £${targetGbpInput}`);
    }

    if (localCurrency) {
      updates.localCurrency = localCurrency;
      detailParts.push(`currency: ${localCurrency}`);
    }

    await updateDoc(doc(db, 'pof_evaluations', studentId), updates);

    await addDoc(collection(db, 'audit_logs'), {
      actor: 'Staff Inspector',
      action: 'EVALUATION_SETUP',
      detail: `Configured ${student.userName}: ${detailParts.join(', ')}`,
      studentId: studentId,
      createdAt: serverTimestamp()
    });

    setIsOverrideModalOpen(false);
    setHoldingDays('');
  };

  const handleUpdatePricing = async () => {
    if (!student) return;

    await updateDoc(doc(db, 'pof_evaluations', studentId), {
      topUpPricingConfig: {
        topUpFeePercentage: Number(pricingForm.feePercentage),
        maxAllowedTopUpNgn: Number(pricingForm.maxLimit),
        updatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'audit_logs'), {
      actor: 'Staff Inspector',
      action: 'PRICING_CONFIG_UPDATE',
      detail: `Updated pricing for ${student.userName}: ${pricingForm.feePercentage}% fee, ₦${pricingForm.maxLimit.toLocaleString()} limit`,
      studentId: studentId,
      createdAt: serverTimestamp()
    });

    setIsOverrideModalOpen(false);
    toast.success('Top-Up pricing strategy updated');
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#030712] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Syncing Student Settings...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <StudentLightDashboard
        evaluationId={studentId}
        userId={student?.userId}
        name={student?.userName || 'Student'}
        isStaff={true}
        onStaffAction={(tab) => {
          setModalTab((tab as any) || 'balance');
          setIsOverrideModalOpen(true);
        }}
      />

      {/* 3. Global Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" onClick={() => setIsOverrideModalOpen(false)}>
           <div className="glass-card w-full max-w-md animate-in zoom-in-95 duration-300 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-amber-500/5">
                 <div>
                    <h3 className="text-xl font-black text-amber-500 uppercase tracking-tight">Student Top-Up Settings</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure pricing and limits for this profile</p>
                 </div>
                 <button onClick={() => setIsOverrideModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-slate-500" />
                 </button>
              </div>

              <div className="px-8 pt-6">
                 <div className="flex items-center space-x-2 bg-slate-950/50 p-1 rounded-2xl border border-white/5">
                    {[
                      { id: 'balance', label: 'Balance' },
                      { id: 'days', label: 'Setup Window' },
                      { id: 'pricing', label: 'Top-Up Pricing' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setModalTab(t.id as any)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all ${overrideTab === t.id ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}
                      >
                        {t.label}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Amount (£)</label>
                          <input
                            type="number"
                            placeholder="e.g. 13340"
                            value={targetGbpInput}
                            onChange={e => setTargetGbpInput(e.target.value)}
                            className="w-full input-rounded px-5 py-4 text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Local Currency</label>
                          <select
                            value={localCurrency}
                            onChange={e => setLocalCurrency(e.target.value)}
                            className="w-full input-rounded px-5 py-4 text-xs font-bold"
                          >
                            {MAJOR_CURRENCIES.map(curr => (
                              <option key={curr.code} value={curr.code}>
                                {curr.code} - {curr.name} ({curr.symbol})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Timer Start Date</label>
                          <input
                            type="date"
                            value={timerStartInput}
                            onChange={e => setTimerStartInput(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">OR: Manual Days Count</label>
                          <input
                            type="number"
                            placeholder="0-28"
                            value={holdingDays}
                            onChange={e => setHoldingDays(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleUpdateDays}
                        className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                         Apply Setup Configuration
                      </button>
                   </div>
                 )}

                 {overrideTab === 'pricing' && (
                   <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Fee (%)</label>
                          <span className="text-sm font-black text-blue-500">{pricingForm.feePercentage}%</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <input
                            type="range" min="0.5" max="15" step="0.1"
                            value={pricingForm.feePercentage}
                            onChange={(e) => setPricingForm(prev => ({ ...prev, feePercentage: parseFloat(e.target.value) }))}
                            className="flex-1 accent-blue-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            value={pricingForm.feePercentage}
                            onChange={(e) => setPricingForm(prev => ({ ...prev, feePercentage: parseFloat(e.target.value) }))}
                            className="w-20 bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-center text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Allocation (₦)</label>
                          <input
                            type="number"
                            value={pricingForm.maxLimit}
                            onChange={(e) => setPricingForm(prev => ({ ...prev, maxLimit: parseInt(e.target.value) }))}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing Preview (e.g. ₦1,000,000)</p>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Admin Service Fee</span>
                          <span className="text-blue-400">₦{((1000000 * (pricingForm.feePercentage / 100))).toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleUpdatePricing}
                        className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                         Apply Pricing Strategy
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
