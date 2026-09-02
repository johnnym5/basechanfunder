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
  limit
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
  Layers
} from 'lucide-react';

import { TopUpRequestModal } from './TopUpRequestModal';
import { StudentSupportChat } from './StudentSupportChat';

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
  connectionMethod: ConnectionMethod;
  lastSyncedAt: string;
  status: AccountStatus;
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
  onStaffAction?: () => void;
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
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // 5-Second Slide-Out Notification Toast State
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const [isToastRetracting, setIsToastRetracting] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);
  const [notificationsList, setNotificationsList] = useState<ToastNotification[]>([]);
  const [notifPage, setNotifPage] = useState(1);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Bank connect modal inputs
  const [modalTab, setModalTab] = useState<'OPEN_BANKING' | 'MANUAL'>('OPEN_BANKING');
  const [bankSearch, setBankSearch] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('SAVINGS');
  const [realAmountInput, setRealAmountInput] = useState('');
  const [manualForm, setManualForm] = useState({ name: '', accountName: '', number: '', balance: '' });

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return [];
    return NIGERIAN_BANKS.filter(b => b.toLowerCase().includes(bankSearch.toLowerCase()));
  }, [bankSearch]);

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

  // 2. Fetch Notifications Stream from audit_logs
  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('createdAt', 'desc'),
      limit(15)
    );

    let isFirstSnapshot = true;
    const unsubNotif = onSnapshot(q, (snap) => {
      const logs: ToastNotification[] = snap.docs.map(d => {
        const item = d.data();
        const time = item.createdAt?.seconds
          ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now';
        return {
          id: d.id,
          title: item.action || 'System Update',
          message: item.detail || `${item.actor || 'Compliance system'} updated verification status`,
          time,
          type: item.action?.includes('FLAG') ? 'ALERT' : item.action?.includes('APPROV') ? 'SUCCESS' : 'INFO'
        };
      });

      setNotificationsList(logs);

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
  }, [isProfileOpen]);

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

  // Test notification helper for verification
  const handleTriggerTestNotification = () => {
    const testNotif: ToastNotification = {
      id: `test-${Date.now()}`,
      title: 'Compliance Audit Update',
      message: 'New automated exchange rate verified for your 28-day holding pool.',
      time: 'Just now',
      type: 'INFO'
    };
    setNotificationsList(prev => [testNotif, ...prev]);
    setIsProfileOpen(false);
    triggerSlideOutToast(testNotif);
  };

  // 3. Computed Totals
  const totals = useMemo(() => {
    const selectedAccounts = accounts.filter(a => selectedAccountIds.includes(a.id));
    const ngn = selectedAccounts.reduce((sum, acc) => sum + acc.balanceNgn, 0);
    const gbp = ngn / LIVE_FX_RATE;
    return { ngn, gbp };
  }, [accounts, selectedAccountIds]);

  const targetGBP = evaluation?.targetGBP || 0;
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
    setSyncingId(id);
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

  const handleConnectBank = async (bank: string, isManual = false) => {
    if (!currentUser) return;
    const balance = isManual ? parseFloat(manualForm.balance) || 0 : parseFloat(realAmountInput) || 0;
    const mask = isManual ? `•••• ${manualForm.number.slice(-4)}` : `•••• ${accountNumberInput.slice(-4)}`;

    await addDoc(collection(db, 'financial_accounts'), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      bankName: bank,
      accountName: isManual ? manualForm.accountName : accountNameInput,
      accountNumberMasked: mask,
      accountType: selectedAccountType,
      balanceNgn: Math.round(balance),
      balanceGbp: Math.round((balance / LIVE_FX_RATE) * 100) / 100,
      connectionMethod: isManual ? 'MANUAL_DEPOSIT' : 'MONO_OPEN_BANKING',
      status: 'VERIFIED',
      lastSyncedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setIsConnectModalOpen(false);
    setSelectedBank('');
    setBankSearch('');
    setRealAmountInput('');
    setAccountNameInput('');
    setAccountNumberInput('');
    setManualForm({ name: '', accountName: '', number: '', balance: '' });
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

          {/* PROFILE FAB BUTTON with Blue Border Ring & Adaptive Theme Background */}
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

            {/* PERSISTENT RED DOT at Bottom-Left Corner */}
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

          {/* COLLAPSIBLE PROFILE POPOVER MENU (Adaptive Solid Background) */}
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
                {/* a. Light / Dark Mode Toggle */}
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

                {/* b. Compliance Support Chat Trigger */}
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

                {/* c. Notifications & System Alerts Drawer Link */}
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

        {/* METRIC CARDS HORIZONTAL CAROUSEL */}
        <section>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 pt-1 px-1">

            {/* CARD 1: Total Liquid Converted Balance */}
            <div className="w-[88%] sm:w-[400px] shrink-0 snap-center rounded-3xl p-6 text-white relative overflow-hidden shadow-xl bg-[#0B172A] border border-white/10 flex flex-col justify-between">
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
                    ₦{totals.ngn.toLocaleString()}
                  </p>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-[8px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                    Local Currency
                  </span>
                </div>
              </div>

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

                    <button
                      onClick={() => setIsTopUpModalOpen(true)}
                      className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors border-l border-white/10 pl-3 ml-2"
                    >
                      <span>{isStaff ? 'UPDATE' : 'TOP-UP'}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
            </div>

            {/* CARD 2: Statutory Holding & Expiration Timer */}
            <div className="w-full sm:w-[85%] md:w-[48%] shrink-0 snap-center rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-xl bg-[#0F172A] border border-white/10 flex flex-col justify-between">
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
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-400 uppercase">
                      No Window Set
                    </h3>
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
                <span className="text-[9px] font-mono text-slate-400">
                  {evaluation?.startDate ? `${evaluation.consecutiveDays || 28}-Day Window` : 'No Window Set'}
                </span>
                <button
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <span>Request Top-Up</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

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
                      <div>
                        <h4 className="text-xs font-black uppercase text-white tracking-tight">{acc.bankName}</h4>
                        <p className="text-[9px] font-mono text-slate-400">{acc.accountNumberMasked} • {acc.accountType}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-500'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/5 text-xs">
                    <div>
                      <p className="text-[8px] font-bold uppercase text-slate-500 tracking-wider">NGN Balance</p>
                      <p className="font-bold text-white">₦{acc.balanceNgn.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold uppercase text-slate-500 tracking-wider">GBP Value</p>
                      <p className="font-bold text-blue-400">£{acc.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 text-[9px] font-mono text-slate-500" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleSyncAccount(acc.id)}
                      disabled={syncingId === acc.id}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                      <span>{syncingId === acc.id ? 'Syncing...' : 'Sync'}</span>
                    </button>
                    <button
                      onClick={() => handleUnlinkAccount(acc.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Unlink
                    </button>
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
            <div className={`max-h-80 overflow-y-auto divide-y p-2 ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {notificationsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active notifications
                </div>
              ) : (
                notificationsList.map(n => (
                  <div key={n.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-blue-600">{n.title}</span>
                      <span className="text-[8px] font-mono text-slate-400">{n.time}</span>
                    </div>
                    <p className={`text-xs leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{n.message}</p>
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
      <TopUpRequestModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* CONNECT BANK MODAL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 border ${
            isDark ? 'bg-[#0D1424] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Connect Bank Account</h3>
              <button onClick={() => setIsConnectModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex space-x-2 bg-slate-950 p-1 rounded-xl border border-white/5 text-[10px] font-black uppercase">
              <button
                onClick={() => setModalTab('OPEN_BANKING')}
                className={`flex-1 py-2 rounded-lg transition-all ${modalTab === 'OPEN_BANKING' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                Open Banking
              </button>
              <button
                onClick={() => setModalTab('MANUAL')}
                className={`flex-1 py-2 rounded-lg transition-all ${modalTab === 'MANUAL' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              >
                Manual Entry
              </button>
            </div>

            {modalTab === 'OPEN_BANKING' ? (
              <div className="space-y-3">
                <input
                  placeholder="Search bank name (e.g. Zenith, GTB, UBA)..."
                  value={bankSearch}
                  onChange={e => { setBankSearch(e.target.value); setSelectedBank(''); }}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                {bankSearch && filteredBanks.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                    {filteredBanks.map(b => (
                      <button
                        key={b}
                        onClick={() => { setSelectedBank(b); setBankSearch(b); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedBank === b ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  placeholder="Account Holder Full Name"
                  value={accountNameInput}
                  onChange={e => setAccountNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  placeholder="10-digit Account Number"
                  maxLength={10}
                  value={accountNumberInput}
                  onChange={e => setAccountNumberInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  disabled={!selectedBank || !accountNameInput || accountNumberInput.length < 10}
                  onClick={() => handleConnectBank(selectedBank)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-all cursor-pointer"
                >
                  Link Open Banking Account
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleConnectBank(manualForm.name, true); }} className="space-y-3">
                <input
                  placeholder="Bank Name (e.g. Access Bank)"
                  required
                  value={manualForm.name}
                  onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  placeholder="Account Holder Full Name"
                  required
                  value={manualForm.accountName}
                  onChange={e => setManualForm({ ...manualForm, accountName: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  placeholder="Account Number"
                  required
                  value={manualForm.number}
                  onChange={e => setManualForm({ ...manualForm, number: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  placeholder="Initial Balance (₦ NGN)"
                  required
                  type="number"
                  value={manualForm.balance}
                  onChange={e => setManualForm({ ...manualForm, balance: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Save Manual Account
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentMobileFirstDashboard;
