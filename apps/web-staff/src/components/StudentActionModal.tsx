import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Save,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  User,
  Calculator,
  Calendar,
  Building2
} from 'lucide-react';
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  collection
} from 'firebase/firestore';
import { db } from '../firebase';

interface StudentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess: () => void;
}

const COUNSELORS = [
  'Julian Morgan',
  'Dr. Sarah Connor',
  'Marcus Wright',
  'Kyle Reese',
  'Unassigned'
];

export const StudentActionModal: React.FC<StudentActionModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'delete'>('edit');
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    currentBalanceNgn: 0,
    targetBalanceNgn: 19200000,
    holdingDays: 0,
    targetHoldingDays: 28,
    counselor: 'Unassigned'
  });

  useEffect(() => {
    if (student) {
      // Map Firestore fields to our form fields
      // Note: We'll store these specific names in the document now to match requirement
      setFormData({
        currentBalanceNgn: student.currentBalanceNgn || (student.currentBalanceGBP ? student.currentBalanceGBP * 1945.5 : 0),
        targetBalanceNgn: student.targetBalanceNgn || student.targetGBP * 1945.5 || 19200000,
        holdingDays: student.consecutiveDays || 0,
        targetHoldingDays: student.targetHoldingDays || 28,
        counselor: student.counselor || 'Unassigned'
      });
    }
  }, [student]);

  const daysLeft = useMemo(() => {
    const left = formData.targetHoldingDays - formData.holdingDays;
    return left > 0 ? left : 0;
  }, [formData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const studentRef = doc(db, 'pof_evaluations', student.id);

      // Calculate a new startDate based on holdingDays to keep existing logic compatible
      const newStart = new Date();
      newStart.setDate(newStart.getDate() - formData.holdingDays + 1);

      await updateDoc(studentRef, {
        ...formData,
        startDate: newStart.toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      });

      // Log the action
      await addDoc(collection(db, 'audit_logs'), {
        actor: 'Staff',
        action: 'UPDATE_STUDENT',
        detail: `Updated parameters for ${student.name}`,
        createdAt: serverTimestamp()
      });

      onSuccess();
      onClose();
    } catch (e) {
      console.error('Update error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, 'pof_evaluations', student.id));

      // Log the action
      await addDoc(collection(db, 'audit_logs'), {
        actor: 'Staff',
        action: 'DELETE_STUDENT',
        detail: `Deleted profile for ${student.name} (${student.id})`,
        createdAt: serverTimestamp()
      });

      onSuccess();
      onClose();
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0A0F1E] border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Student Action</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{student.name} — {student.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6">
          <div className="flex items-center space-x-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Parameters
            </button>
            <button
              onClick={() => setActiveTab('delete')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'delete' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Profile
            </button>
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'edit' ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Available (₦)</label>
                  <input
                    type="number"
                    value={formData.currentBalanceNgn}
                    onChange={e => setFormData({...formData, currentBalanceNgn: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Required (₦)</label>
                  <input
                    type="number"
                    value={formData.targetBalanceNgn}
                    onChange={e => setFormData({...formData, targetBalanceNgn: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Days Done</label>
                  <input
                    type="number"
                    value={formData.holdingDays}
                    onChange={e => setFormData({...formData, holdingDays: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Days</label>
                  <input
                    type="number"
                    value={formData.targetHoldingDays}
                    onChange={e => setFormData({...formData, targetHoldingDays: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Counselor in Charge</label>
                <select
                  value={formData.counselor}
                  onChange={e => setFormData({...formData, counselor: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                >
                  {COUNSELORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Projection</p>
                    <p className="text-xs font-bold text-slate-200">{daysLeft} days remaining until maturity</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </form>
          ) : (
            <div className="space-y-8 py-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Trash2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase">Confirm Deletion</h4>
                  <p className="text-sm text-slate-400 mt-2">
                    Are you sure you want to delete the profile for <br />
                    <span className="text-white font-bold">{student.name}</span>?
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">ID: {student.id}</p>
                </div>
              </div>

              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-[10px] font-medium text-rose-400/80 leading-relaxed italic">
                  This action is irreversible. All compliance tracking data for this student will be permanently removed from the ledger.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('edit')}
                  className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-rose-600/20"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Delete Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
