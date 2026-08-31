import React, { useState } from 'react';

export const AdminDashboard: React.FC = () => {
  const [bufferPercent, setBufferPercent] = useState<number>(10.0);
  const [activeTab, setActiveTab] = useState<'params' | 'roles' | 'audit' | 'vault'>('params');

  const auditLogs = [
    { id: 'LOG-9941', user: 'admin@basechanfunder.com', action: 'UPDATE_FX_SAFETY_BUFFER', detail: 'Changed FX Buffer from 8.5% to 10.0%', ip: '197.210.64.12', time: '10 mins ago' },
    { id: 'LOG-9940', user: 'system_cron', action: 'FETCH_OANDA_SPOT_RATES', detail: 'Updated GBP/NGN rate: 1945.50', ip: '10.0.4.1', time: '25 mins ago' },
    { id: 'LOG-9939', user: 'auditor.smith@ukvi.gov', action: 'EXPORT_COMPLIANCE_CERTIFICATE', detail: 'Exported Certificate for APP-2026-8941', ip: '185.12.14.99', time: '1 hour ago' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-black text-xl text-white shadow-purple-500/20 shadow-lg">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Basechanfunder Admin</h1>
            <p className="text-xs text-slate-400 font-medium">System Governance & Security Control Console</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
            ● Vault Secrets Engine: SEALED (ACTIVE)
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Governance Control</h2>
          {[
            { id: 'params', label: '⚙️ System Parameters' },
            { id: 'roles', label: '👥 RBAC User Management' },
            { id: 'audit', label: '📋 System Audit Logs' },
            { id: 'vault', label: '🔐 Vault & Encryption' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          {activeTab === 'params' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">UKVI Risk Parameters & FX Safety Buffers</h2>
                <p className="text-xs text-slate-400 mt-1">Configure global calculation rules enforced by the Go PoF Engine.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                  <label className="text-xs font-bold text-slate-300 block">Default FX Volatility Safety Buffer (%)</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={bufferPercent}
                      onChange={(e) => setBufferPercent(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg font-mono text-sm w-32 focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-xs text-slate-400">Current: {bufferPercent}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Calculates: <code className="text-purple-400 font-mono">Target_GBP * (1 + {bufferPercent / 100})</code>
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">OANDA FX Integration Status</label>
                  <div className="text-xs font-mono space-y-1">
                    <p className="text-emerald-400">● Live Spot Feed: Connected</p>
                    <p className="text-slate-400">Pairs: GBP/NGN, GBP/USD, GBP/EUR, GBP/CAD</p>
                    <p className="text-slate-500">Cache Expiry: 900 seconds (Redis)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Immutable System Audit Stream</h2>
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
                    <tr>
                      <th className="p-3">Log ID</th>
                      <th className="p-3">User / Actor</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Details</th>
                      <th className="p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="p-3 text-purple-400">{log.id}</td>
                        <td className="p-3 text-slate-300">{log.user}</td>
                        <td className="p-3 font-semibold text-slate-200">{log.action}</td>
                        <td className="p-3 text-slate-400">{log.detail}</td>
                        <td className="p-3 text-slate-500">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h2 className="text-lg font-bold text-white">RBAC Role Permissions</h2>
              <p className="text-xs text-slate-400">Roles: APPLICANT (Client app access), STAFF_AUDITOR (Audit console), ADMIN_GOVERNANCE (System administration).</p>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <h2 className="text-lg font-bold text-white font-sans">HashiCorp Vault Status</h2>
              <p className="text-emerald-400">Vault Engine: Active (http://localhost:8200)</p>
              <p className="text-slate-400">Encryption Standard: AES-256-GCM (PII Fields)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
