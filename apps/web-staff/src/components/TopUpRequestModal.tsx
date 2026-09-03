import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Zap,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface TopUpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAmount?: number;
}

export const TopUpRequestModal: React.FC<TopUpRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAmount
}) => {
  const { currentUser, appUser } = useAuth();
  const [requestType, setRequestType] = useState<'TOP_UP' | 'EXTENSION'>('TOP_UP');
  const [amount, setAmount] = useState<number>(0);
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentRef, setPaymentReference] = useState('');
  const [sliderMode, setSliderMode] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');

  // Pricing Config State
  const [pricing, setPricing] = useState({
    feePercentage: 2.5,
    flatFee: 5000,
    maxLimit: 15000000
  });

  // Load student's specific pricing config
  useEffect(() => {
    if (isOpen && currentUser) {
      const loadPricing = async () => {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.topUpPricingConfig) {
            setPricing({
              feePercentage: data.topUpPricingConfig.topUpFeePercentage || 2.5,
              flatFee: data.topUpPricingConfig.flatProcessingFeeNgn || 5000,
              maxLimit: data.topUpPricingConfig.maxAllowedTopUpNgn || 15000000
            });
            // Use initialAmount if provided, else set to 25% of max
            setAmount(initialAmount ?? Math.floor(data.topUpPricingConfig.maxAllowedTopUpNgn * 0.25));
          }
        }
      };
      loadPricing();
    }
  }, [isOpen, currentUser, initialAmount]);

  // Load student's specific pricing config
  useEffect(() => {
    if (isOpen && currentUser) {
      const loadPricing = async () => {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.topUpPricingConfig) {
            setPricing({
              feePercentage: data.topUpPricingConfig.topUpFeePercentage || 2.5,
              flatFee: data.topUpPricingConfig.flatProcessingFeeNgn || 5000,
              maxLimit: data.topUpPricingConfig.maxAllowedTopUpNgn || 15000000
            });
            // Use initialAmount if provided, else set to 25% of max
            setAmount(initialAmount ?? Math.floor(data.topUpPricingConfig.maxAllowedTopUpNgn * 0.25));
          }
        }
      };
      loadPricing();
    }
  }, [isOpen, currentUser, initialAmount]);

  const calculatedFee = useMemo(() => {
    return (amount * (pricing.feePercentage / 100));
  }, [amount, pricing]);

  const totalPayable = useMemo(() => {
    return amount + calculatedFee;
  }, [amount, calculatedFee]);

  const dynamicPresets = useMemo(() => {
    const max = pricing.maxLimit;
    if (max <= 0) return [];

    // Custom rounding logic based on target scale
    const presets = [
      Math.floor(max * 0.25),
      Math.floor(max * 0.50),
      Math.floor(max * 0.75),
      max
    ];

    return presets.map(p => {
       if (p > 1000000) return Math.round(p / 100000) * 100000;
       if (p > 100000) return Math.round(p / 10000) * 10000;
       return Math.round(p / 1000) * 1000;
    });
  }, [pricing.maxLimit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (requestType === 'TOP_UP' && (!amount || !paymentRef)) return;
    if (requestType === 'EXTENSION' && !days) return;

    setIsSubmitting(true);
    try {
      if (appUser?.role !== 'STUDENT') {
        toast.warning('As an Administrator, please use Inspector Overrides.');
        onClose();
        return;
      }

      if (requestType === 'TOP_UP') {
        const response = await fetch('/api/v1/topup/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.uid,
            userName: appUser?.displayName || 'Student',
            userEmail: currentUser.email,
            requestedCapitalNgn: amount,
            calculatedFeeNgn: calculatedFee,
            totalPayableNgn: totalPayable,
            reason: reason,
            paymentReference: paymentRef,
            status: 'PENDING_FEE_VERIFICATION'
          })
        });
        const result = await response.json();
        if (result.status === 'ERROR') throw new Error(result.message);
      } else {
        await addDoc(collection(db, 'liquidity_requests'), {
          userId: currentUser.uid,
          userName: appUser?.displayName || 'Student',
          userEmail: currentUser.email,
          daysRequested: parseInt(days),
          reason: reason,
          status: 'PENDING',
          type: 'EXTENSION',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSuccess(false);
        setAmount(0);
        setDays('');
        setReason('');
        setPaymentReference('');
      }, 2000);
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0D111A] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">

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
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${requestType === 'EXTENSION' ? 'bg-amber-50 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
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
                <div className="space-y-6">
                  {/* Amount Selection Area */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Capital Amount</label>
                        <div className="flex bg-slate-900 border border-white/5 rounded-lg p-0.5 w-fit">
                           <button
                             type="button"
                             onClick={() => setSliderMode('AMOUNT')}
                             className={`px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all ${sliderMode === 'AMOUNT' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                           >
                             ₦ Value
                           </button>
                           <button
                             type="button"
                             onClick={() => setSliderMode('PERCENT')}
                             className={`px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all ${sliderMode === 'PERCENT' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                           >
                             % Scale
                           </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white font-mono leading-none">₦{amount.toLocaleString()}</span>
                        {sliderMode === 'PERCENT' && (
                           <p className="text-[10px] font-bold text-blue-400">({Math.round((amount / pricing.maxLimit) * 100)}%)</p>
                        )}
                      </div>
                    </div>

                    {/* Interactive Slider */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="5000"
                        max={pricing.maxLimit}
                        step={sliderMode === 'PERCENT' ? (pricing.maxLimit / 100) : 5000}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full accent-blue-500 bg-slate-800 rounded-lg h-2 appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                        <span>MIN: {sliderMode === 'PERCENT' ? '1%' : '₦5,000'}</span>
                        <span>MAX: {sliderMode === 'PERCENT' ? '100%' : '₦' + pricing.maxLimit.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Dynamic Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      {dynamicPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className={`py-2 rounded-lg border text-[8px] font-black transition-all ${
                            amount === preset
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                              : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'
                          }`}
                        >
                          + ₦{(preset / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>

                    {/* Custom Input */}
                    <div className="relative pt-2">
                      <CreditCard className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Math.min(Number(e.target.value), pricing.maxLimit))}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                        placeholder="Or enter custom amount..."
                      />
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Service Fee Breakdown</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500 uppercase tracking-tighter">Top-Up Capital</span>
                        <span className="text-white">₦{amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500 uppercase tracking-tighter">Admin Service Fee ({pricing.feePercentage}%)</span>
                        <span className="text-blue-400">₦{calculatedFee.toLocaleString()}</span>
                      </div>
                      <div className="pt-3 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Total Service Fee Payable</span>
                          <span className="text-xl font-black text-emerald-400">₦{calculatedFee.toLocaleString()}</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-2">
                           <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fee Payment Instructions</p>
                           <p className="text-[10px] font-bold text-slate-300">Transfer fee to: Parallex Bank | 0123456789 | Basechan Int'l</p>
                           <p className="text-[8px] text-amber-500 italic">* Include your Name as transfer reference</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Reference (e.g. Bank Transfer ID)</label>
                    <input
                      required
                      value={paymentRef}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                      placeholder="Enter transfer reference..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
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
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Justification</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none"
                      placeholder="Provide context for this request..."
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (requestType === 'TOP_UP' && amount <= 0)}
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
                    <span>{requestType === 'TOP_UP' ? 'Confirm Payment Sent' : 'Submit Request'}</span>
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
