import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { BouncyButton } from './BouncyButton';
import { HelpKnowledgeBaseModal } from './HelpKnowledgeBaseModal';

export interface HelpModalTriggerProps {
  role: 'ADMIN' | 'STUDENT';
  className?: string;
}

export const HelpModalTrigger: React.FC<HelpModalTriggerProps> = ({
  role,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(true);

  useEffect(() => {
    const storageKey = role === 'ADMIN' ? 'hasSeenAdminHelp_v1' : 'hasSeenStudentHelp_v1';
    const hasSeenHelp = localStorage.getItem(storageKey);
    if (!hasSeenHelp) {
      setHasSeen(false);
      setIsOpen(true);
    } else {
      setHasSeen(true);
    }
  }, [role]);

  const handleClose = () => {
    const storageKey = role === 'ADMIN' ? 'hasSeenAdminHelp_v1' : 'hasSeenStudentHelp_v1';
    localStorage.setItem(storageKey, 'true');
    setHasSeen(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className={`relative inline-flex items-center ${className}`}>
        <BouncyButton
          onClick={() => setIsOpen(true)}
          title="Help & Knowledge Base"
          aria-label="Open Knowledge Base and Onboarding Guide"
          className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all depth-btn-glass bg-white/5 border-white/5 hover:border-amber-500/40 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 relative group"
        >
          <HelpCircle className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors" />

          {/* First-time pulsing indicator */}
          {!hasSeen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-slate-900"></span>
            </span>
          )}
        </BouncyButton>
      </div>

      <HelpKnowledgeBaseModal
        isOpen={isOpen}
        onClose={handleClose}
        role={role}
      />
    </>
  );
};

export default HelpModalTrigger;
