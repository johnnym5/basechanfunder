import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  UserPlus,
  Search,
  Filter,
  ChevronRight,
  Activity,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  MoreVertical,
  ShieldCheck
} from 'lucide-react';
import { AddStudentModal } from './AddStudentModal';

// --- Types ---
type ComplianceStatus = 'CLEARED' | 'NEEDS_TOPUP' | 'NEAR_MATURITY' | 'AT_RISK' | 'PENDING';

interface Student {
  id: string;
  name: string;
  email: string;
  status: ComplianceStatus;
  consecutiveDays: number;
  balanceGbp: number;
  targetGbp: number;
  visaRoute: string;
  lastUpdate: string;
}

const StatusBadge: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  const styles: Record<string, string> = {
    CLEARED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    NEEDS_TOPUP: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    NEAR_MATURITY: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    AT_RISK: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tighter ${styles[status] || styles.PENDING}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const StaffQueue: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'pof_evaluations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(docSnap => {
        const d = docSnap.data();
        const start = d.startDate ? new Date(d.startDate).getTime() : Date.now();
        const days = Math.min(Math.max(Math.floor((Date.now() - start) / 86400000) + 1, 1), 28);

        return {
          id: docSnap.id,
          name: d.userName || 'Unknown Student',
          email: d.userEmail || '',
          status: d.status || 'PENDING',
          consecutiveDays: days,
          balanceGbp: d.currentBalanceGBP || 0,
          targetGbp: d.targetGBP || 0,
          visaRoute: d.visaRoute || 'Student Visa',
          lastUpdate: d.updatedAt?.seconds ? new Date(d.updatedAt.seconds * 1000).toLocaleTimeString() : 'Just now',
        } as Student;
      });
      setStudents(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() =>
    students.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    ), [students, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header with Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Active Student Queue</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Proof of Funds Audit Stream</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Student to Queue</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by name, email, or system ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/40 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-xs font-medium focus:outline-none focus:border-amber-500/50 transition-all backdrop-blur-md"
          />
        </div>
        <button className="px-6 py-4 bg-slate-900/40 border border-white/10 rounded-2xl flex items-center space-x-3 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all backdrop-blur-md">
          <Filter className="w-4 h-4" />
          <span>Advanced Filter</span>
        </button>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/40 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">
                <th className="px-8 py-6">Student Identity</th>
                <th className="px-8 py-6">Visa Route</th>
                <th className="px-8 py-6">Compliance Status</th>
                <th className="px-8 py-6">Holding Maturity</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-8 py-7">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-sm text-amber-500 group-hover:bg-slate-700 transition-colors">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{student.name}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-tighter">{student.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center space-x-2">
                       <span className="text-[10px] font-bold text-slate-400 border border-white/10 px-2 py-0.5 rounded-lg bg-slate-950">{student.visaRoute}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <StatusBadge status={student.status} />
                  </td>
                  <td className="px-8 py-7">
                    <div className="space-y-1.5 w-40">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-slate-300">{student.consecutiveDays}/28D</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${student.consecutiveDays >= 28 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${(student.consecutiveDays / 28) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <button className="p-2.5 rounded-xl bg-slate-800 border border-white/10 hover:bg-amber-500 hover:text-slate-950 transition-all group-hover:border-amber-500/50">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="py-20 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Queue Synchronized & Empty</p>
            </div>
          )}
        </div>
      </div>

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}} // Snapshot will handle UI update
      />

    </div>
  );
};
