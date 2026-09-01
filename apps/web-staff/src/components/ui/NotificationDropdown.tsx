import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bell,
  X,
  UserPlus,
  Zap,
  ShieldAlert,
  Settings2,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Trash2,
  Clock
} from 'lucide-react';

interface SystemNotification {
  id: string;
  type: 'NEW_USER' | 'TOP_UP' | 'OVERRIDE' | 'ANOMALY';
  message: string;
  time: string;
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: SystemNotification[] = [
  { id: '1', type: 'NEW_USER', message: 'Adebayo Ogunlesi registered for GBR route.', time: '2m ago', isRead: false },
  { id: '2', type: 'TOP_UP', message: 'Chidi Anagonye requested a ₦500,000 top-up.', time: '15m ago', isRead: false },
  { id: '3', type: 'ANOMALY', message: 'High deposit flag detected for Student STU-2283.', time: '1h ago', isRead: false },
  { id: '4', type: 'OVERRIDE', message: 'Manual balance adjustment committed by Sarah Connor.', time: '2h ago', isRead: true },
  { id: '5', type: 'NEW_USER', message: 'Tunde Eniola successfully linked GTBank API.', time: '5h ago', isRead: true },
  { id: '6', type: 'TOP_UP', message: 'Urgent: Top-up grace period expiring in 2h.', time: '10h ago', isRead: true },
  { id: '7', type: 'ANOMALY', message: 'Daily balance drop detected for Kwame Nkrumah.', time: '1d ago', isRead: true },
  { id: '8', type: 'NEW_USER', message: 'Zainab Bello completed onboarding.', time: '2d ago', isRead: true },
];

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>(MOCK_NOTIFICATIONS);
  const [page, setPage] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageSize = 5;
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const totalPages = Math.ceil(notifications.length / pageSize);
  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * pageSize;
    return notifications.slice(start, start + pageSize);
  }, [notifications, page]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearAll = () => {
    setNotifications([]);
    setPage(1);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // If we're on a page that becomes empty, go back
    if (paginatedNotifications.length === 1 && page > 1) {
      setPage(page - 1);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_USER': return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'TOP_UP': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'ANOMALY': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'OVERRIDE': return <Settings2 className="w-4 h-4 text-cyan-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl border backdrop-blur-md transition-all relative ${
          isOpen
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
            : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center rounded-full shadow-lg ring-2 ring-[#07090e]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 bg-[#0D111A]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">

          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Activity Feed</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">System Events & Logs</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearAll}
                title="Clear all notifications"
                className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-white/5">
                {paginatedNotifications.map((notif) => (
                  <div key={notif.id} className={`p-5 flex items-start space-x-4 transition-colors group relative ${!notif.isRead ? 'bg-amber-500/[0.03]' : 'hover:bg-white/[0.02]'}`}>
                    {!notif.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                    )}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-slate-400' : 'text-slate-100 font-bold'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{notif.time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissNotification(notif.id)}
                      className="absolute right-4 top-5 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center opacity-30">
                <Bell className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No New Activity</p>
              </div>
            )}
          </div>

          {/* Footer: Pagination */}
          {notifications.length > pageSize && (
            <div className="p-4 border-t border-white/5 bg-slate-950/20 flex items-center justify-between px-6">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
