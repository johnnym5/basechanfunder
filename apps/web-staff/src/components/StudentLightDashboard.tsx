import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Plus,
  Building2,
  TrendingUp,
  ShieldCheck,
  Activity,
  Loader2,
  RefreshCw,
  Trash2,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Globe,
  Lock,
  Zap,
  Clock,
  CheckSquare,
  Square,
  ArrowRight,
  Settings2,
  Phone,
  ShieldAlert,
  FileText
} from 'lucide-react';

import { TopUpRequestModal } from './TopUpRequestModal';
import { UssdFallbackModal } from './UssdFallbackModal';
import { BankStatementView } from './BankStatementView';
import { SmsIngestionService } from '../services/SmsIngestionService';
import { toast } from 'sonner';

import { MAJOR_CURRENCIES } from '../constants';

// --- Types ---

type AccountType = 'SAVINGS' | 'CURRENT' | 'DOMICILIARY';
type ConnectionMethod = 'MONO_OPEN_BANKING' | 'OKRA_AGGREGATOR' | 'MANUAL_DEPOSIT';
type AccountStatus = 'VERIFIED' | 'SYNCING' | 'NEEDS_REAUTH';
type UnlinkStatus = 'ACTIVE' | 'UNLINK_REQUESTED' | 'UNLINK_APPROVED' | 'UNLINK_REJECTED';

interface LinkedBankAccount {
  id: string;
  bankName: string;
  accountNumberMasked: string;
  accountType: AccountType;
  balanceNgn: number;
  balanceGbp: number;
  orgTopUpCapitalNgn: number;
  isCapitalBreached: boolean;
  isVerified: boolean;
  connectionMethod: ConnectionMethod;
  lastSyncedAt: string;
  connectedAt: string;
  status: AccountStatus;
  unlinkStatus: UnlinkStatus;
  isSystemTopUp: boolean;
  unlinkReason?: string;
}

interface TransactionRecord {
  id: string;
  bankAccountId: string;
  type: 'CREDIT' | 'DEBIT' | 'TOPUP_ALLOCATION';
  amountNgn: number;
  description: string;
  date: string;
  runningBalanceNgn: number;
  category: 'PERSONAL_EQUITY' | 'ORG_CAPITAL';
}

const LIVE_FX_RATE = 1945.50;

const NIGERIAN_BANKS = [
  "Access Bank", "Zenith Bank", "Guaranty Trust Bank (GTB)", "United Bank for Africa (UBA)",
  "First Bank of Nigeria", "Fidelity Bank", "First City Monument Bank (FCMB)", "Stanbic IBTC Bank",
  "Sterling Bank", "Wema Bank", "Union Bank", "Polaris Bank", "Keystone Bank", "Ecobank Nigeria",
  "Standard Chartered Bank", "Providus Bank", "Premium Trust Bank", "Signature Bank", "SunTrust Bank",
  "Titan Trust Bank", "Optimus Bank", "Parallex Bank", "Citibank Nigeria", "Globus Bank",
  "Moniepoint MFB", "Kuda MFB", "Opay (Blue Ridge MFB)", "PalmPay", "LAPO MFB", "FairMoney MFB"
];

