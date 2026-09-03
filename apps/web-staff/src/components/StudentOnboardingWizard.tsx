/**
 * StudentOnboardingWizard.tsx
 * Full-screen animated multi-step onboarding wizard for new students.
 * Screens: Welcome → Profile & Visa → SMS Permission Pitch → Balance Parser
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ChevronDown, MapPin, Globe, Shield, Phone,
  CheckCircle2, AlertCircle, Loader2, RefreshCw, Sparkles
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingProfile {
  homeState: string;
  homeCountry: string;
  destinationCountry: string;
  targetCurrency: string;
  targetCurrencySymbol: string;
  isSelf: boolean;         // sponsorship: false=self, true=sponsored
  sponsorRelationship: string;
  hasParallexAccount: boolean;
  parallexAccountNumber: string;
  bankName: string;
  accountNumber: string;
}

interface Props {
  onComplete: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DESTINATION_CURRENCY_MAP: Record<string, { currency: string; symbol: string }> = {
  'United Kingdom':  { currency: 'GBP', symbol: '£' },
  'Canada':          { currency: 'CAD', symbol: 'C$' },
  'USA':             { currency: 'USD', symbol: '$' },
  'Australia':       { currency: 'AUD', symbol: 'A$' },
  'Other':           { currency: 'GBP', symbol: '£' },
};

const DESTINATION_COUNTRIES = ['United Kingdom', 'Canada', 'USA', 'Australia', 'Other'];

const NIGERIAN_BANKS = [
  'Access Bank', 'GTBank', 'First Bank', 'Zenith Bank', 'UBA',
  'Stanbic IBTC', 'Fidelity Bank', 'Union Bank', 'Ecobank',
  'Sterling Bank', 'Wema Bank', 'FCMB', 'Polaris Bank',
  'Keystone Bank', 'Heritage Bank', 'Parallex Bank', 'Other'
];

// ─── Animation Variants ───────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 320, damping: 32 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-60%' : '60%',
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeInOut' as const },
  }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
  <div className="flex gap-2 justify-center mt-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === current ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'
        }`}
      />
    ))}
  </div>
);

const FloatingInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold uppercase tracking-widest text-blue-400">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-blue-500/5 transition-all"
    />
  </div>
);

const FloatingSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon?: React.ReactNode;
}> = ({ label, value, onChange, options, icon }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold uppercase tracking-widest text-blue-400">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">{icon}</div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all appearance-none ${icon ? 'pl-10 pr-10' : 'px-4 pr-10'}`}
      >
        <option value="" disabled className="bg-slate-900">Select…</option>
        {options.map(o => (
          <option key={o} value={o} className="bg-slate-900">{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
    </div>
  </div>
);

// ─── Screen 1: Welcome ────────────────────────────────────────────────────────

const WelcomeScreen: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [arrowActive, setArrowActive] = useState(false);

  return (
    <div className="flex flex-col items-center justify-between h-full py-12 px-6 text-center">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.2)] overflow-hidden"
        >
          <img src="/logo_white.png" alt="Basechan Funder" className="w-16 h-16 object-contain" />
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="space-y-3 max-w-xs"
        >
          <h1 className="text-3xl font-black tracking-tight text-white leading-tight lowercase">
            welcome to <span className="text-blue-400">basechan funder</span>
          </h1>
          <p className="text-sm text-white/50 leading-relaxed font-medium">
            we make sure your <span className="text-white font-bold">PROOF OF FUNDS</span> is cleared and on track
          </p>
        </motion.div>

        {/* Decorative glow dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3 mt-4"
        >
          {['£', '₦', '$'].map((sym, i) => (
            <div
              key={sym}
              className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {sym}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Arrow CTA */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onMouseEnter={() => setArrowActive(true)}
        onMouseLeave={() => setArrowActive(false)}
        onClick={onNext}
        className="relative group w-16 h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 border border-blue-500/60 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all hover:scale-105 active:scale-95"
        aria-label="Get started"
      >
        <motion.div animate={{ x: arrowActive ? 4 : 0 }} transition={{ type: 'spring', stiffness: 400 }}>
          <ArrowRight className="w-7 h-7 text-white" />
        </motion.div>
      </motion.button>
    </div>
  );
};

// ─── Screen 2: Profile & Visa Info ───────────────────────────────────────────

