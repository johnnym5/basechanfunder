import React from 'react';
import { ShieldQuestion, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-amber-500/30">
      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        {/* Background Decorative Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
          <ShieldQuestion className="w-10 h-10 text-amber-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Page not found</h1>
          <p className="text-sm font-mono text-slate-500 font-bold uppercase tracking-widest">
            We couldn't find the page you were looking for.
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          This page doesn't exist or has been moved.
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-amber-500" />
          <span>Go back to dashboard</span>
        </button>
      </div>
    </div>
  );
};
