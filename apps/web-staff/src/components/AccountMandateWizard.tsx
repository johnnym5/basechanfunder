import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Download, Send,
  Loader2, CheckCircle2, FileText, ShieldCheck,
  Rocket, AlertCircle
} from 'lucide-react';
import { MandateTextForm } from './MandateTextForm';
import { MandateDocumentUploader } from './MandateDocumentUploader';
import { MandateSignatureUpload } from './MandateSignatureUpload';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface AccountMandateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const STAGES = [
  { id: 1, title: 'Form Details', subtitle: 'Capture Mandate Info' },
  { id: 2, title: 'Supporting Docs', subtitle: 'Required Attachments' },
  { id: 3, title: 'Review & Draft', subtitle: 'Download Pre-filled PDF' },
  { id: 4, title: 'Wet Signature', subtitle: 'Upload Signed Page' },
  { id: 5, title: 'Final Submission', subtitle: 'Compile & Submit' },
];

export const AccountMandateWizard: React.FC<AccountMandateWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const { currentUser } = useAuth();
  const [stage, setStage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    mandateAuthorisation: 'SOLE_SIGNATORY',
    bvn: '',
    surname: '',
    firstName: '',
    otherName: '',
    identificationType: 'INTERNATIONAL_PASSPORT',
    identificationNo: '',
    telephoneNo: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Files State
  const [files, setFiles] = useState<Record<string, string>>({});
  const [signedMandate, setSignedMandate] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    if (stage === 1) {
        if (!formData.surname || !formData.firstName || !formData.bvn) {
            toast.error("Please fill in all required personal details.");
            return;
        }
    }
    if (stage === 2) {
        const required = ['passport_photo', 'id_data_page', 'utility_bill', 'nin_doc', 'bvn_doc'];
        const missing = required.filter(r => !files[r]);
        if (missing.length > 0) {
            toast.error("Please upload all 5 mandatory documents.");
            return;
        }
    }
    setStage(prev => prev + 1);
  };

  const handleBack = () => setStage(prev => prev - 1);

  const downloadDraft = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/mandate/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, passportPhotoBase64: files.passport_photo }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mandate_Draft_${formData.surname}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Mandate draft downloaded! Please sign and upload in next step.");
    } catch (e) {
      toast.error("Draft generation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFinalPackage = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/mandate/submit-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          signedMandateBase64: signedMandate,
          supportingDocs: [
            files.id_data_page,
            files.utility_bill,
            files.nin_doc,
            files.bvn_doc
          ]
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      toast.success("Mandate package submitted successfully! Awaiting regulatory review.");
      if (onComplete) onComplete();
      onClose();
    } catch (e) {
      toast.error("Final submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-slate-950/90 backdrop-blur-2xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] bg-[#0D111A] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Account Mandate Setup</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Parallex Bank Regulatory Onboarding</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stepper */}
          <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            {STAGES.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 shrink-0">
                <div className={`flex items-center gap-3 ${stage >= s.id ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                    stage === s.id ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' :
                    stage > s.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'
                  }`}>
                    {stage > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-[9px] font-black uppercase text-slate-500 leading-none">{s.subtitle}</p>
                    <p className={`text-[11px] font-bold mt-1 ${stage === s.id ? 'text-amber-500' : 'text-white'}`}>{s.title}</p>
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`w-8 h-[2px] rounded-full transition-all ${stage > s.id ? 'bg-emerald-500' : 'bg-white/5'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
            {stage === 1 && (
              <MandateTextForm
                data={formData}
                onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
              />
            )}
            {stage === 2 && (
              <MandateDocumentUploader
                files={files}
                onUpload={(type, base64) => setFiles(prev => ({ ...prev, [type]: base64 }))}
              />
            )}
            {stage === 3 && (
              <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto shadow-2xl shadow-amber-500/10">
                    <Download className="w-12 h-12" />
                </div>
                <div className="max-w-md mx-auto space-y-3">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Review & Generate</h3>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed">
                        We've mapped your data and photo onto the official template. Please download the draft, review for accuracy, and print it out for signing.
                    </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 max-w-sm mx-auto flex items-center gap-4 text-left">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <div>
                        <p className="text-xs font-bold text-white uppercase tracking-tight">Auto-Fill Successful</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Includes stamped Passport Photo and 12 regulatory fields.</p>
                    </div>
                </div>
                <button
                  onClick={downloadDraft}
                  disabled={isSubmitting}
                  className="px-10 py-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Download Pre-Filled Form to Sign
                </button>
              </div>
            )}
            {stage === 4 && (
              <MandateSignatureUpload
                onUpload={(base64) => setSignedMandate(base64)}
                uploaded={!!signedMandate}
              />
            )}
            {stage === 5 && (
              <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 py-10">
                <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto shadow-2xl shadow-emerald-500/10">
                    <Rocket className="w-12 h-12" />
                </div>
                <div className="max-w-md mx-auto space-y-3">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Ready for Blast-off</h3>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed">
                        Your wet-signed mandate and all 5 supporting documents are ready for compilation into your master regulatory package.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left">
                        <ShieldCheck className="w-6 h-6 text-blue-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400">Bank-Grade Encryption</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left">
                        <Rocket className="w-6 h-6 text-purple-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400">Express Submission</span>
                    </div>
                </div>
                <button
                  onClick={submitFinalPackage}
                  disabled={isSubmitting || !signedMandate}
                  className="px-12 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Submit Master Package
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
            <button
              onClick={handleBack}
              disabled={stage === 1 || isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/5 text-slate-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Back</span>
            </button>

            {stage < 5 && (
                <button
                    onClick={handleNext}
                    disabled={isSubmitting || (stage === 4 && !signedMandate)}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50"
                >
                    <span>{stage === 3 ? 'I have signed it, next' : 'Continue'}</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
