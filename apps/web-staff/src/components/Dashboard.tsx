import React, { useState } from 'react';

export type UserRole = 'APPLICANT' | 'STAFF_AUDITOR' | 'ADMIN_GOVERNANCE';

export interface ActiveUser {
  name: string;
  id: string;
  role: UserRole;
  roleTitle: string;
  email: string;
}

export const StaffDashboard: React.FC = () => {
  // Trial Mode User Profiles
  const userProfiles: Record<UserRole, ActiveUser> = {
    STAFF_AUDITOR: { name: 'J. Morgan', id: 'AUD-88', role: 'STAFF_AUDITOR', roleTitle: 'Staff Compliance Auditor', email: 'j.morgan@basechanfunder.com' },
    APPLICANT: { name: 'Adebayo Ogunlesi', id: 'APP-8941', role: 'APPLICANT', roleTitle: 'Visa Applicant', email: 'adebayo.o@example.com' },
    ADMIN_GOVERNANCE: { name: 'Dr. Sarah Connor', id: 'ADM-01', role: 'ADMIN_GOVERNANCE', roleTitle: 'Global Governance Admin', email: 'admin@basechanfunder.com' }
  };

  const [activeRole, setActiveRole] = useState<UserRole>('STAFF_AUDITOR');
  const currentUser = userProfiles[activeRole];

  const [selectedApplicant, setSelectedApplicant] = useState<string>('APP-2026-8941');
  const [activeTab, setActiveTab] = useState<'matrix' | 'anomalies' | 'mbs' | 'certificate' | 'settings'>('matrix');

  const applicants = [
    { id: 'APP-2026-8941', name: 'Adebayo Ogunlesi', route: 'UK Student Visa (Tier 4)', targetGBP: 13340, status: 'VALIDATED', risk: 'LOW', min28Day: 14850.00, anomalyRatio: 0.12 },
    { id: 'APP-2026-9012', name: 'Chioma Nwosu', route: 'Skilled Worker Visa', targetGBP: 18500, status: 'FLAGGED', risk: 'HIGH', min28Day: 17200.00, anomalyRatio: 3.45 },
    { id: 'APP-2026-9155', name: 'Kowshik Rahman', route: 'Graduate Route', targetGBP: 11200, status: 'PENDING', risk: 'MEDIUM', min28Day: 12100.00, anomalyRatio: 1.80 }
  ];

  const currentApp = applicants.find(a => a.id === selectedApplicant) || applicants[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar with Trial Mode User Role Switcher */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-blue-500/20 shadow-lg">
            B
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Basechanfunder</h1>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                🧪 Trial Sandbox Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">UKVI 28-Day Proof of Funds Compliance Platform</p>
          </div>
        </div>

        {/* Top Right User Role Switcher */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              {currentUser.name.charAt(0)}
            </div>

            <div className="flex flex-col text-left pr-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({currentUser.id})</span>
              </div>
              <span className="text-[10px] text-blue-400 font-medium">{currentUser.roleTitle}</span>
            </div>

            {/* Role Selection Dropdown */}
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="bg-slate-900 border border-blue-500/40 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all cursor-pointer"
            >
              <option value="APPLICANT">👤 Switch to: Normal User (Applicant)</option>
              <option value="STAFF_AUDITOR">🛡️ Switch to: Staff Auditor</option>
              <option value="ADMIN_GOVERNANCE">🔑 Switch to: Admin Governance</option>
            </select>
          </div>
        </div>
      </header>

      {/* Role Banner Alert */}
      <div className={`px-6 py-2 border-b text-xs flex items-center justify-between font-mono ${
        activeRole === 'ADMIN_GOVERNANCE'
          ? 'bg-purple-950/60 border-purple-800/80 text-purple-300'
          : activeRole === 'STAFF_AUDITOR'
          ? 'bg-blue-950/60 border-blue-800/80 text-blue-300'
          : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
      }`}>
        <span>
          <strong>CURRENT PERMISSION LEVEL:</strong> {currentUser.role} — {currentUser.roleTitle} ({currentUser.email})
        </span>
        <span className="text-[11px] underline cursor-pointer hover:text-white">
          Active Mode: {activeRole === 'APPLICANT' ? 'Self-Service Applicant Tracker' : activeRole === 'STAFF_AUDITOR' ? 'Auditor Queue & Verification' : 'Full Admin System Parameters'}
        </span>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6">
        {/* Left Sidebar - Queue (Only for Staff / Admin) */}
        {activeRole !== 'APPLICANT' && (
          <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Queue: Visa Applications</h2>
              <span className="text-xs font-mono text-slate-400">3 Active</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {applicants.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApplicant(app.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedApplicant === app.id
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{app.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{app.id} • {app.route}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.status === 'VALIDATED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : app.status === 'FLAGGED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/50 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Target Requirement</span>
                      <span className="font-mono font-semibold text-slate-200">£{app.targetGBP.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">28-Day Min Balance</span>
                      <span className={`font-mono font-semibold ${app.min28Day >= app.targetGBP * 1.1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        £{app.min28Day.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Main Content */}
        <div className={`col-span-12 ${activeRole === 'APPLICANT' ? 'lg:col-span-12' : 'lg:col-span-8'} bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-6`}>
          {/* Applicant Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80 gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white">{activeRole === 'APPLICANT' ? currentUser.name : currentApp.name}</h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                  {activeRole === 'APPLICANT' ? 'APP-2026-8941' : currentApp.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Route: <span className="text-slate-200">{activeRole === 'APPLICANT' ? 'UK Student Visa (Tier 4)' : currentApp.route}</span> | Target UKVI Requirement: <span className="font-mono text-blue-400">£{(activeRole === 'APPLICANT' ? 13340 : currentApp.targetGBP).toLocaleString()}</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Risk Rating</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  (activeRole === 'APPLICANT' ? 'LOW' : currentApp.risk) === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {activeRole === 'APPLICANT' ? 'LOW' : currentApp.risk} RISK
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 pb-2">
            {[
              { id: 'matrix', label: '📊 28-Day Balance Matrix' },
              { id: 'anomalies', label: '⚠️ Anomaly & Cash Influx' },
              { id: 'mbs', label: '📑 MBS PDF Inspection' },
              { id: 'certificate', label: '📜 Compliance Certificate' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Matrix Tab */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500">28-Day Lowest Closing Balance</span>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    £{(activeRole === 'APPLICANT' ? 14850 : currentApp.min28Day).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500">Target + 10% FX Buffer</span>
                  <p className="text-xl font-bold font-mono text-blue-400 mt-1">
                    £{((activeRole === 'APPLICANT' ? 13340 : currentApp.targetGBP) * 1.1).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500">UKVI Compliance Status</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">PASSED</p>
                </div>
              </div>

              {/* Matrix Timeline Graphic */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">28-Day Consecutive Balance Timeline</h3>
                <div className="h-32 flex items-end justify-between space-x-1.5 pt-6">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const heightPercent = 60 + Math.sin(i * 0.5) * 25 + (i === 14 ? -20 : 0);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all ${
                            heightPercent < 45 ? 'bg-rose-500' : 'bg-blue-500 group-hover:bg-blue-400'
                          }`}
                        />
                        <span className="text-[8px] text-slate-500 mt-2 font-mono">D{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'anomalies' && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Financial Anomaly & Cash Influx Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Single-day cash deposit spikes are calculated against historical median balances. Anomaly ratios &lt; 2.5 indicate zero suspicious cash injections.
              </p>
            </div>
          )}

          {activeTab === 'mbs' && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">MyBankStatement (MBS) Verification</h3>
              <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/50 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Digital Signature Verification:</span>
                  <span className="text-emerald-400 font-semibold font-mono">✓ VALID (GTBank RSA-2048)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Embedded PDF Font Integrity:</span>
                  <span className="text-emerald-400 font-semibold font-mono">✓ ORIGINAL (No editing layers detected)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'certificate' && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Official UKVI Proof of Funds Certificate</h3>
              <p className="text-xs text-slate-400">Download digitally-signed compliance certificate for Home Office visa submission.</p>
              <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition-all">
                Download UKVI Certificate (PDF)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
