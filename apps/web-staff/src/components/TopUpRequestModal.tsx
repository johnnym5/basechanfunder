import React, { useState } from 'react';
import {
  X,
  Zap,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface TopUpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TopUpRequestModal: React.FC<TopUpRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, appUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !amount) return;

    setIsSubmitting(true);
    try {
      // 1. Create a request record
      await addDoc(collection(db, 'liquidity_requests'), {
        userId: currentUser.uid,
        userName: appUser?.displayName || 'Unknown Student',
        userEmail: currentUser.email,
        amountGBP: parseFloat(amount),
        reason: reason,
        status: 'PENDING',
        type: 'TOP_UP',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Also update student's evaluation status if they have one
      const evalQ = query(
        collection(db, 'pof_evaluations'),
        where('userId', '==', currentUser.uid)
      );
      const evalSnap = await getDocs(evalQ);
      if (!evalSnap.empty) {
        const evalDoc = evalSnap.docs[0];
        await updateDoc(doc(db, 'pof_evaluations', evalDoc.id), {
          status: 'NEEDS_TOPUP',
          updatedAt: serverTimestamp()
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
        setAmount('');
        setReason('');
      }, 2000);
    } catch (err) {
      console.error('Request error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0D111A] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Request Top-Up</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Submit liquidity adjustment request</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-8">
          {isSuccess ? (
            <div className="py-10 text-center space-y-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-white uppercase">Request Submitted</h4>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">A counselor will review your request shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Top-Up Amount (£)</label>
                <div className="relative">
                  <TrendingUp className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason (Optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none"
                  placeholder="Explain why you need this top-up..."
                />
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500/80 font-medium leading-relaxed uppercase tracking-tighter">
                  Liquidity requests are processed within 24 hours. Approval is subject to compliance verification.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-tr from-blue-500 to-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Submit Request</span>
                    <Zap className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