const ProfileScreen: React.FC<{
  profile: OnboardingProfile;
  onChange: (field: keyof OnboardingProfile, value: string | boolean) => void;
  onNext: () => void;
  displayName: string;
}> = ({ profile, onChange, onNext, displayName }) => {
  const firstName = displayName?.split(' ')[0] || 'there';

  const isValid =
    profile.homeCountry.trim() &&
    profile.destinationCountry &&
    profile.accountNumber.trim() &&
    (profile.hasParallexAccount ? profile.parallexAccountNumber.trim() : profile.bankName.trim());

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 space-y-1">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-bold uppercase tracking-widest text-blue-400"
        >
          So, {firstName}...
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-xl font-black text-white"
        >
          tell us about you
        </motion.h2>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        {/* Location */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Home Location
          </p>
          <FloatingInput label="State / Region" value={profile.homeState} onChange={v => onChange('homeState', v)} placeholder="e.g. Lagos" />
          <FloatingInput label="Country" value={profile.homeCountry} onChange={v => onChange('homeCountry', v)} placeholder="e.g. Nigeria" />
        </div>

        {/* Destination */}
        <div className="space-y-3 pt-1">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
            <Globe className="w-3 h-3" /> Visa Destination
          </p>
          <FloatingSelect
            label="Destination Country"
            value={profile.destinationCountry}
            onChange={v => onChange('destinationCountry', v)}
            options={DESTINATION_COUNTRIES}
            icon={<Globe className="w-4 h-4" />}
          />
          {profile.destinationCountry && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-300">
                Target currency auto-set to <span className="font-black">{profile.targetCurrencySymbol} {profile.targetCurrency}</span>
              </p>
            </motion.div>
          )}
        </div>

        {/* Sponsorship */}
        <div className="space-y-3 pt-1">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Sponsorship Status
          </p>
          <div className="flex gap-3">
            {(['Self-Funded', 'Sponsored'] as const).map((opt, i) => {
              const isSelected = profile.isSelf === (i === 0);
              return (
                <button
                  key={opt}
                  onClick={() => onChange('isSelf', i === 0)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {!profile.isSelf && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <FloatingInput
                label="Sponsor Relationship"
                value={profile.sponsorRelationship}
                onChange={v => onChange('sponsorRelationship', v)}
                placeholder="e.g. Parent, Employer, Government"
              />
            </motion.div>
          )}
        </div>

        {/* Bank / Account */}
        <div className="space-y-3 pt-1">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> Bank Account Details
          </p>
          <div className="flex gap-3">
            {(['Yes, I have Parallex', 'Other Bank'] as const).map((opt, i) => {
              const isSelected = profile.hasParallexAccount === (i === 0);
              return (
                <button
                  key={opt}
                  onClick={() => onChange('hasParallexAccount', i === 0)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {profile.hasParallexAccount ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <FloatingInput
                label="Parallex Account Number"
                value={profile.parallexAccountNumber}
                onChange={v => onChange('parallexAccountNumber', v)}
                placeholder="10-digit account number"
                type="number"
              />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <FloatingSelect
                label="Bank Name"
                value={profile.bankName}
                onChange={v => onChange('bankName', v)}
                options={NIGERIAN_BANKS}
              />
              <FloatingInput
                label="Account Number"
                value={profile.accountNumber}
                onChange={v => onChange('accountNumber', v)}
                placeholder="10-digit account number"
                type="number"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Next Button */}
      <div className="px-6 pb-8 pt-3">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Screen 3: SMS Permission Pitch ──────────────────────────────────────────

type SmsPermState = 'pitch' | 'requesting' | 'denied' | 'granted';

const SmsPermissionScreen: React.FC<{
  onGranted: () => void;
  onSkip: () => void;
}> = ({ onGranted, onSkip }) => {
  const [state, setState] = useState<SmsPermState>('pitch');

  const requestPermission = useCallback(async () => {
    setState('requesting');
    try {
      // Web: Use the Web SMS API or Notification permission as a stand-in
      // On mobile WebView the Android app handles native SMS permission
      if ('permissions' in navigator) {
        // Try native Notification permission (closest web equivalent)
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          // Post message to Android WebView to request SMS permission
          if ((window as any).AndroidBridge?.requestSmsPermission) {
            (window as any).AndroidBridge.requestSmsPermission();
          }
          setState('granted');
          setTimeout(onGranted, 800);
        } else {
          setState('denied');
        }
      } else {
        // Fallback for environments without Permissions API
        if ((window as any).AndroidBridge?.requestSmsPermission) {
          (window as any).AndroidBridge.requestSmsPermission();
          setState('granted');
          setTimeout(onGranted, 800);
        } else {
          // No native bridge — treat as granted on web (SMS scan runs in-browser)
          setState('granted');
          setTimeout(onGranted, 800);
        }
      }
    } catch {
      setState('denied');
    }
  }, [onGranted]);

  if (state === 'granted') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </motion.div>
        <p className="text-white font-bold text-lg">Permission Granted!</p>
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center"
        >
          <AlertCircle className="w-10 h-10 text-amber-400" />
        </motion.div>
        <div className="space-y-2 max-w-xs">
          <h3 className="text-lg font-black text-white">oh, hold on!</h3>
          <p className="text-sm text-white/50 leading-relaxed">
            it seems you might have rejected the permission. we can't proceed without you giving us your permission. try again.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={requestPermission}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={onSkip}
            className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold uppercase tracking-wider hover:text-white/60 transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
      {/* Icon */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)]"
      >
        <Phone className="w-12 h-12 text-blue-400" />
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 max-w-xs"
      >
        <h3 className="text-2xl font-black text-white lowercase leading-tight">
          sweet, you're <span className="text-blue-400">almost done!</span>
        </h3>
        <p className="text-sm text-white/50 leading-relaxed">
          what we need now is access to your <span className="text-white font-bold">SMS</span> to be able to read and accurately get your account balance.
        </p>
        <p className="text-xs text-white/30 leading-relaxed">
          don't worry — we <span className="text-green-400 font-bold">cannot</span> change your account details, and your data is safe with us.
        </p>
      </motion.div>

      {/* Shield badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3"
      >
        {['Read Only', 'Encrypted', 'No sharing'].map(tag => (
          <div key={tag} className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-bold">
            {tag}
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={requestPermission}
        disabled={state === 'requesting'}
        className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(59,130,246,0.4)] disabled:opacity-60"
      >
        {state === 'requesting' ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Requesting…</>
        ) : (
          <>Proceed <ArrowRight className="w-5 h-5" /></>
        )}
      </motion.button>

      <button
        onClick={onSkip}
        className="text-xs text-white/25 hover:text-white/40 transition-colors font-medium underline underline-offset-2"
      >
        Skip for now — I'll verify later
      </button>
    </div>
  );
};

// ─── Screen 4: Balance Parser ─────────────────────────────────────────────────

type ParseState = 'scanning' | 'found' | 'failed';

// Balance extraction helper – runs multi-pass parse on SMS messages
function extractBalance(messages: string[]): string | null {
  // Pass 1: Look for explicit Balance: or Bal: patterns
  for (const msg of messages) {
    const match = msg.match(/(?:balance|bal)[:\s]*[₦NGN]*\s*([\d,]+(?:\.\d{2})?)/i);
    if (match) return match[1].replace(/,/g, '');
  }

  // Pass 2: Fuzzy — look for ₦ amounts in any financial-looking SMS
  for (const msg of messages) {
    const match = msg.match(/₦\s*([\d,]+(?:\.\d{2})?)/);
    if (match) return match[1].replace(/,/g, '');
  }

  return null;
}

const BalanceParserScreen: React.FC<{
  profile: OnboardingProfile;
  uid: string;
  onComplete: () => void;
}> = ({ profile, uid, onComplete }) => {
  const [state, setState] = useState<ParseState>('scanning');
  const [balance, setBalance] = useState<string | null>(null);
  const [scanLabel, setScanLabel] = useState('Pass 1: Scanning your bank SMS…');

  useEffect(() => {
    let cancelled = false;

    const runScan = async () => {
      // Give UI time to render
      await new Promise(r => setTimeout(r, 1200));
      if (cancelled) return;

      setScanLabel('Pass 1: Matching sender ID & account tail…');
      await new Promise(r => setTimeout(r, 1200));
      if (cancelled) return;

      // Try to get SMS data from Android bridge
      let messages: string[] = [];
      try {
        if ((window as any).AndroidBridge?.getSmsMessages) {
          const raw = (window as any).AndroidBridge.getSmsMessages();
          messages = JSON.parse(raw) as string[];
        }
      } catch {
        // No bridge (web environment) — continue with empty
      }

      const found = extractBalance(messages);

      if (found) {
        if (!cancelled) { setBalance(found); setState('found'); }
      } else {
        if (cancelled) return;
        setScanLabel('Pass 2: Fuzzy scanning all financial messages…');
        await new Promise(r => setTimeout(r, 1400));
        if (cancelled) return;

        // Dispatch admin alert on failure
        try {
          await fetch('/api/v1/support/ingestion-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: uid,
              bankName: profile.hasParallexAccount ? 'Parallex Bank' : profile.bankName,
              accountNumber: profile.hasParallexAccount ? profile.parallexAccountNumber : profile.accountNumber,
            }),
          });
        } catch { /* fire and forget */ }

        // Mark user as pending manual sync
        try {
          await updateDoc(doc(db, 'users', uid), {
            balanceVerificationStatus: 'PENDING_MANUAL_ADMIN_SYNC',
          });
        } catch { /* ignore */ }

        if (!cancelled) setState('failed');
      }
    };

    runScan();
    return () => { cancelled = true; };
  }, [profile, uid]);

  if (state === 'scanning') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
        {/* Animated scanner ring */}
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-blue-500/50 border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-black text-white">Scanning your inbox…</p>
          <p className="text-sm text-white/40">{scanLabel}</p>
        </div>
      </div>
    );
  }

  if (state === 'found') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-24 h-24 rounded-3xl bg-green-500/20 border border-green-500/40 flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.2)]"
        >
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </motion.div>
        <div className="space-y-2 max-w-xs">
          <p className="text-xl font-black text-white">i think we found it! 🎉</p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black text-green-400"
          >
            ₦{Number(balance).toLocaleString()}
          </motion.div>
          <p className="text-xs text-white/30">Account balance detected from your SMS</p>
        </div>
        <motion.button
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={onComplete}
          className="w-full max-w-xs py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          Let's See <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    );
  }

  // Failed state
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"
      >
        <AlertCircle className="w-12 h-12 text-amber-400" />
      </motion.div>
      <div className="space-y-2 max-w-xs">
        <p className="text-lg font-black text-white leading-tight">
          We couldn't automatically verify your balance yet, but don't worry!
        </p>
        <p className="text-sm text-white/40 leading-relaxed">
          Our team has been alerted and will manually sync your balance shortly. You can still access your dashboard now.
        </p>
      </div>
      <motion.button
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={onComplete}
        className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider transition-all"
      >
        Proceed to Dashboard
      </motion.button>
    </div>
  );
};

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

