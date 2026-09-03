import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Filter,
  RefreshCw,
  Zap,
  Clock,
  ShieldAlert,
  UserCheck,
  ChevronUp,
  User,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterCriteria {
  searchTerm: string;
  statuses: string[];
  assignedCounselorId: string | 'ALL' | 'UNASSIGNED';
  financialState: 'ALL' | 'DEFICIT' | 'FULLY_CLEARED' | 'CAPITAL_BREACHED' | 'PENDING_TOPUP_FEE';
  timerStatus: 'ALL' | 'ACTIVE_COUNTDOWN' | 'NEAR_EXPIRATION' | 'EXPIRED' | 'PAUSED';
  destinationCountry: 'ALL' | string;
  ingestionChannel: 'ALL' | 'AUTOMATED' | 'MANUAL' | 'UNVERIFIED';
}

interface StudentTableFiltersProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  counselors: Array<{ uid: string; displayName: string }>;
  onReset: () => void;
  isDark: boolean;
}

export const StudentTableFilters: React.FC<StudentTableFiltersProps> = ({
  filters,
  onFilterChange,
  counselors,
  onReset,
  isDark
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (updates: Partial<FilterCriteria>) => {
    onFilterChange({ ...filters, ...updates });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    updateFilter({ statuses: newStatuses });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statuses.length > 0) count++;
    if (filters.assignedCounselorId !== 'ALL') count++;
    if (filters.financialState !== 'ALL') count++;
    if (filters.timerStatus !== 'ALL') count++;
    if (filters.destinationCountry !== 'ALL') count++;
    if (filters.ingestionChannel !== 'ALL') count++;
    return count;
  }, [filters]);

  const STATUS_OPTIONS = [
    'NEEDS_TOPUP',
    'CLEARED',
    'PENDING',
    'WAITING_APPROVAL',
    'UNAUTHENTICATED',
    'AT_RISK_CAPITAL_BREACH'
  ];

  const COUNTRIES = [
    'United Kingdom',
    'Canada',
    'United States',
    'Australia'
  ];

  return (
    <div className="space-y-3">
      {/*
         Unified High-Density Search & Filter Bar
         "Everything is inside the bar"
      */}
      <div className={`relative flex items-center p-1.5 rounded-2xl border transition-all duration-500 backdrop-blur-2xl ${
        isDark
          ? 'bg-slate-900/60 border-white/10 focus-within:border-amber-500/50 shadow-2xl shadow-black/40'
          : 'bg-white border-slate-200 focus-within:border-blue-500 shadow-lg shadow-slate-200/50'
      }`}>

        {/* Left: Search Identity */}
        <div className="flex-1 flex items-center min-w-[180px]">
          <Search className={`w-4 h-4 ml-3 shrink-0 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search Identity..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter({ searchTerm: e.target.value })}
            className="w-full bg-transparent border-none py-2.5 px-3 text-xs font-bold focus:outline-none placeholder:text-slate-500 text-inherit"
          />
        </div>

        {/* Vertical Divider */}
        <div className={`h-8 w-px mx-1 hidden sm:block ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />

        {/* Integrated Filter Controls (Inside the bar) */}
        <div className="flex items-center gap-1.5 pr-1">

          {/* Counselor Selector - Embedded */}
          <div className="relative group shrink-0 hidden lg:block">
             <User className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${filters.assignedCounselorId !== 'ALL' ? 'text-blue-400' : 'text-slate-500'}`} />
             <select
               value={filters.assignedCounselorId}
               onChange={(e) => updateFilter({ assignedCounselorId: e.target.value })}
               className={`pl-8 pr-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight bg-transparent border-none hover:bg-white/5 transition-all appearance-none cursor-pointer focus:outline-none ${
                 filters.assignedCounselorId !== 'ALL' ? 'text-blue-400' : 'text-slate-400'
               }`}
             >
               <option value="ALL" className={isDark ? 'bg-slate-900' : 'bg-white'}>Any Counselor</option>
               <option value="UNASSIGNED" className={isDark ? 'bg-slate-900' : 'bg-white'}>Unassigned</option>
               {counselors.map(c => (
                 <option key={c.uid} value={c.uid} className={isDark ? 'bg-slate-900' : 'bg-white'}>{c.displayName}</option>
               ))}
             </select>
             <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Status Dropdown - Embedded */}
          <div className="relative group shrink-0 hidden md:block">
             <LayoutGrid className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${filters.statuses.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
             <select
               value={filters.statuses[0] || 'ALL'}
               onChange={(e) => updateFilter({ statuses: e.target.value === 'ALL' ? [] : [e.target.value] })}
               className={`pl-8 pr-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight bg-transparent border-none hover:bg-white/5 transition-all appearance-none cursor-pointer focus:outline-none ${
                 filters.statuses.length > 0 ? 'text-emerald-400' : 'text-slate-400'
               }`}
             >
               <option value="ALL" className={isDark ? 'bg-slate-900' : 'bg-white'}>All Statuses</option>
               {STATUS_OPTIONS.map(opt => (
                 <option key={opt} value={opt} className={isDark ? 'bg-slate-900' : 'bg-white'}>{opt.replace(/_/g, ' ')}</option>
               ))}
             </select>
             <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Advanced Panel Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 ${
              isExpanded
                ? (isDark ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg' : 'bg-blue-600 text-white border-blue-500')
                : (isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Advanced</span>
            {activeFilterCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold ${isExpanded ? 'bg-slate-950/20 text-inherit' : 'bg-blue-600 text-white'}`}>
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Reset Button (Only if filters active) */}
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}
              title="Reset All"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Secondary Panel (Only for complex filters) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-3xl border ${
              isDark ? 'bg-slate-950/40 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
            }`}>

              {/* Financial State */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Capital Deficit
                </label>
                <select
                  value={filters.financialState}
                  onChange={(e) => updateFilter({ financialState: e.target.value as any })}
                  className={`w-full rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all appearance-none border ${
                    isDark ? 'bg-slate-900 border-white/10 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="ALL">All Balance States</option>
                  <option value="DEFICIT">Deficit (Low Funds)</option>
                  <option value="FULLY_CLEARED">Fully Cleared</option>
                  <option value="CAPITAL_BREACHED">Capital Breached</option>
                  <option value="PENDING_TOPUP_FEE">Pending Top-up Fee</option>
                </select>
              </div>

              {/* Timer Status */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Statutory Window
                </label>
                <select
                  value={filters.timerStatus}
                  onChange={(e) => updateFilter({ timerStatus: e.target.value as any })}
                  className={`w-full rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all appearance-none border ${
                    isDark ? 'bg-slate-900 border-white/10 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="ALL">All Timer States</option>
                  <option value="ACTIVE_COUNTDOWN">Active Countdown</option>
                  <option value="NEAR_EXPIRATION">Near Expiration (&lt;7d)</option>
                  <option value="EXPIRED">Expired / Overdue</option>
                  <option value="PAUSED">Paused / Inactive</option>
                </select>
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Route</label>
                <select
                  value={filters.destinationCountry}
                  onChange={(e) => updateFilter({ destinationCountry: e.target.value })}
                  className={`w-full rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all appearance-none border ${
                    isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="ALL">All Jurisdictions</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Ingestion Channel */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Pipeline</label>
                <select
                  value={filters.ingestionChannel}
                  onChange={(e) => updateFilter({ ingestionChannel: e.target.value as any })}
                  className={`w-full rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-all appearance-none border ${
                    isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="ALL">All Channels</option>
                  <option value="AUTOMATED">Automated (SMS/Gmail)</option>
                  <option value="MANUAL">Manual Override</option>
                  <option value="UNVERIFIED">Unverified / Pending</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
