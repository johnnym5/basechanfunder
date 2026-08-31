import React, { useState } from 'react';

export const StaffDashboard: React.FC = () => {
  const [selectedApplicant, setSelectedApplicant] = useState<string>('APP-2026-8941');
  const [activeTab, setActiveTab] = useState<'matrix' | 'anomalies' | 'mbs' | 'certificate'>('matrix');

  const applicants = [
    { id: 'APP-2026-8941', name: 'Adebayo Ogunlesi', route: 'UK Student Visa (Tier 4)', targetGBP: 13340, status: 'VALIDATED', risk: 'LOW', min28Day: 14850.00, anomalyRatio: 0.12 },
    { id: 'APP-2026-9012', name: 'Chioma Nwosu', route: 'Skilled Worker Visa', targetGBP: 18500, status: 'FLAGGED', risk: 'HIGH', min28Day: 17200.00, anomalyRatio: 3.45 },
    { id: 'APP-2026-9155', name: 'Kowshik Rahman', route: 'Graduate Route', targetGBP: 11200, status: 'PENDING', risk: 'MEDIUM', min28Day: 12100.00, anomalyRatio: 1.80 }
  ];

  const currentApp = applicants.find(a => a.id === selectedApplicant) || applicants[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-blue-500/20 shadow-lg">
            B
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Basechanfunder</h1>
            <p className="text-xs text-slate-400 font-medium">UKVI Staff Audit & Compliance Console</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            ● Live Ingestion Active
          </span>
          <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <span>Staff Auditor:</span>
            <span className="text-blue-400">J. Morgan (ID: AUD-88)</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6">
        {/* Left Column - Applicant List */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Queue: Visa Applicants</h2>
            <span className="text-xs font-mono text-slate-400">3 Applications</span>
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

        {/* Right Column - Audit Detail & Matrix Inspector */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-6">
          {/* Applicant Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80 gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white">{currentApp.name}</h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">{currentApp.id}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Route: <span className="text-slate-200">{currentApp.route}</span> | Target UKVI Requirement: <span className="font-mono text-blue-400">£{currentApp.targetGBP.toLocaleString()}</span></p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Risk Rating</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  currentApp.risk === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {currentApp.risk} RISK
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
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

          {/* Tab Contents */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500">28-Day Lowest Closing Balance</span>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">£{currentApp.min28Day.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500">Target + 10% FX Buffer</span>
                  <p className="text-xl font-bold font-mono text-blue-400 mt-1">£{(currentApp.targetGBP * 1.1).toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500">UKVI Compliance Status</span>
                  <p className={`text-xl font-bold mt-1 ${currentApp.min28Day >= currentApp.targetGBP * 1.1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentApp.min28Day >= currentApp.targetGBP * 1.1 ? 'PASSED' : 'DEFICIT'}
                  </p>
                </div>
              </div>

              {/* Matrix Timeline Graphic */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">28-Day Consecutive Balance Timeline</h3>
                <div className="h-32 flex items-end justify-between space-x-1.5 pt-6">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const heightPercent = 60 + Math.sin(i * 0.5) * 25 + (i === 14 ? -35 : 0);
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
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-200">Financial Anomaly Analysis</h3>
                <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded text-slate-300">
                  Anomaly Ratio R: <strong className={currentApp.anomalyRatio > 2.5 ? 'text-rose-400' : 'text-emerald-400'}>{currentApp.anomalyRatio}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates single-day cash deposit spikes against the historical median balance. Anomaly ratios &gt; 2.5 indicate potential parked funds or unverified third-party cash injections.
              </p>
            </div>
          )}

          {activeTab === 'mbs' && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">MyBankStatement (MBS) Forensic Audit</h3>
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
              <h3 className="text-sm font-semibold text-slate-200">Generate Official UKVI Audit Certificate</h3>
              <p className="text-xs text-slate-400">Produces an encrypted, digitally-signed PDF compliance proof for visa submission.</p>
              <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 transition-all">
                Export Signed Compliance Certificate (PDF)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
