import React, { useState, useMemo, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Users,
  Sliders,
  Activity,
  Search,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Globe,
  Database,
  RefreshCw,
  X,
  UserPlus,
  ArrowRightLeft,
  Cpu,
  Wifi,
  BarChart3,
  Loader2,
  Sun,
  Moon,
  LogOut,
  Bell,
  MessageCircle
} from 'lucide-react';
import { useRef } from 'react';

// --- Types & Interfaces ---

type TabType = 'assignments' | 'rules' | 'telemetry';
type StudentStatus = 'COMPLIANT' | 'AT_RISK' | 'MATURED';

interface Student {
  id: string;
  name: string;
  email: string;
  countryCode: string;
  status: StudentStatus;
  counselor: string;
}

interface Rule {
  country: string;
  code: string;
  threshold: number;
  period: number;
  currency: string;
}

interface TelemetryNode {
  name: string;
  type: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latency: number;
  throughput: string;
}

// --- Sub-Components ---

const StatusBadge: React.FC<{ status: StudentStatus }> = ({ status }) => {
  const styles = {
    COMPLIANT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    AT_RISK: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    MATURED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${styles[status] || styles.COMPLIANT}`}>
      {status}
    </span>
  );
};

// --- Main Component ---

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [rules, setRules] = useState<Rule[]>([
    { country: 'United Kingdom', code: 'GBR', threshold: 13340, period: 28, currency: 'GBP' },
    { country: 'Canada', code: 'CAN', threshold: 20635, period: 30, currency: 'CAD' },
    { country: 'Germany', code: 'DEU', threshold: 11208, period: 90, currency: 'EUR' },
    { country: 'United States', code: 'USA', threshold: 25000, period: 30, currency: 'USD' },
  ]);
  const [fxBuffer, setFxBuffer] = useState(10);
  const [loading, setLoading] = useState(true);

  const TELEMETRY_DATA: TelemetryNode[] = [
    { name: 'Mono Open Banking', type: 'API Gateway', status: 'ONLINE', latency: 45, throughput: '1.2k req/m' },
    { name: 'OANDA Data Stream', type: 'FX Engine', status: 'ONLINE', latency: 120, throughput: '600 req/m' },
    { name: 'Core Matrix Engine', type: 'Compliance Node', status: 'ONLINE', latency: 8, throughput: '12k calc/m' },
  ];

  // 1. Fetch live students from evaluations
  useEffect(() => {
    const q = query(collection(db, 'pof_evaluations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.userName || 'Unknown Student',
          email: d.userEmail || '',
          countryCode: d.visaRoute?.includes('UK') ? 'GBR' : (d.visaRoute?.includes('CAN') ? 'CAN' : 'USA'),
          status: d.status === 'VALIDATED' ? 'COMPLIANT' : (d.anomalyRatio > 2.5 ? 'AT_RISK' : 'COMPLIANT'),
          counselor: d.counselor || 'Unassigned'
        } as Student;
      });
      setStudents(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Reassignment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [tempCounselor, setTempCounselor] = useState('');

  const stats = useMemo(() => ({
    total: students.length,
    unassigned: students.filter(s => s.counselor === 'Unassigned').length,
    atRisk: students.filter(s => s.status === 'AT_RISK').length,
    activeStudents: students.filter(s => s.status !== 'MATURED').length
  }), [students]);

  const filteredStudents = useMemo(() =>
    students.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [students, searchTerm]);

  const handleOpenReassign = (student: Student) => {
    setSelectedStudent(student);
    setTempCounselor(student.counselor);
    setIsModalOpen(true);
  };

  const handleSaveReassignment = async () => {
    if (selectedStudent) {
      const studentRef = doc(db, 'pof_evaluations', selectedStudent.id);
      await updateDoc(studentRef, {
        counselor: tempCounselor,
        updatedAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setSelectedStudent(null);
    }
  };

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

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#07090e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#07090e] text-slate-100 font-sans selection:bg-amber-500/30 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 md:px-8 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 uppercase">
                Basechanfunder
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Network Synced</span>
            </div>

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                  isDark
                    ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-[#0B1222]'
                    : 'border-blue-600 shadow-md shadow-blue-500/20 bg-white'
                }`}
              >
                <span className="text-[10px] font-black text-blue-600 uppercase">A</span>
              </button>

              {/* Collapsible Profile Popover Menu */}
              {isProfileOpen && (
                <div className={`absolute right-0 top-full mt-4 w-72 rounded-[2.5rem] shadow-2xl z-[150] p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right border-2 ${
                  isDark
                    ? 'bg-[#0B1222] border-blue-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
                    : 'bg-white border-slate-200 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
                }`}>
                  {/* User Header */}
                  <div className={`flex items-center space-x-3 pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm overflow-hidden border shrink-0 ${
                      isDark ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
                    }`}>
                      A
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-black uppercase truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Admin Governance</p>
                      <p className={`text-[10px] font-mono truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>@admin</p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1.5">
                    {[
                      { id: 'assignments', label: 'Roster Management', icon: Users },
                      { id: 'rules', label: 'Parameter Matrix', icon: Sliders },
                      { id: 'telemetry', label: 'Live Telemetry', icon: Activity },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as TabType); setIsProfileOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          activeTab === item.id
                            ? (isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200')
                            : (isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-800 hover:bg-slate-100')
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-blue-500' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    ))}

                    <div className={`my-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`} />

                    {/* a. Theme Toggle */}
                    <button
                      onClick={() => setIsDark(!isDark)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isDark ? 'text-slate-200 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-slate-800 bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
                        <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                      </div>
                    </button>

                    {/* b. Notifications Drawer Trigger */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsNotificationsOpen(true);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isDark ? 'text-slate-200 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-slate-800 bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Bell className="w-4 h-4 text-amber-500" />
                        <span>Notifications & Alerts</span>
                      </div>
                    </button>

                    {/* c. Compliance Support (Placeholder for Admin) */}
                  </div>

                  {/* Sign Out */}
                  <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <button
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Removed per request */}

          <main className="flex-1 overflow-y-auto p-3 md:p-8 relative pb-24 md:pb-8">
            {activeTab === 'assignments' && (
              <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { label: 'Global Roster', value: stats.total, icon: Users, color: 'text-slate-200' },
                    { label: 'Unassigned', value: stats.unassigned, icon: UserPlus, color: 'text-amber-400' },
                    { label: 'At-Risk Accounts', value: stats.atRisk, icon: AlertTriangle, color: 'text-rose-400' },
                    { label: 'Active Pipeline', value: stats.activeStudents, icon: ShieldCheck, color: 'text-emerald-400' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-3.5 md:p-5 rounded-2xl md:rounded-[2rem] backdrop-blur-sm">
                      <stat.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${stat.color} mb-2 md:mb-3`} />
                      <p className="text-xl md:text-3xl font-black">{stat.value}</p>
                      <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5 md:mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900/20 border border-slate-800 rounded-2xl md:rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
                  <div className="p-4 md:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm md:text-xl font-black uppercase tracking-tight">Active Assignments</h2>
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 md:mt-1">Audit Stream & Workflow</p>
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search ledger..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg md:rounded-xl pl-9 pr-4 py-1.5 md:py-2.5 text-[10px] md:text-xs focus:outline-none focus:border-amber-500/50 transition-all w-full sm:w-64 uppercase font-bold tracking-tight"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-950/40 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                          <th className="px-4 md:px-8 py-3 md:py-4">Student Identity</th>
                          <th className="hidden xs:table-cell px-4 md:px-8 py-3 md:py-4">Jurisdiction</th>
                          <th className="px-4 md:px-8 py-3 md:py-4">Status</th>
                          <th className="hidden sm:table-cell px-4 md:px-8 py-3 md:py-4">Officer</th>
                          <th className="px-4 md:px-8 py-3 md:py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-4 md:px-8 py-4 md:py-6">
                              <div className="flex items-center space-x-3 md:space-x-4">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-[10px] md:text-xs text-amber-500 border border-white/5">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs md:text-sm font-bold text-white uppercase tracking-tight truncate">{student.name}</p>
                                  <p className="text-[8px] md:text-[10px] font-mono text-slate-500 uppercase truncate max-w-[120px] md:max-w-none">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="hidden xs:table-cell px-4 md:px-8 py-4 md:py-6">
                              <span className="text-[8px] md:text-[10px] font-black text-slate-400 bg-slate-950 px-1.5 md:py-1 rounded md:rounded-lg border border-white/5">{student.countryCode}</span>
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6">
                              <StatusBadge status={student.status} />
                            </td>
                            <td className="hidden sm:table-cell px-4 md:px-8 py-4 md:py-6">
                              <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${student.counselor === 'Unassigned' ? 'text-rose-500' : 'text-slate-300'}`}>
                                {student.counselor}
                              </span>
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                              <button
                                onClick={() => handleOpenReassign(student)}
                                className="sm:opacity-0 group-hover:opacity-100 transition-all bg-amber-500 text-slate-950 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105"
                              >
                                Reassign
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Regulatory Matrix</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">PoF Thresholds & Safety Parameters</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {rules.map((rule) => (
                    <div key={rule.code} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-md relative overflow-hidden group">
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-500 shadow-xl">
                          {rule.code}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">{rule.country}</h3>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Compliance Protocol</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Statutory Minimum</p>
                            <div className="flex items-center space-x-2">
                               <span className="text-xl font-black text-white">{rule.currency}</span>
                               <input
                                 type="number" value={rule.threshold} readOnly
                                 className="bg-transparent text-xl font-black w-24 text-emerald-400 focus:outline-none"
                               />
                            </div>
                         </div>
                         <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Holding Window</p>
                            <div className="flex items-center space-x-2">
                               <span className="text-xl font-black text-white">{rule.period}</span>
                               <span className="text-[10px] font-black text-amber-500 uppercase">Days</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'telemetry' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {TELEMETRY_DATA.map((node, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
                      <div className="flex justify-between items-start mb-6">
                         <div className={`p-3 rounded-2xl bg-slate-950 border border-white/5 ${node.status === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {i === 0 ? <Wifi className="w-6 h-6" /> : i === 1 ? <Database className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
                         </div>
                         <span className="text-[8px] font-black px-2 py-1 rounded-lg bg-slate-950 border border-white/5 uppercase text-slate-400">Node Sync</span>
                      </div>
                      <h3 className="font-black text-white uppercase tracking-tight">{node.name}</h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 mb-6">{node.type}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                         <span className="text-[10px] font-black text-emerald-400">{node.latency}ms</span>
                         <span className="text-[10px] font-black text-slate-500">{node.throughput}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Reassignment Modal */}
      {isModalOpen && selectedStudent && (
        ...
      )}

      {/* NOTIFICATIONS DRAWER */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${
            isDark ? 'bg-[#0D1424] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>System Alerts</h3>
              </div>
              <button onClick={() => setIsNotificationsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No new alerts for this audit session.
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
    </div>
  );
};

export default AdminDashboard;
