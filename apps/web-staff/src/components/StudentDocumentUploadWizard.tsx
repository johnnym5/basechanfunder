import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, Upload, CheckCircle2, Loader2, AlertCircle,
  ArrowRight, ShieldCheck, Download, Trash2, Edit3, Image as ImageIcon,
  File as FileIcon, Rocket, Send, ExternalLink
} from 'lucide-react';
import { doc, getDoc, collection, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

interface RequirementItem {
  id: string;
  label: string;
  type: 'TEXT' | 'IMAGE' | 'DOC' | 'PDF';
  description: string;
  isRequired: boolean;
  stage?: number;
  templateUrl?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentDocumentUploadWizard: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, appUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [globalRequirements, setGlobalRequirements] = useState<RequirementItem[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [draftPdfUrl, setDraftPdfUrl] = useState<string | null>(null);

  // Stage names for header
  const stageInfo = [
    { title: 'Profile & Professional', subtitle: 'Basic Identity Info' },
    { title: 'Identity Proofs', subtitle: 'Supporting Attachments' },
    { title: 'Review & Draft', subtitle: 'Preview Stamped Form' },
    { title: 'Wet Signature', subtitle: 'Sign & Re-upload' },
    { title: 'Final Submission', subtitle: 'Regulatory Dispatch' },
  ];

  const currentStageInfo = stageInfo[currentStage - 1];

  const fetchBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    // Cleanup blob URLs to prevent memory leaks
    return () => {
      if (draftPdfUrl && draftPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(draftPdfUrl);
      }
    };
  }, [draftPdfUrl]);

  const handleGenerateDraft = async () => {
    setIsSubmitting(true);
    try {
      const data: Record<string, any> = {};
      activeRequirements.forEach(req => {
        if (submissions[req.id]) {
          data[req.id] = submissions[req.id].value;
        }
      });

      // Special handling for passport photo base64
      let photoBase64 = '';
      if (data['passport_photo']) {
        photoBase64 = await fetchBase64(data['passport_photo']);
      }

      const payload = {
        accountName: data['account_name'] || '',
        accountNumber: data['account_number'] || '',
        mandateAuthorisation: data['mandate_auth_rule'] || 'SOLE_SIGNATORY',
        bvn: data['signatory_bvn'] || '',
        surname: data['surname'] || '',
        firstName: data['first_name'] || '',
        otherName: data['other_name'] || '',
        identificationType: data['id_type'] || 'INTERNATIONAL_PASSPORT',
        identificationNo: data['id_number'] || '',
        telephoneNo: data['telephone_number'] || '',
        date: new Date().toISOString().split('T')[0],
        passportPhotoBase64: photoBase64
      };

      const response = await fetch('/api/v1/mandate/generate-overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate PDF");
      }

      // ─── PDF Viewer Fix: Handle as Blob & Explicit Headers ───
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          setDraftPdfUrl(result.downloadUrl);
        } else {
          throw new Error(result.message);
        }
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDraftPdfUrl(url);
      }

      toast.success("Mandate draft generated successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Draft generation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFinalPackage = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const signedMandateUrl = submissions['signed_mandate']?.value;
      if (!signedMandateUrl) throw new Error("Missing signed mandate");

      const signedBase64 = await fetchBase64(signedMandateUrl);

      // ─── Enforce Multi-Page Overlay Assembly Pipeline ───
      // Required Sequence: 1. ID Data Page, 2. Utility Bill, 3. NIN Slip, 4. BVN Doc
      const supportingDocsUrls = [
        submissions['id_data_page']?.value,
        submissions['utility_bill']?.value,
        submissions['nin_doc']?.value,
        submissions['bvn_doc']?.value
      ].filter(Boolean);

      const supportingDocsBase64 = await Promise.all(
        supportingDocsUrls.map(url => fetchBase64(url))
      );

      const response = await fetch('/api/v1/mandate/submit-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          signedMandateBase64: signedBase64,
          mandateData: {
            accountName: submissions['account_name']?.value || '',
            accountNumber: submissions['account_number']?.value || '',
            mandateAuthorisation: submissions['mandate_auth_rule']?.value || 'SOLE_SIGNATORY',
            bvn: submissions['signatory_bvn']?.value || '',
            surname: submissions['surname']?.value || '',
            firstName: submissions['first_name']?.value || '',
            otherName: submissions['other_name']?.value || '',
            identificationType: submissions['id_type']?.value || 'INTERNATIONAL_PASSPORT',
            identificationNo: submissions['id_number']?.value || '',
            telephoneNo: submissions['telephone_number']?.value || '',
            date: new Date().toISOString().split('T')[0]
          },
          supportingDocs: supportingDocsBase64
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      toast.success("Regulatory package submitted for review!");
      onClose();
    } catch (e) {
      toast.error("Final submission failed: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch Global Requirements
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'document_requirements'), (snap) => {
      if (snap.exists()) {
        setGlobalRequirements(snap.data().globalRequirements || []);
      }
    });
    return unsub;
  }, []);

  // Fetch current student submissions
  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, 'users', currentUser.uid, 'submitted_documents');
    const unsub = onSnapshot(q, (snap) => {
      const data: Record<string, any> = {};
      snap.docs.forEach(d => {
        data[d.id] = d.data();
      });
      setSubmissions(data);
    });
    return unsub;
  }, [currentUser]);

  const activeRequirements = appUser?.hasCustomRequirements
    ? (appUser.customDocumentRequirements as RequirementItem[])
    : globalRequirements;

  const stageRequirements = activeRequirements.filter(req => (req.stage || 1) === currentStage);
  const totalStages = 5;

  const isStageComplete = currentStage === 3 ? true : // Stage 3 is preview
    currentStage === 5 ? true :
    stageRequirements.every(req => {
      if (!req.isRequired) return true;
      return submissions[req.id]?.status === 'PENDING_REVIEW' || submissions[req.id]?.status === 'APPROVED';
    });

  const handleFileUpload = async (requirementId: string, file: File) => {
    if (!currentUser) return;

    // Size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setUploadingId(requirementId);
    setUploadProgress(0);

    const fileExt = file.name.split('.').pop();
    const storagePath = `student_documents/${currentUser.uid}/${requirementId}_${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        toast.error('Upload failed: ' + error.message);
        setUploadingId(null);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const subRef = doc(db, 'users', currentUser.uid, 'submitted_documents', requirementId);
        await setDoc(subRef, {
          requirementId,
          value: downloadURL,
          fileType: file.type,
          fileName: file.name,
          storagePath,
          status: 'PENDING_REVIEW',
          updatedAt: serverTimestamp()
        });

        // Trigger Profile/Ledger Sync
        const reqItem = activeRequirements.find(r => r.id === requirementId);
        if (reqItem?.stage === 1 || reqItem?.stage === 2) {
           fetch(`/api/v1/mandate/sync-profile/${currentUser.uid}`, { method: 'POST' })
             .catch(err => console.warn("Sync deferred:", err));
        }

        toast.success('Document uploaded for review');
        setUploadingId(null);
      }
    );
  };

  const handleTextSubmit = async (requirementId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    try {
      const subRef = doc(db, 'users', currentUser.uid, 'submitted_documents', requirementId);
      await setDoc(subRef, {
        requirementId,
        value: text.trim(),
        status: 'PENDING_REVIEW',
        updatedAt: serverTimestamp()
      });

      // Trigger Profile/Ledger Sync
      const reqItem = activeRequirements.find(r => r.id === requirementId);
      if (reqItem?.stage === 1 || reqItem?.stage === 2) {
         fetch(`/api/v1/mandate/sync-profile/${currentUser.uid}`, { method: 'POST' })
           .catch(err => console.warn("Sync deferred:", err));
      }

      toast.success('Response saved');
    } catch (err: any) {
      toast.error('Failed to save response');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Compliance Documents</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Stage {currentStage} of {totalStages}: {currentStageInfo?.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500"><X className="w-6 h-6" /></button>
        </header>

        {/* Stage Indicator */}
        <div className="px-8 pt-4 flex gap-2">
          {stageInfo.map((s, i) => (
             <div
               key={i}
               className={`h-1.5 flex-1 rounded-full transition-all ${
                 i + 1 === currentStage ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' :
                 i + 1 < currentStage ? 'bg-emerald-500/50' : 'bg-white/5'
               }`}
             />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar touch-pan-y">
          {(currentStage <= 2 || currentStage === 4) && (
            <div className="space-y-6">
              {stageRequirements.length === 0 ? (
                <div className="py-20 text-center opacity-30">
                  <ShieldCheck className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No items required for this stage</p>
                </div>
              ) : (
                stageRequirements.map((req) => {
                  const submission = submissions[req.id];
                  const isUploading = uploadingId === req.id;

                  return (
                    <div key={req.id} className={`p-6 rounded-3xl border transition-all ${
                      submission ? (
                        submission.status === 'APPROVED' ? 'bg-emerald-500/5 border-emerald-500/20' :
                        submission.status === 'REJECTED' ? 'bg-rose-500/5 border-rose-500/20' :
                        'bg-blue-600/5 border-blue-500/20 shadow-lg shadow-blue-500/5'
                      ) : 'bg-white/5 border-white/5'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{req.type}</p>
                            {req.isRequired && <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[6px] font-black uppercase">Mandatory</span>}
                          </div>
                          <h4 className="text-base font-black text-white uppercase tracking-tight">{req.label}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{req.description}</p>
                            {req.templateUrl && (
                              <a
                                href={req.templateUrl}
                                download
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg shrink-0"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download Template</span>
                              </a>
                            )}
                          </div>
                        </div>
                        {submission && (
                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${
                            submission.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                            submission.status === 'REJECTED' ? 'bg-rose-500 text-white' :
                            'bg-blue-600 text-white animate-pulse'
                          }`}>
                            {submission.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {/* Inputs */}
                      <div className="space-y-4">
                        {req.type === 'TEXT' ? (
                          <div className="space-y-3">
                            <textarea
                              defaultValue={submission?.value || ''}
                              onBlur={(e) => handleTextSubmit(req.id, e.target.value)}
                              placeholder="Type your response here..."
                              disabled={submission?.status === 'APPROVED'}
                              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                              rows={3}
                            />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {submission ? (
                               <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
                                 <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                                       {req.type === 'IMAGE' ? <ImageIcon className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                       <p className="text-[10px] font-bold text-white uppercase truncate">{submission.fileName || 'Document Node'}</p>
                                       <p className="text-[8px] text-slate-500 font-mono uppercase">{submission.updatedAt?.seconds ? new Date(submission.updatedAt.seconds * 1000).toLocaleString() : 'Just now'}</p>
                                    </div>
                                 </div>
                                 {submission.status !== 'APPROVED' && (
                                   <label className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-600 text-white transition-all cursor-pointer shadow-lg">
                                      <Upload className="w-4 h-4" />
                                      <input type="file" className="hidden" accept={req.type === 'IMAGE' ? 'image/*' : req.type === 'PDF' ? '.pdf' : '.doc,.docx'} onChange={e => e.target.files?.[0] && handleFileUpload(req.id, e.target.files[0])} />
                                   </label>
                                 )}
                               </div>
                            ) : (
                              <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all hover:bg-white/5 ${isUploading ? 'pointer-events-none' : ''}`}>
                                 {isUploading ? (
                                   <div className="w-full space-y-4">
                                      <div className="flex justify-between items-end px-2">
                                         <span className="text-[10px] font-black text-blue-500 uppercase">Encrypting & Routing...</span>
                                         <span className="text-xs font-black text-white font-mono">{Math.round(uploadProgress)}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                         <motion.div className="h-full bg-blue-600" animate={{ width: `${uploadProgress}%` }} />
                                      </div>
                                   </div>
                                 ) : (
                                   <>
                                     <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-3 shadow-lg">
                                        <Upload className="w-6 h-6" />
                                     </div>
                                     <p className="text-[10px] font-black uppercase text-white tracking-widest">Click to upload {req.type}</p>
                                     <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Maximum file size: 10MB</p>
                                   </>
                                 )}
                                 <input type="file" className="hidden" accept={req.type === 'IMAGE' ? 'image/*' : req.type === 'PDF' ? '.pdf' : '.doc,.docx'} onChange={e => e.target.files?.[0] && handleFileUpload(req.id, e.target.files[0])} />
                              </label>
                            )}
                          </div>
                        )}

                        {submission?.status === 'REJECTED' && submission.rejectionReason && (
                          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest">Feedback from Inspector</p>
                                <p className="text-[11px] font-medium leading-relaxed mt-1 opacity-90">{submission.rejectionReason}</p>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* STAGE 3: PDF Preview & Download */}
          {currentStage === 3 && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mx-auto shadow-2xl shadow-blue-500/10">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Review Stamped Mandate</h3>
                <p className="text-sm font-medium text-slate-400 max-w-md mx-auto leading-relaxed">
                  We've mapped your Stage 1 details and Passport Photo onto the official template. Review for accuracy before signing.
                </p>
              </div>

              {draftPdfUrl ? (
                <div className="aspect-[4/5] w-full rounded-3xl overflow-hidden border border-white/10 bg-black/40 relative group">
                  <iframe
                    src={`${draftPdfUrl}#view=FitH&toolbar=0`}
                    className="w-full h-full border-none"
                    title="Mandate Preview"
                    onError={() => toast.error("Failed to load PDF preview. Please try downloading instead.")}
                  />

                  {/* Fallback View Action for Iframe Failures */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => window.open(draftPdfUrl, '_blank')}
                      className="p-2 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-lg text-white"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/5] w-full rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
                   <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Processing Regulatory Stamping...</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStage(1)}
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Details
                </button>
                <a
                  href={draftPdfUrl || '#'}
                  download={`Account_Mandate_${appUser?.displayName}.pdf`}
                  className="flex-[2] py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download to Print & Sign
                </a>
              </div>
            </div>
          )}

          {/* STAGE 5: Final Submission Status */}
          {currentStage === 5 && (
            <div className="text-center py-12 space-y-8 animate-in fade-in duration-500">
               <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto shadow-2xl shadow-emerald-500/20">
                  <Rocket className="w-12 h-12" />
               </div>
               <div className="space-y-3">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">Ready for Dispatch</h3>
                  <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Your wet-signed mandate and all 4 attachments will now be compiled into a secure master regulatory package.
                  </p>
               </div>

               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-4 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <span className="text-[10px] font-black uppercase text-slate-300">Regulatory PDF Compilation</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Governance Review Queue</span>
                  </div>
               </div>

               <button
                 onClick={handleSubmitFinalPackage}
                 disabled={isSubmitting}
                 className="w-full max-w-sm py-5 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-2xl font-black text-base uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
               >
                 {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                 Submit Final Package
               </button>
            </div>
          )}
        </div>

        <footer className="p-8 border-t border-white/5 bg-slate-950/40 flex gap-4">
           {currentStage > 1 && currentStage < 5 && (
             <button
               onClick={() => setCurrentStage(s => s - 1)}
               className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all border border-white/5"
             >
               Previous Stage
             </button>
           )}
           {currentStage < totalStages ? (
             <button
               onClick={() => {
                 if (currentStage === 2) handleGenerateDraft();
                 setCurrentStage(s => s + 1);
               }}
               disabled={!isStageComplete || isSubmitting}
               className="flex-[2] py-4 bg-blue-600 disabled:opacity-30 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
             >
               <span>{currentStage === 2 ? 'Review Stamped Form' : 'Continue'}</span>
               <ArrowRight className="w-4 h-4" />
             </button>
           ) : (
             <button
               onClick={onClose}
               className="flex-1 py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
             >
               Return to Dashboard
             </button>
           )}
        </footer>
      </motion.div>
    </div>
  );
};
