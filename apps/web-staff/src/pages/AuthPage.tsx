import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, User, AlertCircle, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'signup';

// ─── Glassmorphic Field ────────────────────────────────────────
const Field: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  toggle?: React.ReactNode;
  autoComplete?: string;
}> = ({ label, type = 'text', value, onChange, placeholder, icon, toggle, autoComplete }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-[#020617]/80 border border-white/10 focus:border-[#F5B651]/60 focus:ring-1 focus:ring-[#F5B651]/20 text-white placeholder-slate-500 text-sm rounded-xl py-3.5 transition-all outline-none font-sans"
        style={{ paddingLeft: icon ? '2.75rem' : '1rem', paddingRight: toggle ? '2.75rem' : '1rem' }}
      />
      {toggle && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">{toggle}</div>}
    </div>
  </div>
);

// ─── Main Auth Page ────────────────────────────────────────────
export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const friendly = (err: AuthError) => {
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled. Please try again.';
      case 'auth/network-request-failed': return 'Network error. Check your connection and try again.';
      default: return err.message;
    }
  };

  // ── Email/Password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(friendly(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  // ── Email/Password sign up
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await sendEmailVerification(cred.user);
      // Create Firestore user doc
      const role = email.endsWith('@basechaninternational.com') ? 'ADMIN_GOVERNANCE' : 'STUDENT';
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        displayName: name.trim(),
        photoURL: '',
        role,
        createdAt: serverTimestamp(),
      });
      setSuccess('Account created! Please check your email to verify your account.');
    } catch (err) {
      setError(friendly(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign-in / sign-up
  const handleGoogle = async () => {
    setError(''); setSuccess('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // AuthContext handles Firestore profile creation on first login
    } catch (err) {
      setError(friendly(err as AuthError));
    } finally {
      setGoogleLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#090D16] font-sans p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.06) 0%, #090D16 55%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 55%)' }}
    >
      {/* Ambient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + Brand */}
        <div className="text-center mb-8 space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F5B651]/10 border border-[#F5B651]/30 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.15)]">
              <ShieldCheck className="w-8 h-8 text-[#F5B651]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#FFC174]">BASECHANFUNDER</h1>
            <p className="text-xs text-slate-400 font-mono mt-1">UKVI 28-Day Proof of Funds Compliance Platform</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/8 p-8 space-y-6"
          style={{ background: 'rgba(15,19,28,0.85)', backdropFilter: 'blur(24px)' }}
        >
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-[#0A0D14] border border-white/8 p-1">
            {(['login', 'signup'] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === m
                    ? 'bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error / Success banners */}
          {error && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isLogin ? handleEmailLogin : handleEmailSignup} className="space-y-4">
            {!isLogin && (
              <Field
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="e.g. Chidi Ogunlesi"
                icon={<User className="w-4 h-4" />}
                autoComplete="name"
              />
            )}
            <Field
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />
            <Field
              label="Password"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              toggle={
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="cursor-pointer hover:text-white transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            {!isLogin && (
              <Field
                label="Confirm Password"
                type={showPwd ? 'text' : 'password'}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F5B651] to-[#E5A635] text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] font-mono text-slate-500">OR</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Google SSO */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full py-3 rounded-xl bg-[#181B25] border border-white/10 hover:border-white/25 text-white font-semibold text-sm flex items-center justify-center space-x-3 transition-all disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
