import React from 'react';
import { User, Phone, CreditCard, Hash, Calendar } from 'lucide-react';

interface MandateTextFormProps {
  data: any;
  onChange: (updates: any) => void;
}

export const MandateTextForm: React.FC<MandateTextFormProps> = ({ data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="accountName"
              value={data.accountName || ''}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number (Optional)</label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="accountNumber"
              value={data.accountNumber || ''}
              onChange={handleChange}
              placeholder="10-digit number"
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mandate Authorisation</label>
          <select
            name="mandateAuthorisation"
            value={data.mandateAuthorisation || 'SOLE_SIGNATORY'}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all appearance-none"
          >
            <option value="SOLE_SIGNATORY">Sole Signatory</option>
            <option value="EITHER_TO_SIGN">Either to Sign</option>
            <option value="BOTH_TO_SIGN">Both to Sign</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Signatory BVN</label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="bvn"
              value={data.bvn || ''}
              onChange={handleChange}
              placeholder="11-digit BVN"
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Surname</label>
          <input
            name="surname"
            value={data.surname || ''}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
          <input
            name="firstName"
            value={data.firstName || ''}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Other Name</label>
          <input
            name="otherName"
            value={data.otherName || ''}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identification Type</label>
          <select
            name="identificationType"
            value={data.identificationType || 'INTERNATIONAL_PASSPORT'}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all appearance-none"
          >
            <option value="INTERNATIONAL_PASSPORT">International Passport</option>
            <option value="NATIONAL_ID">National ID (NIN)</option>
            <option value="DRIVERS_LICENSE">Drivers License</option>
            <option value="VOTERS_ID">Voters ID</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identification No.</label>
          <input
            name="identificationNo"
            value={data.identificationNo || ''}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telephone No.</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="telephoneNo"
              value={data.telephoneNo || ''}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="date"
              type="date"
              value={data.date || ''}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
