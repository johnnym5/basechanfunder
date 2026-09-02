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
  orderBy
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
  Eye
} from 'lucide-react';
import { ProfessionalSpinner } from './ui/LoadingStates';
import { ManualOverrideModal } from './ManualOverrideModal';
import { AdminTimerModal } from './AdminTimerModal';
import { AddStudentModal } from './AddStudentModal';
import { useTheme } from '../context/ThemeContext';

// --- Types ---

type ComplianceStatus = 'CLEARED' | 'NEEDS_TOPUP' | 'NEAR_MATURITY' | 'AT_RISK' | 'PENDING' | 'NEW';

interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
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
  const [students, setStudents] = useState<Student[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    // Start with existing student evaluations
    const merged: Student[] = students.map(s => {
      const studentAccs = accounts.filter(a => a.userId === s.userId || a.userEmail === s.email);
      const totalGbp = studentAccs.reduce((sum, curr) => sum + (Number(curr.balanceGBP) || 0), 0);
      const studentRequest = requests.find(r => r.userId === s.userId || r.userEmail === s.email);

      // Sync details from users collection if available
      const userProfile = allUsers.find(u => u.uid === s.userId || u.email === s.email);
      const isApproved = userProfile ? (userProfile.isApproved ?? false) : s.isApproved;
      const name = s.name === 'Unknown Student' && userProfile ? (userProfile.displayName || userProfile.username || s.name) : s.name;

      return { ...s, name, isApproved, balanceGbp: totalGbp, pendingRequest: studentRequest };
    });

    // Add users who are NOT in pof_evaluations yet but are unapproved
    allUsers.forEach(u => {
      const isAlreadyIn = merged.some(s => s.userId === u.uid || s.email === u.email);
      const isStudentRole = u.role === 'STUDENT' || (!u.email?.endsWith('@basechaninternational.com') && !u.email?.endsWith('.basechaninternational@gmail.com'));

      if (!isAlreadyIn && isStudentRole && !u.isApproved) {
        merged.push({
          id: u.uid, // Temporary ID as they don't have an eval yet
          userId: u.uid,
          name: u.displayName || u.username || 'New User',
          email: u.email || '',
          status: 'PENDING',
          isApproved: false,
          consecutiveDays: 0,
          balanceGbp: 0,
          targetGbp: 0,
          anomalyRatio: 0,
          lastUpdate: 'Awaiting Setup',
          createdAt: u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
          isNew: true,
          expirationDate: null,
          timerCustomMessage: null,
          isTimerActive: false
        });
      }
    });

    return merged;
  }, [students, accounts, requests, allUsers]);

  const stats = useMemo(() => ({
    total: liveStudents.length,
    cleared: liveStudents.filter(s => s.status === 'CLEARED').length,
    topUpRequests: liveStudents.filter(s => !!s.pendingRequest).length,
    nearMaturity: liveStudents.filter(s => s.status === 'NEAR_MATURITY').length,
    atRisk: liveStudents.filter(s => s.status === 'AT_RISK').length,
    unapproved: liveStudents.filter(s => !s.isApproved).length,
    newUsers: liveStudents.filter(s => s.isNew).length
  }), [liveStudents]);

  const filteredStudents = useMemo(() => {
    return liveStudents.filter(s => {
      let matchesFilter = true;
      if (filter === 'ALL') matchesFilter = true;
      else if (filter === 'CLEARED') matchesFilter = s.status === 'CLEARED';
      else if (filter === 'NEAR_MATURITY') {
        // Almost Done: less than 7 days left to reach 28
        matchesFilter = s.consecutiveDays >= 21 && s.consecutiveDays < 28 && s.status !== 'CLEARED';
      }
      else if (filter === 'AT_RISK') matchesFilter = s.status === 'AT_RISK';
      else if (filter === 'UNAPPROVED') matchesFilter = !s.isApproved;
      else if (filter === 'REQUESTS') {
        matchesFilter = !!s.pendingRequest;
        if (matchesFilter && requestTypeFilter !== 'ALL') {
          const mappedType = requestTypeFilter === 'FINANCE' ? 'TOP_UP' : 'EXTENSION';
          matchesFilter = s.pendingRequest?.type === mappedType;
        }
      }

      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [liveStudents, filter, requestTypeFilter, searchTerm]);

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
    if (!window.confirm(`Are you sure you want to PERMANENTLY erase ${selectedStudent.name}'s profile?`)) return;

    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'pof_evaluations', selectedStudent.id));
      setSelectedStudent(null);
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          label="Top Up Request"
          value={stats.topUpRequests}
          icon={Zap}
          color="text-amber-400"
          onClick={() => setFilter('REQUESTS')}
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
          onClick={() => setFilter('UNAPPROVED')}
          isActive={filter === 'UNAPPROVED'}
        />
      </div>

      {/* 2. List Header & Search */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 md:space-x-3">
             <div className="w-1 md:w-1.5 h-5 md:h-6 bg-amber-500 rounded-full" />
             <h3 className={`text-xs md:text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
               {filter === 'ALL' ? 'All Students' : filter === 'REQUESTS' ? 'Pending Requests' : filter === 'UNAPPROVED' ? 'Unauthenticated Users' : filter.replace('_', ' ')}
             </h3>
             {filter !== 'ALL' && (
               <button
                 onClick={() => {
                   setFilter('ALL');
                   setRequestTypeFilter('ALL');
                 }}
                 className="text-[8px] md:text-[9px] font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest ml-1 transition-colors"
               >
                 (Reset)
               </button>
             )}
             <button
               onClick={() => setIsAddUserOpen(true)}
               className={`flex items-center space-x-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ml-2 md:ml-4 ${
                 theme === 'dark' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
               }`}
             >
               <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
               <span>Add New Student</span>
             </button>
          </div>

          {filter === 'REQUESTS' && (
            <div className="flex items-center space-x-2 bg-slate-900/40 p-1 rounded-xl border border-white/5">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'FINANCE', label: 'Finance' },
                { id: 'DAYS_EXTENSION', label: 'Days Extension' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRequestTypeFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${requestTypeFilter === t.id ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`border rounded-lg md:rounded-xl pl-8 md:pl-9 pr-4 py-1.5 md:py-2 text-[10px] md:text-xs focus:outline-none focus:border-amber-500/50 transition-all w-full md:w-64 backdrop-blur-md ${
                theme === 'dark' ? 'bg-slate-900/50 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-950'
              }`}
            />
          </div>
        </div>

        {/* 3. Student Table */}
        <div className={`border rounded-2xl md:rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl transition-colors duration-500 ${
          theme === 'dark' ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-10 md:p-20 text-center space-y-3 md:space-y-4">
                <Users className="w-10 h-10 md:w-12 md:h-12 text-slate-300 mx-auto opacity-20" />
                <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">No matching students found</p>
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
                      onClick={() => onInspect?.(student.id)}
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
                            <p className={`text-xs md:text-sm font-bold leading-tight transition-colors truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{student.name}</p>
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
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-700" onClick={() => setSelectedStudent(null)}>
          <div className={`w-full max-w-xl border-l h-screen shadow-2xl animate-in slide-in-from-left fade-in duration-1000 ease-in-out overflow-y-auto ${
            theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
          }`} onClick={e => e.stopPropagation()}>

            <div className={`sticky top-0 p-8 border-b backdrop-blur-xl z-20 flex justify-between items-center ${
              theme === 'dark' ? 'bg-slate-900/95 border-white/5' : 'bg-white/95 border-slate-100'
            }`}>
              <div>
                <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>Student Info</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 uppercase">Reviewing Compliance Profile</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className={`p-3 rounded-2xl transition-all ${
                theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              }`}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {!isEditMode ? (
                <>
                  <div className={`border p-6 rounded-[2.5rem] flex items-center space-x-6 ${
                    theme === 'dark' ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className={`w-20 h-20 rounded-full border flex items-center justify-center font-black text-2xl transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-white/10 text-amber-500' : 'bg-white border-slate-200 text-amber-600'
                    }`}>
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <button
                      onClick={() => {
                        if (onInspect) onInspect(selectedStudent.id);
                        setSelectedStudent(null);
                      }}
                      className="text-left group/name"
                    >
                      <h4 className={`text-xl font-black leading-none transition-all group-hover/name:text-amber-500 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                        {selectedStudent.name}
                      </h4>
                    </button>
                      <p className="text-xs font-mono text-slate-500 mt-2 uppercase">{selectedStudent.email}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <StatusBadge status={selectedStudent.status} isNew={selectedStudent.isNew} />
                        {!selectedStudent.isApproved && <span className="px-2 py-1 rounded bg-rose-500 text-white text-[8px] font-black uppercase">UNAUTHENTICATED</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Current Balance</p>
                      <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>£{selectedStudent.balanceGbp.toLocaleString()}</p>
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
                      onClick={() => {
                        if (onInspect) onInspect(selectedStudent.id);
                        setSelectedStudent(null);
                      }}
                      className={`w-full flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-amber-500/10 hover:text-amber-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <span>View student page</span>
                      <Eye className="w-5 h-5" />
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
          </div>
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
    </div>
  );
};
