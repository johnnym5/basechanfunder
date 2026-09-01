import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
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
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Globe,
  Lock,
  Zap
} from 'lucide-react';

import { TopUpRequestModal } from './TopUpRequestModal';

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

const LIVE_FX_RATE = 1945.50;

const NIGERIAN_BANKS = [
  // Commercial Banks
  "Access Bank", "Zenith Bank", "Guaranty Trust Bank (GTB)", "United Bank for Africa (UBA)",
  "First Bank of Nigeria", "Fidelity Bank", "First City Monument Bank (FCMB)", "Stanbic IBTC Bank",
  "Sterling Bank", "Wema Bank", "Union Bank", "Polaris Bank", "Keystone Bank", "Ecobank Nigeria",
  "Standard Chartered Bank", "Providus Bank", "Premium Trust Bank", "Signature Bank", "SunTrust Bank",
  "Titan Trust Bank", "Optimus Bank", "Parallex Bank", "Citibank Nigeria", "Globus Bank",

  // Non-Interest & Merchant Banks
  "Jaiz Bank", "TAJBank", "Lotus Bank", "The Alternative Bank", "Summit Bank", "FSDH Merchant Bank",
  "Rand Merchant Bank", "Nova Merchant Bank", "Coronation Merchant Bank", "FBNQuest Merchant Bank",

  // Top Digital & Microfinance Banks (MFB)
  "Moniepoint MFB", "Kuda MFB", "Opay (Blue Ridge MFB)", "PalmPay", "LAPO MFB", "FairMoney MFB",
  "Renmoney MFB", "Accion MFB", "VFD MFB", "Sparkle MFB", "AB MFB", "Baobab MFB", "NIRSAL MFB",
  "Grooming Centre MFB", "FINA Trust MFB", "Assets MFB", "Source MFB", "Covenant MFB", "Solid Allianze MFB",
  "Advans La Fayette MFB", "Mainstreet MFB", "Pecan Trust MFB", "Eso-E MFB", "Bosak MFB", "Ibile MFB",
  "Peace MFB", "Excellent MFB", "Royal Exchange MFB", "Mutual Trust MFB", "Carbon MFB", "Branch MFB",
  "Mint MFB", "Rex MFB", "Hasal MFB", "NPF MFB", "Infinity MFB", "Safetrust Mortgage Bank",
  "Abbey Mortgage Bank", "Platinum Mortgage Bank", "Aso Savings & Loans", "FHA Homes",
  "Coop Savings & Loans", "Ekondo MFB", "Gofirst MFB", "Lovonus MFB", "Mkobo MFB", "Penny MFB",
  "Personal Trust MFB", "Rahama MFB", "Rephidim MFB", "Richway MFB", "Sagamu MFB", "Seedvest MFB",
  "Standard MFB", "Stanford MFB", "Susu MFB", "Unilag MFB", "Umuchinemere MFB", "Addosser MFB",
  "Baines Credit MFB", "Balogun Fulani MFB", "Bank of Industry", "Development Bank of Nigeria",
  "Federal Mortgage Bank of Nigeria", "Reliance MFB", "Navy MFB"
];