export const StudentLightDashboard: React.FC<{
  name: string;
  userId?: string;
  evaluationId?: string;
  isStaff?: boolean;
  onStaffAction?: (tab?: string) => void;
}> = ({ name, userId: propUserId, evaluationId: propEvalId, isStaff, onStaffAction }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();

  const activeUserId = propUserId || currentUser?.uid;
  const activeEvalId = propEvalId;

  // State
  const [accounts, setAccounts] = useState<LinkedBankAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricCard, setActiveMetricCard] = useState(0); // 0 = Balance, 1 = Timer
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isUssdModalOpen, setIsUssdModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [selectedUnlinkAccount, setSelectedUnlinkAccount] = useState<LinkedBankAccount | null>(null);
  const [unlinkReason, setUnlinkReason] = useState('');
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementAccount, setStatementOpenAccount] = useState<LinkedBankAccount | null>(null);
  const [isSavingAndSyncing, setIsSavingAndSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Modal State
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('SAVINGS');
  const [realAmountInput, setRealAmountInput] = useState('');
  const [manualForm, setManualForm] = useState({ name: '', accountName: '', number: '', balance: '' });

  const isDark = theme === 'dark';

  const filteredNigerianBanks = useMemo(() => {
    if (!bankSearchQuery) return [];
    return NIGERIAN_BANKS.filter(b => b.toLowerCase().includes(bankSearchQuery.toLowerCase()));
  }, [bankSearchQuery]);

  // Native SMS Listener Bridge
  useEffect(() => {
    (window as any).onSmsBalanceUpdate = async (balance: number, mask: string, timestamp: number) => {
      console.log(`Native SMS Update: ₦${balance} for Acct ${mask}`);

      // 1. Find matching account in state
      let matchedAccId: string | null = null;
      setAccounts(prev => prev.map(acc => {
        const isMatch = SmsIngestionService.verifyMatch(mask, acc.accountNumberMasked.slice(-4));
        if (isMatch || mask === 'XXXX') {
          matchedAccId = acc.id;
          return {
            ...acc,
            balanceNgn: balance,
            balanceGbp: balance / LIVE_FX_RATE,
            lastSyncedAt: new Date(timestamp).toLocaleString(),
            status: 'VERIFIED',
            isVerified: isMatch && mask !== 'XXXX'
          };
        }
        return acc;
      }));

      // 2. Update Firestore if matched
      if (matchedAccId) {
        await updateDoc(doc(db, 'financial_accounts', matchedAccId), {
          balanceNgn: balance,
          balanceGbp: balance / LIVE_FX_RATE,
          lastSyncedAt: serverTimestamp(),
          status: 'VERIFIED',
          isVerified: mask !== 'XXXX', // Only verify if we have a real mask
          updatedAt: serverTimestamp()
        });
      }

      setIsConnectModalOpen(false);
      setIsSavingAndSyncing(false);
      setSyncError(null);
      setPendingAccountId(null);
    };

    (window as any).onSmsSyncFailed = (mask: string) => {
      console.warn(`SMS Sync Failed for mask: ${mask}`);
      setSyncError(`We couldn't find a matching alert for account ending in ${mask}.`);
      setIsSavingAndSyncing(false);
    };

    return () => {
      (window as any).onSmsBalanceUpdate = null;
      (window as any).onSmsSyncFailed = null;
    };
  }, []);

  // 1. Fetch Real Data
  useEffect(() => {
    if (!activeUserId) return;

    const accQ = query(collection(db, 'financial_accounts'), where('userId', '==', activeUserId));
    const unsubAcc = onSnapshot(accQ, (snap) => {
      const data = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          bankName: data.bankName || 'Unknown Bank',
          accountNumberMasked: data.accountNumberMasked || data.accountMask || '•••• ****',
          accountType: data.accountType || data.type || 'SAVINGS',
          balanceNgn: data.balanceNgn || data.balanceNGN || 0,
          balanceGbp: data.balanceGbp || data.balanceGBP || 0,
          orgTopUpCapitalNgn: data.orgTopUpCapitalNgn || 0,
          isCapitalBreached: (data.balanceNgn || 0) < (data.orgTopUpCapitalNgn || 0),
          isVerified: data.isVerified || false,
          connectionMethod: data.connectionMethod || data.provider || 'MANUAL_DEPOSIT',
          lastSyncedAt: data.lastSyncedAt?.seconds
            ? new Date(data.lastSyncedAt.seconds * 1000).toLocaleString()
            : (data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toLocaleString() : 'Never'),
          connectedAt: data.connectedAt?.seconds
            ? new Date(data.connectedAt.seconds * 1000).toISOString()
            : (data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString()),
          status: data.status || 'VERIFIED',
          unlinkStatus: data.unlinkStatus || 'ACTIVE',
          isSystemTopUp: data.isSystemTopUp || false,
          unlinkReason: data.unlinkReason || ''
        } as LinkedBankAccount;
      });
      setAccounts(data);
      // Logic: Only auto-select ALL on the very first time accounts are loaded
      setSelectedAccountIds(prev => prev.length === 0 ? data.map(a => a.id) : prev);
    });

    // 1b. Listen to Evaluation
    let unsubEval: () => void;
    if (activeEvalId) {
       // Direct Doc ID (Most reliable for staff view)
       unsubEval = onSnapshot(doc(db, 'pof_evaluations', activeEvalId), (snap) => {
          if (snap.exists()) setEvaluation(snap.data());
          setLoading(false);
       });
    } else {
       // Query by userId (For student view)
       const evalQ = query(collection(db, 'pof_evaluations'), where('userId', '==', activeUserId));
       unsubEval = onSnapshot(evalQ, (snap) => {
         if (!snap.empty) setEvaluation(snap.docs[0].data());
         setLoading(false);
       });
    }

    return () => { unsubAcc(); unsubEval(); };
  }, [activeUserId, activeEvalId, isStaff]);

  // 2. Calculations
  const totals = useMemo(() => {
    const selectedAccounts = accounts.filter(a => selectedAccountIds.includes(a.id));
    const accountsNgn = selectedAccounts.reduce((sum, acc) => sum + (Number(acc.balanceNgn) || 0), 0);
    const evaluationNgn = Number(evaluation?.currentBalanceNgn) || 0;
    const ngn = accountsNgn + evaluationNgn;
    const gbp = ngn / LIVE_FX_RATE;
    return { ngn, gbp, accountsNgn, evaluationNgn };
  }, [accounts, selectedAccountIds, evaluation]);

  const daysElapsed = useMemo(() => {
    // STRICT CHECK: If startDate is missing or empty, do not show badge.
    if (!evaluation?.startDate || evaluation.startDate === "" || evaluation.startDate === "null" || evaluation.startDate === "undefined") {
      return null;
    }

    const start = new Date(evaluation.startDate).getTime();
    if (isNaN(start)) return null;

    const now = Date.now();
    const diffDays = Math.floor((now - start) / 86400000);

    // Only show if Admin set a date in the past
    if (diffDays < 0) return null;

    return Math.min(diffDays + 1, 28);
  }, [evaluation]);

  // Expiration Logic
  const expiryInfo = useMemo(() => {
    if (!evaluation?.isTimerActive || !evaluation?.expirationDate) return { isExpired: false, isNearExpiry: false, daysLeft: null };

    const now = new Date();
    const expiry = new Date(evaluation.expirationDate);
    expiry.setHours(23, 59, 59, 999);

    const diffTime = expiry.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isExpired: diffTime <= 0,
      isNearExpiry: daysLeft >= 0 && daysLeft <= 7,
      daysLeft
    };
  }, [evaluation]);

  useEffect(() => {
    if (expiryInfo.isExpired) setIsExpiredModalOpen(true);
  }, [expiryInfo.isExpired]);

  // 3. Handlers
  const handleSyncAccount = async (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;

    setSyncingId(id);

    // If it's a UBA account, try Native SMS Sync
    if (acc.bankName.includes('UBA') || acc.bankName.includes('United Bank')) {
       const mask = acc.accountNumberMasked.slice(-4);
       if ((window as any).AndroidBridge) {
         console.log(`Triggering Native SMS Sync for mask: ${mask}`);
         (window as any).AndroidBridge.triggerSmsSync(mask);
         return;
       } else {
         toast.error("SMS Sync is only available in the Basechan Funder Android App.");
         setSyncingId(null);
         return;
       }
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await updateDoc(doc(db, 'financial_accounts', id), {
        lastSyncedAt: serverTimestamp(),
        status: 'VERIFIED'
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleRequestUnlink = async () => {
    if (!selectedUnlinkAccount || !unlinkReason.trim()) return;

    await updateDoc(doc(db, 'financial_accounts', selectedUnlinkAccount.id), {
      unlinkStatus: 'UNLINK_REQUESTED',
      unlinkReason: unlinkReason.trim(),
      updatedAt: serverTimestamp()
    });

    setIsUnlinkModalOpen(false);
    setSelectedUnlinkAccount(null);
    setUnlinkReason('');
    toast.success('Unlink request submitted to Admin for approval.');
  };

  const handleConnectBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserId || !selectedBank || !accountNumberInput) return;

    setIsSavingAndSyncing(true);
    setSyncError(null);
    try {
      const balance = parseFloat(realAmountInput) || 0;
      const mask = `•••• ${accountNumberInput.slice(-4)}`;

      // 1. Save metadata to Firestore
      const docRef = await addDoc(collection(db, 'financial_accounts'), {
        userId: activeUserId,
        userEmail: isStaff ? evaluation?.userEmail || '' : currentUser?.email,
        bankName: selectedBank,
        accountName: name,
        accountNumberMasked: mask,
        accountType: selectedAccountType,
        balanceNgn: Math.round(balance),
        balanceGbp: Math.round((balance / LIVE_FX_RATE) * 100) / 100,
        connectionMethod: 'MANUAL_DEPOSIT',
        status: 'SYNCING',
        isVerified: false,
        lastSyncedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setPendingAccountId(docRef.id);

      // 2. Trigger SMS Sync via Bridge
      if ((window as any).AndroidBridge) {
        (window as any).AndroidBridge.triggerSmsSync(accountNumberInput.slice(-4));
      } else {
        // Fallback simulation for web dev
        setTimeout(async () => {
          await updateDoc(doc(db, 'financial_accounts', docRef.id), {
            status: 'VERIFIED',
            updatedAt: serverTimestamp()
          });
          setIsConnectModalOpen(false);
          setIsSavingAndSyncing(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setIsSavingAndSyncing(false);
    }
  };

  const handleRetrySync = () => {
    if (!accountNumberInput || !(window as any).AndroidBridge) return;
    setIsSavingAndSyncing(true);
    setSyncError(null);
    (window as any).AndroidBridge.triggerSmsSync(accountNumberInput.slice(-4));
  };

  const handleContinueManual = async () => {
    if (!pendingAccountId) return;
    setIsSavingAndSyncing(true);
    try {
      await updateDoc(doc(db, 'financial_accounts', pendingAccountId), {
        status: 'VERIFIED',
        isVerified: false,
        updatedAt: serverTimestamp()
      });
      setIsConnectModalOpen(false);
      setSyncError(null);
      setPendingAccountId(null);
    } finally {
      setIsSavingAndSyncing(false);
    }
  };

  const handleCancelConnect = async () => {
    if (pendingAccountId) {
      await deleteDoc(doc(db, 'financial_accounts', pendingAccountId));
    }
    setIsConnectModalOpen(false);
    setSyncError(null);
    setPendingAccountId(null);
    setSelectedBank('');
    setBankSearchQuery('');
    setAccountNumberInput('');
  };

  const targetGBP = evaluation?.targetGBP || 0;
  const localCurrencyCode = evaluation?.localCurrency || 'NGN';
  const currency = (typeof MAJOR_CURRENCIES !== 'undefined' ? MAJOR_CURRENCIES.find(c => c.code === localCurrencyCode) : null) || { code: 'NGN', symbol: '₦' };

  const isTargetMet = targetGBP > 0 && totals.gbp >= targetGBP;
  const progressPercent = targetGBP > 0 ? Math.min(Math.round((totals.gbp / targetGBP) * 100), 100) : 0;

  if (loading && accounts.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1e]' : 'bg-slate-50'}`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-amber-500' : 'text-blue-600'}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans p-6 md:p-10 animate-in fade-in duration-700 transition-all duration-500 relative ${
      isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    } ${expiryInfo.isExpired ? 'grayscale opacity-40 pointer-events-none' : ''}`}>

      {/* Expiry Warning Banner */}
      {expiryInfo.isNearExpiry && !expiryInfo.isExpired && (
        <div className={`mb-8 p-6 rounded-[2rem] border animate-in slide-in-from-top-4 duration-700 flex flex-col md:flex-row items-center justify-between gap-6 ${
          isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-sm font-black uppercase tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>POF EVALUATION EXPIRES SOON</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Evaluation period ends in <span className="text-amber-500">{expiryInfo.daysLeft} days</span>
              </p>
            </div>
          </div>
          <button onClick={() => setIsTopUpModalOpen(true)} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">
            Request Extension
          </button>
        </div>
      )}

      {/* Top Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <h1 className={`text-4xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-950'}`}>Hello, {name}</h1>
          <p className={`text-base font-medium mt-1 uppercase tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Welcome to your <span className="font-bold text-blue-600">BASECHAN FUNDER</span> dashboard.
          </p>
        </div>
      </header>

      {/* Hero Metric Card Section */}
      <section className="mb-12 relative group">
        <div className="relative overflow-hidden rounded-[2.5rem] min-h-[340px] flex items-stretch">

          {/* CARD 1: Total Liquid Converted Balance */}
          <div className={`w-full flex-shrink-0 transition-all duration-700 transform ${activeMetricCard === 0 ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute'}`}>
            <div className={`h-full rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl transition-colors duration-500 bg-[#0B172A] border border-white/5 flex flex-col justify-between`}>
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-400 text-xs font-black uppercase tracking-[0.25em] mb-3 opacity-80">{name}</p>
                    <h2 className="text-6xl md:text-7xl font-black tracking-tighter">
                      £{totals.gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-2 border-t border-white/5 pt-2 uppercase">
                       <span>CURRENT: £{Math.round(totals.gbp).toLocaleString()}</span>
                       <span>TARGET: {targetGBP > 0 ? `£${targetGBP.toLocaleString()}` : '£0 (NOT SET)'}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                       <p className="text-slate-400 text-xl font-bold uppercase tracking-tight">{currency.symbol}{totals.ngn.toLocaleString()}</p>
                       <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white/5">{currency.code} LOCAL</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      <CreditCard className="w-4 h-4 text-slate-600" />
                      <span>MARK & SELECT: <span className="text-white ml-1">{selectedAccountIds.length} / {accounts.length} SELECTED</span></span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-white/10" />
                    <div className="flex items-center space-x-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      <Building2 className="w-4 h-4 text-emerald-500/60" />
                      <span>Bank: <span className="text-emerald-400 ml-1">
                        {selectedAccountIds.length === 0
                          ? 'NO SOURCES'
                          : selectedAccountIds.length === 1
                            ? accounts.find(a => a.id === selectedAccountIds[0])?.bankName
                            : `${accounts.find(a => a.id === selectedAccountIds[0])?.bankName} and ${selectedAccountIds.length - 1} others`}
                      </span></span>
                    </div>
                  </div>

                  <button
                    onClick={() => isStaff && onStaffAction ? onStaffAction() : setIsTopUpModalOpen(true)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <span>{isStaff ? 'UPDATE TOP-UP' : 'REQUEST TOP-UP'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Statutory Holding & Expiration Timer */}
          <div className={`w-full flex-shrink-0 transition-all duration-700 transform ${activeMetricCard === 1 ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute'}`}>
            <div className={`h-full rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl transition-colors duration-500 bg-[#0F172A] border border-white/5 flex flex-col justify-between`}>
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-amber-400 text-xs font-black uppercase tracking-[0.25em] opacity-80">Holding & Expiration</p>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${
                        targetGBP > 0
                          ? isTargetMet ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {targetGBP > 0 ? (isTargetMet ? 'Compliant' : `${progressPercent}% Of Target`) : 'No Target Set'}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-3">
                      {evaluation?.startDate && (expiryInfo.daysLeft !== null) ? (
                        <>
                          <h3 className="text-6xl md:text-7xl font-black tracking-tight text-white">{expiryInfo.daysLeft}</h3>
                          <span className="text-2xl font-bold text-slate-400 uppercase">Days</span>
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">REMAINING</span>
                        </>
                      ) : (
                        <div className="flex items-baseline space-x-3 opacity-60">
                          <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-500 uppercase">NO WINDOW SET</h3>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-8">
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            targetGBP > 0
                              ? isTargetMet ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-blue-500'
                              : 'bg-slate-700'
                          }`}
                          style={{ width: targetGBP > 0 ? `${progressPercent}%` : '0%' }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-mono text-slate-500 mt-3 uppercase tracking-widest">
                        <span>Current: £{Math.round(totals.gbp).toLocaleString()}</span>
                        <span>Target: {targetGBP > 0 ? `£${targetGBP.toLocaleString()}` : '£0 (Not Set)'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      {evaluation?.startDate ? 'UKVI STATUTORY 28-DAY CONSECUTIVE HOLDING WINDOW' : 'no window set, till admin put a window time'}
                   </p>
                   {isStaff && (
                     <button
                       onClick={() => onStaffAction?.('days')}
                       className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                     >
                       <span>SETUP EVALUATION</span>
                       <Settings2 className="w-3.5 h-3.5" />
                     </button>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Navigation Controls */}
        <div className="flex justify-center items-center mt-6 gap-8">
          <button
            onClick={() => setActiveMetricCard(0)}
            className={`p-2 rounded-full border transition-all hover:scale-110 active:scale-95 ${activeMetricCard === 0 ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-3">
            {[0, 1].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all duration-500 ${activeMetricCard === i ? 'bg-blue-500 w-8' : 'bg-slate-800 w-2'}`} />
            ))}
          </div>

          <button
            onClick={() => setActiveMetricCard(1)}
            className={`p-2 rounded-full border transition-all hover:scale-110 active:scale-95 ${activeMetricCard === 1 ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Bank Accounts Ledger */}
      <section className="space-y-8">
        <div className="flex justify-between items-end px-2">
          <div>
            <h3 className={`text-xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-950'}`}>Bank Accounts Ledger</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Select accounts to include in total asset calculation</p>
          </div>
          <div className="flex items-center space-x-3">
             <button
               onClick={() => setSelectedAccountIds(accounts.map(a => a.id))}
               className={`flex items-center space-x-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-slate-500`}
             >
               <CheckSquare className="w-3 h-3" />
               <span>Select All</span>
             </button>
             <button
               onClick={() => setSelectedAccountIds([])}
               className={`flex items-center space-x-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-slate-500`}
             >
               <Square className="w-3 h-3" />
               <span>Clear</span>
             </button>
             <button
               onClick={() => setIsConnectModalOpen(true)}
               className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-xl ${
                 isDark ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white shadow-lg'
               }`}
             >
               <Plus className="w-3.5 h-3.5" />
               <span>Connect Source</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => {
            const isSelected = selectedAccountIds.includes(acc.id);
            const isSystem = acc.isSystemTopUp;

            let colorClasses = '';
            if (isSystem) {
              // Green theme for Admin accounts
              colorClasses = isDark
                ? (isSelected ? 'bg-emerald-500/5 border-emerald-500/50 shadow-lg' : 'bg-slate-900/40 border-emerald-500/10 hover:border-emerald-500/30')
                : (isSelected ? 'bg-emerald-50/50 border-emerald-600 shadow-lg' : 'bg-white border-emerald-100 hover:border-emerald-300');
            } else {
              // Blue/Amber theme for User accounts
              colorClasses = isDark
                ? (isSelected ? 'bg-amber-500/5 border-amber-500/50 shadow-lg' : 'bg-slate-900/40 border-white/5 hover:border-amber-500/40')
                : (isSelected ? 'bg-blue-50/50 border-blue-600 shadow-lg' : 'bg-white border-slate-200/80 hover:border-blue-500/40');
            }

            return (
              <div
                key={acc.id}
                onClick={() => {
                  setSelectedAccountIds(prev =>
                    prev.includes(acc.id) ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                  );
                }}
                className={`border p-8 rounded-[2rem] flex flex-col transition-all group shadow-sm hover:-translate-y-1 cursor-pointer relative ${colorClasses}`}
              >
                {/* Checkbox Overlay */}
                <div className={`absolute top-4 right-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  isSelected ? (isSystem ? 'bg-emerald-500 border-emerald-500 scale-110' : 'bg-blue-600 border-blue-600 scale-110') : 'border-slate-300'
                }`}>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>

                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
                      isSystem
                        ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600')
                        : (isDark ? 'bg-slate-800 border-white/5 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400')
                    }`}>
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-base font-black tracking-tight uppercase ${
                          isSystem
                            ? (isDark ? 'text-emerald-400' : 'text-emerald-700')
                            : (isDark ? 'text-white' : 'text-slate-900')
                        }`}>{acc.bankName}</h4>
                        {acc.isVerified && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-tighter flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.accountNumberMasked} • {acc.accountType}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter flex items-center gap-0.5 ${
                          isSystem ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          <Lock className="w-2 h-2" />
                          {isSystem ? 'Admin Managed' : 'Read-Only'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right pr-6">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                      acc.status === 'VERIFIED'
                        ? (isSystem ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {acc.status}
                    </span>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1.5">Last Sync: {acc.lastSyncedAt}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-8 border-b border-white/5">
                  <div className={`col-span-2 mb-4 p-4 rounded-2xl border transition-all ${
                    acc.isCapitalBreached
                      ? 'bg-rose-500/10 border-rose-500/40 animate-pulse'
                      : 'bg-slate-950/40 border-white/5'
                  }`}>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub-Ledger Breakdown</p>
                      {acc.isCapitalBreached && (
                        <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-rose-500/20">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          Capital Breach Detected
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">YOUR PERSONAL EQUITY</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                          acc.isCapitalBreached
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {currency.symbol}{Math.max(acc.balanceNgn - acc.orgTopUpCapitalNgn, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">ORG TOP-UP CAPITAL</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 ${
                          isSystem ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          <Lock className="w-2.5 h-2.5" />
                          {currency.symbol}{acc.orgTopUpCapitalNgn.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Bank Balance</p>
                    <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{currency.symbol}{acc.balanceNgn.toLocaleString()}</p>
                  </div>
                  <div className="border-l border-white/5 pl-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">GBP Value</p>
                    <p className={`text-xl font-black ${isSystem ? 'text-emerald-500' : 'text-blue-600'}`}>£{acc.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6" onClick={e => e.stopPropagation()}>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleSyncAccount(acc.id)}
                        disabled={syncingId === acc.id}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'text-slate-500 hover:text-amber-500' : 'text-slate-500 hover:text-blue-600'} disabled:opacity-50`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                        {syncingId === acc.id ? 'Syncing...' : 'Sync Balance'}
                      </button>

                      {!acc.isSystemTopUp && (
                        <button
                          onClick={() => setIsUssdModalOpen(true)}
                          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'text-slate-500 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          USSD
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setStatementOpenAccount(acc);
                          setIsStatementOpen(true);
                        }}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'text-slate-500 hover:text-cyan-400' : 'text-slate-500 hover:text-cyan-600'}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Statement
                      </button>
                    </div>
                    {!acc.isVerified && !acc.isSystemTopUp && (
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block mt-3">Account not verified</span>
                    )}
                  </div>

                  {!acc.isSystemTopUp && (
                    <button
                      onClick={() => {
                        if (acc.unlinkStatus === 'UNLINK_REQUESTED') return;
                        setSelectedUnlinkAccount(acc);
                        setIsUnlinkModalOpen(true);
                      }}
                      disabled={acc.unlinkStatus === 'UNLINK_REQUESTED'}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        acc.unlinkStatus === 'UNLINK_REQUESTED'
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-500 hover:text-rose-500'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {acc.unlinkStatus === 'UNLINK_REQUESTED' ? 'Unlink Pending' : 'Request Unlink'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Connect Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#0D111A]' : 'bg-white'}`}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Connect Account</h3>
                </div>
              </div>
              <button onClick={handleCancelConnect} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Read-Only Guarantee Banner */}
            <div className="mx-8 mt-6 p-4 rounded-2xl bg-blue-600/5 border border-blue-500/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Read-Only Guarantee</p>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Basechanfunder only scans financial SMS alerts to verify continuous POF holding. We have <span className="text-white font-bold">ZERO permission</span> to debit, transfer, or move money from your account.
                </p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {syncError ? (
                <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black uppercase text-white">Bank Not Found</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      We couldn't find a matching SMS alert. What would you like to do?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleRetrySync}
                      className="py-4 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => { setSyncError(null); setSelectedBank(''); setBankSearchQuery(''); }}
                      className="py-4 rounded-2xl bg-slate-800 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                    >
                      Change Bank
                    </button>
                    <button
                      onClick={handleCancelConnect}
                      className="py-4 rounded-2xl bg-slate-800 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleContinueManual}
                      className="py-4 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConnectBank} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Bank</label>
                      <div className="relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          required
                          placeholder="Type to search bank..."
                          value={bankSearchQuery || selectedBank}
                          onFocus={() => setIsBankDropdownOpen(true)}
                          onChange={(e) => {
                            setBankSearchQuery(e.target.value);
                            setSelectedBank('');
                            setIsBankDropdownOpen(true);
                          }}
                          className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:outline-none transition-all ${
                            isDark ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-950 focus:border-blue-600'
                          }`}
                        />
                        {isBankDropdownOpen && bankSearchQuery && filteredNigerianBanks.length > 0 && (
                          <div className={`absolute z-[100] w-full mt-2 max-h-60 overflow-y-auto border rounded-2xl shadow-2xl no-scrollbar ${
                            isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                          }`}>
                            {filteredNigerianBanks.map(bank => (
                              <button
                                key={bank}
                                type="button"
                                onClick={() => {
                                  setSelectedBank(bank);
                                  setBankSearchQuery(bank);
                                  setIsBankDropdownOpen(false);
                                }}
                                className={`w-full text-left px-6 py-4 text-xs font-black uppercase transition-all hover:bg-blue-600 hover:text-white ${
                                  selectedBank === bank ? 'bg-blue-600 text-white' : isDark ? 'text-slate-300' : 'text-slate-700'
                                }`}
                              >
                                {bank}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                        <input
                          required
                          maxLength={10}
                          placeholder="10-digit Number"
                          value={accountNumberInput}
                          onChange={e => setAccountNumberInput(e.target.value.replace(/\D/g, ''))}
                          className={`w-full border rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none transition-all ${
                            isDark ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-950 focus:border-blue-600'
                          }`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Type</label>
                        <select
                          value={selectedAccountType}
                          onChange={e => setSelectedAccountType(e.target.value as AccountType)}
                          className={`w-full border rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none transition-all ${
                            isDark ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-950 focus:border-blue-600'
                          }`}
                        >
                          <option value="SAVINGS">SAVINGS</option>
                          <option value="CURRENT">CURRENT</option>
                          <option value="DOMICILIARY">DOMICILIARY</option>
                        </select>
                      </div>
                    </div>

                    {isStaff && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Balance (₦)</label>
                        <input
                          type="number"
                          placeholder="Initial Balance (₦)"
                          value={realAmountInput}
                          onChange={e => setRealAmountInput(e.target.value)}
                          className={`w-full border rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none transition-all ${
                            isDark ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-950 focus:border-blue-600'
                          }`}
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedBank || accountNumberInput.length < 10 || (isStaff && !realAmountInput) || isSavingAndSyncing}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingAndSyncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Save & Sync Ledger</span>
                          <RefreshCw className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {!isStaff && (
        <TopUpRequestModal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} onSuccess={() => {}} />
      )}

      <UssdFallbackModal
        isOpen={isUssdModalOpen}
        onClose={() => setIsUssdModalOpen(false)}
        onSuccess={() => {}}
        linkedBanks={accounts.map(a => a.bankName)}
      />

      <BankStatementView
        isOpen={isStatementOpen}
        onClose={() => {
          setIsStatementOpen(false);
          setStatementOpenAccount(null);
        }}
        account={statementAccount}
      />

      {/* Unlink Request Modal */}
      {isUnlinkModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[2.5rem] border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'}`}>
             <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Request Account Unlink</h3>
                <button onClick={() => setIsUnlinkModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
             </div>
             <div className="p-8 space-y-6">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                   <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest leading-relaxed">
                      Unlinking an account will immediately stop the continuous 28-day holding verification. This may reset your compliance progress.
                   </p>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason for unlinking</label>
                   <textarea
                     value={unlinkReason}
                     onChange={e => setUnlinkReason(e.target.value)}
                     placeholder="e.g. Account closed, Switching banks..."
                     className="w-full h-32 bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-medium text-white focus:outline-none focus:border-rose-500 transition-all resize-none"
                   />
                </div>
                <button
                  onClick={handleRequestUnlink}
                  disabled={!unlinkReason.trim()}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Submit Unlink Request
                </button>
             </div>
          </div>
        </div>
      )}

      {isExpiredModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[2.5rem] border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Expired</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Evaluation Period Concluded</p>
              <div className={`p-6 rounded-2xl border italic text-xs font-medium leading-relaxed ${isDark ? 'bg-slate-950 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                "{evaluation?.timerCustomMessage || 'Your evaluation period has ended. Please contact your counselor to extend access.'}"
              </div>
              <button onClick={() => setIsExpiredModalOpen(false)} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Understood</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentLightDashboard;
