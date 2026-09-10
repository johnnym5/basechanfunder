import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X as XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('basechan_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('basechan_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[1000] flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-4xl glass-card p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 pointer-events-auto border-blue-500/30 overflow-hidden">
            <div className="flex items-center gap-4 text-left w-full">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Privacy Consent</p>
                <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  We use secure tokens to protect your financial data. By continuing, you agree to our <Link to="/legal/cookies" className="text-blue-500 underline font-bold">Cookie Policy</Link>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={handleAccept}
                className="flex-1 md:flex-none whitespace-nowrap px-6 md:px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
              >
                Accept All
              </button>
              <Link
                to="/legal/cookies"
                className="flex-1 md:flex-none whitespace-nowrap px-6 md:px-8 py-3 bg-white/5 border border-white/10 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-center transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
