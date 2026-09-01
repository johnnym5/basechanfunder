// MasterAppPortal — Unified Governance & Student Portal
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  ClipboardList,
  Server,
  Sliders,
  LogOut,
  BarChart3,
  Building2,
  FolderLock,
  FileCheck2,
  Loader2,
  Activity,
  Compass,
  MessageCircle,
  Eye,
  Sun,
  Moon,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { ProfessionalSpinner } from './ui/LoadingStates';
import { NotificationDropdown } from './ui/NotificationDropdown';
import { RoleSimulationBar } from './RoleSimulationBar';
import { useTheme } from '../context/ThemeContext';

// Import View Components
import { StaffDashboard } from './Dashboard';
import { CounselorPortal } from './CounselorPortal';
import { StudentMobileFirstDashboard } from './StudentMobileFirstDashboard';
import { SettingsConsole } from './SettingsConsole';
import { StaffQueue } from './StaffQueue';
import { StudentSupportChat } from './StudentSupportChat';
import { AdminSupportDesk } from './AdminSupportDesk';
import { StaffStudentViewMode } from './StaffStudentViewMode';

// Dummy/Placeholder sub-components for views not yet refactored
const AccountLinker = () => <div className="p-8 text-white">Account Linker Content</div>;
const DocumentVault = () => <div className="p-8 text-white">Document Vault Content</div>;
const CertificateGenerator = () => <div className="p-8 text-white">Certificate Generator Content</div>;

