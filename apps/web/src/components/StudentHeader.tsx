import React from 'react';
import { HelpModalTrigger } from './HelpModalTrigger';
import { ShieldCheck, Menu, Bell } from 'lucide-react';

export interface StudentHeaderProps {
  displayName?: string;
  isDark?: boolean;
  onToggleSidebar?: () => void;
  notificationBell?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  displayName = 'Student',
  isDark = true,
  onToggleSidebar,
  notificationBell,
  rightActions
}) => {
  return (
    <header
      className={`h-16 px-4 sm:px-8 border-b backdrop-blur-md flex items-center justify-between transition-colors duration-500 sticky top-0 z-30 ${
        isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white/80 border-slate-200'
      }`}
    >
      {/* Left Title & Greeting */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white md:hidden hover:bg-white/5 transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 truncate">
          <h1 className="text-xs sm:text-lg md:text-xl font-black uppercase tracking-tight text-depth-header whitespace-nowrap overflow-hidden">
            <span className="text-slate-600 dark:text-slate-400">HI </span>
            <span className="text-accent-gold dark:text-amber-500">
              {displayName.split(' ')[0]?.toUpperCase() || 'STUDENT'}
            </span>
          </h1>
          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Student Portal</span>
          </span>
        </div>
      </div>

      {/* Right Cluster: Help Trigger Beside Bell */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Help & Onboarding Knowledge Base Trigger beside Notification Bell */}
          <HelpModalTrigger role="STUDENT" />
          {/* Notification Bell */}
          {notificationBell || (
            <button
              aria-label="Notifications"
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/5 text-slate-300 hover:text-white"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}
        </div>

        {rightActions}
      </div>
    </header>
  );
};

export default StudentHeader;
