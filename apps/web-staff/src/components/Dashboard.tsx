import React, { useState, useMemo, useEffect } from 'react';
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
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
import { useTheme } from '../context/ThemeContext';

// --- Types ---

type ComplianceStatus = 'CLEARED' | 'NEEDS_TOPUP' | 'NEAR_MATURITY' | 'AT_RISK' | 'PENDING' | 'NEW';

interface Student {
  id: string;
  name: string;
  email: string;
  status: ComplianceStatus;
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
    type: 'FINANCE' | 'DAYS_EXTENSION';
    amountNgn?: number;
    daysRequested?: number;
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
      className={`w-full text-left border p-5 rounded-3xl backdrop-blur-md relative overflow-hidden group transition-all ${
        theme === 'dark'
          ? `bg-slate-900/40 border-white/5 ${isActive ? 'border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/5' : 'hover:border-white/10'}`
          : `bg-white border-slate-200 shadow-sm ${isActive ? 'border-amber-500 ring-2 ring-amber-500/10' : 'hover:border-slate-300'}`
      }`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className={`p-2 rounded-xl border w-fit mb-3 ${color} ${
        theme === 'dark' ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{value}</p>
      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>{label}</p>
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
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onInspect }) => {
  const { appUser, role } = useAuth();
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ComplianceStatus | 'ALL' | 'REQUESTS'>('ALL');
  const [requestTypeFilter, setRequestTypeFilter] = useState<'ALL' | 'FINANCE' | 'DAYS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Modal & Drawer State
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (days >= 21 && days < 28 && status !== 'CLEARED') status = 'NEAR_MATURITY';

        if (d.anomalyRatio > 2.5) status = 'AT_RISK';

        return {
          id: docSnap.id,
          name: d.userName || 'Unknown Student',
          email: d.userEmail || '',
          status,
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
        } as Student;
      });
      setStudents(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // 2. Subscribe to top-up requests
  useEffect(() => {
    const q = query(collection(db, 'topup_requests'), where('status', '==', 'PENDING'), orderBy('createdAt', 'desc'));
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
    return students.map(s => {
      const studentAccs = accounts.filter(a => a.userId === s.id || a.userEmail === s.email);
      const totalGbp = studentAccs.reduce((sum, curr) => sum + (Number(curr.balanceGBP) || 0), 0);
      const studentRequest = requests.find(r => r.userId === s.id || r.userEmail === s.email);
      return { ...s, balanceGbp: totalGbp, pendingRequest: studentRequest };
    });
  }, [students, accounts, requests]);

  const stats = useMemo(() => ({
    total: liveStudents.length,
    cleared: liveStudents.filter(s => s.status === 'CLEARED').length,
    topUpRequests: requests.length,
    nearMaturity: liveStudents.filter(s => s.status === 'NEAR_MATURITY').length,
    atRisk: liveStudents.filter(s => s.status === 'AT_RISK').length,
    newUsers: liveStudents.filter(s => s.isNew).length
  }), [liveStudents, requests]);

  const filteredStudents = useMemo(() => {
    return liveStudents.filter(s => {
      let matchesFilter = true;
      if (filter === 'ALL') matchesFilter = true;
      else if (filter === 'CLEARED') matchesFilter = s.status === 'CLEARED';
      else if (filter === 'NEAR_MATURITY') matchesFilter = s.status === 'NEAR_MATURITY';
      else if (filter === 'AT_RISK') matchesFilter = s.status === 'AT_RISK';
      else if (filter === 'REQUESTS') {
        matchesFilter = !!s.pendingRequest;
        if (matchesFilter && requestTypeFilter !== 'ALL') {
          matchesFilter = s.pendingRequest?.type === requestTypeFilter;
        }
      }

      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [liveStudents, filter, requestTypeFilter, searchTerm]);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'pof_evaluations', id), {
        status: 'VALIDATED',
        updatedAt: serverTimestamp()
      });
      setSelectedStudent(null);
    } catch (e) {
      console.error('Approve error:', e);
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

  const tabs = ['ALL', 'CLEARED', 'NEEDS_TOPUP', 'NEAR_MATURITY', 'AT_RISK'];
  if (isAdmin) tabs.splice(1, 0, 'NEW');

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
          label="Risky"
          value={stats.atRisk}
          icon={ShieldAlert}
          color="text-rose-400"
          onClick={() => setFilter('AT_RISK')}
          isActive={filter === 'AT_RISK'}
        />
      </div>

      {/* 2. List Header & Search */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
             <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
             <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
               {filter === 'ALL' ? 'All Students' : filter === 'REQUESTS' ? 'Pending Requests' : filter.replace('_', ' ')}
             </h3>
             {filter !== 'ALL' && (
               <button
                 onClick={() => {
                   setFilter('ALL');
                   setRequestTypeFilter('ALL');
                 }}
                 className="text-[9px] font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest ml-2 transition-colors"
               >
                 (Reset)
               </button>
             )}
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500/50 transition-all w-full md:w-64 backdrop-blur-md ${
                theme === 'dark' ? 'bg-slate-900/50 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-950'
              }`}
            />
          </div>
        </div>

        {/* 3. Student Table */}
        <div className={`border rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl transition-colors duration-500 ${
          theme === 'dark' ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <Users className="w-12 h-12 text-slate-300 mx-auto opacity-20" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching students found</p>
              </div>
            ) : (
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className={`text-[10px] font-black uppercase tracking-widest border-b transition-colors ${
                    theme === 'dark' ? 'bg-slate-950/40 text-slate-500 border-white/5' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <th className="px-8 py-5">Student Name</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Request</th>
                    <th className="px-8 py-5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => onInspect?.(student.id)}
                      className={`transition-all group cursor-pointer ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs transition-colors ${
                            theme === 'dark' ? 'bg-slate-800 border-white/10 text-amber-500' : 'bg-slate-100 border-slate-200 text-amber-600'
                          }`}>
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className={`text-sm font-bold leading-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{student.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-1 truncate max-w-[150px] uppercase">{student.email || student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={student.status} isNew={student.isNew} />
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          {student.pendingRequest ? (
                            <div className="flex items-center space-x-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                               <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                 {student.pendingRequest.type === 'FINANCE' ? 'Finance Top Up Requested' : 'Days Extension Requested'}
                               </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">No Request Yet</span>
                          )}
                          <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                             Balance: £{student.balanceGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })} / £{student.targetGbp.toLocaleString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                          className={`p-2 rounded-xl border transition-all ${
                            theme === 'dark'
                              ? 'bg-slate-800 border-white/5 text-slate-400 hover:bg-amber-500 hover:text-slate-950'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-amber-500 hover:text-white'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
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
                    <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center font-black text-2xl transition-colors ${
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
                      <div className="mt-4">
                        <StatusBadge status={selectedStudent.status} isNew={selectedStudent.isNew} />
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

                    {selectedStudent.status !== 'CLEARED' && (
                      <button
                        onClick={() => handleApprove(selectedStudent.id)}
                        className="w-full flex items-center justify-between p-6 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-3xl text-slate-950 font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all"
                      >
                        <span>Approve student</span>
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

                    <button className={`w-full flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                    }`}>
                      <span>View history</span>
                      <Activity className="w-5 h-5 text-cyan-500" />
                    </button>

                    <button className={`w-full flex items-center justify-between p-6 border rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-white/10 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                    }`}>
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
    </div>
  );
};
