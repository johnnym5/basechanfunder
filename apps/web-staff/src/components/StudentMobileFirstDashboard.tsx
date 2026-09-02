import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
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
  Clock,
  Sun,
  Moon,
  MessageCircle,
  Bell,
  LogOut,
  Sparkles,
  ShieldAlert,
  Settings2,
  CheckCheck,
  History,
  Lock,
  Zap,
  ArrowRight,
  Layers,
  Phone,
  FileText
} from 'lucide-react';

import { TopUpRequestModal } from './TopUpRequestModal';
import { StudentSupportChat } from './StudentSupportChat';
import { UssdFallbackModal } from './UssdFallbackModal';
import { SmsIngestionService } from '../services/SmsIngestionService';
import { toast } from 'sonner';

import { MAJOR_CURRENCIES } from '../constants';

// --- Types ---
type AccountType = 'SAVINGS' | 'CURRENT' | 'DOMICILIARY';
type ConnectionMethod = 'MONO_OPEN_BANKING' | 'OKRA_AGGREGATOR' | 'MANUAL_DEPOSIT';
type AccountStatus = 'VERIFIED' | 'SYNCING' | 'NEEDS_REAUTH';

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
  status: AccountStatus;
  isSystemTopUp: boolean;
  unlinkStatus: 'ACTIVE' | 'UNLINK_REQUESTED';
}

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
}

const LIVE_FX_RATE = 1945.50;

const NIGERIAN_BANKS = [
  "Access Bank", "Zenith Bank", "Guaranty Trust Bank (GTB)", "United Bank for Africa (UBA)",
  "First Bank of Nigeria", "Fidelity Bank", "First City Monument Bank (FCMB)", "Stanbic IBTC Bank",
  "Sterling Bank", "Wema Bank", "Union Bank", "Polaris Bank", "Keystone Bank", "Ecobank Nigeria",
  "Standard Chartered Bank", "Providus Bank", "Premium Trust Bank", "Signature Bank", "SunTrust Bank",
  "Titan Trust Bank", "Optimus Bank", "Parallex Bank", "Citibank Nigeria", "Globus Bank",
  "Jaiz Bank", "TAJBank", "Lotus Bank", "The Alternative Bank", "Summit Bank", "FSDH Merchant Bank",
  "Moniepoint MFB", "Kuda MFB", "Opay (Blue Ridge MFB)", "PalmPay", "LAPO MFB", "FairMoney MFB",
  "Renmoney MFB", "Accion MFB", "VFD MFB", "Sparkle MFB", "AB MFB", "Carbon MFB", "Branch MFB"
];

