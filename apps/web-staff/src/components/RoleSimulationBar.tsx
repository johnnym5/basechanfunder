import React from 'react';
import {
  User,
  ShieldAlert,
  ChevronDown,
  X,
  UserCheck,
  Users,
  Settings,
  Eye
} from 'lucide-react';
import { UserRole } from '../context/AuthContext';

interface SimulationTarget {
  id: string;
  name: string;
}

interface RoleSimulationBarProps {
  activeRole: UserRole | null;
  targetUser: SimulationTarget | null;
  availableTargets?: SimulationTarget[];
  onRoleChange: (role: UserRole) => void;
  onTargetChange: (target: SimulationTarget) => void;
  onExit: () => void;
}

export const RoleSimulationBar: React.FC<RoleSimulationBarProps> = ({
  activeRole,
  targetUser,
  availableTargets = [],
  onRoleChange,
  onTargetChange,
  onExit
}) => {
  return (
    <div className="sticky top-0 z-[200] w-full bg-amber-500 border-b border-amber-600 px-6 py-2.5 flex items-center justify-between shadow-xl">
      <div className="flex items-center space-x-6">
        {/* Warning Indicator */}
        <div className="flex items-center space-x-2 text-slate-950">
          <ShieldAlert className="w-5 h-5 fill-slate-950/20" />
          <span className="text-xs font-black uppercase tracking-widest text-red-700">Admin Impersonation Active</span>
        </div>

        <div className="h-6 w-px bg-slate-950/10" />

        {/* Role Toggles */}
        <div className="flex items-center space-x-1 bg-slate-950/10 p-1 rounded-xl">
          {[
            { id: 'STUDENT', label: 'Student View', icon: User },
            { id: 'COUNSELOR', label: 'Counselor View', icon: Users },
            { id: 'ADMIN_GOVERNANCE', label: 'Admin View', icon: Settings },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id as UserRole)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                activeRole === role.id
                  ? 'bg-slate-950 text-white shadow-lg'
                  : 'text-slate-950 hover:bg-slate-950/10'
              }`}
            >
              <role.icon className="w-3 h-3" />
              <span>{role.label}</span>
            </button>
          ))}
        </div>

        {/* Context Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-3 px-4 py-2 bg-slate-950/10 rounded-xl border border-slate-950/10 hover:bg-slate-950/20 transition-all">
            <div className="w-5 h-5 rounded-lg bg-slate-950 flex items-center justify-center">
              <UserCheck className="w-3 h-3 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-950/60 uppercase leading-none">Simulating Context For</p>
              <p className="text-xs font-black text-slate-950 mt-0.5">{targetUser?.name || 'Select Target'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-950" />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
             <div className="p-3 border-b border-slate-100 bg-slate-50">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Users in Database</span>
             </div>
             <div className="max-h-64 overflow-y-auto p-2 space-y-1">
               {availableTargets.length > 0 ? (
                 availableTargets.map(u => (
                   <button
                     key={u.id}
                     onClick={() => onTargetChange(u)}
                     className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center justify-between"
                   >
                     <span className="truncate">{u.name}</span>
                   </button>
                 ))
               ) : (
                 <div className="p-4 text-center">
                   <p className="text-[10px] font-bold text-slate-400 italic">No registered users in live database.</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Exit Button */}
      <button
        onClick={onExit}
        className="flex items-center space-x-2 px-4 py-2 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20"
      >
        <X className="w-4 h-4 text-amber-500" />
        <span>Exit Simulation</span>
      </button>
    </div>
  );
};
