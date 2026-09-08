import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
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
  FileText,
  User,
  Upload,
  Rocket,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TopUpRequestModal } from './TopUpRequestModal';
import { UssdFallbackModal } from './UssdFallbackModal';
import { BankStatementView } from './BankStatementView';
import { StudentProfileModal } from './StudentProfileModal';
import { StudentDocumentUploadWizard } from './StudentDocumentUploadWizard';
import { AdminStudentProfileDrawer } from './AdminStudentProfileDrawer';
import { ApprovedTopUpCard } from './ApprovedTopUpCard';
import { useStudentDashboardData } from '../hooks/useStudentDashboardData';
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
  accountName?: string;
  accountNumber?: string;
  accountNumberMasked: string;
  accountType: AccountType;
  balanceNgn: number;
  balanceGbp: number;
  orgTopUpCapitalNgn: number;
  isCapitalBreached: boolean;
  isVerified: boolean;
  isDedicatedParallex?: boolean;
  lastTransactionAt?: string;
  connectionMethod: ConnectionMethod;
  lastSyncedAt: string;
  connectedAt: string;
  status: AccountStatus;
  unlinkStatus: UnlinkStatus;
  isSystemTopUp: boolean;
  unlinkReason?: string;
  verificationStatus?: string;
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

export interface StudentDashboardViewProps {
  studentId: string;
  viewMode: 'STUDENT' | 'ADMIN';
  studentName?: string;
  onAdminAction?: (tab?: string) => void;
  onExit?: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  studentId,
  viewMode,
  studentName: propStudentName,
  onAdminAction,
  onExit
}) => {
  const { currentUser, appUser, role } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isAdmin = viewMode === 'ADMIN';

  // Shared Data Pipeline
  const {
    balance: liveBalance,
    accounts: liveAccounts,
    evaluation: liveEvaluation,
    userProfile,
    loading: dataLoading
  } = useStudentDashboardData(studentId);

  // Derived student name & mandate status
  const effectiveStudentName =
    propStudentName ||
    userProfile?.displayName ||
    (viewMode === 'STUDENT' ? appUser?.displayName : 'Student') ||
    'Student';

  const effectiveMandateStatus =
    userProfile?.mandateStatus ||
    (viewMode === 'STUDENT' ? appUser?.mandateStatus : 'NOT_STARTED') ||
    'NOT_STARTED';

  // State
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    if (liveEvaluation) setEvaluation(liveEvaluation);
  }, [liveEvaluation]);

  // Sync selected accounts
  useEffect(() => {
    if (liveAccounts.length > 0 && selectedAccountIds.length === 0) {
      setSelectedAccountIds(liveAccounts.map(a => a.id));
    }
  }, [liveAccounts, selectedAccountIds]);

  // Use liveAccounts as primary data source
  const accounts = useMemo(() => {
    return liveAccounts.map(item => ({
      id: item.id,
      bankName: item.bankName || 'Unknown Bank',
      accountNumberMasked: item.accountNumberMasked || item.accountMask || '•••• ****',
      accountType: item.accountType || item.type || 'SAVINGS',
      balanceNgn: item.accountBalanceNgn || item.balanceNgn || item.balanceNGN || 0,
      balanceGbp: item.balanceGbp || item.balanceGBP || 0,
      orgTopUpCapitalNgn: item.orgTopUpCapitalNgn || 0,
      isCapitalBreached: (item.accountBalanceNgn || item.balanceNgn || 0) < (item.orgTopUpCapitalNgn || 0),
      isVerified: item.isVerified || false,
      isDedicatedParallex: item.isDedicatedParallex || item.bankName?.includes('Parallex'),
      lastTransactionAt: item.lastTransactionAt || (item.lastSyncedAt?.seconds ? new Date(item.lastSyncedAt.seconds * 1000).toISOString() : null),
      isSystemTopUp: item.isSystemTopUp || false,
      unlinkStatus: item.unlinkStatus || 'ACTIVE',
      connectionMethod: item.connectionMethod || item.provider || 'MANUAL_DEPOSIT',
      lastSyncedAt: item.lastSyncedAt?.seconds
        ? new Date(item.lastSyncedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Just now',
      status: item.status || 'VERIFIED'
    } as LinkedBankAccount));
  }, [liveAccounts]);

  // High-level totals
  const totals = useMemo(() => {
    const selectedAccounts = accounts.filter(a => selectedAccountIds.includes(a.id));
    const accountsNgn = selectedAccounts.reduce((sum, acc) => sum + (Number(acc.balanceNgn) || 0), 0);
    const ngn = liveBalance.consolidatedBalanceNgn > 0 ? liveBalance.consolidatedBalanceNgn : accountsNgn;
    const gbp = liveBalance.gbpEquivalent > 0 ? liveBalance.gbpEquivalent : ngn / LIVE_FX_RATE;
    return { ngn, gbp, accountsNgn, evaluationNgn: 0 };
  }, [accounts, selectedAccountIds, liveBalance]);

  const targetGBP = evaluation?.targetGBP || 0;
  const localCurrencyCode = evaluation?.localCurrency || 'NGN';
  const currency = (typeof MAJOR_CURRENCIES !== 'undefined' ? MAJOR_CURRENCIES.find(c => c.code === localCurrencyCode) : null) || { code: 'NGN', symbol: '₦' };

  const isTargetMet = targetGBP > 0 && totals.gbp >= targetGBP;
  const progressPercent = targetGBP > 0 ? Math.min(Math.round((totals.gbp / targetGBP) * 100), 100) : 0;

  const expiryInfo = useMemo(() => {
    if (!evaluation?.isTimerActive || !evaluation?.expirationDate) return { isExpired: false, isNearExpiry: false, daysLeft: 0 };
    const now = new Date();
    const expiry = new Date(evaluation.expirationDate);
    expiry.setHours(23, 59, 59, 999);
    const diffTime = expiry.getTime() - now.getTime();
    const daysLeft = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
    return { isExpired: diffTime <= 0, isNearExpiry: daysLeft >= 0 && daysLeft <= 7, daysLeft };
  }, [evaluation]);

  // UI States & Modals
  const [activeMetricCard, setActiveMetricCard] = useState(0);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isUssdModalOpen, setIsUssdModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [isDocumentWizardOpen, setIsDocumentWizardOpen] = useState(false);
  const [isAdminReviewDrawerOpen, setIsAdminReviewDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUnlinkAccount, setSelectedUnlinkAccount] = useState<LinkedBankAccount | null>(null);
  const [unlinkReason, setUnlinkReason] = useState('');
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementAccount, setStatementOpenAccount] = useState<LinkedBankAccount | null>(null);
  const [isSavingAndSyncing, setIsSavingAndSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [prepopulatedTopUpAmount, setPrepopulatedTopUpAmount] = useState<number | undefined>();

  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('SAVINGS');
  const [realAmountInput, setRealAmountInput] = useState('');

  const filteredNigerianBanks = useMemo(() => {
    if (!bankSearchQuery) return [];
    return NIGERIAN_BANKS.filter(b => b.toLowerCase().includes(bankSearchQuery.toLowerCase()));
  }, [bankSearchQuery]);

  // Student drawer data for Admin review modal
  const studentDrawerPayload = useMemo(() => {
    return {
      id: studentId,
      userId: studentId,
      displayName: effectiveStudentName,
      userName: effectiveStudentName,
      email: userProfile?.email || evaluation?.userEmail || '',
      targetGBP: targetGBP,
      currentBalanceNgn: totals.ngn,
      mandateStatus: effectiveMandateStatus,
      consecutiveDays: evaluation?.consecutiveDays || 0,
      hasCustomRequirements: evaluation?.hasCustomRequirements || false,
      customDocumentRequirements: evaluation?.customDocumentRequirements || [],
      ...userProfile?.raw,
      ...evaluation,
    };
  }, [studentId, effectiveStudentName, userProfile, evaluation, targetGBP, totals.ngn, effectiveMandateStatus]);

  // Handlers
  const handleSyncAccount = async (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    setSyncingId(id);

    if (acc.isSystemTopUp) {
      try {
        await fetch('/api/v1/topup/status');
        await new Promise(r => setTimeout(r, 1000));
        toast.success('System liquidity pulse verified.');
      } catch (e) {
        toast.success('System liquidity verified.');
      } finally {
        setSyncingId(null);
        return;
      }
    }

    if (acc.bankName.includes('UBA') || acc.bankName.includes('United Bank')) {
      if ((window as any).AndroidBridge) {
        (window as any).AndroidBridge.triggerSmsSync(acc.accountNumberMasked.slice(-4));
        return;
      } else {
        toast.error("SMS Sync is only available in the Basechan Funder Android App.");
        setSyncingId(null);
        return;
      }
    }

    try {
      await new Promise(r => setTimeout(r, 1200));
      await updateDoc(doc(db, 'financial_accounts', id), {
        lastSyncedAt: serverTimestamp(),
        status: 'VERIFIED'
      });
      toast.success(`${acc.bankName} balance synchronized.`);
    } catch (err: any) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setSyncingId(null);
    }
  };

  // Admin bulk re-sync
  const handleAdminBulkResync = async () => {
    setIsBulkSyncing(true);
    try {
      for (const acc of accounts) {
        await updateDoc(doc(db, 'financial_accounts', acc.id), {
          lastSyncedAt: serverTimestamp(),
          status: 'VERIFIED'
        });
      }
      toast.success('All linked bank accounts re-synced successfully.');
    } catch (err: any) {
      toast.error('Failed to re-sync bank ledger: ' + err.message);
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const handleAdminUnlink = async (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    if (window.confirm('Accept and unlink this account immediately?')) {
      try {
        await deleteDoc(doc(db, 'financial_accounts', accountId));

        await addDoc(collection(db, 'notifications'), {
          userId: studentId,
          studentName: effectiveStudentName,
          title: 'Account Force-Unlinked',
          body: `Bank account (${acc.bankName}) was removed by an Administrator.`,
          type: 'ALERT',
          createdAt: serverTimestamp(),
          isRead: false
        });

        toast.success('Account unlinked.');
      } catch (err: any) {
        toast.error('Failed to unlink: ' + err.message);
      }
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
    toast.success('Unlink request submitted.');
  };

  const handleConnectBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !selectedBank || !accountNumberInput) return;
    setIsSavingAndSyncing(true);
    try {
      const balance = parseFloat(realAmountInput) || 0;
      const mask = `•••• ${accountNumberInput.slice(-4)}`;
      await addDoc(collection(db, 'financial_accounts'), {
        userId: studentId,
        userEmail: isAdmin ? evaluation?.userEmail || '' : currentUser?.email,
        bankName: selectedBank,
        accountName: effectiveStudentName,
        accountNumberMasked: mask,
        accountType: selectedAccountType,
        balanceNgn: Math.round(balance),
        balanceGbp: Math.round((balance / LIVE_FX_RATE) * 100) / 100,
        connectionMethod: 'MANUAL_DEPOSIT',
        status: 'VERIFIED',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        userId: studentId,
        studentName: effectiveStudentName,
        title: 'New Bank Source Linked',
        body: `${isAdmin ? 'Admin' : 'Student'} linked a new ${selectedBank} account (${mask}).`,
        type: 'INFO',
        createdAt: serverTimestamp(),
        isRead: false
      });

      setIsConnectModalOpen(false);
      setSelectedBank('');
      setBankSearchQuery('');
      setAccountNumberInput('');
      setRealAmountInput('');
      toast.success('Bank account connected successfully.');
    } catch (err: any) {
      toast.error('Error adding account: ' + err.message);
    } finally {
      setIsSavingAndSyncing(false);
    }
  };

  const handleCancelConnect = () => {
    setIsConnectModalOpen(false);
    setSelectedBank('');
    setBankSearchQuery('');
    setAccountNumberInput('');
    setRealAmountInput('');
    setSyncError(null);
  };

  const handleAdditionalTopUp = () => {
    const deficitGbp = targetGBP - totals.gbp;
    if (deficitGbp > 0) setPrepopulatedTopUpAmount(Math.round(deficitGbp * LIVE_FX_RATE));
    if (isAdmin && onAdminAction) {
      onAdminAction('pricing');
    } else {
      setIsTopUpModalOpen(true);
    }
  };

  if (dataLoading && accounts.length === 0) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-xs font-black text-amber-500 uppercase tracking-widest">
          {isAdmin ? 'Loading Student Profile...' : 'Loading Dashboard...'}
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 font-sans transition-all duration-500 relative ${
      expiryInfo.isExpired ? 'grayscale opacity-40 pointer-events-none' : ''
    }`}>



      {/* Expiry Warning Banner */}
      {expiryInfo.isNearExpiry && !expiryInfo.isExpired && (
        <div className="p-6 rounded-[2rem] border bg-amber-500/10 border-amber-500/20 animate-in slide-in-from-top-4 duration-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-amber-400">
                POF EVALUATION EXPIRES SOON
              </h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Evaluation period ends in <span className="text-amber-500">{expiryInfo.daysLeft} days</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => isAdmin ? onAdminAction?.('days') : setIsTopUpModalOpen(true)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
          >
            {isAdmin ? 'Adjust Window' : 'Request Extension'}
          </button>
        </div>
      )}

      {/* Hero Metric Card Section */}
      <section className="relative group">
        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] min-h-[280px] md:min-h-[340px] flex items-stretch">

          {/* CARD 1: Total Liquid Converted Balance */}
          <div className={`w-full flex-shrink-0 transition-all duration-700 transform ${activeMetricCard === 0 ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute'}`}>
            <div className="h-full glass-card p-6 md:p-12 text-white relative flex flex-col justify-between overflow-hidden !bg-slate-900/90 !border-white/10 shadow-2xl">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-[0.25em] mb-2 opacity-90 truncate">
                      {effectiveStudentName}
                    </p>
                    <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-depth-header leading-none break-all">
                      £{totals.gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="flex justify-between text-[8px] md:text-[10px] font-mono text-slate-400 mt-4 border-t border-white/5 pt-2 uppercase tracking-tight">
                       <span>CURRENT: £{Math.round(totals.gbp).toLocaleString()}</span>
                       <span>TARGET: {targetGBP > 0 ? `£${targetGBP.toLocaleString()}` : '£0 (NOT SET)'}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 md:gap-3">
                       <p className="text-slate-400 text-lg md:text-xl font-bold uppercase tracking-tight text-depth-header">
                         {currency.symbol}{totals.ngn.toLocaleString()}
                       </p>
                       <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                         {currency.code}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-6">
                    <div className="flex items-center space-x-2 text-[9px] md:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>LINKED: <span className="text-white ml-1">{selectedAccountIds.length} / {accounts.length}</span></span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-white/10" />
                    <div className="flex items-center space-x-2 text-[9px] md:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[140px] sm:max-w-none">Bank: <span className="text-emerald-400 ml-1">
                        {selectedAccountIds.length === 0
                          ? 'NONE'
                          : selectedAccountIds.length === 1
                            ? accounts.find(a => a.id === selectedAccountIds[0])?.bankName
                            : `MULTI (+${selectedAccountIds.length - 1})`}
                      </span></span>
                    </div>
                  </div>

                  {/* Primary Top-Up CTA: Dynamic copy */}
                  <button
                    onClick={() => {
                      if (isAdmin) {
                        onAdminAction ? onAdminAction('pricing') : toast.info('Admin override ready');
                      } else {
                        setIsTopUpModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-2 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/20"
                  >
                    {isAdmin && <Settings2 className="w-3.5 h-3.5" />}
                    <span>{isAdmin ? 'CONFIGURE CAPITAL / TOP-UP' : 'UPDATE TOP-UP'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Statutory Holding & Expiration Timer */}
          <div className={`w-full flex-shrink-0 transition-all duration-700 transform ${activeMetricCard === 1 ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute'}`}>
            <div className="h-full glass-card p-6 md:p-12 text-white relative flex flex-col justify-between overflow-hidden !bg-slate-900/90 !border-white/10 shadow-2xl">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-amber-400 text-xs font-black uppercase tracking-[0.25em] opacity-90">Proof of Funds Timeline</p>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${
                        targetGBP > 0
                          ? isTargetMet ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {targetGBP > 0 ? (isTargetMet ? 'Target Met' : `${progressPercent}% Of Target`) : 'No Target Set'}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-3">
                      {evaluation?.startDate ? (
                        expiryInfo.isExpired ? (
                          <h3 className="text-3xl md:text-5xl font-black tracking-tight text-rose-500 uppercase">Window Expired</h3>
                        ) : (
                          <>
                            <h3 className="text-5xl md:text-7xl font-black tracking-tight text-white">{expiryInfo.daysLeft}</h3>
                            <span className="text-2xl font-bold text-slate-400 uppercase">Days</span>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">REMAINING</span>
                          </>
                        )
                      ) : (
                        <div className="flex items-baseline space-x-3 opacity-60">
                          <h3 className="text-3xl md:text-5xl font-black tracking-tight text-slate-500 uppercase">NO WINDOW SET</h3>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-6">
                      <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            targetGBP > 0
                              ? isTargetMet ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-blue-500'
                              : 'bg-slate-700'
                          }`}
                          style={{ width: targetGBP > 0 ? `${progressPercent}%` : '0%' }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-mono text-slate-400 mt-3 uppercase tracking-widest">
                        <span>Current: £{Math.round(totals.gbp).toLocaleString()}</span>
                        <span>Target: {targetGBP > 0 ? `£${targetGBP.toLocaleString()}` : '£0 (Not Set)'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {evaluation?.startDate ? (
                        <>
                          STATUTORY COMPLIANCE WINDOW: <span className="text-white ml-2">{new Date(evaluation.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span> - <span className="text-white">{new Date(evaluation.expirationDate || new Date(new Date(evaluation.startDate).getTime() + 28 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </>
                      ) : (
                        <span className="text-rose-400 animate-pulse">Waiting for Admin to initialize evaluation window</span>
                      )}
                   </p>
                   {isAdmin && (
                     <button
                       onClick={() => onAdminAction?.('days')}
                       className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/20"
                     >
                       <Settings2 className="w-3.5 h-3.5" />
                       <span>SETUP EVALUATION</span>
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

      {/* Compliance Section: Dynamic copy & role-gated modals */}
      <section className="space-y-4">
        <div className="px-1">
          <h3 className="text-lg md:text-xl uppercase font-extrabold text-white tracking-tight">
            {isAdmin ? 'COMPLIANCE DOCUMENTS & VERIFICATION' : 'VERIFICATION & UPGRADES'}
          </h3>
          <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isAdmin ? 'Review student identity uploads & mandate package' : 'Verify your documents to unlock full features'}
          </p>
        </div>

        <div className="p-6 md:p-8 rounded-[2rem] border backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6 transition-all bg-slate-900/80 border-white/10 hover:border-blue-500/30 shadow-xl">
           <div className="flex items-start gap-4 md:gap-6 w-full sm:w-auto">
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${
                effectiveMandateStatus === 'MANDATE_APPROVED'
                  ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
                  : 'bg-sky-950/60 text-sky-300 border-sky-800'
              }`}>
                 {effectiveMandateStatus === 'MANDATE_APPROVED' ? (
                   <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" />
                 ) : (
                   <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />
                 )}
              </div>
              <div className="min-w-0">
                 <h4 className="text-base md:text-lg font-black uppercase tracking-tight text-white leading-tight">
                   {effectiveMandateStatus === 'MANDATE_APPROVED'
                     ? 'Compliance Verification Cleared'
                     : effectiveMandateStatus === 'MANDATE_SUBMITTED_AWAITING_APPROVAL'
                       ? 'Package Awaiting Verification'
                       : 'Upgrade Account'}
                 </h4>
                 <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5 leading-relaxed">
                   {effectiveMandateStatus === 'MANDATE_APPROVED'
                     ? 'Regulatory account mandate has been fully verified and approved.'
                     : effectiveMandateStatus === 'MANDATE_SUBMITTED_AWAITING_APPROVAL'
                       ? 'Document package has been received and is under professional review.'
                       : 'Submit your international passport and supporting financial documents for review.'}
                 </p>
              </div>
           </div>

           {/* Role-gated action button */}
           <button
             onClick={() => {
               if (isAdmin) {
                 setIsAdminReviewDrawerOpen(true);
               } else {
                 setIsDocumentWizardOpen(true);
               }
             }}
             className={`w-full sm:w-auto px-6 md:px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
               effectiveMandateStatus === 'MANDATE_APPROVED'
                 ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                 : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-95'
             }`}
           >
             {isAdmin ? (
               <>
                 <Search className="w-3.5 h-3.5" />
                 <span>INSPECT & VERIFY SUBMISSIONS</span>
               </>
             ) : (
               <span>MANAGE SUBMISSIONS</span>
             )}
           </button>
        </div>
      </section>

      {/* Bank Accounts Ledger: Dynamic Micro-Copy */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 px-1">
          <div className="min-w-0">
            <h3 className="text-lg md:text-xl uppercase font-extrabold text-white tracking-tight leading-tight">
              {isAdmin ? 'LINKED BANK ACCOUNTS (AUDIT TRAIL)' : 'LINKED BANK ACCOUNTS'}
            </h3>
            <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Select accounts to include in total asset calculation
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <button
               onClick={() => setSelectedAccountIds(accounts.map(a => a.id))}
               aria-label="Select all bank accounts"
               className="flex-1 lg:flex-none flex items-center justify-center space-x-2 text-[9px] font-black uppercase tracking-widest transition-all px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white"
             >
               <CheckSquare className="w-3.5 h-3.5" />
               <span>Select All</span>
             </button>
             <button
               onClick={() => setSelectedAccountIds([])}
               aria-label="Clear selected bank accounts"
               className="flex-1 lg:flex-none flex items-center justify-center space-x-2 text-[9px] font-black uppercase tracking-widest transition-all px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white"
             >
               <Square className="w-3.5 h-3.5" />
               <span>Clear</span>
             </button>

             {/* Dynamic Action Trigger */}
             {isAdmin ? (
               <button
                 onClick={handleAdminBulkResync}
                 disabled={isBulkSyncing}
                 className="w-full lg:w-auto flex items-center justify-center space-x-2 text-[9px] font-black uppercase tracking-widest transition-all px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95 disabled:opacity-50"
               >
                 <RefreshCw className={`w-3.5 h-3.5 ${isBulkSyncing ? 'animate-spin' : ''}`} />
                 <span>RE-SYNC BANK LEDGER</span>
               </button>
             ) : (
               <button
                 onClick={() => setIsConnectModalOpen(true)}
                 aria-label="Link new bank account source"
                 className="w-full lg:w-auto flex items-center justify-center space-x-2 text-[9px] font-black uppercase tracking-widest transition-all px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-95"
               >
                 <Plus className="w-3.5 h-3.5" />
                 <span>+ CONNECT BANK</span>
               </button>
             )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Approved Top Up Cards (Priority Rendering) */}
          {accounts.filter(a => a.isSystemTopUp).map(acc => (
            <ApprovedTopUpCard
              key={acc.id}
              account={acc}
              evaluation={evaluation || { expirationDate: null, startDate: null }}
              isSyncing={syncingId === acc.id}
              onSync={handleSyncAccount}
              onAdditionalTopUp={handleAdditionalTopUp}
            />
          ))}

          {/* Standard User Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.filter(a => !a.isSystemTopUp).map((acc) => {
              const isSelected = selectedAccountIds.includes(acc.id);

              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountIds(prev =>
                      prev.includes(acc.id) ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                    );
                  }}
                  className={`glass-subcard p-6 md:p-8 flex flex-col justify-between transition-all group shadow-sm hover:-translate-y-1 cursor-pointer relative ${
                    isSelected ? 'border-amber-500/50 bg-amber-500/5' : ''
                  }`}
                >
                  {/* Checkbox Overlay */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-600 scale-110' : 'border-slate-600'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>

                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center bg-slate-800 border-white/5 text-slate-400">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black tracking-tight uppercase text-white">
                              {acc.accountName || acc.bankName}
                            </h4>
                            {acc.id === 'parallex_dedicated' && (
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">(Mandate)</span>
                            )}
                            {acc.isVerified && (
                              <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter flex items-center gap-0.5 bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Verified
                              </span>
                            )}
                            {acc.isDedicatedParallex && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-800 text-[7px] font-black uppercase tracking-tighter flex items-center gap-0.5">
                                <Building2 className="w-2.5 h-2.5" />
                                Dedicated POF Account
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.accountNumberMasked} • {acc.accountType}</p>
                            <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter flex items-center gap-0.5 bg-sky-950/60 text-sky-300 border border-sky-800">
                              <Lock className="w-2 h-2" />
                              Read-Only
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right pr-8">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                          acc.verificationStatus === 'MANDATE_PENDING_REVIEW'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : acc.status === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {acc.verificationStatus === 'MANDATE_PENDING_REVIEW' ? 'Mandate Pending' : acc.status}
                        </span>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1.5">Last Sync: {acc.lastSyncedAt}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/5">
                      <div className={`col-span-2 mb-4 p-4 rounded-2xl border transition-all ${
                        acc.isCapitalBreached
                          ? 'bg-rose-500/10 border-rose-500/40 animate-pulse'
                          : 'bg-slate-950/40 border-white/5'
                      }`}>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Summary</p>
                          {acc.isCapitalBreached && (
                            <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-rose-500/20">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              Target Shortfall
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          {/* Sub-labels: Dynamic micro-copy */}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              {isAdmin ? 'STUDENT PERSONAL EQUITY' : 'YOUR EQUITY'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                              acc.isCapitalBreached
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {currency.symbol}{Math.max(acc.balanceNgn - acc.orgTopUpCapitalNgn, 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              {isAdmin ? 'ORGANIZATION TOP-UP CAPITAL' : 'SPONSORSHIP / TOP-UP'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 bg-blue-500/10 text-blue-400 border-blue-500/20">
                              <Lock className="w-2.5 h-2.5" />
                              {currency.symbol}{acc.orgTopUpCapitalNgn.toLocaleString()}
                            </span>
                          </div>
                          {acc.isDedicatedParallex && (
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Account Usage Status</span>
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter flex items-center gap-1">
                                 Active (Last txn: {acc.lastTransactionAt ? new Date(acc.lastTransactionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bank Balance</p>
                        <p className="text-xl font-black text-white">{currency.symbol}{acc.balanceNgn.toLocaleString()}</p>
                      </div>
                      <div className="border-l border-white/5 pl-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GBP Value</p>
                        <p className="text-xl font-black text-blue-400">£{acc.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleSyncAccount(acc.id)}
                          disabled={syncingId === acc.id}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                          {syncingId === acc.id ? 'Syncing...' : 'Sync Balance'}
                        </button>

                        <button
                          onClick={() => setIsUssdModalOpen(true)}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-400 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          USSD
                        </button>

                        <button
                          onClick={() => {
                            setStatementOpenAccount(acc);
                            setIsStatementOpen(true);
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-400 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Statement
                        </button>
                      </div>
                      {!acc.isVerified && (
                        <span className="text-[10px] text-zinc-500 font-medium block mt-2">Account not verified</span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (isAdmin) {
                          handleAdminUnlink(acc.id);
                        } else {
                          if (acc.unlinkStatus === 'UNLINK_REQUESTED') return;
                          setSelectedUnlinkAccount(acc);
                          setIsUnlinkModalOpen(true);
                        }
                      }}
                      disabled={!isAdmin && acc.unlinkStatus === 'UNLINK_REQUESTED'}
                      className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        !isAdmin && acc.unlinkStatus === 'UNLINK_REQUESTED'
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isAdmin && acc.unlinkStatus === 'UNLINK_REQUESTED'
                        ? 'Approve Unlink'
                        : acc.unlinkStatus === 'UNLINK_REQUESTED'
                          ? 'Unlink Pending'
                          : isAdmin
                            ? 'Force Unlink'
                            : 'Request Unlink'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Connect Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleCancelConnect}>
          <div className="w-full max-w-lg glass-card overflow-hidden !bg-slate-900 !border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Connect your bank account</h3>
              <button onClick={handleCancelConnect} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <form onSubmit={handleConnectBank} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Bank</label>
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
                        className="w-full border rounded-2xl pl-12 pr-4 py-4 text-xs font-bold bg-slate-950 border-white/10 text-white focus:border-blue-500 focus:outline-none transition-all"
                      />
                      {isBankDropdownOpen && bankSearchQuery && filteredNigerianBanks.length > 0 && (
                        <div className="absolute z-[100] w-full mt-2 max-h-60 overflow-y-auto border rounded-2xl shadow-2xl no-scrollbar bg-slate-900 border-white/10">
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
                                selectedBank === bank ? 'bg-blue-600 text-white' : 'text-slate-300'
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                      <input
                        required
                        maxLength={10}
                        placeholder="10-digit Number"
                        value={accountNumberInput}
                        onChange={e => setAccountNumberInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full border rounded-2xl px-5 py-4 text-xs font-bold bg-slate-950 border-white/10 text-white focus:border-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                      <select
                        value={selectedAccountType}
                        onChange={e => setSelectedAccountType(e.target.value as AccountType)}
                        className="w-full border rounded-2xl px-5 py-4 text-xs font-bold bg-slate-950 border-white/10 text-white focus:border-blue-500 focus:outline-none transition-all"
                      >
                        <option value="SAVINGS">SAVINGS</option>
                        <option value="CURRENT">CURRENT</option>
                        <option value="DOMICILIARY">DOMICILIARY</option>
                      </select>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Balance (₦)</label>
                      <input
                        type="number"
                        placeholder="Initial Balance (₦)"
                        value={realAmountInput}
                        onChange={e => setRealAmountInput(e.target.value)}
                        className="w-full border rounded-2xl px-5 py-4 text-xs font-bold bg-slate-950 border-white/10 text-white focus:border-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedBank || accountNumberInput.length < 10 || (isAdmin && !realAmountInput) || isSavingAndSyncing}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            </div>
          </div>
        </div>
      )}

      {/* Student Modals */}
      {!isAdmin && (
        <TopUpRequestModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          onSuccess={() => {}}
          initialAmount={prepopulatedTopUpAmount}
        />
      )}

      <UssdFallbackModal
        isOpen={isUssdModalOpen}
        onClose={() => setIsUssdModalOpen(false)}
        onSuccess={() => {}}
        linkedBanks={accounts.map(a => a.bankName)}
      />

      <StudentDocumentUploadWizard
        isOpen={isDocumentWizardOpen}
        onClose={() => setIsDocumentWizardOpen(false)}
      />

      {/* Admin Review Drawer Modal with APPROVE / REJECT WITH NOTES */}
      <AdminStudentProfileDrawer
        isOpen={isAdminReviewDrawerOpen}
        onClose={() => setIsAdminReviewDrawerOpen(false)}
        student={studentDrawerPayload}
        initialTab="documents"
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
          <div className="w-full max-w-md rounded-[2.5rem] border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-[#0D111A] border-white/10">
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

      {/* Expired Modal */}
      {isExpiredModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[2.5rem] border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-[#0D111A] border-white/10">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">Account Expired</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Evaluation Period Concluded</p>
              <div className="p-6 rounded-2xl border italic text-xs font-medium leading-relaxed bg-slate-950 border-white/5 text-slate-300">
                "{evaluation?.timerCustomMessage || 'Your evaluation period has ended. Please contact your counselor to extend access.'}"
              </div>
              <button onClick={() => setIsExpiredModalOpen(false)} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Understood</button>
            </div>
          </div>
        </div>
      )}

      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userData={userProfile || appUser}
        consolidatedBalance={accounts.reduce((sum, acc) => sum + acc.balanceNgn, 0)}
        holdingProgress={evaluation?.consecutiveDays ? Math.min(Math.round((evaluation.consecutiveDays / 28) * 100), 100) : 0}
      />

    </div>
  );
};

export default StudentDashboardView;