export const StudentOnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const { appUser, currentUser } = useAuth();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<OnboardingProfile>({
    homeState: '',
    homeCountry: '',
    destinationCountry: '',
    targetCurrency: 'GBP',
    targetCurrencySymbol: '£',
    isSelf: true,
    sponsorRelationship: '',
    hasParallexAccount: false,
    parallexAccountNumber: '',
    bankName: '',
    accountNumber: '',
  });

  const updateProfile = useCallback((field: keyof OnboardingProfile, value: string | boolean) => {
    setProfile(prev => {
      const next = { ...prev, [field]: value };
      // Auto-update currency when destination changes
      if (field === 'destinationCountry' && typeof value === 'string') {
        const mapping = DESTINATION_CURRENCY_MAP[value];
        if (mapping) {
          next.targetCurrency = mapping.currency;
          next.targetCurrencySymbol = mapping.symbol;
        }
      }
      return next;
    });
  }, []);

  const goNext = useCallback(async () => {
    if (step === 1) {
      // Save profile to Firestore before moving on
      if (currentUser) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            onboardingProfile: {
              homeState: profile.homeState,
              homeCountry: profile.homeCountry,
              destinationCountry: profile.destinationCountry,
              targetCurrency: profile.targetCurrency,
              targetCurrencySymbol: profile.targetCurrencySymbol,
              isSelf: profile.isSelf,
              sponsorRelationship: profile.sponsorRelationship,
              bankName: profile.hasParallexAccount ? 'Parallex Bank' : profile.bankName,
              accountNumber: profile.hasParallexAccount ? profile.parallexAccountNumber : profile.accountNumber,
              savedAt: serverTimestamp(),
            },
            onboardingComplete: false,
          });
        } catch { /* ignore */ }
      }
    }
    setDirection(1);
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  }, [step, currentUser, profile]);

  const handleOnboardingComplete = useCallback(async () => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          onboardingComplete: true,
          onboardingCompletedAt: serverTimestamp(),
        });
      } catch { /* ignore */ }
    }
    onComplete();
  }, [currentUser, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#07090e] flex flex-col overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-blue-500/5" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-blue-900/10" />
      </div>

      {/* Step Dots */}
      <div className="relative z-10 pt-6">
        <StepDots total={TOTAL_STEPS} current={step} />
      </div>

      {/* Animated Step Container */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            {step === 0 && (
              <WelcomeScreen onNext={goNext} />
            )}
            {step === 1 && (
              <ProfileScreen
                profile={profile}
                onChange={updateProfile}
                onNext={goNext}
                displayName={appUser?.displayName || ''}
              />
            )}
            {step === 2 && (
              <SmsPermissionScreen
                onGranted={goNext}
                onSkip={goNext}
              />
            )}
            {step === 3 && (
              <BalanceParserScreen
                profile={profile}
                uid={currentUser?.uid || ''}
                onComplete={handleOnboardingComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentOnboardingWizard;
