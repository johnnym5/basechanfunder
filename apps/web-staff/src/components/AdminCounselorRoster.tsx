import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Mail,
  Activity,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { PRE_APPROVED_COUNSELORS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface CounselorStats {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'PENDING_REGISTRATION';
  assignedStudentCount: number;
  lastActive?: string;
}

export const AdminCounselorRoster: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [counselors, setCounselors] = useState<CounselorStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch all registered counselors from Firestore
    const q = query(collection(db, 'users'), where('role', '==', 'COUNSELOR'));
    const unsub = onSnapshot(q, async (snap) => {
      const registered = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Map whitelisted counselors to their registration status and student counts
      const rosterPromises = PRE_APPROVED_COUNSELORS.map(async (white) => {
        const user = registered.find(u => u.email.toLowerCase() === white.email.toLowerCase());

        let studentCount = 0;
        if (user) {
          // Count assigned students for this counselor
          const studentQ = query(collection(db, 'pof_evaluations'), where('counselorId', '==', user.uid));
          const studentSnap = await getDocs(studentQ);
          studentCount = studentSnap.size;
        }

        return {
          id: user?.uid || white.email,
          name: white.name,
          email: white.email,
          status: user ? 'ACTIVE' : 'PENDING_REGISTRATION',
          assignedStudentCount: studentCount,
          lastActive: user?.lastLoginAt ? new Date(user.lastActive).toLocaleDateString() : undefined
        } as CounselorStats;
      });

      const fullRoster = await Promise.all(rosterPromises);
      setCounselors(fullRoster);
      setLoading(false);
    });

    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Staff Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Staff Counselors</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Whitelisted access governance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {counselors.map((staff) => (
          <div
            key={staff.email}
            className={`p-6 rounded-[2.5rem] border backdrop-blur-md transition-all hover:-translate-y-1 ${
              isDark ? 'bg-slate-900/40 border-white/5 hover:border-amber-500/30' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                staff.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : 'bg-slate-800 border-white/5 text-slate-500'
              }`}>
                <Briefcase className="w-7 h-7" />
              </div>
              <span className={`text-[8px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${
                staff.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {staff.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-1 mb-6">
              <h4 className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{staff.name}</h4>
              <p className="text-[10px] font-mono text-slate-500 uppercase">{staff.email}</p>
            </div>

            <div className={`p-4 rounded-2xl border mb-6 flex items-center justify-between ${
              isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'
            }`}>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Cases</p>
                <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{staff.assignedStudentCount}</p>
              </div>
              <Users className="w-5 h-5 text-blue-500" />
            </div>

            <div className="flex gap-2">
              <button
                disabled={staff.status !== 'ACTIVE'}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-30"
              >
                View Roster
              </button>
              <button
                disabled={staff.status !== 'ACTIVE'}
                className={`px-4 py-3 rounded-xl border font-black text-[9px] uppercase transition-all ${
                  isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                Assign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
