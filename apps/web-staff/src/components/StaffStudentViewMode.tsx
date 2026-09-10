import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  addDoc,
  limit,
  runTransaction,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import {
  X as XIcon,
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
import { StudentDashboardSkeleton } from './ui/LoadingStates';

interface StaffStudentViewModeProps {
  studentId: string;
  onExit: () => void;
}

export const StaffStudentViewMode: React.FC<StaffStudentViewModeProps> = ({ studentId, onExit }) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTab, setModalTab] = useState<'request' | 'history' | 'days' | 'pricing'>('request');

  // Form States
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedCapital, setModifiedCapital] = useState<number>(0);
  const [isProcessing, setIsSubmitting] = useState(false);

  const [holdingDays, setHoldingDays] = useState('');
  const [targetGbpInput, setTargetGbpInput] = useState('');
  const [localCurrency, setLocalCurrency] = useState('NGN');
  const [timerStartInput, setTimerStartInput] = useState(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState('28');

  const calculatedEndDate = useMemo(() => {
    if (!timerStartInput) return null;
    const start = new Date(timerStartInput);
    const duration = parseInt(durationDays) || 0;
    const end = new Date(start.getTime() + (duration * 24 * 60 * 60 * 1000));
    return end.toISOString().split('T')[0];
  }, [timerStartInput, durationDays]);

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
             setStudent({ userId: studentId, userName: userSnap.data().displayName, email: userSnap.data().email });
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

    // 3. Listen to Top-Up Request History
    const historyQ = query(
        collection(db, 'topup_requests'),
        where('userId', '==', studentId),
        where('status', 'in', ['APPROVED', 'REJECTED'])
    );
    const unsubHistory = onSnapshot(historyQ, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRequestHistory(docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => {
        unsubEval();
        unsubRequest();
        unsubHistory();
    };
  }, [studentId]);

  const handleApproveRequest = async () => {
    if (!activeRequest || !studentId) return;
    setIsSubmitting(true);
    const t = toast.loading('Synchronizing Dual-Ledger Facility...');
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', studentId);
        const requestRef = doc(db, 'topup_requests', activeRequest.id);
        const facilityRef = doc(db, 'financial_accounts', `TOPUP_${studentId}`);

        // 1. Update Request Status
        transaction.update(requestRef, {
          status: 'APPROVED',
          approvedAt: serverTimestamp(),
          approvedCapitalNgn: Number(modifiedCapital),
          adminServiceFeeNgn: Math.round(Number(modifiedCapital) * (pricingForm.feePercentage / 100))
        });

        // 2. Initialize or Update Top-Up Facility
        const LIVE_FX_RATE = 1945.50;
        transaction.set(facilityRef, {
          userId: studentId,
          accountName: 'Basechan Sponsored Capital',
          bankName: 'Organization Top-Up Capital',
          accountNumberMasked: '•••• TOPUP',
          accountType: 'SPONSORED',
          balanceNgn: Number(modifiedCapital),
          balanceGbp: Math.round((Number(modifiedCapital) / LIVE_FX_RATE) * 100) / 100,
          status: 'VERIFIED',
          isVerified: true,
          connectionMethod: 'TOP_UP',
          updatedAt: serverTimestamp()
        }, { merge: true });

        // 3. Update Student Root Record
        transaction.update(userRef, {
          status: 'CLEARED',
          topUpStatus: 'APPROVED',
          hasPendingTopUp: false,
          isApproved: true,
          updatedAt: serverTimestamp()
        });

        // 4. Update Evaluation if exists
        const evalQ = query(collection(db, 'pof_evaluations'), where('userId', '==', studentId));
        const evalSnap = await getDocs(evalQ);
        if (!evalSnap.empty) {
          transaction.update(evalSnap.docs[0].ref, {
            status: 'CLEARED',
            isApproved: true,
            updatedAt: serverTimestamp()
          });
        }
      });

      toast.success('Top-Up approved successfully!', { id: t });
      setIsOverrideModalOpen(false);
      setIsModifying(false);
    } catch (err: any) {
      toast.error('Transaction failed: ' + err.message, { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDenyRequest = async () => {
    if (!activeRequest || !studentId) return;
    const reason = window.prompt("Reason for denial:");
    if (reason === null) return; // Cancelled

    setIsSubmitting(true);
    const t = toast.loading('Denying claim...');
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', studentId);
        const requestRef = doc(db, 'topup_requests', activeRequest.id);

        transaction.update(requestRef, {
          status: 'REJECTED',
          rejectionReason: reason || 'Information mismatch',
          rejectedAt: serverTimestamp()
        });

        transaction.update(userRef, {
          topUpStatus: 'REJECTED',
          hasPendingTopUp: false,
          status: 'ACTION_REQUIRED',
          updatedAt: serverTimestamp()
        });
      });

      toast.success('Request denied.', { id: t });
      setIsOverrideModalOpen(false);
    } catch (err: any) {
      toast.error('Failed: ' + err.message, { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDays = async () => {
    if (!student) return;
    setIsSubmitting(true);

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
      updates.expirationDate = calculatedEndDate;
      updates.durationDays = parseInt(durationDays) || 28;
      updates.isTimerActive = true;
      detailParts.push(`start: ${timerStartInput}, end: ${calculatedEndDate}`);
    }

    if (targetGbpInput) {
      updates.targetGBP = parseFloat(targetGbpInput) || 0;
      detailParts.push(`target: £${targetGbpInput}`);
    }

    if (localCurrency) {
      updates.localCurrency = localCurrency;
      detailParts.push(`currency: ${localCurrency}`);
    }

    try {
      // Use setDoc with merge instead of updateDoc to ensure creation if missing
      // We always use the UID as the document ID for evaluations now to keep it consistent
      await setDoc(doc(db, 'pof_evaluations', studentId), {
        ...updates,
        userId: studentId,
        userName: student.userName || student.name || 'Student',
        userEmail: student.email || '',
        createdAt: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, 'audit_logs'), {
        actor: 'Staff Inspector',
        action: 'EVALUATION_SETUP',
        detail: `Configured ${student.userName}: ${detailParts.join(', ')}`,
        studentId: studentId,
        createdAt: serverTimestamp()
      });

      toast.success('Setup configuration applied.');
      setIsOverrideModalOpen(false);
      setHoldingDays('');
    } catch (e: any) {
      toast.error('Setup failed: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePricing = async () => {
    if (!student) return;
    setIsSubmitting(true);

    const updates = {
      topUpPricingConfig: {
        topUpFeePercentage: Number(pricingForm.feePercentage),
        maxAllowedTopUpNgn: Number(pricingForm.maxLimit),
        updatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'pof_evaluations', studentId), {
        ...updates,
        userId: studentId,
        userName: student.userName || student.name || 'Student',
        userEmail: student.email || '',
        createdAt: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, 'audit_logs'), {
        actor: 'Staff Inspector',
        action: 'PRICING_CONFIG_UPDATE',
        detail: `Updated pricing for ${student.userName}: ${pricingForm.feePercentage}% fee, ₦${pricingForm.maxLimit.toLocaleString()} limit`,
        studentId: studentId,
        createdAt: serverTimestamp()
      });

      toast.success('Top-Up pricing updated.');
      setIsOverrideModalOpen(false);
    } catch (e: any) {
      toast.error('Pricing update failed: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <StudentDashboardSkeleton />;
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
                    <h3 className="text-xl font-black text-main dark:text-amber-500 uppercase tracking-tight">Student Top-Up Settings</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure pricing and limits for this profile</p>
                 </div>
                 <button onClick={() => setIsOverrideModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                    <XIcon className="w-6 h-6 text-slate-500" />
                 </button>
              </div>

              <div className="px-8 pt-6">
                 <div className="flex items-center space-x-2 bg-slate-950/50 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'request', label: 'Pending Request' },
                      { id: 'history', label: 'History' },
                      { id: 'days', label: 'Setup Window' },
                      { id: 'pricing', label: 'Top-Up Pricing' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setModalTab(t.id as any)}
                        className={`flex-1 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all shrink-0 ${overrideTab === t.id ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}
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
                        <div className="py-12 text-center space-y-4">
                           <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto border border-white/5 opacity-40">
                              <CheckCheck className="w-8 h-8 text-emerald-500" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-xs font-black uppercase tracking-widest text-main dark:text-white opacity-40">No pending claims</p>
                              <button
                                 onClick={() => setModalTab('history')}
                                 className="text-[9px] font-bold text-blue-400 uppercase tracking-widest hover:underline"
                              >
                                 View Request History
                              </button>
                           </div>
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
                                       <h4 className="text-3xl font-black text-main dark:text-white leading-none">₦{activeRequest.topUpAmountNgn?.toLocaleString()}</h4>
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
                                    <XIcon className="w-3.5 h-3.5" />
                                    Deny Request
                                 </button>
                              </div>
                           </div>
                        </div>
                      )}
                   </div>
                 )}

                 {overrideTab === 'history' && (
                    <div className="space-y-4 animate-in fade-in duration-300 max-h-[400px] overflow-y-auto no-scrollbar">
                       {requestHistory.length === 0 ? (
                          <div className="py-12 text-center opacity-30">
                             <History className="w-10 h-10 mx-auto mb-2" />
                             <p className="text-[10px] font-black uppercase tracking-widest">No transaction history</p>
                          </div>
                       ) : (
                          requestHistory.map((req) => (
                             <div key={req.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                   <div>
                                      <p className="text-[10px] font-black text-main dark:text-white uppercase tracking-tight">₦{req.topUpAmountNgn?.toLocaleString()}</p>
                                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{new Date(req.createdAt).toLocaleDateString()}</p>
                                   </div>
                                   <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${
                                      req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                   }`}>
                                      {req.status}
                                   </span>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                   <div className="px-2 py-0.5 rounded bg-slate-900 text-[8px] font-mono text-slate-400">REF: {req.paymentReference}</div>
                                   {req.rejectionReason && (
                                      <p className="text-[8px] text-rose-400 italic truncate flex-1">"{req.rejectionReason}"</p>
                                   )}
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 )}

                 {overrideTab === 'days' && (
                   <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Amount (£)</label>
                          <input
                            type="number"
                            placeholder="e.g. 13340"
                            value={targetGbpInput}
                            onChange={e => setTargetGbpInput(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Local Currency</label>
                          <select
                            value={localCurrency}
                            onChange={e => setLocalCurrency(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          >
                            {MAJOR_CURRENCIES.map(curr => (
                              <option key={curr.code} value={curr.code}>
                                {curr.code} - {curr.name} ({curr.symbol})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timer Start Date</label>
                             <button
                                onClick={() => setTimerStartInput(new Date().toISOString().split('T')[0])}
                                className="text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-tighter transition-colors"
                             >
                                Reset to Today
                             </button>
                          </div>
                          <input
                            type="date"
                            value={timerStartInput}
                            onChange={e => setTimerStartInput(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duration (Days)</label>
                          <input
                            type="number"
                            placeholder="e.g. 30"
                            value={durationDays}
                            onChange={e => setDurationDays(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-2 col-span-2">
                           <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-1">
                              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Calculated End Date</p>
                              <div className="flex items-center justify-between">
                                 <p className="text-sm font-bold text-white uppercase">{calculatedEndDate ? new Date(calculatedEndDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Invalid Date'}</p>
                                 <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase">Statutory Maturity</span>
                              </div>
                           </div>
                        </div>

                        <div className="col-span-2 pt-2">
                           <div className="flex items-center gap-2 px-2">
                              <div className="h-px flex-1 bg-white/5" />
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Emergency Manual Override</span>
                              <div className="h-px flex-1 bg-white/5" />
                           </div>
                        </div>

                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Force Manual Days Count</label>
                          <input
                            type="number"
                            placeholder="Overwrite current count (0-28)"
                            value={holdingDays}
                            onChange={e => setHoldingDays(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500 opacity-60 hover:opacity-100 transition-opacity"
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

const History: React.FC = () => {
    return <div className="p-8 text-center text-slate-500 uppercase font-black text-[10px]">Unified history node coming soon</div>
}
