import React, { useEffect, useState } from 'react';
import { ShieldAlert, HardDrive, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface StorageMetrics {
  usedBytes: number;
  limitBytes: number;
  usagePercentage: number;
}

export const StorageUsageBar: React.FC<{ onSyncRequest?: () => void }> = ({ onSyncRequest }) => {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'storage_metrics'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const usedBytes = data.totalBytesUsed || 0;
        const limitBytes = 1073741824; // 1 GB
        const usagePercentage = Math.round((usedBytes / limitBytes) * 10000) / 100;

        setMetrics({
          usedBytes,
          limitBytes,
          usagePercentage
        });
      } else {
        // Default empty state
        setMetrics({
          usedBytes: 0,
          limitBytes: 1073741824,
          usagePercentage: 0
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
        <span className="text-[10px] font-black uppercase text-slate-500">Calculating Capacity...</span>
      </div>
    );
  }

  if (!metrics) return null;

  const formattedUsed = (metrics.usedBytes / (1024 * 1024)).toFixed(1);
  const formattedLimit = (metrics.limitBytes / (1024 * 1024 * 1024)).toFixed(1);
  const isHighUsage = metrics.usagePercentage >= 75;

  return (
    <div className="space-y-3 w-full">
      <AnimatePresence>
        {isHighUsage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 shadow-lg shadow-rose-500/5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-tight">
                  Storage Limit Warning ({metrics.usagePercentage}% Used)
                </h4>
                <p className="text-[10px] text-rose-500/80 font-medium leading-relaxed">
                  Free tier capacity limit approaching. Please export or batch-delete outdated student mandate packages to prevent storage lock.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onClick={onSyncRequest}
        className={`glass-card p-4 md:p-6 border-white/5 bg-slate-900/40 cursor-pointer group hover:bg-slate-900/60 transition-all ${!metrics.usedBytes ? 'border-amber-500/30' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400">
            <HardDrive className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest">Bucket Infrastructure</span>
          </div>
          <div className="flex items-center gap-3">
            {!metrics.usedBytes && (
              <span className="text-[8px] font-black text-amber-500 uppercase animate-pulse">Click to refresh accurate stats</span>
            )}
            <span className="text-[10px] font-bold font-mono text-white">
              {formattedUsed} MB / {formattedLimit} GB Used
            </span>
          </div>
        </div>

        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.usagePercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isHighUsage ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
            }`}
          />
        </div>

        <div className="mt-2 flex justify-between">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Firebase Cloud Storage</span>
          <span className={`text-[8px] font-black uppercase tracking-tighter ${isHighUsage ? 'text-rose-400' : 'text-blue-400'}`}>
            {metrics.usagePercentage}% Capacity Consumed
          </span>
        </div>
      </div>
    </div>
  );
};
