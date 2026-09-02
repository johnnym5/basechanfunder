import React, { useState } from 'react';
import {
  X,
  Zap,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar,
  Clock,
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
  const [requestType, setRequestType] = useState<'TOP_UP' | 'EXTENSION'>('TOP_UP');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (requestType === 'TOP_UP' && !amount) return;
    if (requestType === 'EXTENSION' && !days) return;

    setIsSubmitting(true);
    try {
      // 1. Create a request record
      await addDoc(collection(db, 'liquidity_requests'), {
        userId: currentUser.uid,
        userName: appUser?.displayName || 'Unknown Student',
        userEmail: currentUser.email,
        amountGBP: requestType === 'TOP_UP' ? parseFloat(amount) : 0,
        daysRequested: requestType === 'EXTENSION' ? parseInt(days) : 0,
        reason: reason,
        status: 'PENDING',
        type: requestType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Also update student's evaluation status
      const evalQ = query(
        collection(db, 'pof_evaluations'),
        where('userId', '==', currentUser.uid)
      );
      const evalSnap = await getDocs(evalQ);
      if (!evalSnap.empty) {
        const evalDoc = evalSnap.docs[0];
        await updateDoc(doc(db, 'pof_evaluations', evalDoc.id), {
          status: requestType === 'TOP_UP' ? 'NEEDS_TOPUP' : 'PENDING',
          updatedAt: serverTimestamp()
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
        setAmount('');
        setDays('');
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
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">System Request</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Submit adjustment for review</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-8 pt-6">
          <div className="flex items-center space-x-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setRequestType('TOP_UP')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${requestType === 'TOP_UP' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Zap className="w-3.5 h-3.5" /> Top-Up
            </button>
            <button
              onClick={() => setRequestType('EXTENSION')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${requestType === 'EXTENSION' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Calendar className="w-3.5 h-3.5" /> Extension
            </button>
          </div>
        </div>

        <div className="p-8">
          {isSuccess ? (
            <div className="py-10 text-center space-y-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-white uppercase">Request Submitted</h4>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">The board will review your {requestType} shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {requestType === 'TOP_UP' ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Top-Up Amount (£)</label>
                  <div className="relative">
                    <TrendingUp className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Extension Days</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      required
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-bold"
                      placeholder="e.g. 7"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Justification</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none"
                  placeholder="Provide context for this request..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                  requestType === 'TOP_UP'
                    ? 'bg-gradient-to-tr from-blue-500 to-blue-700 text-white shadow-blue-500/20'
                    : 'bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Submit {requestType.replace('_', ' ')}</span>
                    <ArrowRight className="w-4 h-4" />
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
