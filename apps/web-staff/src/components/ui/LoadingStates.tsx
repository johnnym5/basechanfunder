import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  message?: string;
}

export const ProfessionalSpinner: React.FC<SpinnerProps> = ({ message = 'Updating data…' }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative w-16 h-16">
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl animate-pulse"></div>

        {/* Spinning Gradient Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-500/30 animate-spin"></div>

        {/* Inner Glass Ring */}
        <div className="absolute inset-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <p className="text-xs font-black text-white/90 uppercase tracking-[0.2em] animate-pulse">
          {message}
        </p>
        <div className="flex space-x-1.5 opacity-50">
          <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeletonLoader: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-4 animate-pulse relative overflow-hidden">
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

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#030712] p-6 md:p-10 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
          <div className="h-4 w-64 bg-slate-900/60 rounded-lg"></div>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-900"></div>
      </div>

      {/* Hero Card Skeleton */}
      <div className="h-64 w-full bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-10">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-slate-800 rounded"></div>
          <div className="h-16 w-64 bg-slate-800 rounded-2xl"></div>
          <div className="h-6 w-48 bg-slate-800/60 rounded"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-slate-900/40 rounded-[2rem] border border-white/5"></div>
        <div className="h-48 bg-slate-900/40 rounded-[2rem] border border-white/5"></div>
      </div>

      {/* Table Area */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-900 rounded-lg"></div>
        <TableSkeletonLoader rows={3} />
      </div>
    </div>
  );
};
