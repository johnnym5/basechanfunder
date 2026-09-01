import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpRight,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  MoreVertical,
  Activity
} from 'lucide-react';

// --- Types ---

interface StudentRequest {
  id: string;
  name: string;
  email: string;
  type: 'TOP_UP' | 'EXTENSION';
  amount?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expiresAt: Date;
  daysRemaining: number;
}

// --- Mock Data ---

const MOCK_REQUESTS: StudentRequest[] = [
  { id: 'STU-8941', name: 'Adebayo Ogunlesi', email: 'a.ogunlesi@uni.ac.uk', type: 'TOP_UP', amount: 2500, status: 'PENDING', expiresAt: new Date(Date.now() + 86400000), daysRemaining: 19 },
  { id: 'STU-9022', name: 'Chidi Anagonye', email: 'c.anagonye@phd.edu', type: 'EXTENSION', status: 'PENDING', expiresAt: new Date(Date.now() + 43200000), daysRemaining: 12 },
  { id: 'STU-7731', name: 'Tunde Eniola', email: 'tunde.e@gmail.com', type: 'TOP_UP', amount: 1200, status: 'APPROVED', expiresAt: new Date(Date.now() - 86400000), daysRemaining: 28 },
];

// --- Sub-Components ---

const CountdownTimer: React.FC<{ expiry: Date }> = ({ expiry }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = expiry.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiry]);

  const isCritical = timeLeft.includes('0h') || timeLeft === 'EXPIRED';

  return (
    <div className={`flex items-center space-x-2 font-mono text-[10px] font-black ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
};

// --- Main Component ---

export const CounselorPortal: React.FC = () => {
  const [requests, setRequests] = useState<StudentRequest[]>(MOCK_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAction = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#DFE2EF] p-8 font-sans selection:bg-[#F5B651]/20">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Counselor Workflow Console</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest ml-1">Managing Scoped Student Portfolios & Liquidity Adjustments</p>
          </div>

          <div className="flex items-center space-x-3">
             <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center space-x-4 backdrop-blur-md">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Pending Reviews</p>
                  <p className="text-lg font-black text-amber-500">{requests.filter(r => r.status === 'PENDING').length}</p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Active Students</p>
                  <p className="text-lg font-black text-emerald-400">42</p>
                </div>
             </div>
          </div>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search student identity or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/40 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-xs font-medium focus:outline-none focus:border-[#F5B651]/50 transition-all backdrop-blur-md"
            />
          </div>
          <button className="px-6 py-4 bg-slate-900/40 border border-white/10 rounded-2xl flex items-center space-x-3 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all backdrop-blur-md">
            <Filter className="w-4 h-4" />
            <span>Filter by Region</span>
          </button>
        </div>

        {/* Students Queue Table */}
        <div className="bg-[#0D111A]/60 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/40 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">
                  <th className="px-8 py-5">Student Identity</th>
                  <th className="px-8 py-5">Request Type</th>
                  <th className="px-8 py-5">24h Grace Timer</th>
                  <th className="px-8 py-5">PoF Status</th>
                  <th className="px-8 py-5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-xs text-[#F5B651]">
                          {req.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{req.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{req.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                          req.type === 'TOP_UP' ? 'bg-[#F5B651]/10 text-[#F5B651] border-[#F5B651]/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {req.type}
                        </span>
                        {req.amount && <p className="text-xs font-black text-slate-300">£{req.amount.toLocaleString()}</p>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {req.status === 'PENDING' ? (
                        <CountdownTimer expiry={req.expiresAt} />
                      ) : (
                        <span className="text-[10px] font-black text-slate-600 uppercase">CLOSED</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 max-w-[100px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(req.daysRemaining / 28) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{req.daysRemaining}/28 Days</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleAction(req.id, 'REJECTED')}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'APPROVED')}
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-black uppercase tracking-widest ${req.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global counselor alerts */}
        <footer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0F131C] border border-white/5 p-6 rounded-3xl flex items-start space-x-4">
            <Activity className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-tight">System Throughput</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Processing 84 transactions per minute across OANDA bridge.</p>
            </div>
          </div>
          <div className="bg-[#0F131C] border border-white/5 p-6 rounded-3xl flex items-start space-x-4">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-tight">Pending Forensics</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">12 eStatement OCR tickets waiting for manual auditor review.</p>
            </div>
          </div>
          <div className="bg-[#0F131C] border border-white/5 p-6 rounded-3xl flex items-start space-x-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-tight">Security Node</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Vault Encryption status is nominal. Session TTL: 4h.</p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default CounselorPortal;
