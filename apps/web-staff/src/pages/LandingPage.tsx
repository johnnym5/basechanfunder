import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Clock,
  Zap,
  Globe,
  Database,
  Lock,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-amber-500/30 overflow-x-hidden">

      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* 1. Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <span className="text-lg font-black tracking-widest text-white uppercase">Basechanfunder</span>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Compliance Ledger Platform</p>
          </div>
        </div>

        <button
          onClick={onNavigateToLogin}
          className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all"
        >
          Partner Login
        </button>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-24 pb-20 px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">v2.4 Live: UKVI 2026 Ready</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Automated Proof of Funds <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">Verification & Compliance</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700">
          Eliminate visa rejection risks with real-time mathematical validation of the 28-day continuous holding rule. Insulate against NGN volatility with dynamic FX buffers and forensic eStatement audits.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-700">
          <button
            onClick={onNavigateToLogin}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Launch Governance Portal <ArrowRight className="w-5 h-5" />
          </button>
          <button className="w-full sm:w-auto px-10 py-5 bg-slate-900 border border-white/10 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all">
            View Protocol Docs
          </button>
        </div>
      </section>

      {/* 3. Core Feature Grid */}
      <section className="py-20 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Continuous Holding Engine",
              desc: "Real-time tracking of 28 consecutive days of liquid funds. Our Go-based matrix engine detects balance drops instantly.",
              icon: Clock,
              color: "text-amber-500"
            },
            {
              title: "FX Volatility Shield",
              desc: "Automated 10% safety buffer over statutory GBP requirements to absorb rapid local currency devaluation.",
              icon: TrendingUp,
              color: "text-emerald-400"
            },
            {
              title: "Anomaly Detection (R)",
              desc: "Algorithmic flagging of sudden cash deposit spikes. Prevents 'parked money' flags via historical median analysis.",
              icon: AlertTriangle,
              color: "text-rose-400"
            },
            {
              title: "24h Grace Adjustments",
              desc: "Student-initiated top-up requests with counselor approval workflows to maintain continuous compliance windows.",
              icon: Zap,
              color: "text-cyan-400"
            },
            {
              title: "Multi-Channel Ingestion",
              desc: "Seamless data flows from Mono/Okra Open Banking, Android SMS listeners, and verified MBS eStatement tickets.",
              icon: Database,
              color: "text-purple-400"
            },
            {
              title: "MBS Ticket Vault",
              desc: "Forensic PDF audit of official MyBankStatement tickets with RSA signature verification and font integrity checks.",
              icon: Lock,
              color: "text-slate-300"
            },
          ].map((feature, i) => (
            <div key={i} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md hover:border-amber-500/20 transition-all group">
              <div className={`w-14 h-14 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Destination Matrix */}
      <section className="py-20 px-8 bg-slate-900/20 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-white tracking-tight">Global Jurisdiction Support</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Automated regulatory mapping for major study destinations</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { code: "GBR", country: "United Kingdom", requirement: "£1,334 /mo (London)", period: "28 Days", active: true },
              { code: "CAN", country: "Canada", requirement: "$20,635 + Tuition", period: "30 Days", active: true },
              { code: "DEU", country: "Germany", requirement: "€11,208 (Blocked)", period: "90 Days", active: true },
              { code: "USA", country: "United States", requirement: "Full I-20 Coverage", period: "30 Days", active: true },
            ].map((dest, i) => (
              <div key={i} className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-black text-amber-500">
                    {dest.code}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                  </div>
                </div>
                <h4 className="text-lg font-black text-white mb-4 tracking-tight">{dest.country}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-slate-600 tracking-tighter">Statutory Min</span>
                    <span className="text-slate-300">{dest.requirement}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-slate-600 tracking-tighter">Holding Rule</span>
                    <span className="text-slate-300">{dest.period}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Bottom CTA */}
      <section className="py-32 px-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-8">
            Ready to secure your <br />
            <span className="text-amber-500 italic">Proof of Funds compliance?</span>
          </h2>
          <button
            onClick={onNavigateToLogin}
            className="px-12 py-6 bg-white text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            Enter Basechanfunder
          </button>

          <div className="mt-16 flex items-center justify-center space-x-12 opacity-40">
            <div className="flex items-center space-x-2 grayscale group hover:grayscale-0 transition-all">
               <ShieldCheck className="w-5 h-5" />
               <span className="text-[10px] font-black uppercase tracking-widest">NDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 grayscale group hover:grayscale-0 transition-all">
               <Globe className="w-5 h-5" />
               <span className="text-[10px] font-black uppercase tracking-widest">ISO 27001</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          &copy; 2026 Basechanfunder &bull; Enterprise Governance Suite
        </p>
      </footer>

    </div>
  );
};
