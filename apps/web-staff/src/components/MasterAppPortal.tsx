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
  Briefcase,
  ChevronDown
} from 'lucide-react';
import { ProfessionalSpinner } from './ui/LoadingStates';
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
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

  // Onboarding state — show wizard for new students who haven't completed it
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!appUser || !currentUser || onboardingChecked) return;
    // Only show onboarding for STUDENT role
    if (role !== 'STUDENT') { setOnboardingChecked(true); return; }

    // Check Firestore for onboardingComplete flag
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

  // Show onboarding wizard for new students
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

  // Define nav items for the FAB dropdown
  const navItems = isStaffOrAdmin ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Roster', icon: Users },
    ...(isAdmin ? [{ id: 'counselors', label: 'Counselors', icon: Briefcase }] : []),
    { id: 'support', label: 'Support Desk', icon: MessageCircle },
    ...(isAdmin ? [{ id: 'database', label: 'Database Explorer', icon: Database }] : []),
    { id: 'params', label: 'Settings', icon: Sliders },
  ] : [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
  ];

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans selection:bg-amber-500/30 overflow-y-auto custom-scrollbar transition-colors duration-500 relative ${
      theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* ── Dynamic Animated Background Layer (100% to 175% slow zoom & pan + 75% Frosted Glass) ── */}
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

        {/* ── 75% Frosted Glass Overlay ── */}
        <div
          className={`absolute inset-0 backdrop-blur-xl transition-colors duration-500 ${
            isDark ? 'bg-[#030712]/75' : 'bg-slate-50/75'
          }`}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Main Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.03),transparent)]">

          {/* Top Header - Restructured Admin/Student Header */}
          <header className={`h-16 flex-shrink-0 px-6 md:px-8 border-b flex items-center justify-between transition-colors duration-500 backdrop-blur-md ${
            theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-white/70 border-slate-200 shadow-sm'
          }`}>
            {/* Left Header: Greeting only */}
            <div className="flex items-center space-x-4">
              {inspectingStudentId ? (
                <button
                  onClick={() => setInspectingStudentId(null)}
                  className="flex items-center gap-2 bg-slate-900 border border-white/10 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Exit Inspector</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className={`text-base md:text-lg font-black tracking-wider uppercase truncate ${
                    isDark
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400'
                      : 'text-slate-900'
                  }`}>
                    HELLO {appUser?.displayName?.toUpperCase() || (role === 'STUDENT' ? 'STUDENT' : 'ADMIN')}
                  </h1>
                </div>
              )}
            </div>

            {/* Right Header Utility Cluster: Notification Bell, Light/Dark Switch, Profile Avatar */}
            <div className="flex items-center space-x-3 md:space-x-4 shrink-0 relative" ref={profileMenuRef}>
               {/* 1. Standalone Textless Notification Bell Icon */}
               <button
                 onClick={() => setIsNotificationsOpen(true)}
                 className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95 shadow-sm backdrop-blur-md ${
                   isDark
                     ? 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                     : 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                 }`}
                 title="Notifications"
                 aria-label="Notifications"
               >
                 <Bell className="w-5 h-5 text-slate-300" />
               </button>

               {/* 2. Interactive Light / Dark Mode Toggle Switch */}
               <button
                 onClick={toggleTheme}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 shadow-sm backdrop-blur-md ${
                   isDark
                     ? 'bg-slate-900/80 border-white/10 text-amber-300 hover:bg-slate-800'
                     : 'bg-white/80 border-slate-200 text-blue-600 hover:bg-slate-100'
                 }`}
                 title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                 aria-label="Toggle Theme"
               >
                 {isDark ? (
                   <>
                     <Sun className="w-4 h-4 text-amber-400" />
                     <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider">Light</span>
                   </>
                 ) : (
                   <>
                     <Moon className="w-4 h-4 text-blue-600" />
                     <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider">Dark</span>
                   </>
                 )}
               </button>

               {/* 3. Circular Profile Avatar / Initial Badge [ B ] */}
               <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`w-10 h-10 rounded-full border-2 p-0.5 transition-all hover:scale-105 active:scale-95 shadow-lg ${
                    isDark
                      ? 'border-blue-500 shadow-blue-500/20 bg-slate-900'
                      : 'border-blue-600 shadow-blue-600/10 bg-white'
                  }`}
                  title="User Profile Menu"
                  aria-label="Profile Menu"
               >
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-800 border border-white/5">
                    {appUser.photoURL ? (
                      <img src={appUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-blue-400 uppercase">
                        {appUser.displayName ? appUser.displayName[0] : 'B'}
                      </span>
                    )}
                  </div>
               </button>

               {/* CONSOLIDATED DROPDOWN MENU */}
               {isProfileOpen && (
                 <div className={`absolute right-0 top-full mt-4 w-72 rounded-[2.5rem] shadow-2xl z-[150] p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right border-2 ${
                   isDark
                     ? 'bg-[#0B1222] border-blue-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
                     : 'bg-white border-slate-200 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
                 }`}>
                   {/* Menu Header (Mobile) */}
                   <div className={`md:hidden flex items-center space-x-3 pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm overflow-hidden border shrink-0 bg-blue-500/20 border-blue-500/40 text-blue-400">
                        {appUser.displayName?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-black uppercase truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{appUser.displayName}</p>
                        <p className="text-[10px] font-mono text-amber-500 truncate">{role?.replace(/_/g, ' ')}</p>
                      </div>
                   </div>

                   {/* Main Navigation Items */}
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-3 mb-2">Navigation</p>
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
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wide transition-all ${
                            activeTab === item.id
                              ? 'bg-amber-500 text-slate-950 shadow-lg'
                              : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-slate-950' : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                   </div>

                   <div className={`my-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`} />

                   {/* System Actions */}
                   <div className="space-y-1">
                      <button
                        onClick={() => { toggleTheme(); setIsProfileOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase transition-all ${
                          isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                         {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
                         <span>{isDark ? 'Light UI Mode' : 'Dark UI Mode'}</span>
                      </button>

                      <button
                        onClick={() => { setIsNotificationsOpen(true); setIsProfileOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase transition-all ${
                          isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                         <Bell className="w-4 h-4 text-amber-500" />
                         <span>Notifications</span>
                      </button>
                   </div>

                   <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                     <button
                       onClick={() => signOut(auth)}
                       className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase text-rose-500 hover:bg-rose-500/10 transition-all"
                     >
                       <LogOut className="w-4 h-4" />
                       <span>Terminate Session</span>
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </header>

          <div className={`flex-1 overflow-y-auto custom-scrollbar backdrop-blur-[75px] ${role === 'STUDENT' ? 'p-0' : 'p-4 md:p-10'} ${isDark ? 'bg-black/20' : 'bg-white/20'}`}>
            <div className={role === 'STUDENT' ? 'w-full' : 'max-w-7xl mx-auto'}>
              {inspectingStudentId ? (
                <StaffStudentViewMode studentId={inspectingStudentId} onExit={() => setInspectingStudentId(null)} />
              ) : !appUser.isApproved && role === 'STUDENT' ? (
                <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-1000">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/10">
                    <ShieldAlert className="w-12 h-12 animate-pulse" />
                  </div>
                  <div className="space-y-3 max-w-md">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Account Pending</h2>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
                      Please wait for admin to approve your account. Your dashboard will automatically unlock once verified.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Governance Clearance...</span>
                  </div>
                </div>
              ) : (
                <>
                  {role === 'STUDENT' && activeTab === 'dashboard' && <StudentMobileFirstDashboard name={appUser.displayName} />}

                  {/* Dashboard Tab */}
                  {activeTab === 'dashboard' && isStaffOrAdmin && (
                     role === 'COUNSELOR' ? <CounselorPortal /> : <StaffDashboard
                        onInspect={(id) => setInspectingStudentId(id)}
                        onMessageStudent={(id) => {
                          setSupportInitialStudentId(id);
                          setIsAdminSupportOpen(true);
                        }}
                      />
                  )}

                  {/* Student Roster Tab */}
                  {activeTab === 'students' && isStaffOrAdmin && (
                     <StaffDashboard
                        onInspect={(id) => setInspectingStudentId(id)}
                        onMessageStudent={(id) => {
                          setSupportInitialStudentId(id);
                          setIsAdminSupportOpen(true);
                        }}
                      />
                  )}

                  {/* Counselors Tab */}
                  {activeTab === 'counselors' && isAdmin && (
                    <AdminCounselorRoster />
                  )}

                  {role === 'COUNSELOR' && activeTab === 'students' && <CounselorPortal />}

                  {/* Fallback */}
                  {(!role || !['dashboard', 'students', 'counselors'].includes(activeTab)) && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Compass className="w-12 h-12 text-slate-700" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Select a menu item to continue</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${
            theme === 'dark' ? 'bg-[#0D1424] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>System Alerts</h3>
              </div>
              <button onClick={() => setIsNotificationsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 text-center text-xs text-slate-400 italic">No new alerts for this session.</div>
            <div className={`p-3 border-t flex justify-end items-center ${theme === 'dark' ? 'border-white/5 bg-slate-950/40' : 'border-slate-100 bg-slate-50'}`}>
              <button onClick={() => setIsNotificationsOpen(false)} className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {isAdminSupportOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-6xl h-[90vh] rounded-[2.5rem] border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col ${
            isDark ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'
          }`}>
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-5xl h-[85vh] rounded-[2.5rem] border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col ${
            isDark ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'
          }`}>
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
