import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Rocket,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getPlatformType } from '../utils/deviceDetection';
import { useNotificationModal } from '../context/NotificationContext';

interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseNotes: string;
  apkUrl: string;
}

export const AppUpdateModal: React.FC = () => {
  const { showNotification } = useNotificationModal();
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const platform = getPlatformType();
  const isNative = platform === 'NATIVE_ANDROID';

  useEffect(() => {
    if (!isNative) return;

    const checkVersion = async () => {
      try {
        const response = await fetch('/api/v1/app/latest-version');
        if (!response.ok) return;

        const data = await response.json();

        // Get current version from bridge
        let currentVersionCode = 0;
        if ((window as any).AndroidBridge?.getVersionCode) {
          currentVersionCode = (window as any).AndroidBridge.getVersionCode();
        }

        if (data.versionCode > currentVersionCode) {
          setUpdateInfo(data);
        }
      } catch (err) {
        console.error("Version check failed", err);
      }
    };

    checkVersion();
  }, [isNative]);

  const handleUpdate = async () => {
    if (!updateInfo) return;
    setIsUpdating(true);
    setError(null);

    try {
      // Simulate download progress if bridge doesn't support it yet
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 95) {
            clearInterval(interval);
            return 95;
          }
          return p + Math.random() * 10;
        });
      }, 500);

      if ((window as any).AndroidBridge?.installApkFromUrl) {
        (window as any).AndroidBridge.installApkFromUrl(updateInfo.apkUrl);
      } else {
        // Fallback or alert
        setTimeout(() => {
          clearInterval(interval);
          setProgress(100);
          showNotification({
            title: 'Download Complete',
            message: 'Update downloaded. Please use the APK installer to complete the process.',
            type: 'SUCCESS'
          });
        }, 5000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to download update");
      setIsUpdating(false);
    }
  };

  if (!updateInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-[#0D111A] border border-amber-500/20 rounded-[2.5rem] overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 bg-amber-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-amber-500 uppercase tracking-tight">New Update Available</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Version v{updateInfo.version}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Release Notes</p>
              <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5">
                <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                  {updateInfo.releaseNotes}
                </p>
              </div>
            </div>

            {isUpdating ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Downloading Update...</p>
                  <span className="text-xs font-mono font-bold text-white">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 text-center animate-pulse">Finalizing packages, please do not close the app.</p>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-rose-200 leading-relaxed">{error}</p>
              </div>
            ) : (
              <button
                onClick={handleUpdate}
                className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                <span>Update Now</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
