import React from 'react';
import { AdminNotificationPopover } from './ui/AdminNotificationPopover';
import { HelpModalTrigger } from './HelpModalTrigger';
import { Shield, ArrowLeft, Menu } from 'lucide-react';

export interface AdminHeaderProps {
  displayName?: string;
  isDark?: boolean;
  inspectingStudentId?: string | null;
  onExitInspector?: () => void;
  onToggleSidebar?: () => void;
  onViewStudent?: (userId: string, eventId?: string) => Promise<void>;
  rightActions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  displayName = 'Admin',
  isDark = true,
  inspectingStudentId,
  onExitInspector,
  onToggleSidebar,
  onViewStudent = async () => {},
  rightActions
}) => {
  return (
    <header
      className={`h-16 px-4 sm:px-8 border-b backdrop-blur-md flex items-center justify-between transition-colors duration-500 sticky top-0 z-30 ${
        isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white/80 border-slate-200'
      }`}
    >
      {/* Left Title & Status */}
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

        {inspectingStudentId ? (
          <div className="flex items-center gap-2">
            {onExitInspector && (
              <button
                onClick={onExitInspector}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-black uppercase transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Exit Inspector</span>
              </button>
            )}
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>ADMIN INSPECTOR MODE</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 truncate">
            <h1 className="text-xs sm:text-lg md:text-xl font-black uppercase tracking-tight text-depth-header whitespace-nowrap overflow-hidden">
              <span className="text-slate-600 dark:text-slate-400">HI </span>
              <span className="text-accent-gold dark:text-amber-500">
                {displayName.split(' ')[0]?.toUpperCase() || 'ADMIN'}
              </span>
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-wider items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Governance Admin</span>
            </span>
          </div>
        )}
      </div>

      {/* Right Cluster: Help Trigger Beside Bell */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Help & Onboarding Knowledge Base Trigger beside Notification Bell */}
          <HelpModalTrigger role="ADMIN" />
          {/* Admin Notification Bell */}
          <AdminNotificationPopover onViewStudent={onViewStudent} />
        </div>

        {rightActions}
      </div>
    </header>
  );
};

export default AdminHeader;
