import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Lock, ArrowLeft, Mail, Building, Landmark } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BUSINESS_DETAILS = {
  name: "Basechan International Limited",
  regNumber: "RC-1234567",
  address: "Plot 102, Trans-Amadi Industrial Layout, Port Harcourt, Rivers State, Nigeria",
  email: "support@basechaninternational.com",
  phone: "+234 800 BASECHAN"
};

export const LegalPages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.split('/').pop();

  const [activeTab, setActiveTab] = useState(path === 'privacy' ? 'privacy' : path === 'cookies' ? 'cookies' : 'terms');

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans p-6 md:p-12 selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all shadow-xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white">Governance & Compliance</h1>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Legal Framework & Privacy Standards</p>
            </div>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
            {[
              { id: 'terms', label: 'Terms', icon: FileText },
              { id: 'privacy', label: 'Privacy', icon: Shield },
              { id: 'cookies', label: 'Cookies', icon: Lock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-12 space-y-10 border-white/10"
        >
          {activeTab === 'terms' && (
            <section className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Terms of Service</h2>
                <p className="text-xs text-slate-500 font-medium">Last Updated: September 7, 2026</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">1. Governance Framework</h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                      By accessing the BasechanFunder platform, you agree to be bound by these terms. We provide
                      statutory proof of funds (POF) verification and Parallex Bank account maintenance services.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">2. Capital Holding Rules</h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                      All top-up capital provided through our system must adhere to continuous holding periods.
                      Any unauthorized withdrawal or breach of the org-floor balance will result in an
                      immediate compliance flag sent to relevant statutory bodies.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">3. Service Fees</h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                      Standard admin fees apply to all liquidity allocations. Fees are non-refundable once
                      the transaction has been settled on the ledger.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">4. Account Termination</h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                      Basechan reserves the right to suspend accounts suspected of fraudulent SMS alerts or
                      tampering with the Native Android Bridge sensors.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'privacy' && (
            <section className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Privacy & Data Policy</h2>
                <p className="text-xs text-slate-500 font-medium">Last Updated: September 7, 2026</p>
              </div>

              <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20 space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                  "Your financial privacy is non-negotiable. Basechan uses AES-256 encryption at rest and
                  TLS 1.3 for all data in transit between your mobile device and our ledger."
                </p>
              </div>

              <div className="space-y-6 text-slate-300">
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Data We Collect</h3>
                  <ul className="list-disc list-inside text-sm space-y-2 ml-2">
                    <li>Identity: International Passport, NIN, BVN (for Bank Mandates only).</li>
                    <li>Financial: SMS Alerts containing balance updates for verified bank accounts.</li>
                    <li>Technical: Device ID and IP address for secure session management.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Retention & Rights</h3>
                  <p className="text-sm leading-relaxed">
                    Personal data is retained for the duration of your visa application process plus
                    a statutory 12-month archive period. You have the right to request a full "Purge to Unauthenticated"
                    which permanently deletes all your financial records from our Firestore shards.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'cookies' && (
            <section className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Cookie & Token Policy</h2>
                <p className="text-xs text-slate-500 font-medium">Last Updated: September 7, 2026</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Token Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    <tr>
                      <td className="px-6 py-4 font-mono font-bold">firebase_auth_token</td>
                      <td className="px-6 py-4">Essential</td>
                      <td className="px-6 py-4 leading-relaxed">Secures your session and identity verification.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-mono font-bold">basechan_theme</td>
                      <td className="px-6 py-4">Preference</td>
                      <td className="px-6 py-4 leading-relaxed">Remembers your Light/Dark mode choice.</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-mono font-bold">fcm_push_token</td>
                      <td className="px-6 py-4">Functional</td>
                      <td className="px-6 py-4 leading-relaxed">Delivers real-time liquidity and flag alerts.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Business Footer */}
          <div className="pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-slate-500 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Entity Details</p>
                <p className="text-[11px] font-bold text-white">{BUSINESS_DETAILS.name}</p>
                <p className="text-[11px] text-slate-500 uppercase font-mono mt-0.5">{BUSINESS_DETAILS.regNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Landmark className="w-5 h-5 text-slate-500 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Registered Address</p>
                <p className="text-[11px] leading-relaxed text-slate-400 font-medium">{BUSINESS_DETAILS.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Official Support</p>
                <a href={`mailto:${BUSINESS_DETAILS.email}`} className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors underline">{BUSINESS_DETAILS.email}</a>
                <p className="text-[11px] text-slate-500 mt-0.5 font-bold uppercase">{BUSINESS_DETAILS.phone}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
