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
    <div className="w-full h-full space-y-8 animate-pulse">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-900/40 rounded-2xl border border-white/5 p-5">
            <div className="w-8 h-8 rounded-lg bg-slate-800/50 mb-4"></div>
            <div className="h-4 w-12 bg-slate-800/50 rounded mb-2"></div>
            <div className="h-2 w-20 bg-slate-800/30 rounded"></div>
          </div>
        ))}
      </div>

      {/* Title & Action Area Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-slate-900/60 rounded-xl"></div>
        <div className="h-10 w-40 bg-slate-900 rounded-xl"></div>
      </div>

      {/* Table Area */}
      <div className="glass-card !bg-slate-900/20 !border-white/5 p-2">
        <div className="space-y-4">
          <div className="h-10 w-full bg-slate-900/40 rounded-xl"></div>
          <TableSkeletonLoader rows={6} />
        </div>
      </div>
    </div>
  );
};

export const StudentDashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full space-y-8 animate-pulse">
      {/* Hero Metric Card Skeleton */}
      <div className="h-64 w-full bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-10">
        <div className="space-y-6">
          <div className="h-4 w-32 bg-slate-800/50 rounded"></div>
          <div className="h-16 w-1/2 bg-slate-800 rounded-2xl"></div>
          <div className="flex gap-4">
            <div className="h-8 w-40 bg-slate-800/40 rounded-xl"></div>
            <div className="h-8 w-40 bg-slate-800/40 rounded-xl"></div>
          </div>
        </div>
      </div>

      {/* Documents Area Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-900/60 rounded-lg ml-2"></div>
        <div className="h-32 w-full bg-slate-900/40 rounded-[2rem] border border-white/5"></div>
      </div>

      {/* Ledger Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <div className="h-6 w-40 bg-slate-900/60 rounded-lg"></div>
          <div className="h-8 w-32 bg-slate-900 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900/40 rounded-[2rem] border border-white/5"></div>
          <div className="h-80 bg-slate-900/40 rounded-[2rem] border border-white/5"></div>
        </div>
      </div>
    </div>
  );
};
