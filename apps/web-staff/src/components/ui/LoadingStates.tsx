import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  message?: string;
}

export const ProfessionalSpinner: React.FC<SpinnerProps> = ({ message = 'Syncing PoF Nodes…' }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-12">
      <div className="relative">
        {/* Glassmorphic Ring */}
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin shadow-[0_0_15px_rgba(245,158,11,0.2)]"></div>
        {/* Inner static ring */}
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-white/5 pointer-events-none"></div>
      </div>
      <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest animate-pulse">
        {message}
      </p>
    </div>
  );
};

export const TableSkeletonLoader: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 px-6 py-4 bg-slate-900/40 border border-white/5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-slate-800/50"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/4 bg-slate-800/50 rounded"></div>
            <div className="h-2 w-1/3 bg-slate-800/30 rounded"></div>
          </div>
          <div className="w-24 h-6 bg-slate-800/50 rounded-lg"></div>
          <div className="w-16 h-4 bg-slate-800/30 rounded"></div>
        </div>
      ))}
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
    </div>
  );
};
