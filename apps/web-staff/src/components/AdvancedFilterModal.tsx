import React, { useState } from 'react';
import {
  X,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  ShieldAlert,
  Save,
  Globe
} from 'lucide-react';

interface FilterState {
  visaRoute: string;
  status: string;
  isNew: boolean;
  counselor: string;
  minBalance: string;
  maxBalance: string;
  minDays: string;
  maxDays: string;
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
  currentFilters: FilterState;
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  currentFilters
}) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-[#0D111A] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white">Advanced Search</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Refine Student Ledger View</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">

          {/* Visa Route */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Route</label>
            <div className="grid grid-cols-2 gap-2">
              {['UK (GBR)', 'Canada (CAN)', 'Germany (DEU)', 'USA'].map((route) => (
                <button
                  key={route}
                  onClick={() => setFilters({...filters, visaRoute: route})}
                  className={`px-4 py-3 rounded-2xl border text-[10px] font-bold transition-all ${filters.visaRoute === route ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/20'}`}
                >
                  {route}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Compliance Status</label>
            <div className="grid grid-cols-2 gap-2">
              {['CLEARED', 'AT_RISK', 'NEEDS_TOPUP', 'PENDING'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilters({...filters, status})}
                  className={`px-4 py-3 rounded-2xl border text-[10px] font-bold transition-all ${filters.status === status ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/20'}`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Numeric Ranges */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min Balance (₦)</label>
                <input
                  type="number"
                  value={filters.minBalance}
                  onChange={(e) => setFilters({...filters, minBalance: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Balance (₦)</label>
                <input
                  type="number"
                  value={filters.maxBalance}
                  onChange={(e) => setFilters({...filters, maxBalance: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Any"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min Holding (Days)</label>
                <input
                  type="number"
                  value={filters.minDays}
                  onChange={(e) => setFilters({...filters, minDays: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Holding (Days)</label>
                <input
                  type="number"
                  value={filters.maxDays}
                  onChange={(e) => setFilters({...filters, maxDays: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="28+"
                />
              </div>
            </div>
          </div>

          {/* Assigned Counselor */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Counselor</label>
            <select
              value={filters.counselor}
              onChange={(e) => setFilters({...filters, counselor: e.target.value})}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 appearance-none"
            >
              <option value="">Any Counselor</option>
              <option value="Julian Morgan">Julian Morgan</option>
              <option value="Sarah Connor">Sarah Connor</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {/* New User Toggle */}
          <button
            onClick={() => setFilters({...filters, isNew: !filters.isNew})}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${filters.isNew ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border-white/5 text-slate-500'}`}
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">New Users only (&lt;24h)</span>
            </div>
            {filters.isNew && <CheckCircle2 className="w-4 h-4" />}
          </button>

        </div>

        {/* Actions */}
        <div className="p-8 border-t border-white/5 bg-slate-950/20 flex gap-4">
          <button
            onClick={() => {
              onReset();
              setFilters({
                visaRoute: '',
                status: '',
                isNew: false,
                counselor: '',
                minBalance: '',
                maxBalance: '',
                minDays: '',
                maxDays: ''
              });
            }}
            className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Reset All
          </button>
          <button
            onClick={() => onApply(filters)}
            className="flex-1 py-4 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/10 active:scale-95 transition-all"
          >
            Apply Parameters
          </button>
        </div>

      </div>
    </div>
  );
};
