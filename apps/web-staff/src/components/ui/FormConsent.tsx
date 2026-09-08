import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FormConsentProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const FormConsent: React.FC<FormConsentProps> = ({ id, checked, onChange, className = '' }) => {
  return (
    <div className={`p-4 rounded-2xl bg-blue-600/5 border border-blue-500/20 flex items-start gap-4 transition-all ${className}`}>
      <div className="pt-1">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer"
        />
      </div>
      <label htmlFor={id} className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 cursor-pointer select-none">
        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter inline-flex items-center gap-1 mb-1">
          <ShieldCheck className="w-3 h-3 text-blue-500" /> Statutory Data Processing Consent
        </span>
        <br />
        I consent to the collection and processing of my identity documents (International Passport, NIN, BVN) for
        <span className="text-blue-500 font-bold mx-1">Parallex Bank</span> account maintenance and proof of funds verification
        in accordance with our <Link to="/legal/privacy" className="underline hover:text-blue-400 transition-colors">Privacy Policy</Link>
        and <Link to="/legal/terms" className="underline hover:text-blue-400 transition-colors">Terms of Service</Link>.
      </label>
    </div>
  );
};
