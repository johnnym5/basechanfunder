import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Save,
  Loader2,
  Calendar,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';

interface AdminTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export const AdminTimerModal: React.FC<AdminTimerModalProps> = ({ isOpen, onClose, student }) => {
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    expirationDate: '',
    timerCustomMessage: '',
    isTimerActive: false
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    if (student) {
      setFormData({
        expirationDate: student.expirationDate || '',
        timerCustomMessage: student.timerCustomMessage || '',
        isTimerActive: student.isTimerActive || false
      });
    }
  }, [student, isOpen]);

  const handleSave = async () => {
    if (!student) return;
    setIsSubmitting(true);
    try {
      const studentRef = doc(db, 'pof_evaluations', student.id);
      await updateDoc(studentRef, {
        expirationDate: formData.isTimerActive ? formData.expirationDate : null,
        timerCustomMessage: formData.timerCustomMessage || null,
        isTimerActive: formData.isTimerActive,
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (e) {
      console.error('Timer update error:', e);
      alert('Failed to update timer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-lg rounded-[2.5rem] border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'
      }`}>

        <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <div>
            <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>POF Timer Setup</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure account expiration & lockdown</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}>
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Toggle Active */}
          <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${
            formData.isTimerActive
              ? (isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200')
              : (isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200')
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.isTimerActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Activate Expiry Timer</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Lock account after a specific date</p>
              </div>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, isTimerActive: !prev.isTimerActive }))}
              className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.isTimerActive ? 'bg-amber-500' : 'bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 ${formData.isTimerActive ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {formData.isTimerActive && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
              {/* Expiration Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Select Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                  className={`w-full rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-amber-500 transition-all ${
                    isDark ? 'bg-slate-950 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Custom Message */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Expiry Popup Message
                </label>
                <textarea
                  placeholder="e.g. Your evaluation period has ended. Please contact your counselor to extend access."
                  value={formData.timerCustomMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, timerCustomMessage: e.target.value }))}
                  rows={3}
                  className={`w-full rounded-2xl px-5 py-4 text-xs font-medium focus:outline-none focus:border-amber-500 transition-all resize-none ${
                    isDark ? 'bg-slate-950 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                isDark ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}>
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold leading-relaxed italic">
                  Warning: Once the timer hits zero, the student's dashboard will be completely locked and a grayscale overlay will be applied.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className={`flex-1 px-6 py-4 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${
                isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || (formData.isTimerActive && !formData.expirationDate)}
              className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/10 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Commit Timer</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