export const StudentLightDashboard: React.FC<{
  name: string;
  isStaff?: boolean;
  onStaffAction?: () => void;
}> = ({ name, isStaff, onStaffAction }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();

  // State
  const [accounts, setAccounts] = useState<LinkedBankAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Modal State
  const [modalTab, setModalTab] = useState<'OPEN_BANKING' | 'MANUAL'>('OPEN_BANKING');
  const [bankSearch, setBankSearch] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('SAVINGS');
  const [realAmountInput, setRealAmountInput] = useState('');
  const [manualForm, setManualForm] = useState({ name: '', accountName: '', number: '', balance: '' });

  const isDark = theme === 'dark';

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return [];
    return NIGERIAN_BANKS.filter(b => b.toLowerCase().includes(bankSearch.toLowerCase()));
  }, [bankSearch]);

  // 1. Fetch Real Data
  useEffect(() => {
    if (!currentUser?.uid) return;

    const accQ = query(collection(db, 'financial_accounts'), where('userId', '==', currentUser.uid));
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
          connectionMethod: data.connectionMethod || data.provider || 'MANUAL_DEPOSIT',
          lastSyncedAt: data.lastSyncedAt?.seconds
            ? new Date(data.lastSyncedAt.seconds * 1000).toLocaleString()
            : (data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toLocaleString() : 'Never'),
          status: data.status || 'VERIFIED'
        } as LinkedBankAccount;
      });
      setAccounts(data);
      // Auto-select all accounts on first load if none selected
      setSelectedAccountIds(prev => prev.length === 0 ? data.map(a => a.id) : prev);
    });

    const evalQ = query(collection(db, 'pof_evaluations'), where('userId', '==', currentUser.uid));
    const unsubEval = onSnapshot(evalQ, (snap) => {
      if (!snap.empty) setEvaluation(snap.docs[0].data());
      setLoading(false);
    });

    return () => { unsubAcc(); unsubEval(); };
  }, [currentUser?.uid]);

  // 2. Calculations
  const totals = useMemo(() => {
    const selectedAccounts = accounts.filter(a => selectedAccountIds.includes(a.id));
    const ngn = selectedAccounts.reduce((sum, acc) => sum + acc.balanceNgn, 0);
    const gbp = ngn / LIVE_FX_RATE;
    return { ngn, gbp };
  }, [accounts, selectedAccountIds]);

  const daysElapsed = useMemo(() => {
    // Stricter checking for placeholders and empty states
    if (!evaluation?.startDate) return null;
    const sDate = String(evaluation.startDate).trim().toLowerCase();
    if (sDate === "" || sDate === "null" || sDate === "undefined" || sDate === "false") return null;

    const start = new Date(evaluation.startDate).getTime();
    if (isNaN(start)) return null;

    const now = Date.now();
    // Only show if the start date is actually in the past (tracking has commenced)
    if (start > now) return null;

    return Math.min(Math.max(Math.floor((now - start) / 86400000) + 1, 1), 28);
  }, [evaluation]);

  // Expiration Logic
  const expiryInfo = useMemo(() => {
    if (!evaluation?.isTimerActive || !evaluation?.expirationDate) return { isExpired: false, isNearExpiry: false, daysLeft: null };

    const now = new Date();
    const expiry = new Date(evaluation.expirationDate);
    // Set expiry to end of the day
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
    if (expiryInfo.isExpired) {
      setIsExpiredModalOpen(true);
    }
  }, [expiryInfo.isExpired]);

  // 3. Handlers
  const handleSyncAccount = async (id: string) => {
    setSyncingId(id);
    // Simulate API delay
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
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
    if (window.confirm('Are you sure you want to unlink this account?')) {
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
              <h4 className={`text-sm font-black uppercase tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                Your POF is expiring this week!
              </h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Evaluation period ends in <span className="text-amber-500">{expiryInfo.daysLeft} days</span>
              </p>
            </div>
          </div>
          <button className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-amber-500/10 active:scale-95">
            Add More Time / Request Extension
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

        <button
          onClick={() => isStaff && onStaffAction ? onStaffAction() : setIsTopUpModalOpen(true)}
          className="flex items-center space-x-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{isStaff ? 'New Top-Up Update' : 'New Top-Up Request'}</span>
        </button>
      </header>

      {/* Hero Metric Card */}
      <section className="mb-12">
        <div className={`rounded-[28px] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl transition-colors duration-500 bg-[#0B172A] border border-white/5`}>
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.25em] mb-3 opacity-80">{name}</p>
                <h2 className="text-6xl md:text-7xl font-black tracking-tighter">
                  £{totals.gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <div className="mt-4 flex items-center gap-3">
                   <p className="text-slate-400 text-xl font-bold uppercase tracking-tight">₦{totals.ngn.toLocaleString()}</p>
                   <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white/5">Local Currency</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5">
              <div className="flex items-center space-x-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <span>Sources Linked: <span className="text-white ml-1">{selectedAccountIds.length} / {accounts.length} Selected</span></span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center space-x-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <Building2 className="w-4 h-4 text-emerald-500/60" />
                <span>Bank: <span className="text-emerald-400 ml-1">
                  {selectedAccountIds.length === 0
                    ? 'No Sources Selected'
                    : selectedAccountIds.length === 1
                      ? accounts.find(a => a.id === selectedAccountIds[0])?.bankName
                      : `${accounts.find(a => a.id === selectedAccountIds[0])?.bankName} and ${selectedAccountIds.length - 1} others`}
                </span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Bank Accounts Ledger */}
        <section className="space-y-8">
          <div className="flex justify-between items-end px-2">
            <div>
              <h3 className={`text-xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-950'}`}>Bank Accounts Ledger</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Open Banking & Manual Source Refreshes</p>
            </div>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-xl ${
                isDark ? 'bg-white/5 text-amber-500 hover:bg-white/10' : 'bg-slate-200 text-blue-600 hover:bg-slate-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect New Bank Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((acc) => {
              const bankName = acc.bankName.toLowerCase();
              const isSelected = selectedAccountIds.includes(acc.id);

              let colorClasses = isDark ? 'bg-slate-900/40 border-white/5 hover:border-amber-500/40' : 'bg-white border-slate-200/80 hover:border-blue-500/40';
              if (isSelected) {
                colorClasses = isDark ? 'bg-amber-500/5 border-amber-500/50 shadow-lg shadow-amber-500/5' : 'bg-blue-50/50 border-blue-500/50 shadow-lg shadow-blue-500/5';
              }

              let iconClasses = isDark ? 'bg-slate-800 border-white/5 text-slate-500 group-hover:text-amber-500 group-hover:bg-amber-500/10' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50';

              if (bankName.includes('uba') || bankName.includes('united bank')) {
                colorClasses = isSelected
                  ? (isDark ? 'bg-rose-500/10 border-rose-500/60 shadow-lg shadow-rose-500/5' : 'bg-rose-50 border-rose-500/60 shadow-lg shadow-rose-500/5')
                  : (isDark ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60' : 'bg-rose-50 border-rose-200 hover:border-rose-300');
                iconClasses = isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-rose-100 border-rose-200 text-rose-600';
              } else if (bankName.includes('opay')) {
                colorClasses = isSelected
                  ? (isDark ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/5' : 'bg-emerald-50 border-emerald-500/60 shadow-lg shadow-emerald-500/5')
                  : (isDark ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60' : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300');
                iconClasses = isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-100 border-emerald-200 text-emerald-600';
              } else if (bankName.includes('gtb') || bankName.includes('guaranty trust')) {
                colorClasses = isSelected
                  ? (isDark ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5' : 'bg-amber-50 border-amber-200 shadow-lg shadow-amber-500/5')
                  : (isDark ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60' : 'bg-amber-50 border-amber-200 hover:border-amber-300');
                iconClasses = isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-100 border-amber-200 text-amber-600';
              }

              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountIds(prev =>
                      prev.includes(acc.id) ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                    );
                  }}
                  className={`border p-8 rounded-[2rem] flex flex-col transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer relative ${colorClasses}`}
                >
                  {/* Selection Indicator */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 scale-110 shadow-lg shadow-blue-500/20'
                      : 'border-slate-300 group-hover:border-blue-400'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>

                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center space-x-5">
                      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${iconClasses}`}>
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className={`text-base font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{acc.bankName}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{acc.accountNumberMasked} • {acc.accountType}</p>
                      </div>
                    </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                      acc.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {acc.status}
                    </span>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1.5 whitespace-nowrap">Sync: {acc.lastSyncedAt}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-8 border-b transition-colors border-white/5">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Local Balance</p>
                    <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>₦{acc.balanceNgn.toLocaleString()}</p>
                  </div>
                  <div className="border-l border-white/5 pl-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">GBP Value</p>
                    <p className="text-xl font-black text-blue-600">£{acc.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                  <div className="flex items-center justify-between pt-6" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleSyncAccount(acc.id)}
                    disabled={syncingId === acc.id}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      isDark ? 'text-slate-500 hover:text-amber-500' : 'text-slate-500 hover:text-blue-600'
                    } disabled:opacity-50`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                    {syncingId === acc.id ? 'Syncing...' : 'Sync Balance'}
                  </button>
                  <button
                    onClick={() => handleUnlinkAccount(acc.id)}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-rose-500 uppercase tracking-widest transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Unlink
                  </button>
                </div>
              </div>
            );
          })}

          {accounts.length === 0 && (
            <div className={`border-2 border-dashed p-12 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 opacity-50 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
               <Building2 className="w-12 h-12 text-slate-600" />
               <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">No bank accounts linked to your profile</p>
            </div>
          )}
        </div>
      </section>

      {/* Connect Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${isDark ? 'bg-[#0D111A]' : 'bg-white'}`}>

            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Connect Account</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Authorize access to your daily ledger</p>
              </div>
              <button onClick={() => setIsConnectModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="px-8 pt-6">
              <div className="flex items-center space-x-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
                <button
                  onClick={() => setModalTab('OPEN_BANKING')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'OPEN_BANKING' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Open Banking
                </button>
                <button
                  onClick={() => setModalTab('MANUAL')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'MANUAL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Manual Entry
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {modalTab === 'OPEN_BANKING' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">What bank do you use?</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        placeholder="Start typing your bank name..."
                        value={bankSearch}
                        onChange={(e) => {
                          setBankSearch(e.target.value);
                          setSelectedBank('');
                        }}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {bankSearch && (
                    <div className="space-y-4">
                      {filteredBanks.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto no-scrollbar py-2">
                          {filteredBanks.map(bank => (
                            <button
                              key={bank}
                              onClick={() => {
                                setSelectedBank(bank);
                                setBankSearch(bank);
                              }}
                              className={`w-full text-left p-4 rounded-2xl bg-slate-950 border transition-all group ${selectedBank === bank ? 'border-blue-600 bg-blue-600/10 text-blue-400' : 'border-white/5 text-slate-400 hover:bg-white/5'}`}
                            >
                               <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mb-3 border border-white/5 transition-all ${selectedBank === bank ? 'bg-blue-600' : 'group-hover:bg-blue-600'}`}>
                                  <Building2 className={`w-5 h-5 ${selectedBank === bank ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                               </div>
                               <p className="text-[10px] font-black uppercase leading-tight">{bank}</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center space-y-4">
                          <p className="text-xs font-bold text-amber-500/80">Seems we don't have your bank name on our Open Banking list.</p>
                          <button
                            onClick={() => {
                              setModalTab('MANUAL');
                              setManualForm(prev => ({ ...prev, name: bankSearch }));
                            }}
                            className="px-6 py-2 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                          >
                            Add Manually Instead
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Holder Name</label>
                       <input
                         placeholder="Full name on account..."
                         value={accountNameInput}
                         onChange={e => setAccountNameInput(e.target.value)}
                         className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                          <input
                            placeholder="10 Digits"
                            maxLength={10}
                            value={accountNumberInput}
                            onChange={e => setAccountNumberInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Type</label>
                          <select
                            value={selectedAccountType}
                            onChange={e => setSelectedAccountType(e.target.value as AccountType)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                          >
                             <option value="SAVINGS">SAVINGS</option>
                             <option value="CURRENT">CURRENT</option>
                             <option value="DOMICILIARY">DOMICILIARY</option>
                          </select>
                       </div>
                    </div>
                    {isStaff && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Balance in Account (₦)</label>
                         <input
                           type="number"
                           placeholder="Enter real amount for sync..."
                           value={realAmountInput}
                           onChange={e => setRealAmountInput(e.target.value)}
                           className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                         />
                      </div>
                    )}
                    <button
                      disabled={!selectedBank || !accountNameInput || accountNumberInput.length < 10 || (isStaff && !realAmountInput)}
                      onClick={() => handleConnectBank(selectedBank)}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Launch Open Banking Authenticator</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                     <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-medium text-blue-400/80 leading-relaxed italic">
                       Encryption protocol active. Your bank credentials are never stored. Access is read-only.
                     </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleConnectBank(manualForm.name, true); }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank Name</label>
                    <input
                      placeholder="e.g. Zenith Bank"
                      required
                      value={manualForm.name}
                      onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Name</label>
                    <input
                      placeholder="Enter Full Name"
                      required
                      value={manualForm.accountName}
                      onChange={(e) => setManualForm({...manualForm, accountName: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                      <input
                        placeholder="10 Digits"
                        required
                        value={manualForm.number} maxLength={10}
                        onChange={(e) => setManualForm({...manualForm, number: e.target.value.replace(/\D/g, '')})}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Type</label>
                       <select
                         value={selectedAccountType}
                         onChange={e => setSelectedAccountType(e.target.value as AccountType)}
                         className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                       >
                          <option value="SAVINGS">SAVINGS</option>
                          <option value="CURRENT">CURRENT</option>
                          <option value="DOMICILIARY">DOMICILIARY</option>
                       </select>
                    </div>
                    {isStaff && (
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Balance (₦)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          required
                          value={manualForm.balance}
                          onChange={(e) => setManualForm({...manualForm, balance: e.target.value})}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    Link Manual Source
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      <TopUpRequestModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        onSuccess={() => {}}
      />

    </div>
  );
};

export { StudentMobileFirstDashboard } from './StudentMobileFirstDashboard';
export default StudentMobileFirstDashboard;
