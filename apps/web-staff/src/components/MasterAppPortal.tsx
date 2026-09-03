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
  onSnapshot
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
  BarChartHorizontal
} from 'lucide-react';
import { ProfessionalSpinner } from './ui/LoadingStates';
import { NotificationDropdown } from './ui/NotificationDropdown';
import { useTheme } from '../context/ThemeContext';

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

export const MasterAppPortal: React.FC = () => {
// ... existing imports ...
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
    import('firebase/firestore').then(({ doc, getDoc }) => {
      import('../firebase').then(({ db }) => {
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
          const data = snap.data();
          const completed = data?.onboardingComplete === true;
          setShowOnboarding(!completed);
          setOnboardingChecked(true);
        }).catch(() => { setOnboardingChecked(true); });
      });
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

  // Define sidebar items based on role
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
    <div className={`h-screen w-full flex font-sans selection:bg-amber-500/30 overflow-hidden transition-colors duration-500 relative ${
      theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Background Graphic Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDark ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDark ? 'bg-amber-500/5' : 'bg-amber-500/10'}`} />
      </div>

      {/* STICKY SIDEBAR (For Staff/Admin Only) */}
      {isStaffOrAdmin && role !== 'STUDENT' && (
        <aside className="sticky top-0 h-screen w-64 border-r border-white/10 bg-slate-900/40 backdrop-blur-3xl flex flex-col justify-between p-6 z-40 shrink-0 hidden md:flex">
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                 <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-tighter text-white">Governance</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Portal v1.2</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'support') setIsAdminSupportOpen(true);
                    else if (item.id === 'params') {
                      setActiveTab('params');
                      setIsSettingsOpen(true);
                    }
                    else if (item.id === 'database') {
                      setActiveTab('database');
                      setIsSettingsOpen(true);
                    }
                    else setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    (activeTab === item.id || (item.id === 'database' && activeTab === 'database') || (item.id === 'params' && activeTab === 'params'))
                      ? 'bg-amber-500 text-slate-950 shadow-xl shadow-amber-500/20 scale-[1.02]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${(activeTab === item.id || (item.id === 'database' && activeTab === 'database') || (item.id === 'params' && activeTab === 'params')) ? 'text-slate-950' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
             <button
               onClick={toggleTheme}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
             >
                {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
                <span>{isDark ? 'Light UI' : 'Dark UI'}</span>
             </button>
             <button
               onClick={() => signOut(auth)}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/10 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
             >
                <LogOut className="w-4 h-4" />
                <span>Terminate Session</span>
             </button>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Main Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.03),transparent)]">

          {/* Top Header */}
          <header className={`h-14 md:h-16 flex-shrink-0 px-4 md:px-8 border-b flex items-center justify-between transition-colors duration-500 ${
            theme === 'dark' ? 'bg-slate-950/20 border-white/5' : 'bg-white border-slate-200 shadow-sm'
          } ${role === 'STUDENT' ? 'hidden' : 'flex'}`}>
            <div className="flex items-center space-x-3 md:space-x-6 min-w-0 flex-1 pr-4">
              {inspectingStudentId ? (
                <button
                  onClick={() => setInspectingStudentId(null)}
                  className="flex items-center gap-2 bg-slate-900 border border-white/10 text-white px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shrink-0"
                >
                  <ArrowLeft className="w-2 md:w-3 h-2 md:h-3" />
                  <span className="truncate">Exit Student Page</span>
                </button>
              ) : (
                role !== 'STUDENT' && (
                  <div className="flex items-center gap-4">
                    {/* Mobile Menu Trigger could go here */}
                    <h1 className={`text-[9px] md:text-xs font-black tracking-tight uppercase truncate ${isDark ? 'text-white' : 'text-blue-950'}`}>
                      Governance Control <span className="text-slate-500 mx-2">/</span> <span className="text-amber-500">{activeTab.replace('_', ' ')}</span>
                    </h1>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
               <div className="hidden md:flex flex-col items-end">
                  <p className="text-[10px] font-black uppercase text-white leading-none">{appUser.displayName}</p>
                  <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mt-1">{role?.replace(/_/g, ' ')}</p>
               </div>
               <div className="w-10 h-10 rounded-full border-2 border-blue-500 p-0.5 shadow-lg shadow-blue-500/20">
                  <img src={appUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${appUser.uid}`} className="w-full h-full rounded-full object-cover" alt="" />
               </div>
            </div>
          </header>

          <div className={`flex-1 overflow-y-auto custom-scrollbar backdrop-blur-[75px] ${role === 'STUDENT' ? 'p-0' : 'p-3 md:p-8'} ${isDark ? 'bg-black/20' : 'bg-white/20'}`}>
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

                  {/* Dashboard Tab: Show Stats and recent activity */}
                  {activeTab === 'dashboard' && isStaffOrAdmin && (
                     role === 'COUNSELOR' ? <CounselorPortal /> : <StaffDashboard
                        onInspect={(id) => setInspectingStudentId(id)}
                        onMessageStudent={(id) => {
                          setSupportInitialStudentId(id);
                          setIsAdminSupportOpen(true);
                        }}
                      />
                  )}

                  {/* Student Roster Tab: Main Table */}
                  {activeTab === 'students' && isStaffOrAdmin && (
                     <StaffDashboard
                        onInspect={(id) => setInspectingStudentId(id)}
                        onMessageStudent={(id) => {
                          setSupportInitialStudentId(id);
                          setIsAdminSupportOpen(true);
                        }}
                      />
                  )}

                  {/* Counselors Tab (Admin Only) */}
                  {activeTab === 'counselors' && isAdmin && (
                    <AdminCounselorRoster />
                  )}

                  {role === 'COUNSELOR' && activeTab === 'students' && <CounselorPortal />}

                  {/* Fallback if no tab matches */}
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
