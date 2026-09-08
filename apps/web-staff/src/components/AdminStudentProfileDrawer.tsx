import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Flag, CheckCircle2, User, Globe, CreditCard,
  Save, Loader2, TrendingUp, Sliders, Activity,
  Clock, History, ShieldAlert, ChevronRight, Zap,
  FileText, Plus, Trash2, Edit3, ShieldCheck, Download,
  ExternalLink, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  doc, updateDoc, collection, query, where, orderBy,
  limit, onSnapshot, serverTimestamp, getDoc, getDocs, setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

interface AdminStudentProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onUpdate?: () => void;
  initialTab?: 'profile' | 'activity' | 'documents';
  highlightEventId?: string | null;
}

interface RequirementItem {
  id: string;
  label: string;
  type: 'TEXT' | 'IMAGE' | 'DOC' | 'PDF';
  description: string;
  isRequired: boolean;
  stage?: number;
  templateUrl?: string;
}

export const AdminStudentProfileDrawer: React.FC<AdminStudentProfileDrawerProps> = ({
  isOpen,
  onClose,
  student,
  onUpdate,
  initialTab = 'profile',
  highlightEventId = null
}) => {
  const { theme } = useTheme();
  const { appUser } = useAuth();
  const isDark = theme === 'dark';
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'documents'>(initialTab);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Document Requirement States
  const [globalRequirements, setGlobalRequirements] = useState<RequirementItem[]>([]);
  const [hasCustomRequirements, setHasCustomRequirements] = useState(student?.hasCustomRequirements || false);
  const [customRequirements, setCustomRequirements] = useState<RequirementItem[]>(student?.customDocumentRequirements || []);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<RequirementItem | null>(null);

  const [editForm, setEditForm] = useState({
    phoneNumber: student?.phoneNumber || '',
    sponsorRelationship: student?.sponsorRelationship || '',
    isVerified: student?.isVerified || false,
    topUpFeePercentage: student?.topUpPricingConfig?.topUpFeePercentage || 2.5,
    flatProcessingFeeNgn: student?.topUpPricingConfig?.flatProcessingFeeNgn || 5000,
    maxAllowedTopUpNgn: student?.topUpPricingConfig?.maxAllowedTopUpNgn || 15000000
  });

  // Sync tab and form if props change
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (student) {
      setEditForm({
        phoneNumber: student.phoneNumber || '',
        sponsorRelationship: student.sponsorRelationship || '',
        isVerified: student.isVerified || false,
        topUpFeePercentage: student.topUpPricingConfig?.topUpFeePercentage || 2.5,
        flatProcessingFeeNgn: student.topUpPricingConfig?.flatProcessingFeeNgn || 5000,
        maxAllowedTopUpNgn: student.topUpPricingConfig?.maxAllowedTopUpNgn || 15000000
      });
      setHasCustomRequirements(student.hasCustomRequirements || false);
      setCustomRequirements(student.customDocumentRequirements || []);
    }
  }, [student]);

  // Fetch Global Requirements
  useEffect(() => {
    if (!isOpen || activeTab !== 'documents') return;
    const unsub = onSnapshot(doc(db, 'system_config', 'document_requirements'), (snap) => {
      if (snap.exists()) {
        setGlobalRequirements(snap.data().globalRequirements || []);
      }
    });
    return unsub;
  }, [isOpen, activeTab]);

  // Fetch Submissions
  useEffect(() => {
    if (!isOpen || !student || activeTab !== 'documents') return;
    const q = query(collection(db, 'users', student.userId || student.id, 'submitted_documents'));
    const unsub = onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [isOpen, student, activeTab]);

  // Fetch Audit Logs when activeTab is 'activity'
  useEffect(() => {
    if (!isOpen || !student || activeTab !== 'activity') return;

    setLoadingLogs(true);
    const q = query(
      collection(db, 'audit_logs'),
      where('studentId', '==', student.userId || student.id),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingLogs(false);
    }, (err) => {
      console.error("Audit log error:", err);
      setLoadingLogs(false);
    });

    return unsub;
  }, [isOpen, student, activeTab]);

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
        hasCustomRequirements,
        customDocumentRequirements: customRequirements,
        updatedAt: serverTimestamp()
      });
      toast.success('Student profile updated successfully');
      if (onUpdate) onUpdate();
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
        approvedAt: serverTimestamp()
      });
      toast.success('Student account approved');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error('Failed to approve student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCustom = () => {
    if (!hasCustomRequirements) {
      // Cloning global requirements into custom ones
      setCustomRequirements([...globalRequirements]);
    }
    setHasCustomRequirements(!hasCustomRequirements);
  };

  const handleAddCustomRequirement = (req: RequirementItem) => {
    setCustomRequirements(prev => [...prev, req]);
  };

  const handleUpdateCustomRequirement = (req: RequirementItem) => {
    setCustomRequirements(prev => prev.map(item => item.id === req.id ? req : item));
  };

  const handleDeleteCustomRequirement = (id: string) => {
    setCustomRequirements(prev => prev.filter(item => item.id !== id));
  };

  const handleReviewSubmission = async (requirementId: string, status: 'APPROVED' | 'REJECTED', reason: string | null = null) => {
    try {
      const subRef = doc(db, 'users', student.userId || student.id, 'submitted_documents', requirementId);
      await updateDoc(subRef, {
        status,
        rejectionReason: reason,
        reviewedAt: serverTimestamp(),
        reviewedBy: appUser?.email || 'Admin'
      });
      toast.success(`Document marked as ${status}`);
    } catch (err: any) {
      toast.error('Review failed: ' + err.message);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && student && (
        <div className="fixed inset-0 z-[600] flex justify-end bg-slate-950/40 backdrop-blur-md" onClick={onClose}>
          <motion.div
            key={`drawer-${student.userId || student.id}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 h-screen w-full max-w-[420px] bg-slate-900/60 backdrop-blur-[75px] border-l border-white/15 z-50 flex flex-col overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.5)] rounded-l-3xl transition-colors duration-500"
            onClick={e => e.stopPropagation()}
          >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/40">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Governance Review</h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Configuration Mode: {student.name || student.displayName}</p>
            </div>
            <button onClick={onClose} aria-label="Close governance review" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-all shadow-sm">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 pt-6 gap-2">
            {[
              { id: 'profile', label: 'Student Profile', icon: User },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'activity', label: 'Activity History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            {activeTab === 'profile' && (
              <>
                {/* Identity Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <User className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Personal Identity</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Display Name</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{student.name || student.displayName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Email Address</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{student.email}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Phone Number</p>
                      <input
                        type="text"
                        value={editForm.phoneNumber}
                        onChange={e => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Target */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Route & Target</h4>
                  </div>
                  <div className="bg-white/40 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl p-6 grid grid-cols-2 gap-6 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase">Origin</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {student.homeState || 'N/A'}, {student.homeCountry || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase">Destination</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{student.destinationCountry || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase">Target Currency</p>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 dark:text-amber-500 text-lg font-black">{student.targetCurrencySymbol || '£'}</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{student.targetCurrency || 'GBP'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top-Up Pricing Config */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Top-Up Pricing</h4>
                  </div>
                  <div className="bg-white/40 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Service Fee (%)</label>
                        <span className="text-sm font-black text-accent-gold dark:text-amber-500">{editForm.topUpFeePercentage}%</span>
                      </div>
                      <input
                        type="range" min="0.5" max="15" step="0.1"
                        value={editForm.topUpFeePercentage}
                        onChange={(e) => setEditForm(prev => ({ ...prev, topUpFeePercentage: parseFloat(e.target.value) }))}
                        className="w-full accent-amber-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Flat Admin Fee (₦)</label>
                        <input
                          type="number"
                          value={editForm.flatProcessingFeeNgn}
                          onChange={(e) => setEditForm(prev => ({ ...prev, flatProcessingFeeNgn: parseInt(e.target.value) }))}
                          className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Max Allocation (₦)</label>
                        <input
                          type="number"
                          value={editForm.maxAllowedTopUpNgn}
                          onChange={(e) => setEditForm(prev => ({ ...prev, maxAllowedTopUpNgn: parseInt(e.target.value) }))}
                          className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Master Package Dispatch */}
                {student.compiledPackageUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Master Regulatory Package</h4>
                    </div>
                    <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col gap-4">
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
                        A unified 6-page PDF has been compiled for this student including the signed upgrade form and all identity proofs.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => window.open(student.compiledPackageDownloadUrl || student.compiledPackageUrl, '_blank')}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review Package
                        </button>
                        <a
                          href={student.compiledPackageDownloadUrl || student.compiledPackageUrl}
                          download={`Package_${student.name || 'User'}.pdf`}
                          className="flex-1 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Status */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Financial Setup</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Primary Bank</p>
                        <p className="text-sm font-bold text-white">{student.bankName || 'Not Linked'}</p>
                      </div>
                      <button
                        onClick={() => setEditForm(prev => ({ ...prev, isVerified: !prev.isVerified }))}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          editForm.isVerified
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                        }`}
                      >
                        {editForm.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Inheritance Toggle */}
                <div className={`p-6 rounded-[2rem] border transition-all ${
                  hasCustomRequirements ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-600/5 border-blue-500/20'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${hasCustomRequirements ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                           {hasCustomRequirements ? <Sliders className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div>
                           <p className={`text-[10px] font-black uppercase tracking-widest ${hasCustomRequirements ? 'text-amber-500' : 'text-blue-500'}`}>
                             {hasCustomRequirements ? 'Student-Level Overrides Active' : 'Inheriting System Defaults'}
                           </p>
                           <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                             {hasCustomRequirements ? 'Manual document checklist defined for this user' : 'Synchronized with global master requirement list'}
                           </p>
                        </div>
                     </div>
                     <button
                       onClick={handleToggleCustom}
                       className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all ${
                         hasCustomRequirements ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-blue-600 text-white shadow-lg'
                       }`}
                     >
                       {hasCustomRequirements ? 'Revert to Global' : 'Customize List'}
                     </button>
                  </div>
                </div>

                {/* Requirements Configuration (Only shown if custom) */}
                {hasCustomRequirements && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Document Checklist Configuration</h5>
                      <button
                        onClick={() => { setEditingRequirement(null); setIsRequirementModalOpen(true); }}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {customRequirements.map((req, idx) => (
                        <div key={req.id || `custom-${idx}`} className="p-4 glass-subcard flex items-center justify-between group">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="min-w-0">
                               <p className="text-xs font-bold text-white truncate">{req.label}</p>
                               <p className="text-[9px] text-slate-500 font-mono uppercase">{req.type} {req.isRequired && '• Mandatory'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingRequirement(req); setIsRequirementModalOpen(true); }} className="p-1.5 hover:bg-white/5 rounded text-blue-400"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteCustomRequirement(req.id)} className="p-1.5 hover:bg-rose-500/10 rounded text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submissions Review Area */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Student Submissions</h5>
                  {(hasCustomRequirements ? customRequirements : globalRequirements).map((req, idx) => {
                    const submission = submissions.find(s => s.requirementId === req.id);
                    return (
                      <div key={req.id || `req-${idx}`} className={`p-6 rounded-[2rem] border transition-all ${
                        submission ? (
                          submission.status === 'APPROVED' ? 'bg-emerald-500/5 border-emerald-500/20' :
                          submission.status === 'REJECTED' ? 'bg-rose-500/5 border-rose-500/20' :
                          'bg-blue-600/5 border-blue-500/30 shadow-lg shadow-blue-500/5'
                        ) : 'bg-white/5 border-white/5 opacity-60'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{req.type}</p>
                            <h6 className="text-sm font-black text-white uppercase tracking-tight leading-none">{req.label}</h6>
                          </div>
                          {submission ? (
                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${
                              submission.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                              submission.status === 'REJECTED' ? 'bg-rose-500 text-white' :
                              'bg-blue-600 text-white animate-pulse'
                            }`}>
                              {submission.status.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-[7px] font-black text-slate-600 uppercase">Awaiting Submission</span>
                          )}
                        </div>

                        {submission && (
                          <div className="space-y-4">
                            {req.type === 'TEXT' ? (
                              <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 text-xs text-slate-300 font-medium leading-relaxed italic">
                                "{submission.value}"
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                                      {req.type === 'IMAGE' ? <Activity className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-bold text-white uppercase">Binary Payload</p>
                                      <p className="text-[8px] text-slate-500 font-mono uppercase">{submission.fileType || 'File Node'}</p>
                                   </div>
                                </div>
                                <a
                                  href={submission.value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-600 text-white transition-all shadow-lg"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}

                            {submission.status === 'PENDING_REVIEW' && (
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                  onClick={() => handleReviewSubmission(req.id, 'APPROVED')}
                                  className="py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                  Verify & Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt("Reason for rejection:");
                                    if (reason) handleReviewSubmission(req.id, 'REJECTED', reason);
                                  }}
                                  className="py-3 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                                >
                                  Reject Document
                                </button>
                              </div>
                            )}

                            {submission.status === 'REJECTED' && submission.rejectionReason && (
                              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                 <p className="text-[9px] font-bold uppercase truncate">Reason: {submission.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Audit Trail</h4>
                </div>

                {loadingLogs ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading History...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                    <History className="w-12 h-12" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Activity Logged</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log, idx) => {
                      const isHighlighted = highlightEventId && log.id === highlightEventId;
                      return (
                        <div
                          key={log.id || `log-${idx}`}
                          className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                            isHighlighted
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {isHighlighted && (
                            <div className="absolute top-0 right-0 p-2">
                              <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{log.action || 'Event'}</span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">
                              {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'Now'}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-200 leading-relaxed">{log.detail || log.message}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center">
                              <User className="w-2 h-2 text-slate-500" />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Actor: {log.actor || 'System'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-white/5 space-y-3 sticky bottom-0 z-20 backdrop-blur-xl bg-slate-900/80">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
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
    )}
    <RequirementItemModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        requirement={editingRequirement}
        onSave={(req) => {
          if (editingRequirement) handleUpdateCustomRequirement(req);
          else handleAddCustomRequirement(req);
          setIsRequirementModalOpen(false);
        }}
      />
    </AnimatePresence>
  );
};

const RequirementItemModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  requirement: RequirementItem | null;
  onSave: (req: RequirementItem) => void;
}> = ({ isOpen, onClose, requirement, onSave }) => {
  const [form, setForm] = useState<RequirementItem>({
    id: '',
    label: '',
    type: 'PDF',
    description: '',
    isRequired: true,
    templateUrl: ''
  });

  useEffect(() => {
    if (requirement) setForm({ ...requirement, templateUrl: requirement.templateUrl || '' });
    else setForm({ id: Math.random().toString(36).substr(2, 9), label: '', type: 'PDF', description: '', isRequired: true, templateUrl: '' });
  }, [requirement, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="glass-card w-full max-w-md animate-in zoom-in-95 duration-300 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">{requirement ? 'Edit' : 'Add'} Custom Requirement</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure student-specific check item</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Field Label</label>
              <input
                value={form.label}
                onChange={e => setForm({...form, label: e.target.value})}
                placeholder="e.g. Sponsor Bank Statement"
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Input Type</label>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value as any})}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none"
              >
                <option value="TEXT">Text Input / Response</option>
                <option value="IMAGE">Image (.jpg, .png)</option>
                <option value="DOC">Word Document (.doc, .docx)</option>
                <option value="PDF">PDF File (.pdf)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instruction / Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Instructions for the student..."
                rows={3}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Template Download URL (Optional)</label>
              <input
                value={form.templateUrl}
                onChange={e => setForm({...form, templateUrl: e.target.value})}
                placeholder="e.g. /downloads/template.pdf"
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center justify-between p-4 glass-subcard">
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Mandatory Requirement</p>
                <p className="text-[8px] text-slate-500 uppercase font-bold mt-0.5">Blocking if not submitted</p>
              </div>
              <button
                onClick={() => setForm({...form, isRequired: !form.isRequired})}
                className={`w-12 h-6 rounded-full transition-all relative ${form.isRequired ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${form.isRequired ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
          <button
            onClick={() => onSave(form)}
            disabled={!form.label}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {requirement ? 'Commit Requirement Change' : 'Incorporate into Custom List'}
          </button>
        </div>
      </div>
    </div>
  );
};
