import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Briefcase, CreditCard, PieChart, ShieldCheck, Mail, Phone, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  consolidatedBalance?: number;
  holdingProgress?: number;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  userData,
  consolidatedBalance = 0,
  holdingProgress = 0
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem] border shadow-2xl relative ${
            isDark ? 'bg-slate-900/90 border-white/15' : 'bg-white border-slate-200'
          } backdrop-blur-xl`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8 md:p-10 space-y-8">
            {/* Header: Personal Identity */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-amber-500/30 shadow-2xl shadow-amber-500/20 shrink-0">
                {userData.photoURL ? (
                  <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-3xl font-black text-amber-500">
                    {userData.displayName?.[0] || 'S'}
                  </div>
                )}
              </div>
              <div className="text-center md:text-left space-y-1">
                <h2 className={`text-3xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{userData.displayName}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[11px] uppercase tracking-wider">{userData.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[11px] uppercase tracking-wider">{userData.phoneNumber || 'Not Provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visa & Location Card */}
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Origin & Destination</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Current Location</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{userData.homeState || 'N/A'}, {userData.homeCountry || 'N/A'}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Target Destination</p>
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{userData.destinationCountry || 'N/A'}</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                      <span className="text-[10px] font-black text-amber-500 uppercase">{userData.targetCurrencySymbol} {userData.targetCurrency || 'GBP'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sponsorship Card */}
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sponsorship Profile</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Funding Source</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{userData.isSelf ? 'Self-Funded' : 'Sponsored'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Relationship</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{userData.sponsorRelationship || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Ingestion Card */}
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Financial Ingestion</span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Bank Provider</p>
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{userData.bankName || 'Not Linked'}</p>
                    </div>
                    {userData.isVerified && (
                      <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase">Verified</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Ingestion Channel</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{userData.ingestionChannel || 'SMS SYNC'}</p>
                  </div>
                </div>
              </div>

              {/* Proof of Funds Card */}
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-purple-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Compliance Metrics</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Current Balance</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₦{consolidatedBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">28-Day Progress</p>
                      <p className={`text-[9px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{holdingProgress}%</p>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${holdingProgress}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={onClose}
                className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200'
                }`}
              >
                Close Profile
              </button>
              <button className="flex-1 py-4 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-amber-400 shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
                <Info className="w-4 h-4" />
                Request Info Update
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
