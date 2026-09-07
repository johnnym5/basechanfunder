import React from 'react';
import { Upload, FileCheck, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface MandateDocumentUploaderProps {
  files: any;
  onUpload: (type: string, base64: string) => void;
}

const DOCUMENT_TYPES = [
  { id: 'passport_photo', label: 'Passport Photograph', hint: 'Used for form photo frame', accept: 'image/*' },
  { id: 'id_data_page', label: 'Intl Passport Data Page', hint: 'Clear image or PDF', accept: 'image/*,application/pdf' },
  { id: 'utility_bill', label: 'Utility Bill', hint: '<= 3 months old', accept: 'image/*,application/pdf' },
  { id: 'nin_doc', label: 'NIN Document', hint: 'NIN Slip or Card', accept: 'image/*,application/pdf' },
  { id: 'bvn_doc', label: 'BVN Printout', hint: 'Official BVN document', accept: 'image/*,application/pdf' },
];

export const MandateDocumentUploader: React.FC<MandateDocumentUploaderProps> = ({ files, onUpload }) => {
  const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(type, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {DOCUMENT_TYPES.map((doc) => (
        <div
          key={doc.id}
          className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
            files[doc.id] ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className={`text-xs font-black uppercase tracking-tight ${files[doc.id] ? 'text-emerald-400' : 'text-white'}`}>
                {doc.label}
              </h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {doc.hint}
              </p>
            </div>
            {files[doc.id] ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <FileCheck className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept={doc.accept}
              onChange={(e) => handleFileChange(doc.id, e)}
              className="hidden"
            />
            <div className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${
              files[doc.id]
                ? 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                : 'border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'
            }`}>
              <Upload className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {files[doc.id] ? 'Replace Document' : 'Upload File'}
              </span>
            </div>
          </label>

          {files[doc.id] && doc.id === 'passport_photo' && (
            <div className="mt-4 w-16 h-20 rounded-lg overflow-hidden border border-emerald-500/20 mx-auto shadow-2xl">
                <img src={files[doc.id]} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      ))}

      <div className="md:col-span-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-[10px] font-bold text-amber-200/70 uppercase tracking-tight leading-relaxed">
            All 5 documents are mandatory for regulatory compliance. Please ensure images are clear and readable.
          </p>
      </div>
    </div>
  );
};
