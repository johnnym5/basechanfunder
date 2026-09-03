import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NotificationType = 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'CONFIRM';

interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

interface NotificationContextValue {
  showNotification: (options: NotificationOptions) => void;
  closeNotification: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<NotificationOptions | null>(null);

  const showNotification = useCallback((opts: NotificationOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeNotification = useCallback(() => {
    setIsOpen(false);
    // Delay clearing options to allow exit animation
    setTimeout(() => setOptions(null), 300);
  }, []);

  const handleConfirm = () => {
    if (options?.onConfirm) options.onConfirm();
    if (!options?.isProcessing) closeNotification();
  };

  const handleCancel = () => {
    if (options?.onCancel) options.onCancel();
    closeNotification();
  };

  const getIcon = (type: NotificationType = 'INFO') => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'ERROR': return <XCircle className="w-8 h-8 text-rose-500" />;
      case 'CONFIRM': return <HelpCircle className="w-8 h-8 text-blue-500" />;
      default: return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, closeNotification }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative bg-slate-900/90 backdrop-blur-[75px] border border-white/15 rounded-3xl p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 text-center ${
                options.type === 'CONFIRM' ? 'border-amber-500/40' : ''
              }`}
            >
              <div className="flex justify-center">
                {options.isProcessing ? (
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                ) : (
                  getIcon(options.type)
                )}
              </div>

              <div className="space-y-2">
                {options.title && (
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {options.title}
                  </h3>
                )}
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  {options.message}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleConfirm}
                  disabled={options.isProcessing}
                  className="w-full py-4 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {options.confirmText || (options.type === 'CONFIRM' ? 'Confirm' : 'Got It')}
                </button>
                {options.type === 'CONFIRM' && (
                  <button
                    onClick={handleCancel}
                    disabled={options.isProcessing}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    {options.cancelText || 'Cancel'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

export const useNotificationModal = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationModal must be used within a NotificationProvider');
  return context;
};

const HelpCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
