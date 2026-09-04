// MasterAppPortal — Unified Governance & Student Portal
import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Sliders,
  LogOut,
  BarChart3,
  Loader2,
  Compass,
  MessageCircle,
  Eye,
  Sun,
  Moon,
  ShieldAlert,
  ArrowLeft,
  Bell,
  X,
  Database,
  Briefcase
} from 'lucide-react';
import { ProfessionalSpinner } from './ui/LoadingStates';
import { NotificationDropdown } from './ui/NotificationDropdown';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// Import View Components
import { StaffDashboard } from './Dashboard';
import { CounselorPortal } from './CounselorPortal';
import { StudentMobileFirstDashboard } from './StudentMobileFirstDashboard';
import { SettingsConsole } from './SettingsConsole';
import { StudentSupportChat } from './StudentSupportChat';
import { AdminSupportDesk } from './AdminSupportDesk';
import { StaffStudentViewMode } from './StaffStudentViewMode';
import { StudentOnboardingWizard } from './StudentOnboardingWizard';
import { AppUpdateModal } from './AppUpdateModal';
import { AdminCounselorRoster } from './AdminCounselorRoster';
import { getPlatformType } from '../utils/deviceDetection';

export const MasterAppPortal: React.FC = () => {
  const { appUser, role, currentUser, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminSupportOpen, setIsAdminSupportOpen] = useState(false);
  const [supportInitialStudentId, setSupportInitialStudentId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(null);

  // Profile Menu State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!appUser || !currentUser || onboardingChecked) return;
    if (role !== 'STUDENT') { setOnboardingChecked(true); return; }

    getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        const completed = data?.onboardingComplete === true;
        setShowOnboarding(!completed);
      }
      setOnboardingChecked(true);
    }).catch(() => {
      setOnboardingChecked(true);
    });
  }, [appUser, currentUser, role, onboardingChecked]);

  if (authLoading || !appUser || !currentUser || (role === 'STUDENT' && !onboardingChecked)) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <ProfessionalSpinner message="Verifying session..." />
      </div>
    );
  }

  if (showOnboarding && role === 'STUDENT') {
    return (
      <StudentOnboardingWizard
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  const isStaffOrAdmin = role === 'STAFF_AUDITOR' || role === 'COUNSELOR' || role === 'ADMIN_GOVERNANCE';
  const isAdmin = role === 'ADMIN_GOVERNANCE';
  const isDark = theme === 'dark';

  const navItems = isStaffOrAdmin ? [
    ...(isAdmin ? [{ id: 'counselors', label: 'Counselors', icon: Briefcase }] : []),
    { id: 'support', label: 'Support Desk', icon: MessageCircle },
    { id: 'params', label: 'Settings', icon: Sliders },
  ] : [];

  return (
    <div className={`h-screen w-full flex flex-col font-sans selection:bg-amber-500/30 overflow-hidden transition-colors duration-500 relative ${
      theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Dynamic Animated Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={role === 'STUDENT' ? (isDark ? 'student_dark' : 'student_light') : (isDark ? 'admin_dark' : 'admin_light')}
            initial={{ opacity: 0, scale: 1.0, x: '-6%' }}
            animate={{
              opacity: 1,
              scale: [1.0, 1.75, 1.0],
              x: ['-6%', '6%', '-6%'],
              y: ['-2%', '3%', '-2%'],
            }}
            transition={{
              opacity: { duration: 1.2, ease: 'easeInOut' },
              scale: { duration: 42, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' },
              x: { duration: 38, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' },
              y: { duration: 32, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' },
            }}
            className="absolute inset-[-20%] bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                role === 'STUDENT'
                  ? (isDark ? '/bg_student_dark.jpg' : '/bg_student_light.jpg')
                  : (isDark ? '/bg_admin_dark.jpg' : '/bg_admin_light.jpg')
              })`,
              filter: isDark ? 'brightness(0.75) contrast(1.15)' : 'brightness(1.02) contrast(1.02)',
            }}
          />
        </AnimatePresence>

        {/* ── High-Depth Frosted Glass Backdrop Overlay (Strong Blur & Translucent Glass Reflection) ── */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            isDark ? 'bg-[#030712]/60' : 'bg-slate-100/60'
          }`}
          style={{
            backdropFilter: 'blur(75px) saturate(160%)',
            WebkitBackdropFilter: 'blur(75px) saturate(160%)',
          }}
        />

        {/* ── Subtle Glass Specular Highlights / Light Gradient ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.6) 0%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 40%)',
          }}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">

          {/* Restructured Top Header */}
          <header className={`h-16 flex-shrink-0 px-6 md:px-8 border-b flex items-center justify-between transition-colors duration-500 backdrop-blur-md sticky top-0 z-[100] ${
            theme === 'dark' ? 'bg-slate-950/40 border-white/5 shadow-2xl' : 'bg-white/70 border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center space-x-4">
              {inspectingStudentId ? (
                <button
                  onClick={() => setInspectingStudentId(null)}
                  className="flex items-center gap-2 bg-slate-900 border border-white/10 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg depth-btn-glass"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Exit Inspector</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className={`text-base md:text-xl font-black uppercase tracking-tighter text-depth-header`}>
                    <span className={isDark ? 'text-slate-400' : 'text-blue-950'}>HELLO </span>
                    <span className="text-amber-500">{appUser?.displayName?.toUpperCase() || 'ADMIN'}</span>
                  </h1>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 md:space-x-6 shrink-0 relative" ref={profileMenuRef}>
               {/* Right Utility Cluster */}
               <div className="flex items-center gap-2 md:gap-4">
                  {/* Notification Bell (Unified Pop-up) */}
                  <NotificationDropdown />

                  {/* Light / Dark Mode Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all depth-btn-glass ${
                      isDark ? 'bg-white/5 border-white/5 text-amber-400 hover:bg-amber-500/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
               </div>

               {/* Profile FAB Button (Acts as Menu Trigger) */}
               <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`w-11 h-11 rounded-full border-2 p-0.5 transition-all hover:scale-105 active:scale-95 shadow-xl ${
                    isDark
                      ? 'border-blue-500 shadow-blue-500/20 bg-slate-900'
                      : 'border-blue-600 shadow-blue-600/10 bg-white'
                  }`}
               >
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-800 border border-white/5">
                    {appUser.photoURL ? (
                      <img src={appUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-blue-400 uppercase">{appUser.displayName?.[0] || 'A'}</span>
                    )}
                  </div>
               </button>

               {/* DROPDOWN MENU - Further Trimmed */}
               {isProfileOpen && (
                 <div className={`absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl z-[150] p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right border ${
                   isDark
                     ? 'bg-[#0B1222]/98 backdrop-blur-xl border-white/10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
                     : 'bg-white border-slate-200 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.1)]'
                 }`}>
                   <div className="space-y-0.5">
                      <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-3 my-1 opacity-50">Governance</p>
                      {navItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'support') setIsAdminSupportOpen(true);
                            else if (item.id === 'params' || item.id === 'database') {
                              setActiveTab(item.id);
                              setIsSettingsOpen(true);
                            }
                            else setActiveTab(item.id);
                            setIsProfileOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${
                            activeTab === item.id
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <item.icon className={`w-3 h-3 ${activeTab === item.id ? 'text-slate-950' : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                   </div>

                   <div className={`pt-1 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                     <button
                       onClick={() => signOut(auth)}
                       className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-rose-500 hover:bg-rose-500/10 transition-all"
                     >
                       <LogOut className="w-3 h-3" />
                       <span>Terminate Session</span>
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </header>

          <div className={`p-4 md:p-10 ${role === 'STUDENT' ? 'p-0' : ''}`}>
            <div className={role === 'STUDENT' ? 'w-full' : 'max-w-7xl mx-auto'}>
              {inspectingStudentId ? (
                <StaffStudentViewMode studentId={inspectingStudentId} onExit={() => setInspectingStudentId(null)} />
              ) : !appUser.isApproved && role === 'STUDENT' ? (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/10">
                    <ShieldAlert className="w-12 h-12 animate-pulse" />
                  </div>
                  <div className="space-y-3 max-w-md">
                    <h2 className={`text-3xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Pending</h2>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
                      Please wait for admin to approve your account.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Clearance...</span>
                  </div>
                </div>
              ) : (
                <>
                  {role === 'STUDENT' && activeTab === 'dashboard' && <StudentMobileFirstDashboard name={appUser.displayName} />}
                  {activeTab === 'dashboard' && isStaffOrAdmin && (
                     role === 'COUNSELOR' ? <CounselorPortal /> : <StaffDashboard
                        onInspect={(id) => setInspectingStudentId(id)}
                        onMessageStudent={(id) => {
                          setSupportInitialStudentId(id);
                          setIsAdminSupportOpen(true);
                        }}
                      />
                  )}
                  {activeTab === 'students' && isStaffOrAdmin && (
                     <StaffDashboard
                        onInspect={(id) => setInspectingStudentId(id)}
                        onMessageStudent={(id) => {
                          setSupportInitialStudentId(id);
                          setIsAdminSupportOpen(true);
                        }}
                      />
                  )}
                  {activeTab === 'counselors' && isAdmin && (
                    <AdminCounselorRoster />
                  )}
                  {role === 'COUNSELOR' && activeTab === 'students' && <CounselorPortal />}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {isAdminSupportOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAdminSupportOpen(false)}>
          <div className={`w-full max-w-6xl h-[90vh] rounded-[2.5rem] border overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-300 flex flex-col ${
            isDark ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'
          }`} onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-amber-500" />
                <h3 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Support Governance Desk</h3>
              </div>
              <button onClick={() => setIsAdminSupportOpen(false)} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4 md:p-8">
              <AdminSupportDesk initialStudentId={supportInitialStudentId} />
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsSettingsOpen(false)}>
          <div className={`w-full max-w-5xl h-[85vh] rounded-[2.5rem] border overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-300 flex flex-col ${
            isDark ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'
          }`} onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h3 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>System Parameters</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <SettingsConsole initialTab={activeTab === 'database' ? 'database' : 'risk'} />
            </div>
          </div>
        </div>
      )}

      {role === 'STUDENT' && isSupportOpen && (
        <StudentSupportChat isPopUp={true} onClose={() => setIsSupportOpen(false)} />
      )}

      {getPlatformType() === 'NATIVE_ANDROID' && <AppUpdateModal />}
    </div>
  );
};

export default MasterAppPortal;