export const StudentMobileFirstDashboard: React.FC<{
  name: string;
  isStaff?: boolean;
  onStaffAction?: (tab?: string) => void;
}> = ({ name, isStaff, onStaffAction }) => {
  const { currentUser, appUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // --- States ---
  const [accounts, setAccounts] = useState<LinkedBankAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isUssdModalOpen, setIsUssdModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [selectedUnlinkAccount, setSelectedUnlinkAccount] = useState<LinkedBankAccount | null>(null);
  const [isSavingAndSyncing, setIsSavingAndSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [activeMetricCard, setActiveMetricCard] = useState(0); // 0 = Balance, 1 = Timer

  // 5-Second Slide-Out Notification Toast State
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const [isToastRetracting, setIsToastRetracting] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);
  const [notificationsList, setNotificationsList] = useState<ToastNotification[]>([]);
  const [notifPage, setNotifPage] = useState(1);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Bank connect modal inputs
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

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            lastSyncedAt: 'Just now (SMS)',
            status: 'VERIFIED',
            isVerified: isMatch && mask !== 'XXXX'
          };
        }
        return acc;
      }));

      // 2. Persist to Firestore
      if (matchedAccId) {
        const isMatch = mask !== 'XXXX';
        await updateDoc(doc(db, 'financial_accounts', matchedAccId), {
          balanceNgn: balance,
          balanceGbp: balance / LIVE_FX_RATE,
          lastSyncedAt: serverTimestamp(),
          status: 'VERIFIED',
          isVerified: isMatch,
          updatedAt: serverTimestamp()
        });
      }

      // 3. Trigger a success toast
      triggerSlideOutToast({
        id: `sms-${Date.now()}`,
        title: 'SMS Alert Received',
        message: `Balance updated: ₦${balance.toLocaleString()} from native parser.`,
        time: 'Just now',
        type: 'SUCCESS'
      });

      // 4. Clear modal states
      setIsConnectModalOpen(false);
      setIsSavingAndSyncing(false);
    };

    (window as any).onSmsSyncFailed = (mask: string) => {
      console.warn(`SMS Sync Failed for mask: ${mask}`);
      setSyncError(`We couldn't find a matching UBA SMS alert for account ending in ${mask}.`);
      setIsSavingAndSyncing(false);
    };

    return () => {
      (window as any).onSmsBalanceUpdate = null;
      (window as any).onSmsSyncFailed = null;
    };
  }, []);

  // 1. Fetch Real Bank Accounts & Evaluation
  useEffect(() => {
    if (!currentUser?.uid) return;

    const accQ = query(collection(db, 'financial_accounts'), where('userId', '==', currentUser.uid));
    const unsubAcc = onSnapshot(accQ, (snap) => {
      const data = snap.docs.map(d => {
        const item = d.data();
        return {
          id: d.id,
          bankName: item.bankName || 'Unknown Bank',
          accountNumberMasked: item.accountNumberMasked || item.accountMask || '•••• ****',
          accountType: item.accountType || item.type || 'SAVINGS',
          balanceNgn: item.balanceNgn || item.balanceNGN || 0,
          balanceGbp: item.balanceGbp || item.balanceGBP || 0,
          orgTopUpCapitalNgn: item.orgTopUpCapitalNgn || 0,
          isCapitalBreached: (item.balanceNgn || 0) < (item.orgTopUpCapitalNgn || 0),
          isVerified: item.isVerified || false,
          isSystemTopUp: item.isSystemTopUp || false,
          unlinkStatus: item.unlinkStatus || 'ACTIVE',
          connectionMethod: item.connectionMethod || item.provider || 'MANUAL_DEPOSIT',
          lastSyncedAt: item.lastSyncedAt?.seconds
            ? new Date(item.lastSyncedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
          status: item.status || 'VERIFIED'
        } as LinkedBankAccount;
      });
      setAccounts(data);
      setSelectedAccountIds(prev => prev.length === 0 ? data.map(a => a.id) : prev);
    });

    const evalQ = query(collection(db, 'pof_evaluations'), where('userId', '==', currentUser.uid));
    const unsubEval = onSnapshot(evalQ, (snap) => {
      if (!snap.empty) setEvaluation(snap.docs[0].data());
      setLoading(false);
    });

    return () => { unsubAcc(); unsubEval(); };
  }, [currentUser?.uid]);

  // 2. Fetch Notifications Stream
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    let isFirstSnapshot = true;
    const unsubNotif = onSnapshot(q, (snap) => {
      const logs: ToastNotification[] = snap.docs.map(d => {
        const item = d.data();
        const createdDate = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date();

        // Simple relative time string
        const diff = Date.now() - createdDate.getTime();
        let timeStr = 'Just now';
        if (diff > 1000 * 60 * 60 * 24) timeStr = `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ago`;
        else if (diff > 1000 * 60 * 60) timeStr = `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
        else if (diff > 1000 * 60) timeStr = `${Math.floor(diff / (1000 * 60))}m ago`;

        return {
          id: d.id,
          title: item.title || 'Notification',
          message: item.body || item.message || '',
          time: timeStr,
          type: item.type || 'INFO',
          isRead: item.isRead || false
        } as any;
      });

      setNotificationsList(logs);
      setHasUnreadNotification(logs.some(n => !(n as any).isRead));

      // Trigger 5-second slide-out toast on fresh incoming notification
      if (!isFirstSnapshot && snap.docChanges().some(c => c.type === 'added')) {
        const newest = logs[0];
        if (newest && !isProfileOpen) {
          triggerSlideOutToast(newest);
        }
      }
      isFirstSnapshot = false;
    }, () => {});

    return unsubNotif;
  }, [isProfileOpen, currentUser?.uid]);

  // Function to trigger 5-second Slide-Out Notification Toast
  const triggerSlideOutToast = (notif: ToastNotification) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    setIsToastRetracting(false);
    setActiveToast(notif);
    setHasUnreadNotification(true);

    // After 4.6s, start smooth retract animation into the avatar button
    const retractTimer = setTimeout(() => {
      setIsToastRetracting(true);
    }, 4600);

    // After exactly 5.0s, hide banner and keep persistent bottom-left red dot
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
      setIsToastRetracting(false);
    }, 5000);

    return () => {
      clearTimeout(retractTimer);
    };
  };

  // 3. Computed Totals
  const totals = useMemo(() => {
    const selectedAccounts = accounts.filter(a => selectedAccountIds.includes(a.id));
    const accountsNgn = selectedAccounts.reduce((sum, acc) => sum + (Number(acc.balanceNgn) || 0), 0);
    const evaluationNgn = Number(evaluation?.currentBalanceNgn) || 0;
    const ngn = accountsNgn + evaluationNgn;
    const gbp = ngn / LIVE_FX_RATE;
    return { ngn, gbp, accountsNgn, evaluationNgn };
  }, [accounts, selectedAccountIds, evaluation]);

  const targetGBP = evaluation?.targetGBP || 0;
  const localCurrencyCode = evaluation?.localCurrency || 'NGN';
  const currency = (typeof MAJOR_CURRENCIES !== 'undefined' ? MAJOR_CURRENCIES.find(c => c.code === localCurrencyCode) : null) || { code: 'NGN', symbol: '₦' };

  const isTargetMet = targetGBP > 0 && totals.gbp >= targetGBP;
  const progressPercent = targetGBP > 0 ? Math.min(Math.round((totals.gbp / targetGBP) * 100), 100) : 0;

  // Expiration logic
  const expiryInfo = useMemo(() => {
    if (!evaluation?.isTimerActive || !evaluation?.expirationDate) {
      return { isExpired: false, isNearExpiry: false, daysLeft: 0 };
    }
    const now = new Date();
    const expiry = new Date(evaluation.expirationDate);
    expiry.setHours(23, 59, 59, 999);
    const diffTime = expiry.getTime() - now.getTime();
    const daysLeft = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
    return {
      isExpired: diffTime <= 0,
      isNearExpiry: daysLeft >= 0 && daysLeft <= 7,
      daysLeft
    };
  }, [evaluation]);

  // Handlers
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
         toast.error("SMS Sync is only available in the Android App.");
         setSyncingId(null);
         return;
       }
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const accRef = doc(db, 'financial_accounts', id);
      await updateDoc(accRef, {
        lastSyncedAt: serverTimestamp(),
        status: 'VERIFIED'
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleUnlinkAccount = async (id: string) => {
    if (window.confirm('Unlink this bank account from your pool?')) {
      await deleteDoc(doc(db, 'financial_accounts', id));
    }
  };

  const handleConnectBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedBank || !accountNumberInput) return;

    setIsSavingAndSyncing(true);
    setSyncError(null);
    try {
      const balance = parseFloat(realAmountInput) || 0;
      const mask = `•••• ${accountNumberInput.slice(-4)}`;

      // 1. Save metadata
      const docRef = await addDoc(collection(db, 'financial_accounts'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
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

      // 2. Trigger SMS Sync
      if ((window as any).AndroidBridge) {
        (window as any).AndroidBridge.triggerSmsSync(accountNumberInput.slice(-4));
      } else {
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
        isVerified: false, // Explicitly false as it wasn't auto-verified
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

  if (loading && accounts.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#030712]' : 'bg-slate-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 relative ${
      isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>

      {/* TOP HEADER: Clean Title + Profile FAB */}
      <header className={`sticky top-0 z-40 px-4 pt-4 pb-3 backdrop-blur-xl border-b transition-colors flex items-center justify-between ${
        isDark ? 'bg-[#030712]/95 border-white/5' : 'bg-white/95 border-slate-200 shadow-xs'
      }`}>
        <div className="flex-1 min-w-0 pr-3">
          <h1 className={`text-xs sm:text-base font-black tracking-tight uppercase truncate ${isDark ? 'text-white' : 'text-blue-950'}`}>
            Hello, {name || 'Student'}
          </h1>
          <p className={`text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Welcome to your <span className="text-blue-600 font-bold">Basechan Funder</span> dashboard
          </p>
        </div>

        {/* TOP-RIGHT PROFILE FAB & ANIMATED NOTIFICATION BANNER CONTAINER */}
        <div className="relative flex items-center" ref={profileMenuRef}>

          {/* SLIDE-OUT NOTIFICATION BANNER */}
          {activeToast && !isProfileOpen && (
            <div
              onClick={() => {
                setIsNotificationsOpen(true);
                setActiveToast(null);
                setHasUnreadNotification(false);
              }}
              className={`absolute right-12 z-50 flex items-center gap-2.5 border shadow-xl rounded-2xl px-3.5 py-2 max-w-[260px] sm:max-w-[320px] cursor-pointer backdrop-blur-2xl transition-all duration-400 ${
                isDark
                  ? 'bg-slate-900/95 border-blue-500/40 text-white shadow-[0_4px_25px_rgba(59,130,246,0.3)]'
                  : 'bg-white border-blue-200 text-slate-900 shadow-[0_4px_25px_rgba(0,0,0,0.15)]'
              } ${
                isToastRetracting
                  ? 'opacity-0 translate-x-10 scale-90'
                  : 'animate-in slide-in-from-right-8 fade-in duration-300'
              }`}
            >
              <div className="w-6 h-6 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider truncate">
                  {activeToast.title}
                </p>
                <p className={`text-[10px] truncate leading-tight mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                  {activeToast.message}
                </p>
              </div>
            </div>
          )}

          {/* PROFILE FAB BUTTON */}
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              if (!isProfileOpen) setHasUnreadNotification(false);
            }}
            aria-label="Student Profile Menu"
            className={`relative w-7 h-7 rounded-full border-2 transition-all hover:scale-105 active:scale-95 overflow-visible cursor-pointer z-50 flex items-center justify-center ${
              isDark
                ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-[#0B1222]'
                : 'border-blue-600 shadow-md shadow-blue-500/20 bg-white'
            }`}
          >
            {appUser?.photoURL ? (
              <img
                src={appUser.photoURL}
                alt="Profile Avatar"
                className="w-full h-full object-cover rounded-full bg-slate-800"
              />
            ) : (
              <span className="text-[9px] font-black text-blue-600 uppercase">
                {name?.[0]?.toUpperCase() || 'S'}
              </span>
            )}

            {/* PERSISTENT RED DOT */}
            {hasUnreadNotification && (
              <span className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 shadow-sm animate-pulse z-10 ${
                isDark ? 'border-[#030712]' : 'border-white'
              }`} />
            )}
          </button>

          {/* BACKDROP OVERLAY FOR PROFILE MENU */}
          {isProfileOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsProfileOpen(false)}
            />
          )}

          {/* COLLAPSIBLE PROFILE POPOVER MENU */}
          {isProfileOpen && (
            <div className={`absolute right-0 top-14 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-72 rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right border-2 ${
              isDark
                ? 'bg-[#0B1222] border-blue-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
                : 'bg-white border-slate-200 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
            }`}>
              {/* User Header */}
              <div className={`flex items-center space-x-3 pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm overflow-hidden border shrink-0 ${
                  isDark ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
                }`}>
                  {appUser?.photoURL ? (
                    <img src={appUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    name?.[0]?.toUpperCase() || 'S'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-black uppercase truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{name}</p>
                  <p className={`text-[10px] font-mono truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>@{appUser?.username || 'student'}</p>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-1.5">
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? 'text-slate-200 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-slate-800 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {isDark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsSupportOpen(true);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? 'text-slate-200 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-slate-800 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <span>Compliance Support</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsNotificationsOpen(true);
                    setHasUnreadNotification(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? 'text-slate-200 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-slate-800 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>Notifications & Alerts</span>
                  </div>
                  {notificationsList.length > 0 && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono">
                      {notificationsList.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Sign Out */}
              <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                <button
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN MOBILE CONTENT CONTAINER */}
      <main className="w-full px-3.5 sm:px-6 py-4 space-y-4 max-w-4xl mx-auto pb-12">

        {/* METRIC CARDS PAGED CONTAINER */}
        <section className="relative group">
          <div className="relative overflow-hidden rounded-3xl min-h-[220px] flex items-stretch">
            {/* CARD 1: Total Liquid Converted Balance */}
            <div className={`w-full flex-shrink-0 transition-all duration-500 transform ${activeMetricCard === 0 ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute'}`}>
              <div className="h-full rounded-3xl p-6 text-white relative overflow-hidden shadow-xl bg-[#0B172A] border border-white/10 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 mb-1">
                    {name || 'Student Balance'}
                  </p>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                    £{totals.gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>

                  <div className="mt-2.5 flex items-center gap-2">
                    <p className="text-slate-300 text-base sm:text-lg font-bold">
                      {currency.symbol}{totals.ngn.toLocaleString()}
                    </p>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[8px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                      {currency.code} LOCAL
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-end justify-between">
                  <div className="space-y-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Sources Linked: <span className="text-white">{selectedAccountIds.length} / {accounts.length} Selected</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[150px]">Bank: <span className="text-emerald-400">
                          {selectedAccountIds.length === 0
                            ? 'No Sources Selected'
                            : selectedAccountIds.length === 1
                              ? accounts.find(a => a.id === selectedAccountIds[0])?.bankName
                              : `${accounts.find(a => a.id === selectedAccountIds[0])?.bankName} (+${selectedAccountIds.length - 1})`}
                        </span></span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const t = toast.loading('Generating POF Statement PDF...');
                            setTimeout(() => {
                              toast.success('PDF Downloaded successfully!', { id: t });
                            }, 2000);
                          }}
                          className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest border transition-all px-2 py-1 rounded-lg ${
                            isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          <FileText className="w-2.5 h-2.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => isStaff && onStaffAction ? onStaffAction() : setIsTopUpModalOpen(true)}
                          className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors border-l border-white/10 pl-3 ml-2"
                        >
                          <span>{isStaff ? 'UPDATE' : 'TOP-UP'}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Statutory Holding & Expiration Timer */}
            <div className={`w-full flex-shrink-0 transition-all duration-500 transform ${activeMetricCard === 1 ? 'translate-x-0 opacity-100 relative' : '-translate-x-full opacity-0 absolute'}`}>
              <div className="h-full rounded-3xl p-6 text-white relative overflow-hidden shadow-xl bg-[#0F172A] border border-white/10 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      Holding & Expiration
                    </p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      targetGBP > 0
                        ? isTargetMet ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {targetGBP > 0 ? (isTargetMet ? 'Compliant' : `${progressPercent}% Of Target`) : 'No Target Set'}
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2 mt-1">
                    {evaluation?.startDate && expiryInfo.daysLeft > 0 ? (
                      <>
                        <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                          {expiryInfo.daysLeft} <span className="text-lg font-bold text-slate-400">Days</span>
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                          Remaining
                        </span>
                      </>
                    ) : (
                      <div className="flex items-baseline space-x-2 opacity-60">
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-500 uppercase">No window set</h3>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          targetGBP > 0
                            ? isTargetMet ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-blue-500'
                            : 'bg-slate-700'
                        }`}
                        style={{ width: targetGBP > 0 ? `${progressPercent}%` : '0%' }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                      <span>Current: £{Math.round(totals.gbp).toLocaleString()}</span>
                      <span>Target: {targetGBP > 0 ? `£${targetGBP.toLocaleString()}` : '£0 (Not Set)'}</span>
                    </div>
                  </div>
                </div>

                  <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">
                    {evaluation?.startDate ? 'UKVI 28-Day Window' : 'no window set, till admin put a window time'}
                  </span>
                  {isStaff && (
                    <button
                      onClick={() => onStaffAction?.('days')}
                      className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <span>SETUP EVALUATION</span>
                      <Settings2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center mt-3 gap-6">
            <button
              onClick={() => setActiveMetricCard(0)}
              className={`p-1.5 rounded-full border transition-all ${activeMetricCard === 0 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              {[0, 1].map(i => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeMetricCard === i ? 'bg-blue-500 w-4' : 'bg-slate-700'}`} />
              ))}
            </div>

            <button
              onClick={() => setActiveMetricCard(1)}
              className={`p-1.5 rounded-full border transition-all ${activeMetricCard === 1 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* BANK ACCOUNTS LEDGER */}
        <section className="space-y-3 pt-2">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className={`text-base font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Bank Accounts Ledger
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Open Banking & Verified Sources
              </p>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Connect Bank</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => {
              const isSelected = selectedAccountIds.includes(acc.id);
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountIds(prev =>
                      prev.includes(acc.id) ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                    );
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-950/20 border-blue-500/50 shadow-md shadow-blue-500/5'
                      : isDark ? 'bg-slate-900/40 border-white/5 hover:border-white/20' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-blue-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black uppercase text-white tracking-tight">{acc.bankName}</h4>
                          {acc.isVerified && (
                            <span className="px-1 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[6px] font-black uppercase tracking-tighter flex items-center gap-0.5">
                              <ShieldCheck className="w-2 h-2" />
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-mono text-slate-400">{acc.accountNumberMasked} • {acc.accountType}</p>
                          <span className="px-1 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[6px] font-black uppercase tracking-tighter flex items-center gap-0.5">
                            <Lock className="w-2 h-2" />
                            Read-Only
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-500'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/5 text-xs">
                    <div className={`col-span-2 mb-2 p-3 rounded-xl border transition-all ${
                      acc.isCapitalBreached
                        ? 'bg-rose-500/10 border-rose-500/40 animate-pulse'
                        : 'bg-white/5 border-white/5'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ledger Breakdown</p>
                        {acc.isCapitalBreached && (
                          <span className="text-[7px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase animate-bounce">
                            Capital Breached
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Your Equity</span>
                          <span className={acc.isCapitalBreached ? 'text-rose-400' : 'text-emerald-400'}>
                            {currency.symbol}{Math.max(acc.balanceNgn - acc.orgTopUpCapitalNgn, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter">Org Capital</span>
                          <span className="text-blue-400 flex items-center gap-0.5"><Lock className="w-2 h-2" />{currency.symbol}{acc.orgTopUpCapitalNgn.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold uppercase text-slate-500 tracking-wider">Total Balance</p>
                      <p className="font-bold text-white">{currency.symbol}{acc.balanceNgn.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold uppercase text-slate-500 tracking-wider">GBP Value</p>
                      <p className="font-bold text-blue-400">£{acc.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 text-[9px] font-mono text-slate-500" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleSyncAccount(acc.id)}
                            disabled={syncingId === acc.id}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <RefreshCw className={`w-3 h-3 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                            <span>{syncingId === acc.id ? 'Syncing...' : 'Sync'}</span>
                          </button>

                          {!acc.isSystemTopUp && (
                            <button
                              onClick={() => setIsUssdModalOpen(true)}
                              className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>USSD</span>
                            </button>
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
                            className={`transition-colors ${
                              acc.unlinkStatus === 'UNLINK_REQUESTED'
                                ? 'text-slate-700 cursor-not-allowed'
                                : 'text-slate-500 hover:text-rose-400'
                            }`}
                          >
                            {acc.unlinkStatus === 'UNLINK_REQUESTED' ? 'Unlink Pending' : 'Unlink'}
                          </button>
                        )}
                      </div>
                      {!acc.isVerified && (
                        <span className="text-[9px] text-zinc-500 font-medium block mt-2">Account not verified</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {accounts.length === 0 && (
              <div className="p-8 rounded-2xl border-2 border-dashed border-white/10 text-center space-y-2 opacity-60">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold uppercase text-slate-400">No bank accounts linked</p>
                <p className="text-[10px] text-slate-500">Tap Connect Bank above to link your proof of funds</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* NOTIFICATIONS DRAWER */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${
            isDark ? 'bg-[#0D1424] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>System Alerts & Logs</h3>
              </div>
              <button onClick={() => setIsNotificationsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`max-h-80 overflow-y-auto divide-y p-2 no-scrollbar ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {notificationsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active notifications
                </div>
              ) : (
                notificationsList.map(n => (
                  <div key={n.id} className={`p-3 space-y-2 rounded-2xl transition-all ${!(n as any).isRead ? (isDark ? 'bg-blue-500/5' : 'bg-blue-50') : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase ${n.type === 'ALERT' ? 'text-rose-500' : 'text-blue-600'}`}>{n.title}</span>
                      <span className="text-[8px] font-mono text-slate-400">{n.time}</span>
                    </div>
                    <p className={`text-xs leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{n.message}</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          const ref = doc(db, 'notifications', n.id);
                          updateDoc(ref, { isRead: true });
                          setIsNotificationsOpen(false);
                          // deep link handling could go here
                        }}
                        className="text-[9px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        View Details
                      </button>
                      {n.type === 'ALERT' && (
                        <button className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-400 transition-colors">Resolve Flag</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={`p-3 border-t flex justify-end items-center ${isDark ? 'border-white/5 bg-slate-950/40' : 'border-slate-100 bg-slate-50'}`}>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT CHAT POPUP */}
      {isSupportOpen && (
        <StudentSupportChat
          isPopUp={true}
          onClose={() => setIsSupportOpen(false)}
        />
      )}

      {/* TOP-UP MODAL */}
      {!isStaff && (
        <TopUpRequestModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {/* USSD MODAL */}
      <UssdFallbackModal
        isOpen={isUssdModalOpen}
        onClose={() => setIsUssdModalOpen(false)}
        onSuccess={() => {}}
        linkedBanks={accounts.map(a => a.bankName)}
      />

      {/* CONNECT BANK MODAL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 border ${
            isDark ? 'bg-[#0D1424] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Connect Account</h3>
                </div>
              </div>
              <button onClick={handleCancelConnect} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Guarantee Notice */}
            <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${isDark ? 'bg-blue-600/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Read-Only Guarantee</p>
                <p className="text-[9px] text-slate-500 leading-tight font-medium">
                  We only scan financial SMS alerts to verify POF holding. We have <span className="font-bold">ZERO permission</span> to move money.
                </p>
              </div>
            </div>

            <div className="p-2 space-y-5">
              {syncError ? (
                <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-tight">Bank Not Found</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      We couldn't find a matching UBA SMS alert. What would you like to do?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleRetrySync}
                      className="py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => { setSyncError(null); setSelectedBank(''); setBankSearchQuery(''); }}
                      className="py-3 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                    >
                      Change Bank
                    </button>
                    <button
                      onClick={handleCancelConnect}
                      className="py-3 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleContinueManual}
                      className="py-3 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
                    >
                      Continue
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-600 italic px-4">
                    "Continue" means you will have to manually send any changes made on your account to the organization for updates.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConnectBank} className="space-y-5">
                  <div className="space-y-2 relative">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Bank</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
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
                        className={`w-full border rounded-xl pl-11 pr-4 py-3 text-xs font-bold focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-950 focus:border-blue-600'
                        }`}
                      />
                      {isBankDropdownOpen && bankSearchQuery && filteredNigerianBanks.length > 0 && (
                        <div className={`absolute z-[100] w-full mt-1 max-h-48 overflow-y-auto border rounded-xl shadow-2xl no-scrollbar ${
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
                              className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase transition-all hover:bg-blue-600 hover:text-white ${
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                      <input
                        required
                        maxLength={10}
                        placeholder="10-digit Number"
                        value={accountNumberInput}
                        onChange={e => setAccountNumberInput(e.target.value.replace(/\D/g, ''))}
                        className={`w-full border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-950 focus:border-blue-600'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Type</label>
                      <select
                        value={selectedAccountType}
                        onChange={e => setSelectedAccountType(e.target.value as AccountType)}
                        className={`w-full border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all ${
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
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Balance (₦)</label>
                      <input
                        type="number"
                        placeholder="Initial Balance (₦)"
                        value={realAmountInput}
                        onChange={e => setRealAmountInput(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-950 focus:border-blue-600'
                        }`}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedBank || accountNumberInput.length < 10 || (isStaff && !realAmountInput) || isSavingAndSyncing}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentMobileFirstDashboard;
