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
  X
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
import { LandingPage } from '../pages/LandingPage';
import { StudentOnboardingWizard } from './StudentOnboardingWizard';

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
  const isDark = theme === 'dark';

  // Define sidebar items based on role
  const navItems = isStaffOrAdmin ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'support', label: 'Support Desk', icon: MessageCircle },
    { id: 'params', label: 'Settings', icon: Sliders },
  ] : [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
  ];

  return (
    <div className={`h-screen w-full flex flex-col font-sans selection:bg-amber-500/30 overflow-hidden transition-colors duration-500 ${
      theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="flex-1 flex overflow-hidden">
        {/* Main Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.03),transparent)]">

          {/* Top Header (Hidden for Student - Student has its own Profile FAB header) */}
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
                  <h1 className={`text-[9px] md:text-xs font-black tracking-tight uppercase truncate ${isDark ? 'text-white' : 'text-blue-950'}`}>
                    Hello <span className="text-amber-500">{appUser.displayName || 'User'}</span>, welcome to your <span className="text-amber-500">{role?.split('_')[0]} Dashboard</span>
                  </h1>
                )
              )}
            </div>

            <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center space-x-4 p-0.5 rounded-full border-2 transition-all hover:scale-105 active:scale-95 ${
                    isDark
                      ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-[#0B1222]'
                      : 'border-blue-600 shadow-md shadow-blue-500/20 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
                    {appUser.photoURL ? (
                      <img src={appUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-blue-600 uppercase">{(appUser.displayName?.[0] || 'U')}</span>
                    )}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className={`absolute right-0 top-full mt-4 w-72 rounded-[2.5rem] shadow-2xl z-[150] p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right border-2 ${
                    isDark
                      ? 'bg-[#0B1222] border-blue-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.95)]'
                      : 'bg-white border-slate-200 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
                  }`}>
                    <div className={`flex items-center space-x-3 pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm overflow-hidden border shrink-0 ${
                        isDark ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        {appUser.photoURL ? (
                          <img src={appUser.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          appUser.displayName?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-black uppercase truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{appUser.displayName}</p>
                        <p className={`text-[10px] font-mono truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>@{appUser.username || 'user'}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {navItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'support') setIsAdminSupportOpen(true);
                            else if (item.id === 'params') setIsSettingsOpen(true);
                            else setActiveTab(item.id);
                            setIsProfileOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === item.id
                              ? (isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200')
                              : (isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-800 hover:bg-slate-100')
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-blue-500' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>
                        </button>
                      ))}
                      <div className={`my-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`} />
                      <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isDark ? 'text-slate-200 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-slate-800 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
                          <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsNotificationsOpen(true);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isDark ? 'text-slate-200 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-slate-800 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <span>Notifications & Alerts</span>
                        </div>
                      </button>
                    </div>

                    <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <button
                        onClick={() => signOut(auth)}
                        className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className={`flex-1 overflow-y-auto ${role === 'STUDENT' ? 'p-0' : 'p-3 md:p-8'}`}>
            <div className={role === 'STUDENT' ? 'w-full' : 'max-w-7xl mx-auto'}>
              {inspectingStudentId ? (
                <StaffStudentViewMode studentId={inspectingStudentId} onExit={() => setInspectingStudentId(null)} />
              ) : !appUser.isApproved && role === 'STUDENT' ? (
                <LandingPage isPendingApproval={true} />
              ) : (
                <>
                  {role === 'STUDENT' && activeTab === 'dashboard' && <StudentMobileFirstDashboard name={appUser.displayName} />}
                  {isStaffOrAdmin && (
                    <>
                      {activeTab === 'dashboard' && (
                        role === 'COUNSELOR' ? <CounselorPortal /> : <StaffDashboard
                          onInspect={(id) => setInspectingStudentId(id)}
                          onMessageStudent={(id) => {
                            setSupportInitialStudentId(id);
                            setIsAdminSupportOpen(true);
                          }}
                        />
                      )}
                    </>
                  )}

                  {role === 'COUNSELOR' && activeTab === 'students' && <CounselorPortal />}

                  {/* Fallback if no tab matches */}
                  {(!role || !['dashboard', 'students'].includes(activeTab)) && (
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
            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
              <SettingsConsole />
            </div>
          </div>
        </div>
      )}

      {role === 'STUDENT' && isSupportOpen && (
        <StudentSupportChat isPopUp={true} onClose={() => setIsSupportOpen(false)} />
      )}
    </div>
  );
};

export default MasterAppPortal;
