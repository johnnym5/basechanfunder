import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
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
  CreditCard,
  CheckCheck
} from 'lucide-react';
import { StudentDashboardView } from './StudentDashboardView';
import { MAJOR_CURRENCIES } from '../constants';

interface StaffStudentViewModeProps {
  studentId: string;
  onExit: () => void;
}

export const StaffStudentViewMode: React.FC<StaffStudentViewModeProps> = ({ studentId, onExit }) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTab, setModalTab] = useState<'request' | 'days' | 'pricing'>('request');

  // Form States
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedCapital, setModifiedCapital] = useState<number>(0);
  const [isProcessing, setIsSubmitting] = useState(false);

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

    // 1. Listen to Student Evaluation
    const evalQ = query(collection(db, 'pof_evaluations'), where('userId', '==', studentId));
    const unsubEval = onSnapshot(evalQ, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        setStudent({ id: docSnap.id, ...data });

        if (data.targetGBP) setTargetGbpInput(data.targetGBP.toString());
        if (data.localCurrency) setLocalCurrency(data.localCurrency);
        if (data.startDate) setTimerStartInput(data.startDate);
        if (data.topUpPricingConfig) {
          setPricingForm({
            feePercentage: data.topUpPricingConfig.topUpFeePercentage || 2.5,
            maxLimit: data.topUpPricingConfig.maxAllowedTopUpNgn || 150000000
          });
        }
      } else {
        getDoc(doc(db, 'users', studentId)).then(userSnap => {
           if (userSnap.exists()) {
             setStudent({ userId: studentId, userName: userSnap.data().displayName });
           }
        });
      }
      setLoading(false);
    });

    // 2. Listen to Pending Top-Up Request
    const requestQ = query(
        collection(db, 'topup_requests'),
        where('userId', '==', studentId),
        where('status', '==', 'PENDING_ADMIN_VERIFICATION'),
        limit(1)
    );
    const unsubRequest = onSnapshot(requestQ, (snap) => {
        if (!snap.empty) {
            const data = snap.docs[0].data();
            setActiveRequest({ id: snap.docs[0].id, ...data });
            setModifiedCapital(data.topUpAmountNgn || 0);
        } else {
            setActiveRequest(null);
        }
    });

    return () => {
        unsubEval();
        unsubRequest();
    };
  }, [studentId]);

  const handleApproveRequest = async () => {
    if (!activeRequest || !studentId) return;
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/v1/topup/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId: activeRequest.id,
                userId: studentId,
                approvedCapitalNgn: modifiedCapital,
                adminServiceFeeNgn: Math.round(modifiedCapital * (pricingForm.feePercentage / 100))
            })
        });

        const result = await response.json();
        if (result.status === 'SUCCESS') {
            toast.success('Top-Up approved successfully!');
            setIsOverrideModalOpen(false);
            setIsModifying(false);
        } else {
            throw new Error(result.message);
        }
    } catch (err: any) {
        toast.error('Approval failed: ' + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDenyRequest = async () => {
    if (!activeRequest || !studentId) return;
    const reason = window.prompt("Reason for denial:");
    if (reason === null) return; // Cancelled

    setIsSubmitting(true);
    try {
        const response = await fetch('/api/v1/topup/deny', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId: activeRequest.id,
                userId: studentId,
                rejectionReason: reason || 'Information mismatch'
            })
        });

        const result = await response.json();
        if (result.status === 'SUCCESS') {
            toast.success('Request denied.');
            setIsOverrideModalOpen(false);
        } else {
            throw new Error(result.message);
        }
    } catch (err: any) {
        toast.error('Denial failed: ' + err.message);
    } finally {
        setIsSubmitting(false);
    }
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
    <div className="relative w-full">
      <StudentDashboardView
        studentId={studentId}
        viewMode="ADMIN"
        studentName={student?.userName || student?.displayName || 'Student'}
        onAdminAction={(tab) => {
          setModalTab((tab as any) || 'balance');
          setIsOverrideModalOpen(true);
        }}
        onExit={onExit}
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
                      { id: 'request', label: 'Pending Request' },
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
                 {overrideTab === 'request' && (
                   <div className="space-y-6 animate-in fade-in duration-300">
                      {!activeRequest ? (
                        <div className="py-12 text-center space-y-4 opacity-50">
                           <ShieldAlert className="w-12 h-12 mx-auto text-slate-500" />
                           <p className="text-xs font-black uppercase tracking-widest">No active top-up claims pending for this profile.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20 space-y-5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4">
                                 <div className="px-2 py-1 rounded bg-blue-500 text-white text-[7px] font-black uppercase tracking-widest animate-pulse">Live Claim</div>
                              </div>

                              <div className="space-y-4">
                                 <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Top-Up Capital Requested</p>
                                    {isModifying ? (
                                       <div className="relative">
                                          <input
                                             type="number"
                                             value={modifiedCapital}
                                             onChange={e => setModifiedCapital(Number(e.target.value))}
                                             className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-3 text-lg font-black text-white focus:outline-none"
                                          />
                                       </div>
                                    ) : (
                                       <h4 className="text-3xl font-black text-white leading-none">₦{activeRequest.topUpAmountNgn?.toLocaleString()}</h4>
                                    )}
                                 </div>

                                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Admin Service Fee (2.5%)</p>
                                       <p className="text-sm font-bold text-blue-400">₦{Math.round(modifiedCapital * (pricingForm.feePercentage / 100)).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Payment Reference</p>
                                       <div className="flex items-center justify-end gap-1.5 mt-1">
                                          <Zap className="w-3 h-3 text-amber-500" />
                                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase">"{activeRequest.paymentReference || 'N/A'}"</span>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="pt-2">
                                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter italic">Submitted: {new Date(activeRequest.createdAt).toLocaleString()}</p>
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 gap-3">
                              <button
                                 onClick={handleApproveRequest}
                                 disabled={isProcessing}
                                 className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                 {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                                 Approve Top-Up
                              </button>

                              <div className="flex gap-3">
                                 <button
                                    onClick={() => setIsModifying(!isModifying)}
                                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isModifying ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-white/5'}`}
                                 >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    {isModifying ? 'Save Mod' : 'Modify'}
                                 </button>
                                 <button
                                    onClick={handleDenyRequest}
                                    disabled={isProcessing}
                                    className="flex-1 py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                                 >
                                    <X className="w-3.5 h-3.5" />
                                    Deny Request
                                 </button>
                              </div>
                           </div>
                        </div>
                      )}
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
