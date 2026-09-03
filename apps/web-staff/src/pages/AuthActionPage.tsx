import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applyActionCode, sendEmailVerification, AuthError } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

type ActionState = 'LOADING' | 'SUCCESS' | 'ERROR';

export const AuthActionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ActionState>('LOADING');
  const [errorMsg, setErrorMsg] = useState('');
  const [isResending, setIsResending] = useState(false);

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!mode || !oobCode) {
      setState('ERROR');
      setErrorMsg('Invalid or missing security token.');
      return;
    }

    if (mode === 'verifyEmail') {
      handleVerifyEmail(oobCode);
    } else {
      setState('ERROR');
      setErrorMsg(`Action "${mode}" is not supported by this handler.`);
    }
  }, [mode, oobCode]);

  const handleVerifyEmail = async (code: string) => {
    try {
      await applyActionCode(auth, code);
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }
      setState('SUCCESS');

      // Auto redirect after success
      setTimeout(() => {
        // If logged in, go to dashboard, else go to login page
        navigate(auth.currentUser ? '/' : '/auth');
      }, 3500);
    } catch (err: any) {
      console.error('Verification error:', err);
      setState('ERROR');
      setErrorMsg(friendly(err));
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser) {
      toast.error('Session expired. Please sign in again.');
      navigate('/auth');
      return;
    }
    setIsResending(true);
    try {
      const { getActionCodeSettings } = await import('../firebase');
      await sendEmailVerification(auth.currentUser, getActionCodeSettings());
      toast.success('Verification link dispatched to your inbox.');
    } catch (err: any) {
      toast.error(friendly(err));
    } finally {
      setIsResending(false);
    }
  };

  const friendly = (err: AuthError) => {
    switch (err.code) {
      case 'auth/expired-action-code':
        return 'The security token has expired. Request a new link.';
      case 'auth/invalid-action-code':
        return 'Invalid token. This link may have been used already.';
      case 'auth/user-disabled':
        return 'This account has been administratively disabled.';
      case 'auth/user-not-found':
        return 'Verification target user was not found.';
      default:
        return err.message || 'Verification failed. Technical cluster error.';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-6 font-sans relative overflow-hidden">

      {/* Background Graphic Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-blue-500/20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-amber-500/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* 75% BLUR FROSTED GLASS CARD */}
        <div className="bg-white/10 backdrop-blur-[75px] border border-white/15 rounded-[3rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-10 text-center">

          {/* Header Icon Cluster */}
          <div className="flex justify-center">
            {state === 'LOADING' && (
              <div className="relative w-24 h-24 flex items-center justify-center">
                <Loader2 className="w-20 h-20 text-[#F5B651] animate-spin" />
                <div className="absolute inset-0 rounded-full blur-2xl bg-[#F5B651]/20 animate-pulse" />
              </div>
            )}
            {state === 'SUCCESS' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, 0] }}
                className="w-24 h-24 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
            )}
            {state === 'ERROR' && (
              <div className="w-24 h-24 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.1)]">
                <AlertTriangle className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              {state === 'LOADING' && 'Verifying...'}
              {state === 'SUCCESS' && 'Verified Successfully'}
              {state === 'ERROR' && 'Link Error'}
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              {state === 'LOADING' && 'Syncing your identity with the governance cluster...'}
              {state === 'SUCCESS' && 'Your email has been confirmed. Redirecting to your dashboard...'}
              {state === 'ERROR' && (errorMsg || 'We encountered a problem while processing your request.')}
            </p>
          </div>

          {/* Interactive States */}
          <div className="pt-2">
            {state === 'LOADING' && (
              <div className="flex flex-col items-center space-y-6">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#F5B651] animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-[#F5B651] animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-[#F5B651] animate-bounce" />
                </div>
                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em]">Basechan Secure Auth</p>
              </div>
            )}

            {state === 'SUCCESS' && (
              <div className="space-y-6">
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-5 bg-gradient-to-tr from-[#F5B651] to-[#E5A635] text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-amber-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-3"
                >
                  <span>Launch Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Authorized Access Granted</span>
                </div>
              </div>
            )}

            {state === 'ERROR' && (
              <div className="space-y-4">
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full py-5 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-white/10 transition-all flex items-center justify-center gap-3 shadow-xl backdrop-blur-md"
                >
                  {isResending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-5 h-5" />}
                  <span>Resend Verification</span>
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full py-4 text-[#F5B651] font-black text-[10px] uppercase tracking-[0.3em] hover:opacity-80 transition-opacity"
                >
                  Return to portal
                </button>
              </div>
            )}
          </div>

          {/* Technical Footer */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-2 opacity-50">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="text-[9px] font-bold text-white uppercase tracking-[0.2em]">End-to-End Encrypted Verification</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthActionPage;
