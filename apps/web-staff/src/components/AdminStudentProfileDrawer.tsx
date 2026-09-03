import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, CheckCircle2, User, Globe, CreditCard, Save, Loader2, TrendingUp, Sliders } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

interface AdminStudentProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onUpdate?: () => void;
}

export const AdminStudentProfileDrawer: React.FC<AdminStudentProfileDrawerProps> = ({
  isOpen,
  onClose,
  student,
  onUpdate
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    phoneNumber: student?.phoneNumber || '',
    sponsorRelationship: student?.sponsorRelationship || '',
    isVerified: student?.isVerified || false,
    topUpFeePercentage: student?.topUpPricingConfig?.topUpFeePercentage || 2.5,
    flatProcessingFeeNgn: student?.topUpPricingConfig?.flatProcessingFeeNgn || 5000,
    maxAllowedTopUpNgn: student?.topUpPricingConfig?.maxAllowedTopUpNgn || 15000000
  });

  // Re-sync form if student changes
  React.useEffect(() => {
    if (student) {
      setEditForm({
        phoneNumber: student.phoneNumber || '',
        sponsorRelationship: student.sponsorRelationship || '',
        isVerified: student.isVerified || false,
        topUpFeePercentage: student.topUpPricingConfig?.topUpFeePercentage || 2.5,
        flatProcessingFeeNgn: student.topUpPricingConfig?.flatProcessingFeeNgn || 5000,
        maxAllowedTopUpNgn: student.topUpPricingConfig?.maxAllowedTopUpNgn || 15000000
      });
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', student.userId || student.id), {
        phoneNumber: editForm.phoneNumber,
        sponsorRelationship: editForm.sponsorRelationship,
        isVerified: editForm.isVerified,
        topUpPricingConfig: {
          topUpFeePercentage: Number(editForm.topUpFeePercentage),
          flatProcessingFeeNgn: Number(editForm.flatProcessingFeeNgn),
          maxAllowedTopUpNgn: Number(editForm.maxAllowedTopUpNgn),
          updatedAt: new Date()
        },
        updatedAt: new Date()
      });
      toast.success('Student profile updated successfully');
      if (onUpdate) onUpdate();
      onClose();
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', student.userId || student.id), {
        isApproved: true,
        approvedAt: new Date()
      });
      toast.success('Student account approved');
      if (onUpdate) onUpdate();
      onClose();
    } catch (error: any) {
      toast.error('Failed to approve student');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex justify-end bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed right-0 top-0 bottom-0 h-screen w-full max-w-[420px] backdrop-blur-2xl border-l rounded-l-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-y-auto transition-colors duration-500 ${
            isDark ? 'bg-slate-900/75 border-white/15 text-slate-100' : 'bg-white/80 border-slate-200 text-slate-900'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b flex justify-between items-center sticky top-0 z-20 backdrop-blur-xl transition-colors ${
            isDark ? 'bg-slate-950/20 border-white/5' : 'bg-white/40 border-slate-100'
          }`}>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Governance Review</h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Full Compliance Profile Inspector</p>
            </div>
            <button onClick={onClose} className={`p-2.5 rounded-xl transition-all ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Identity Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Personal Identity</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Display Name</p>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.name || student.displayName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Email Address</p>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.email}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Phone Number (Editable)</p>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={e => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className={`w-full bg-transparent border-b text-sm font-bold py-2 focus:outline-none focus:border-amber-500 transition-colors ${
                      isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Location & Target */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-500" />
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Route & Target</h4>
              </div>
              <div className={`grid grid-cols-2 gap-6 p-6 rounded-[2rem] border ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm'
              }`}>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Origin</p>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {student.homeState || 'N/A'}, {student.homeCountry || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Destination</p>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.destinationCountry || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Target Currency</p>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-lg font-black">{student.targetCurrencySymbol}</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.targetCurrency || 'GBP'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-Up Pricing Config */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sliders className="w-5 h-5 text-blue-500" />
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Top-Up Pricing & Fees</h4>
              </div>
              <div className={`p-6 rounded-[2rem] border space-y-6 ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Fee (%)</label>
                    <span className="text-sm font-black text-blue-500">{editForm.topUpFeePercentage}%</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <input
                      type="range" min="0.5" max="15" step="0.1"
                      value={editForm.topUpFeePercentage}
                      onChange={(e) => setEditForm(prev => ({ ...prev, topUpFeePercentage: parseFloat(e.target.value) }))}
                      className="flex-1 accent-blue-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={editForm.topUpFeePercentage}
                      onChange={(e) => setEditForm(prev => ({ ...prev, topUpFeePercentage: parseFloat(e.target.value) }))}
                      className={`w-20 bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-center focus:outline-none focus:border-blue-500 ${isDark ? 'text-white' : 'text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Flat Admin Fee (₦)</label>
                    <input
                      type="number"
                      value={editForm.flatProcessingFeeNgn}
                      onChange={(e) => setEditForm(prev => ({ ...prev, flatProcessingFeeNgn: parseInt(e.target.value) }))}
                      className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-blue-500 ${isDark ? 'text-white' : 'text-slate-900'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Allocation (₦)</label>
                    <input
                      type="number"
                      value={editForm.maxAllowedTopUpNgn}
                      onChange={(e) => setEditForm(prev => ({ ...prev, maxAllowedTopUpNgn: parseInt(e.target.value) }))}
                      className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-blue-500 ${isDark ? 'text-white' : 'text-slate-900'}`}
                    />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing Preview (e.g. ₦1,000,000 top-up)</p>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-tighter">Calculated Fee</span>
                    <span className="text-blue-400">₦{((1000000 * (editForm.topUpFeePercentage / 100)) + editForm.flatProcessingFeeNgn).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Financial Setup</h4>
              </div>
              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm'
                }`}>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Bank Name</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.bankName || 'Not Linked'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Status:</span>
                    <button
                      onClick={() => setEditForm(prev => ({ ...prev, isVerified: !prev.isVerified }))}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        editForm.isVerified
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                      }`}
                    >
                      {editForm.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Sponsor Relationship (Editable)</p>
                  <select
                    value={editForm.sponsorRelationship}
                    onChange={e => setEditForm(prev => ({ ...prev, sponsorRelationship: e.target.value }))}
                    className={`w-full bg-transparent border-b text-sm font-bold py-2 focus:outline-none focus:border-amber-500 transition-colors ${
                      isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Self">Self</option>
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={`p-8 border-t space-y-3 sticky bottom-0 z-20 backdrop-blur-xl ${
            isDark ? 'bg-slate-900/95 border-white/5' : 'bg-white/95 border-slate-100'
          }`}>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isDark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
              {!student.isApproved && (
                <button
                  onClick={handleApprove}
                  disabled={isSaving}
                  className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Access
                </button>
              )}
            </div>
            <button className="w-full py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2">
              <Flag className="w-4 h-4" />
              Flag Low Funds
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
