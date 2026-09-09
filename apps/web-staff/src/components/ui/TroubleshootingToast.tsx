import React from 'react';
import { Info, ExternalLink } from 'lucide-react';
import { IncidentEngine } from '../../services/incidentEngine';

interface Props {
  message: string;
  onOpenGuide?: () => void;
}

export const TroubleshootingToast: React.FC<Props> = ({ message, onOpenGuide }) => {
  const incident = IncidentEngine.troubleshoot(message);
  const isNew = incident.code === 'NEW_UNIDENTIFIED_ISSUE';

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            if (onOpenGuide) onOpenGuide();
            else window.dispatchEvent(new CustomEvent('app:open-settings', { detail: { tab: 'troubleshooting' } }));
          }}
          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all shrink-0"
          title="Get Troubleshooting Guide"
        >
          <Info className="w-4 h-4 text-blue-400" />
        </button>
      </div>

      <div className={`mt-1 p-2 rounded-lg border text-[10px] leading-relaxed ${
        isNew ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      }`}>
        <div className="flex items-center gap-1.5 mb-1 font-black uppercase tracking-widest">
          {isNew ? 'New Incident Flagged' : `Identified: ${incident.code}`}
        </div>
        <p>{incident.resolution}</p>
        {incident.docsUrl && (
          <a
            href={incident.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 mt-1 font-bold hover:underline"
          >
            Read Documentation <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
};
