import React, { useState } from 'react';
import {
  BarChart3,
  ShieldCheck,
  KeyRound,
  FileCheck2,
  FolderLock,
  Building2,
  Activity,
  Sliders,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Sun,
  Moon,
  ChevronDown,
  Download,
  Search,
  Lock,
  Terminal,
  Cpu,
  Zap,
  Globe,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Server,
  User,
  Users,
  Settings,
  MessageSquare,
  FileText
} from 'lucide-react';

export type PortalView =
  | 'applicant_dashboard'
  | 'audit_console_1'
  | 'audit_console_2'
  | 'admin_governance'
  | 'document_vault_1'
  | 'document_vault_2'
  | 'executive_dashboard'
  | 'financial_sources'
  | 'concierge_support'
  | 'system_telemetry'
  | 'system_settings_1'
  | 'system_settings_2';

export const StitchCompliancePortal: React.FC = () => {
  const [activeView, setActiveView] = useState<PortalView>('system_telemetry');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${
      isDark ? 'bg-[#090D16] text-[#DFE2EF]' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-500 px-8 py-3.5 flex items-center justify-between ${
        isDark ? 'bg-[#0F131C]/90 border-[#31353F] shadow-2xl' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-4">
          <img src="/logo.svg" alt="Logo" className="w-9 h-9 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-base font-black tracking-tight text-[#FFC174]">
                BASECHANFUNDER
              </span>
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#FFC174] border border-[#F59E0B]/30">
                DEEP OBSIDIAN STITCH UI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">UKVI 28-Day Proof of Funds Compliance Engine</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search infrastructure..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#020617]/80 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FFC174]"
            />
          </div>

          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark ? 'bg-[#181B25] border-[#31353F] text-amber-400' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#181B25] border border-[#31353F] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></span>
            <span className="text-[#FFC174] font-bold">Stitch UI Sync: ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="p-8 max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className={`p-4 rounded-2xl border backdrop-blur-xl ${
            isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 px-3 mb-3">
              Stitch Portal Templates (Full UI Screens)
            </h2>

            {[
              { id: 'system_telemetry', label: '1. System Telemetry', icon: Sliders },
              { id: 'applicant_dashboard', label: '2. Applicant Dashboard', icon: BarChart3 },
              { id: 'audit_console_1', label: '3. Compliance Audit Console 1', icon: ShieldCheck },
              { id: 'audit_console_2', label: '4. Compliance Audit Console 2', icon: ShieldCheck },
              { id: 'admin_governance', label: '5. Admin Governance Console', icon: KeyRound },
              { id: 'document_vault_1', label: '6. Document Vault 1', icon: FolderLock },
              { id: 'document_vault_2', label: '7. Document Vault 2', icon: FolderLock },
              { id: 'executive_dashboard', label: '8. Executive Dashboard', icon: Activity },
              { id: 'financial_sources', label: '9. Financial Sources (APIs)', icon: Building2 },
              { id: 'concierge_support', label: '10. Concierge Support', icon: HelpCircle },
              { id: 'system_settings_1', label: '11. System Settings 1', icon: Settings },
              { id: 'system_settings_2', label: '12. System Settings 2', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as PortalView)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${
                    activeView === item.id
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : isDark
                      ? 'text-slate-300 hover:bg-[#181B25] hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* 1. SYSTEM TELEMETRY FULL SCREEN */}
          {activeView === 'system_telemetry' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white">System Telemetry</h2>
                  <p className="text-xs text-slate-400 mt-1">Real-time infrastructure monitoring and health metrics.</p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-[#181B25] border border-[#31353F] flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></div>
                  <span className="text-xs font-mono font-bold text-white">ALL SYSTEMS NOMINAL</span>
                </div>
              </div>

              {/* API Gateway Health Cards */}
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">API Gateway Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mono Card */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-[#181B25] flex items-center justify-center border border-white/10">
                        <Server className="w-4 h-4 text-[#FFC174]" />
                      </div>
                      <span className="font-bold text-sm text-white">Mono Gateway</span>
                    </div>
                    <span className="text-xs font-mono text-[#00E676] bg-[#00E676]/10 px-2 py-1 rounded font-bold">99.99%</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] font-mono text-slate-400">Latency</p>
                      <p className="text-3xl font-black font-mono text-white">42<span className="text-sm text-slate-400 ml-1">ms</span></p>
                    </div>
                    <div className="w-24 h-10 opacity-70">
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <polyline fill="none" points="0,30 20,25 40,35 60,15 80,20 100,5" stroke="#FFC174" strokeWidth="2.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Okra Card */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-[#181B25] flex items-center justify-center border border-white/10">
                        <Building2 className="w-4 h-4 text-[#FFC174]" />
                      </div>
                      <span className="font-bold text-sm text-white">Okra Link</span>
                    </div>
                    <span className="text-xs font-mono text-[#00E676] bg-[#00E676]/10 px-2 py-1 rounded font-bold">99.98%</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] font-mono text-slate-400">Latency</p>
                      <p className="text-3xl font-black font-mono text-white">115<span className="text-sm text-slate-400 ml-1">ms</span></p>
                    </div>
                    <div className="w-24 h-10 opacity-70">
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <polyline fill="none" points="0,20 20,15 40,25 60,20 80,10 100,15" stroke="#FFC174" strokeWidth="2.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* OANDA Stream Card */}
                <div className={`p-6 rounded-2xl border relative overflow-hidden ${
                  isDark ? 'bg-[#0F131C] border-[#FFC174]/40' : 'bg-white border-amber-300 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-[#FFC174]/20 flex items-center justify-center border border-[#FFC174]/50">
                        <TrendingUp className="w-4 h-4 text-[#FFC174]" />
                      </div>
                      <span className="font-bold text-sm text-white">OANDA Stream</span>
                    </div>
                    <span className="text-xs font-mono text-[#FFC174] bg-[#FFC174]/10 px-2 py-1 rounded border border-[#FFC174]/30 animate-pulse font-bold">98.45%</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] font-mono text-slate-400">Latency</p>
                      <p className="text-3xl font-black font-mono text-[#FFC174]">840<span className="text-sm text-slate-400 ml-1">ms</span></p>
                    </div>
                    <div className="w-24 h-10 opacity-80">
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <polyline fill="none" points="0,30 20,28 40,15 60,5 80,35 100,2" stroke="#FFB4AB" strokeWidth="2.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Section Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Event Stream (Terminal Log Console) */}
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">System Event Stream</h3>
                  <div className="rounded-2xl border border-white/10 bg-[#020617] p-4 font-mono text-xs space-y-2 h-96 overflow-y-auto">
                    <div className="flex items-center space-x-2 border-b border-white/10 pb-2 mb-2 text-slate-400">
                      <Terminal className="w-4 h-4 text-[#FFC174]" />
                      <span>root@basechan-core:~</span>
                    </div>
                    <div className="text-slate-400"><span className="text-slate-500">[14:32:01.045]</span> <span className="text-blue-400">[INFO]</span> Handshake established with AWS Central (us-east-1).</div>
                    <div className="text-slate-400"><span className="text-slate-500">[14:32:02.112]</span> <span className="text-blue-400">[INFO]</span> Mono Gateway polling active. RTT: 42ms.</div>
                    <div className="text-slate-400"><span className="text-slate-500">[14:32:05.881]</span> <span className="text-[#00E676]">[OK]</span> KYC Bridge verified 14 pending requests.</div>
                    <div className="p-1 rounded bg-[#FFC174]/10 border-l-2 border-[#FFC174] text-[#FFC174]">
                      <span className="text-slate-400">[14:32:15.302]</span> <strong>[WARN]</strong> Elevated Latency in OANDA Stream. Threshold exceeded (&gt;800ms).
                    </div>
                    <div className="text-slate-400"><span className="text-slate-500">[14:32:16.001]</span> <span className="text-blue-400">[INFO]</span> Attempting secondary route for market data...</div>
                    <div className="p-1 rounded bg-rose-500/10 border-l-2 border-rose-500 text-rose-300">
                      <span className="text-slate-400">[14:32:18.442]</span> <strong>[ERR]</strong> MBS Protocol timeout on block sync. Retrying (1/3).
                    </div>
                    <div className="text-slate-400"><span className="text-slate-500">[14:32:20.100]</span> <span className="text-blue-400">[INFO]</span> System GC cycle completed. Freed 1.2GB memory.</div>
                    <div className="text-slate-400"><span class="text-slate-500">[14:32:22.505]</span> <span className="text-[#00E676]">[OK]</span> MBS Protocol sync re-established.</div>
                  </div>
                </div>

                {/* Core Utilization Radial CPU Load */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Core Utilization</h3>
                    <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
                      <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                          <circle cx="50" cy="50" r="42" stroke="#FFC174" strokeWidth="8" strokeDasharray="263.8" strokeDashoffset="65" strokeLinecap="round" fill="none" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black font-mono text-white">76%</span>
                          <span className="text-[10px] font-mono text-slate-400">CPU LOAD</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs font-mono text-slate-400 border-t border-white/10 pt-3">
                        <span>MEM: 64%</span>
                        <span>NET: 1.2Gbps</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Incidents Timeline */}
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Recent Incidents</h3>
                    <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 rounded-full bg-[#FFC174] mt-1 shadow-[0_0_10px_#FFC174]"></div>
                        <div>
                          <span className="text-[10px] font-mono text-[#FFC174] font-bold">Active Incident</span>
                          <h4 className="text-xs font-bold text-white mt-0.5">OANDA Stream Degradation</h4>
                          <p className="text-[11px] text-slate-400">Investigating elevated latency.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. APPLICANT DASHBOARD FULL SCREEN */}
          {activeView === 'applicant_dashboard' && (
            <div className="space-y-6">
              <div className={`p-8 rounded-3xl border ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-xs font-mono text-slate-400 block">PROFIT & HOLDINGS</span>
                    <h2 className="text-3xl font-black text-white">Applicant Financial Maturity Dashboard</h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#003822] text-[#00E676] border border-[#00E676]/30 text-xs font-mono font-bold">
                    ● COMPLIANT_HOLDING
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
                  <div className="p-5 rounded-2xl bg-[#181B25] border border-[#31353F]">
                    <span className="text-xs text-slate-400 block">Target Requirement</span>
                    <span className="text-2xl font-bold text-[#FFC174] mt-1 block">£13,761.00</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#181B25] border border-[#31353F]">
                    <span className="text-xs text-slate-400 block">Current Local Balance</span>
                    <span className="text-2xl font-bold text-white mt-1 block">₦18,450,000</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#181B25] border border-[#31353F]">
                    <span className="text-xs text-slate-400 block">28-Day Maturity</span>
                    <span className="text-2xl font-bold text-[#00E676] mt-1 block">Day 19 / 28</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3 & 4. COMPLIANCE AUDIT CONSOLES */}
          {(activeView === 'audit_console_1' || activeView === 'audit_console_2') && (
            <div className={`p-8 rounded-3xl border space-y-6 ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-[#FFC174]" />
                <h2 className="text-xl font-bold text-white">Caseworker Compliance Audit Console</h2>
              </div>
              <p className="text-xs text-slate-400">Auditing UKVI 28-day continuous holding rules, FX volatility buffers, and eStatement forensic digital signatures.</p>

              <div className="border border-[#31353F] rounded-2xl overflow-hidden bg-[#181B25] font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#1C1F29] border-b border-[#31353F] text-slate-400">
                    <tr>
                      <th className="p-3">Applicant ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Target GBP</th>
                      <th className="p-3">28-Day Min</th>
                      <th className="p-3">Risk Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#31353F]">
                    <tr className="hover:bg-[#262A34]">
                      <td className="p-3 text-[#FFC174]">APP-2026-8941</td>
                      <td className="p-3 text-white">Adebayo Ogunlesi</td>
                      <td className="p-3">£13,340.00</td>
                      <td className="p-3 text-[#00E676] font-bold">£14,850.00</td>
                      <td className="p-3"><span className="text-[#00E676] font-bold">VALIDATED</span></td>
                    </tr>
                    <tr className="hover:bg-[#262A34]">
                      <td className="p-3 text-[#FFC174]">APP-2026-9012</td>
                      <td className="p-3 text-white">Chioma Nwosu</td>
                      <td className="p-3">£18,500.00</td>
                      <td className="p-3 text-rose-400 font-bold">£17,200.00</td>
                      <td className="p-3"><span className="text-rose-400 font-bold">FLAGGED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. ADMIN GOVERNANCE CONSOLE */}
          {activeView === 'admin_governance' && (
            <div className={`p-8 rounded-3xl border space-y-6 ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <KeyRound className="w-6 h-6 text-[#FFC174]" />
                <h2 className="text-xl font-bold text-white font-sans">Admin Governance & System Parameters</h2>
              </div>
              <div className="p-5 rounded-2xl bg-[#181B25] border border-[#31353F] space-y-3 font-mono text-xs">
                <span className="text-slate-400 block font-sans">Default FX Volatility Safety Buffer</span>
                <span className="text-2xl font-bold text-[#FFC174]">10.00%</span>
                <p className="text-slate-500">Enforced across all Go PoF Matrix calculations.</p>
              </div>
            </div>
          )}

          {/* 6 & 7. DOCUMENT VAULT */}
          {(activeView === 'document_vault_1' || activeView === 'document_vault_2') && (
            <div className={`p-8 rounded-3xl border space-y-6 ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <FolderLock className="w-6 h-6 text-[#FFC174]" />
                <h2 className="text-xl font-bold text-white font-sans">Document Vault & Forensic RSA Inspection</h2>
              </div>
              <div className="p-5 rounded-2xl bg-[#181B25] border border-[#31353F] font-mono text-xs space-y-2">
                <p className="text-[#00E676]">✓ GTBank Digital RSA Signature: VALID</p>
                <p className="text-[#00E676]">✓ PDF Font Editing Layers: NONE (ORIGINAL)</p>
              </div>
            </div>
          )}

          {/* 8, 9, 10, 11, 12. OTHER SCREENS */}
          {(activeView === 'executive_dashboard' || activeView === 'financial_sources' || activeView === 'concierge_support' || activeView === 'system_settings_1' || activeView === 'system_settings_2') && (
            <div className={`p-8 rounded-3xl border space-y-6 ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-[#FFC174]" />
                <h2 className="text-xl font-bold text-white font-sans">Executive Dashboard & Telemetry Feeds</h2>
              </div>
              <p className="text-xs text-slate-400 font-sans">Live feeds from Open Banking (Mono/Okra), Zenith SMS Agent, and HashiCorp Vault.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