export const MasterAppPortal: React.FC = () => {
  const { appUser: realUser, role: realRole, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<any>(null);
  const [simulatedTarget, setSimulatedTarget] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  // Fetch real users for simulation
  useEffect(() => {
    if (realRole !== 'ADMIN_GOVERNANCE') return;
    const q = query(collection(db, 'users'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setDbUsers(snap.docs.map(d => ({ id: d.id, name: d.data().displayName || d.data().email, role: d.data().role })));
    });
    return unsub;
  }, [realRole]);

  if (!realUser || !currentUser) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <ProfessionalSpinner message="Loading app…" />
      </div>
    );
  }

  // Determine effective user/role
  const role = isSimulating ? simulatedRole : realRole;
  const appUser = isSimulating ? { ...realUser, displayName: simulatedTarget?.name || realUser.displayName, role: simulatedRole } : realUser;

  const isStaffOrAdmin = role === 'STAFF_AUDITOR' || role === 'COUNSELOR' || role === 'ADMIN_GOVERNANCE';

  // Define sidebar items based on role
  const navItems = isStaffOrAdmin ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'queue', label: 'Student List', icon: Users },
    { id: 'support', label: 'Support Desk', icon: MessageCircle },
    { id: 'params', label: 'Settings', icon: Sliders },
  ] : [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
  ];

  return (
    <div className={`h-screen w-full flex flex-col font-sans selection:bg-amber-500/30 overflow-hidden transition-colors duration-500 ${
      theme === 'dark' ? 'bg-[#0a0f1e] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Simulation Warning (Sticky Top) */}
      {isSimulating && (
        <div className="bg-amber-500 text-slate-950 px-6 py-1 flex justify-between items-center shadow-xl z-[200]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Admin Impersonation Active — Simulating {role} View</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-950/10 px-3 py-0.5 rounded-lg border border-slate-950/10">
              <span className="text-[9px] font-black uppercase opacity-60">Context:</span>
              <span className="text-[9px] font-black uppercase">{appUser.displayName}</span>
            </div>
            <button
              onClick={() => setIsSimulating(false)}
              className="text-[9px] font-black uppercase border border-slate-950/20 px-2 py-0.5 rounded hover:bg-slate-950 hover:text-white transition-all"
            >
              Exit Simulation
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 1. Unified Sidebar Navigation (Desktop Only) */}
        {role !== 'STUDENT' && (
          <aside className={`hidden md:flex w-16 hover:w-64 transition-all duration-300 border-r z-50 flex flex-col group relative overflow-hidden backdrop-blur-3xl animate-in slide-in-from-left fade-in duration-1000 ease-in-out ${
            theme === 'dark' ? 'bg-slate-950/50 border-white/5' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <div className="p-4 flex items-center space-x-4 mb-8">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <ShieldCheck className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-950' : 'text-white'}`} />
              </div>
              <span className={`text-sm font-black tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>BCF Control</span>
            </div>

            <nav className="flex-1 px-3 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-4 px-3 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : `hover:bg-white/5 ${theme === 'dark' ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-900'}`
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => signOut(auth)}
                className="w-full flex items-center space-x-4 px-3 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          </aside>
        )}

        {/* 2. Main Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.03),transparent)]">

          {/* Top Header (Hidden for Student - Student has its own Profile FAB header) */}
          <header className={`h-16 flex-shrink-0 px-8 border-b flex items-center justify-between transition-colors duration-500 ${
          theme === 'dark' ? 'bg-slate-950/20 border-white/5' : 'bg-white border-slate-200'
        } ${role === 'STUDENT' ? 'hidden' : 'flex'}`}>
          <div className="flex items-center space-x-6">
            {inspectingStudentId ? (
              <button
                onClick={() => setInspectingStudentId(null)}
                className="flex items-center gap-2 bg-slate-900 border border-white/10 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                Exit Student Page
              </button>
            ) : (
              role !== 'STUDENT' && (
                <h1 className="text-base font-black text-white tracking-tight uppercase">
                  Hello <span className="text-amber-500">{appUser.displayName || 'User'}</span>, welcome to your <span className="text-amber-500">{role?.split('_')[0]} Dashboard</span>
                </h1>
              )
            )}
          </div>

            <div className="flex items-center space-x-6">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 border-white/5 text-slate-400 hover:text-amber-500'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-blue-600'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {role === 'STUDENT' && (
              <button
                onClick={() => setIsSupportOpen(!isSupportOpen)}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                  isSupportOpen
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                    : theme === 'dark' ? 'bg-slate-900 border-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-950'
                }`}
                title="Customer Support"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Support</span>
              </button>
            )}
            <NotificationDropdown />
            {/* User Profile Section (Clickable for Simulation) */}
            <div className="relative">
              <button
                onClick={() => realRole === 'ADMIN_GOVERNANCE' && setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center space-x-4 p-1.5 rounded-2xl transition-all ${isProfileOpen ? 'bg-white/5 ring-1 ring-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="text-right hidden sm:block">
                  <p className={`text-sm font-black leading-none tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{appUser.displayName}</p>
                  <p className="text-[10px] font-bold font-mono text-amber-500/60 mt-1 uppercase">@{appUser.username || 'user'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-black text-amber-500 overflow-hidden shadow-lg ring-1 ring-white/5">
                  {appUser.photoURL ? (
                    <img src={appUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg uppercase">{(appUser.displayName?.[0] || 'U')}</span>
                  )}
                </div>
              </button>

              {/* Simulation / Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-4 w-72 bg-[#0D111A] border border-white/10 rounded-[2rem] shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="p-6 border-b border-white/5 bg-slate-950/20">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Simulation Engine</span>
                    <h4 className="text-xs font-bold text-white mt-1">Impersonate View Mode</h4>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Role Selection */}
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-slate-500 uppercase px-2">Target Role</p>
                       <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'STUDENT', label: 'Student', color: 'text-amber-500' },
                            { id: 'COUNSELOR', label: 'Counselor', color: 'text-emerald-500' },
                            { id: 'ADMIN_GOVERNANCE', label: 'Admin', color: 'text-purple-500' },
                          ].map(r => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setSimulatedRole(r.id);
                                setIsSimulating(true);
                                setSimulatedTarget(null);
                                setIsProfileOpen(false);
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/20 text-[10px] font-bold text-slate-300 transition-all text-left"
                            >
                              <span className={r.color}>●</span> {r.label}
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Quick Select Targets */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase px-2">Quick Switch Context</p>
                       <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
                          {dbUsers.map(u => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setSimulatedRole(u.role || 'STUDENT');
                                setIsSimulating(true);
                                setSimulatedTarget(u);
                                setIsProfileOpen(false);
                              }}
                              className="w-full px-3 py-2 rounded-xl hover:bg-white/5 text-[11px] font-bold text-slate-400 hover:text-amber-500 transition-all text-left flex justify-between items-center"
                            >
                              <span>{u.name}</span>
                              <span className="text-[9px] opacity-40 font-mono">{u.role}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/40 border-t border-white/5">
                    <button
                      onClick={() => { setIsSimulating(false); setIsProfileOpen(false); }}
                      className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                    >
                      Reset Real Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </header>

          {/* Dynamic Content Area */}
          <div className={`flex-1 overflow-y-auto ${role === 'STUDENT' ? 'p-0' : 'p-8'}`}>
            <div className={role === 'STUDENT' ? 'w-full' : 'max-w-7xl mx-auto'}>

              {/* View Dispatcher */}
              {inspectingStudentId ? (
                <StaffStudentViewMode studentId={inspectingStudentId} onExit={() => setInspectingStudentId(null)} />
              ) : (
                <>
                  {role === 'STUDENT' && (
                    <>
                      {activeTab === 'dashboard' && <StudentMobileFirstDashboard name={appUser.displayName} />}
                    </>
                  )}

                  {(role === 'STAFF_AUDITOR' || role === 'COUNSELOR' || role === 'ADMIN_GOVERNANCE') && (
                    <>
                      {activeTab === 'dashboard' && (
                        role === 'COUNSELOR' ? <CounselorPortal /> : <StaffDashboard onInspect={(id) => setInspectingStudentId(id)} />
                      )}
                      {activeTab === 'queue'      && <StaffQueue onInspect={(id) => setInspectingStudentId(id)} />}
                      {activeTab === 'support'    && <AdminSupportDesk />}
                      {activeTab === 'params'     && <SettingsConsole />}
                    </>
                  )}

                  {role === 'COUNSELOR' && activeTab === 'students' && <CounselorPortal />}

                  {/* Fallback if no tab matches */}
                  {(!role || !['dashboard', 'accounts', 'documents', 'certificate', 'queue', 'support', 'params', 'students'].includes(activeTab)) && (
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

      {/* Mobile Bottom Navigation (Visible only on mobile viewports) */}
      {role !== 'STUDENT' && (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t px-6 pt-3 pb-8 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)] ${
          theme === 'dark' ? 'bg-slate-950/80 backdrop-blur-3xl border-white/10' : 'bg-white border-slate-200'
        }`}>
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center space-y-1 ${activeTab === item.id ? 'text-amber-500' : 'text-slate-500'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Student Floating Messenger */}
      {role === 'STUDENT' && isSupportOpen && (
        <StudentSupportChat
          isPopUp={true}
          onClose={() => setIsSupportOpen(false)}
        />
      )}

    </div>
  );
};

export default MasterAppPortal;
