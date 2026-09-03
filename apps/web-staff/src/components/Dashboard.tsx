import React, { useState, useMemo, useEffect } from 'react';
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Zap,
  Search,
  SearchX,
  RefreshCw,
  UserPlus,
  ChevronRight,
  Activity,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Settings2,
  Trash2,
  Save,
  Sparkles,
  MoreVertical,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { ProfessionalSpinner } from './ui/LoadingStates';
import { ManualOverrideModal } from './ManualOverrideModal';
import { AdminTimerModal } from './AdminTimerModal';
import { AddStudentModal } from './AddStudentModal';
import { AdminStudentProfileDrawer } from './AdminStudentProfileDrawer';
import { useTheme } from '../context/ThemeContext';
import { useNotificationModal } from '../context/NotificationContext';
import { StudentTableFilters, FilterCriteria } from './StudentTableFilters';
import { toast } from 'sonner';

// --- Types ---

type ComplianceStatus = 'CLEARED' | 'NEEDS_TOPUP' | 'NEAR_MATURITY' | 'AT_RISK' | 'PENDING' | 'NEW' | 'WAITING_APPROVAL' | 'UNAUTHENTICATED' | 'AT_RISK_CAPITAL_BREACH' | 'ARCHIVED';

interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  accountNumbers: string[];
  parallexAccountNumbers: string[];
  status: ComplianceStatus;
  isApproved: boolean;
  consecutiveDays: number;
  balanceGbp: number;
  targetGbp: number;
  anomalyRatio: number;
  lastUpdate: string;
  createdAt: string; // ISO string
  isNew: boolean;
  expirationDate: string | null;
  timerCustomMessage: string | null;
  isTimerActive: boolean;
  assignedCounselorId?: string;
  counselorName?: string;
  destinationCountry?: string;
  ingestionChannels: string[];
  pendingRequest?: {
    id: string;
    type: 'TOP_UP' | 'EXTENSION';
    amountGBP?: number;
    daysRequested?: number;
    reason?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: any;
  };
}

// --- Sub-Components ---

const StatCard: React.FC<{ label: string; value: number | string; icon: any; color: string; onClick?: () => void; isActive?: boolean }> = ({
  label, value, icon: Icon, color, onClick, isActive
}) => {
  const { theme } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border p-3.5 md:p-5 rounded-2xl md:rounded-3xl backdrop-blur-md relative overflow-hidden group transition-all ${
        theme === 'dark'
          ? `bg-slate-900/40 border-white/5 ${isActive ? 'border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/5' : 'hover:border-white/10'}`
          : `bg-white border-slate-200 shadow-sm ${isActive ? 'border-amber-500 ring-2 ring-amber-500/10' : 'hover:border-slate-300'}`
      }`}
    >
      <div className={`absolute top-0 right-0 p-3 md:p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
        <Icon className="w-12 h-12 md:w-16 md:h-16" />
      </div>
      <div className={`p-1.5 md:p-2 rounded-lg border w-fit mb-2 md:mb-3 ${color} ${
        theme === 'dark' ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200'
      }`}>
        <Icon className="w-4 h-4 md:w-5 h-5" />
      </div>
      <p className={`text-xl md:text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{value}</p>
      <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-0.5 md:mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>{label}</p>
    </button>
  );
};

const StatusBadge: React.FC<{ status: ComplianceStatus; isNew?: boolean }> = ({ status, isNew }) => {
  const { theme } = useTheme();
  const styles: Record<string, string> = {
    CLEARED: theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
    NEEDS_TOPUP: theme === 'dark' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200',
    NEAR_MATURITY: theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200',
    AT_RISK: theme === 'dark' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200',
    PENDING: theme === 'dark' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-50 text-slate-500 border-slate-200',
    NEW: theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tighter whitespace-nowrap shadow-sm ${styles[status] || styles.PENDING}`}>
        {status.replace('_', ' ')}
      </span>
      {isNew && (
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 uppercase tracking-widest animate-pulse">
          New
        </span>
      )}
    </div>
  );
};

interface StaffDashboardProps {
  onInspect?: (id: string) => void;
  onMessageStudent?: (id: string) => void;
}

const HistoryLogModal: React.FC<{ isOpen: boolean; onClose: () => void; student: Student | null }> = ({ isOpen, onClose, student }) => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !student) return;
    setLoading(true);
    // Fetch logs for this student (either by evaluation ID or userId)
    const q = query(
      collection(db, 'audit_logs'),
      where('studentId', 'in', [student.id, student.userId]),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Audit log error:", err);
      setLoading(false);
    });

    return unsub;
  }, [isOpen, student]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] border flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${
        theme === 'dark' ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-500" />
            <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Audit Trail: {student?.name}</h3>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <Activity className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs font-black uppercase tracking-widest">No history recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className={`p-4 rounded-2xl border transition-all ${
                  theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      log.action?.includes('APPROV') ? 'text-emerald-500' :
                      log.action?.includes('FLAG') || log.action?.includes('REJECT') ? 'text-rose-500' : 'text-blue-500'
                    }`}>
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{log.detail}</p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mt-2">Actor: {log.actor || 'System'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onInspect, onMessageStudent }) => {
  const { appUser, role } = useAuth();
  const { theme } = useTheme();
  const { showNotification } = useNotificationModal();
  const [students, setStudents] = useState<Student[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Filter State
  const INITIAL_FILTERS: FilterCriteria = {
    searchTerm: '',
    statuses: [],
    assignedCounselorId: 'ALL',
    financialState: 'ALL',
    timerStatus: 'ALL',
    destinationCountry: 'ALL',
    ingestionChannel: 'ALL'
  };
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>(INITIAL_FILTERS);

  // Keep legacy filter for backward compatibility if needed, but we'll prioritize advancedFilters
  const [filter, setFilter] = useState<ComplianceStatus | 'ALL' | 'REQUESTS' | 'UNAPPROVED'>('ALL');
  const [requestTypeFilter, setRequestTypeFilter] = useState<'ALL' | 'FINANCE' | 'DAYS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Modal & Drawer State
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Request Handling State
  const [modifyingRequest, setModifyingRequest] = useState<boolean>(false);
  const [modValue, setModValue] = useState<string>('');

  // Form State for Editing
  const [editFormData, setEditFormData] = useState({
    name: '',
    balanceGbp: 0,
    targetGbp: 0,
    consecutiveDays: 0,
    totalTargetDays: 28,
    visaRoute: '',
    counselor: 'Unassigned'
  });

  const isAdmin = role === 'ADMIN_GOVERNANCE';

  // 1. Subscribe to all evaluations
  useEffect(() => {
    const q = query(collection(db, 'pof_evaluations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const currentTime = Date.now();
      const data = snap.docs.map(docSnap => {
        const d = docSnap.data();

        // 24-hour expiration logic
        const createdMillis = d.createdAt?.seconds ? d.createdAt.seconds * 1000 : currentTime;
        const elapsedHours = (currentTime - createdMillis) / (1000 * 60 * 60);
        const isNew = elapsedHours <= 24;

        // Compute consecutive days from start date
        const start = d.startDate ? new Date(d.startDate).getTime() : null;
        const days = start ? Math.min(Math.max(Math.floor((Date.now() - start) / (86400000)) + 1, 1), 28) : 0;

        // Determine status if not explicitly set
        let status = (d.status || 'PENDING') as any;
        if (status === 'VALIDATED') status = 'CLEARED';

        // "Almost Done" logic: users with less than 7 days left to reach 28
        if (days >= 22 && days < 28 && status !== 'CLEARED') status = 'NEAR_MATURITY';

        if (d.anomalyRatio > 2.5) status = 'AT_RISK';

        return {
          id: docSnap.id,
          userId: d.userId, // Storing the actual user UID
          name: d.userName || 'Unknown Student',
          email: d.userEmail || '',
          status,
          isApproved: d.isApproved !== undefined ? d.isApproved : false,
          consecutiveDays: days,
          balanceGbp: 0,
          currentBalanceNgn: d.currentBalanceNgn || 0,
          targetGbp: d.targetGBP || 0,
          anomalyRatio: d.anomalyRatio || 0,
          lastUpdate: d.updatedAt?.seconds ? new Date(d.updatedAt.seconds * 1000).toLocaleTimeString() : 'Just now',
          createdAt: new Date(createdMillis).toISOString(),
          isNew,
          expirationDate: d.expirationDate || null,
          timerCustomMessage: d.timerCustomMessage || null,
          isTimerActive: d.isTimerActive || false
        } as any;
      });
      setStudents(data);
    });
    return unsub;
  }, []);

  // 1b. Subscribe to all users to find unauthenticated ones
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // 2. Subscribe to liquidity requests
  useEffect(() => {
    const q = query(collection(db, 'liquidity_requests'), where('status', '==', 'PENDING'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // 3. Subscribe to all financial accounts
  useEffect(() => {
    const q = query(collection(db, 'financial_accounts'));
    const unsub = onSnapshot(q, (snap) => {
      const accs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAccounts(accs);
    });
    return unsub;
  }, []);

  // 4. Merge data
  const liveStudents = useMemo(() => {
    const LIVE_FX = 1945.50;

    // Start with existing student evaluations
    const merged: Student[] = students.map(s => {
      const studentAccs = accounts.filter(a => a.userId === s.userId || a.userEmail === s.email);

      // Sum all bank accounts (handle both balanceGbp and balanceGBP casing)
      const accountsTotalGbp = studentAccs.reduce((sum, curr) =>
        sum + (Number(curr.balanceGbp) || Number(curr.balanceGBP) || 0), 0
      );

      // Add manual balance override from evaluation doc
      const manualTotalGbp = ((s as any).currentBalanceNgn || 0) / LIVE_FX;

      const totalGbp = accountsTotalGbp + manualTotalGbp;

      const studentRequest = requests.find(r => r.userId === s.userId || r.userEmail === s.email);

      // Sync details from users collection if available
      const userProfile = allUsers.find(u => u.uid === s.userId || u.email === s.email);
      const isApproved = userProfile ? (userProfile.isApproved ?? false) : s.isApproved;
      const name = s.name === 'Unknown Student' && userProfile ? (userProfile.displayName || userProfile.username || s.name) : s.name;

      // New data fields for filtering
      const phoneNumber = userProfile?.phoneNumber || '';
      const accountNumbers = studentAccs.map(a => a.accountNumberMasked || '').filter(Boolean);
      const onboarding = userProfile?.onboardingProfile;
      const parallexAccountNumbers = [onboarding?.parallexAccountNumber].filter(Boolean);
      const destinationCountry = onboarding?.destinationCountry || '';

      const ingestionChannels: string[] = [];
      if (studentAccs.some(a => a.connectionMethod !== 'MANUAL_DEPOSIT')) ingestionChannels.push('AUTOMATED');
      if (manualTotalGbp > 0 || studentAccs.some(a => a.connectionMethod === 'MANUAL_DEPOSIT')) ingestionChannels.push('MANUAL');
      if (studentAccs.length === 0 && manualTotalGbp === 0) ingestionChannels.push('UNVERIFIED');

      // Adjust status based on approval
      let finalStatus = s.status;
      if (!isApproved) finalStatus = 'WAITING_APPROVAL';

      return {
        ...s,
        name,
        isApproved,
        status: finalStatus,
        balanceGbp: totalGbp,
        pendingRequest: studentRequest,
        phoneNumber,
        accountNumbers,
        parallexAccountNumbers,
        destinationCountry,
        ingestionChannels,
        counselorName: s.counselor || 'Unassigned'
      };
    });

    // Add users who are NOT in pof_evaluations yet but are unapproved
    allUsers.forEach(u => {
      const isAlreadyIn = merged.some(s => s.userId === u.uid || s.email === u.email);
      const isStudentRole = u.role === 'STUDENT' || (!u.email?.endsWith('@basechaninternational.com') && !u.email?.endsWith('.basechaninternational@gmail.com'));

      if (!isAlreadyIn && isStudentRole) {
        merged.push({
          id: u.uid, // Temporary ID as they don't have an eval yet
          userId: u.uid,
          name: u.displayName || u.username || 'New User',
          email: u.email || '',
          phoneNumber: u.phoneNumber || '',
          accountNumbers: [],
          parallexAccountNumbers: [u.onboardingProfile?.parallexAccountNumber].filter(Boolean),
          status: u.isApproved ? 'PENDING' : 'UNAUTHENTICATED',
          isApproved: u.isApproved ?? false,
          consecutiveDays: 0,
          balanceGbp: 0,
          targetGbp: 0,
          anomalyRatio: 0,
          lastUpdate: 'Awaiting Setup',
          createdAt: u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
          isNew: true,
          expirationDate: null,
          timerCustomMessage: null,
          isTimerActive: false,
          ingestionChannels: ['UNVERIFIED'],
          destinationCountry: u.onboardingProfile?.destinationCountry || ''
        });
      }
    });

    return merged;
  }, [students, accounts, requests, allUsers]);

  const stats = useMemo(() => ({
    total: liveStudents.length,
    cleared: liveStudents.filter(s => s.status === 'CLEARED').length,
    topUpRequired: liveStudents.filter(s => !!s.pendingRequest || s.status === 'NEEDS_TOPUP').length,
    nearMaturity: liveStudents.filter(s => s.status === 'NEAR_MATURITY').length,
    atRisk: liveStudents.filter(s => s.status === 'AT_RISK').length,
    unapproved: liveStudents.filter(s => !s.isApproved).length,
    newUsers: liveStudents.filter(s => s.isNew).length
  }), [liveStudents]);

  const filteredStudents = useMemo(() => {
    const normalize = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const query = normalize(advancedFilters.searchTerm);

    return liveStudents.filter(s => {
      // 1. Text Search Matching (Multi-field)
      if (query) {
        const fieldsToMatch = [
          s.name,
          s.email,
          s.userId,
          s.phoneNumber || '',
          ...(s.accountNumbers || []),
          ...(s.parallexAccountNumbers || [])
        ];
        const isMatch = fieldsToMatch.some(f => normalize(f).includes(query));
        if (!isMatch) return false;
      }

      // 2. Status Filter (Multi-select)
      if (advancedFilters.statuses.length > 0) {
        if (!advancedFilters.statuses.includes(s.status)) return false;
      }

      // 3. Counselor Assignment
      if (advancedFilters.assignedCounselorId !== 'ALL') {
        if (advancedFilters.assignedCounselorId === 'UNASSIGNED') {
          if (s.counselorName !== 'Unassigned') return false;
        } else {
          // Assuming we match by name or UID if available
          if (s.assignedCounselorId !== advancedFilters.assignedCounselorId && s.counselorName !== advancedFilters.assignedCounselorId) {
             // Try dynamic lookup
             const counselor = allUsers.find(u => u.uid === advancedFilters.assignedCounselorId);
             if (!counselor || s.counselorName !== counselor.displayName) return false;
          }
        }
      }

      // 4. Financial State
      if (advancedFilters.financialState !== 'ALL') {
        const isDeficit = s.balanceGbp < s.targetGbp;
        const isBreached = (s as any).isCapitalBreached || s.status === 'AT_RISK_CAPITAL_BREACH' || s.status === 'AT_RISK';
        const hasPendingFee = !!s.pendingRequest; // Assuming requests represent top-ups needing verification

        if (advancedFilters.financialState === 'DEFICIT' && !isDeficit) return false;
        if (advancedFilters.financialState === 'FULLY_CLEARED' && isDeficit) return false;
        if (advancedFilters.financialState === 'CAPITAL_BREACHED' && !isBreached) return false;
        if (advancedFilters.financialState === 'PENDING_TOPUP_FEE' && !hasPendingFee) return false;
      }

      // 5. Timer Status
      if (advancedFilters.timerStatus !== 'ALL') {
        const remaining = s.expirationDate ? Math.ceil((new Date(s.expirationDate).getTime() - Date.now()) / 86400000) : null;
        const isActive = s.isTimerActive && s.consecutiveDays > 0;

        if (advancedFilters.timerStatus === 'ACTIVE_COUNTDOWN' && !isActive) return false;
        if (advancedFilters.timerStatus === 'NEAR_EXPIRATION' && (remaining === null || remaining > 7 || remaining < 0)) return false;
        if (advancedFilters.timerStatus === 'EXPIRED' && (remaining !== null && remaining >= 0)) return false;
        if (advancedFilters.timerStatus === 'PAUSED' && s.isTimerActive) return false;
      }

      // 6. Destination
      if (advancedFilters.destinationCountry !== 'ALL') {
        if (s.destinationCountry !== advancedFilters.destinationCountry) return false;
      }

      // 7. Ingestion Channel
      if (advancedFilters.ingestionChannel !== 'ALL') {
        if (!s.ingestionChannels.includes(advancedFilters.ingestionChannel)) return false;
      }

      return true;
    });
  }, [liveStudents, advancedFilters, allUsers]);

  const handleApprove = async (student: Student) => {
    // ... logic ...
  };

  const handleProcessRequest = async (student: Student, action: 'APPROVE' | 'REJECT', valOverride?: number) => {
    if (!student.pendingRequest) return;
    setIsSubmitting(true);
    try {
      const reqId = student.pendingRequest.id;
      const type = student.pendingRequest.type;
      const finalVal = valOverride !== undefined ? valOverride : (type === 'TOP_UP' ? student.pendingRequest.amountGBP : student.pendingRequest.daysRequested) || 0;

      if (action === 'APPROVE') {
        if (type === 'TOP_UP') {
          // Add a "System Top-Up" account to credit the student
          await addDoc(collection(db, 'financial_accounts'), {
            userId: student.userId,
            userEmail: student.email,
            bankName: 'System Liquidity Top-Up',
            accountName: student.name,
            accountNumberMasked: '•••• SYST',
            accountType: 'SAVINGS',
            balanceNgn: Math.round(finalVal * 1945.50), // Convert GBP to NGN for storage
            balanceGBP: finalVal,
            connectionMethod: 'MANUAL_DEPOSIT',
            status: 'VERIFIED',
            lastSyncedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        } else {
          // Days extension: Push start date back to credit days
          const pofRef = doc(db, 'pof_evaluations', student.id);
          const pofSnap = await getDocs(query(collection(db, 'pof_evaluations'), where('userId', '==', student.userId)));
          if (!pofSnap.empty) {
            const d = pofSnap.docs[0].data();
            const currentStart = d.startDate ? new Date(d.startDate) : new Date();
            currentStart.setDate(currentStart.getDate() - finalVal);
            await updateDoc(doc(db, 'pof_evaluations', pofSnap.docs[0].id), {
              startDate: currentStart.toISOString().split('T')[0],
              updatedAt: serverTimestamp()
            });
          }
        }

        await updateDoc(doc(db, 'liquidity_requests', reqId), {
          status: 'APPROVED',
          processedAmount: type === 'TOP_UP' ? finalVal : 0,
          processedDays: type === 'EXTENSION' ? finalVal : 0,
          updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, 'audit_logs'), {
          actor: appUser?.displayName || 'Admin',
          action: `REQUEST_${type}_APPROVED`,
          detail: `Approved ${type} request for ${student.name}. Value: ${finalVal}`,
          studentId: student.userId,
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'liquidity_requests', reqId), {
          status: 'REJECTED',
          updatedAt: serverTimestamp()
        });
      }

      setModifyingRequest(false);
      setSelectedStudent(null);
    } catch (e) {
      console.error('Process request error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const studentRef = doc(db, 'pof_evaluations', selectedStudent.id);

      // Calculate new start date if days changed
      const newStart = new Date();
      newStart.setDate(newStart.getDate() - editFormData.consecutiveDays + 1);

      await updateDoc(studentRef, {
        userName: editFormData.name,
        targetGBP: editFormData.targetGbp,
        currentBalanceGBP: editFormData.balanceGbp,
        startDate: newStart.toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      });

      setIsEditMode(false);
    } catch (e) {
      console.error('Update error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedStudent) return;

    showNotification({
      title: "Archive Student?",
      message: "This will move the student's account and all linked records to the Archive Vault for 7 days before permanent deletion. Access will be revoked immediately.",
      type: "CONFIRM",
      confirmText: "Archive & Disable",
      onConfirm: async () => {
        setIsSubmitting(true);
        const t = toast.loading(`Archiving ${selectedStudent.name}...`);
        try {
          const res = await fetch('/api/v1/admin/users/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: selectedStudent.userId,
              evaluationId: selectedStudent.id
            })
          });

          if (!res.ok) throw new Error("Server failed to archive user");

          // Audit Log
          await addDoc(collection(db, 'audit_logs'), {
            actor: appUser?.email || 'Admin',
            action: 'USER_ARCHIVED',
            detail: `Moved ${selectedStudent.name} to 7-day Archive Vault.`,
            studentId: selectedStudent.userId,
            createdAt: serverTimestamp()
          });

          toast.success('User moved to Archive Vault.', { id: t });
          setSelectedStudent(null);
        } catch (e: any) {
          console.error('Archive error:', e);
          toast.error(`Archival failed: ${e.message}`, { id: t });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const counselors = useMemo(() =>
    allUsers.filter(u => u.role === 'COUNSELOR').map(u => ({ uid: u.uid || u.id, displayName: u.displayName || u.username || 'Counselor' }))
  , [allUsers]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <ProfessionalSpinner message="Loading please wait..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans">

      {/* 1. Statistics (Clickable Filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Students"
          value={stats.total}
          icon={Users}
          color="text-slate-300"
          onClick={() => setFilter('ALL')}
          isActive={filter === 'ALL'}
        />
        <StatCard
          label="Cleared"
          value={stats.cleared}
          icon={CheckCircle2}
          color="text-emerald-400"
          onClick={() => setFilter('CLEARED')}
          isActive={filter === 'CLEARED'}
        />
        <StatCard
          label="Top Up Required"
          value={stats.topUpRequired}
          icon={Zap}
          color="text-amber-400"
          onClick={() => {
            setFilter('REQUESTS');
            setRequestTypeFilter('ALL');
          }}
          isActive={filter === 'REQUESTS'}
        />
        <StatCard
          label="Almost Done"
          value={stats.nearMaturity}
          icon={Clock}
          color="text-cyan-400"
          onClick={() => setFilter('NEAR_MATURITY')}
          isActive={filter === 'NEAR_MATURITY'}
        />
        <StatCard
          label="Unauthenticated"
          value={stats.unapproved}
          icon={ShieldAlert}
          color="text-rose-400"
          onClick={() => {
            setFilter('UNAPPROVED');
            setRequestTypeFilter('ALL');
          }}
          isActive={filter === 'UNAPPROVED'}
        />
      </div>

      {/* 2. List Header & Multi-Criteria Search Engine */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-end">
           <button
             onClick={() => setIsAddUserOpen(true)}
             className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
               theme === 'dark' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
             }`}
           >
             <UserPlus className="w-3.5 h-3.5" />
             <span>Add New Student</span>
           </button>
        </div>

        <StudentTableFilters
          filters={advancedFilters}
          onFilterChange={setAdvancedFilters}
          counselors={counselors}
          onReset={() => setAdvancedFilters(INITIAL_FILTERS)}
          isDark={theme === 'dark'}
        />

        {/* 3. Student Table */}
        <div className={`border rounded-2xl md:rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl transition-colors duration-500 ${
          theme === 'dark' ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-950/40 border border-white/5 flex items-center justify-center text-slate-500 shadow-2xl">
                  <SearchX className="w-12 h-12" />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                   <p className="text-sm font-black text-white uppercase tracking-tight">No match found</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                     No students match your current search or filter criteria. Try expanding your parameters or resetting the filters.
                   </p>
                </div>
                <button
                  onClick={() => setAdvancedFilters(INITIAL_FILTERS)}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-amber-500"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              </div>
            ) : (
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest border-b transition-colors ${
                    theme === 'dark' ? 'bg-slate-950/40 text-slate-500 border-white/5' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <th className="px-4 md:px-8 py-3 md:py-5">Student Name</th>
                    <th className="px-4 md:px-8 py-3 md:py-5">Status</th>
                    <th className="hidden sm:table-cell px-4 md:px-8 py-3 md:py-5">Request</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`transition-all group cursor-pointer ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 md:px-8 py-4 md:py-6">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center font-black text-[10px] md:text-xs transition-colors ${
                            theme === 'dark' ? 'bg-slate-800 border-white/10 text-amber-500' : 'bg-slate-100 border-slate-200 text-amber-600'
                          }`}>
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                               <p className={`text-xs md:text-sm font-bold leading-tight transition-colors truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{student.name}</p>
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (onInspect) onInspect(student.id);
                                 }}
                                 className="p-1 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
                                 title="View Full Dashboard"
                               >
                                 <ArrowUpRight className="w-3 h-3" />
                               </button>
                            </div>
                            {!student.isApproved && (
                               <span className="inline-block px-1.5 py-0.5 rounded bg-rose-500 text-white text-[7px] font-black uppercase tracking-tighter mt-1 animate-pulse">Waiting Approval</span>
                            )}
                            <p className="text-[8px] md:text-[10px] font-mono text-slate-500 mt-0.5 truncate max-w-[120px] md:max-w-[150px] uppercase">{student.email || student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-6">
                        <StatusBadge status={student.status} isNew={student.isNew} />
                      </td>
                      <td className="hidden sm:table-cell px-4 md:px-8 py-4 md:py-6">
                        <div className="space-y-1">
                          {student.pendingRequest ? (
                            <div className="flex items-center space-x-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                               <span className="text-[9px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                 {student.pendingRequest.type === 'TOP_UP' ? 'Finance Top Up' : 'Days Extension'}
                               </span>
                            </div>
                          ) : student.status === 'NEEDS_TOPUP' ? (
                            <div className="flex items-center space-x-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                               <span className="text-[9px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                 System Flag: Low Funds
                               </span>
                            </div>
                          ) : (
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">No Request</span>
                          )}
                          <p className={`text-[9px] md:text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                             £{student.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })} / £{student.targetGbp.toLocaleString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                          className={`p-1.5 md:p-2 rounded-lg md:rounded-xl border transition-all ${
                            theme === 'dark'
                              ? 'bg-slate-800 border-white/5 text-slate-400 hover:bg-amber-50'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-amber-500 hover:text-white'
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setSelectedStudent(null)}>
          <aside
            className={`fixed right-0 top-0 bottom-0 h-screen w-full max-w-[420px] backdrop-blur-2xl border-l rounded-l-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-500 ease-out transition-colors ${
              theme === 'dark' ? 'bg-slate-900/75 border-white/15 text-slate-100' : 'bg-white/80 border-slate-200 text-slate-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`sticky top-0 p-6 border-b backdrop-blur-xl z-20 flex justify-between items-center transition-colors ${
              theme === 'dark' ? 'bg-slate-950/20 border-white/5' : 'bg-white/40 border-slate-100'
            }`}>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Student Info</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Reviewing Compliance Profile</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className={`p-2.5 rounded-xl transition-all ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              }`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8 flex-1">
              {!isEditMode ? (
                <>
                  <div
                    onClick={() => {
                      if (onInspect) onInspect(selectedStudent.id);
                      setSelectedStudent(null);
                    }}
                    className={`border p-6 rounded-[2.5rem] flex items-center space-x-6 cursor-pointer group/card transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-white/5 hover:border-amber-500/30' : 'bg-slate-50 border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className={`w-20 h-20 rounded-full border flex items-center justify-center font-black text-2xl transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-white/10 text-amber-500' : 'bg-white border-slate-200 text-amber-600'
                    }`}>
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className={`text-xl font-black leading-none transition-all group-hover/card:text-amber-500 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                        {selectedStudent.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 mt-2 uppercase">{selectedStudent.email}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <StatusBadge status={selectedStudent.status} isNew={selectedStudent.isNew} />
                        {!selectedStudent.isApproved && <span className="px-2 py-1 rounded bg-rose-500 text-white text-[8px] font-black uppercase">UNAUTHENTICATED</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Consolidated Total Balance</p>
                      <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>£{selectedStudent.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Compliance Actions</h5>

                    {/* Pending Request Handling */}
                    {selectedStudent.pendingRequest && (
                      <div className={`p-6 rounded-[2rem] border-2 border-dashed space-y-4 ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-500/20'}`}>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <Zap className="w-4 h-4 text-amber-500" />
                             <span className="text-xs font-black uppercase text-amber-500 tracking-tight">Pending {selectedStudent.pendingRequest.type.replace('_', ' ')}</span>
                           </div>
                           <span className="text-[9px] font-mono text-slate-500">{new Date(selectedStudent.pendingRequest.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/20 border border-white/5 space-y-2">
                          <p className="text-xs font-bold text-white">
                            Requested: {selectedStudent.pendingRequest.type === 'TOP_UP' ? `£${selectedStudent.pendingRequest.amountGBP}` : `${selectedStudent.pendingRequest.daysRequested} Days`}
                          </p>
                          {selectedStudent.pendingRequest.reason && (
                            <p className="text-[10px] text-slate-500 italic leading-relaxed">"{selectedStudent.pendingRequest.reason}"</p>
                          )}
                        </div>

                        {modifyingRequest ? (
                          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                             <input
                               type="number"
                               placeholder={`New ${selectedStudent.pendingRequest.type === 'TOP_UP' ? 'Amount (£)' : 'Days'}`}
                               value={modValue}
                               onChange={e => setModValue(e.target.value)}
                               className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                             />
                             <div className="flex gap-2">
                               <button onClick={() => handleProcessRequest(selectedStudent, 'APPROVE', parseFloat(modValue))} className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Confirm & Approve</button>
                               <button onClick={() => setModifyingRequest(false)} className="px-4 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase transition-all">Cancel</button>
                             </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleProcessRequest(selectedStudent, 'APPROVE')}
                              disabled={isSubmitting}
                              className="col-span-2 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Quick Approve
                            </button>
                            <button
                              onClick={() => {
                                setModValue(selectedStudent.pendingRequest?.type === 'TOP_UP' ? String(selectedStudent.pendingRequest.amountGBP) : String(selectedStudent.pendingRequest.daysRequested));
                                setModifyingRequest(true);
                              }}
                              className="py-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                            >
                              Modify Amount
                            </button>
                            <button
                              onClick={() => handleProcessRequest(selectedStudent, 'REJECT')}
                              className="py-3 bg-rose-600/10 border border-rose-500/20 text-rose-400 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                            >
                              Reject Request
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!selectedStudent.isApproved && (
                      <button
                        onClick={async () => {
                          handleApprove(selectedStudent);
                        }}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-between p-6 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-3xl text-slate-950 font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? <span>Processing...</span> : <span>Approve User Access</span>}
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}

                    {selectedStudent.status !== 'CLEARED' && selectedStudent.isApproved && (
                      <button
                        onClick={() => handleApprove(selectedStudent)}
                        className="w-full flex items-center justify-between p-6 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-3xl text-slate-950 font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all"
                      >
                        <span>Clear Compliance</span>
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => setIsProfileDrawerOpen(true)}
                      className={`w-full flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <span>View Full Profile</span>
                      <Eye className="w-5 h-5 text-amber-500" />
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setIsEditMode(true)}
                        className={`flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                          theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        <span>Edit</span>
                        <Settings2 className="w-5 h-5 text-blue-500" />
                      </button>
                      <button
                        onClick={handleDeleteProfile}
                        className={`flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                          theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-rose-500/10 hover:text-rose-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 shadow-sm'
                        }`}
                      >
                        <span>Delete</span>
                        <Trash2 className="w-5 h-5 text-rose-500" />
                      </button>
                    </div>

                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className={`w-full flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <span>View history</span>
                      <Activity className="w-5 h-5 text-cyan-500" />
                    </button>

                    <button
                      onClick={() => {
                        if (onMessageStudent && selectedStudent) onMessageStudent(selectedStudent.userId);
                        setSelectedStudent(null);
                      }}
                      className={`w-full flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <span>Message Student</span>
                      <FileText className="w-5 h-5 text-emerald-500" />
                    </button>

                    <button
                      onClick={() => setIsOverrideOpen(true)}
                      className={`w-full flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <span>Manual Change</span>
                      <Settings2 className="w-5 h-5 text-amber-500" />
                    </button>

                    <button
                      onClick={() => setIsTimerModalOpen(true)}
                      className={`w-full flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-amber-500/10 hover:text-amber-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <span>Set Expiry Timer</span>
                      <Clock className="w-5 h-5 text-amber-500" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Identity</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className={`w-full border rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 ${
                          theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Available Balance (£)</label>
                      <input
                        type="number"
                        value={editFormData.balanceGbp}
                        onChange={(e) => setEditFormData({...editFormData, balanceGbp: parseFloat(e.target.value)})}
                        className={`w-full border rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 ${
                          theme === 'dark' ? 'bg-slate-950 border-white/10 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Required Target (£)</label>
                      <input
                        type="number"
                        value={editFormData.targetGbp}
                        onChange={(e) => setEditFormData({...editFormData, targetGbp: parseFloat(e.target.value)})}
                        className={`w-full border rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 ${
                          theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Completed Days</label>
                      <input
                        type="number"
                        value={editFormData.consecutiveDays}
                        onChange={(e) => setEditFormData({...editFormData, consecutiveDays: parseInt(e.target.value)})}
                        className={`w-full border rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 ${
                          theme === 'dark' ? 'bg-slate-950 border-white/10 text-amber-500' : 'bg-slate-50 border-slate-200 text-amber-600'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Days</label>
                      <input
                        type="number"
                        value={editFormData.totalTargetDays}
                        onChange={(e) => setEditFormData({...editFormData, totalTargetDays: parseInt(e.target.value)})}
                        className={`w-full border rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 ${
                          theme === 'dark' ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className={`flex-1 px-6 py-4 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/10 active:scale-95"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <ManualOverrideModal
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        student={selectedStudent}
        performedBy={appUser?.email || 'system'}
      />

      <AdminTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        student={selectedStudent}
      />

      <AddStudentModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSuccess={() => {}}
      />

      <HistoryLogModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        student={selectedStudent}
      />

      <AdminStudentProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        student={selectedStudent}
        onUpdate={() => {}}
      />
    </div>
  );
};
