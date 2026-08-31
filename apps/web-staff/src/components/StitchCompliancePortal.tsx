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
  Lock
} from 'lucide-react';

export type PortalView =
  | 'applicant_dashboard'
  | 'audit_console_1'
  | 'audit_console_2'
  | 'admin_governance'
  | 'document_vault'
  | 'executive_dashboard'
  | 'financial_sources'
  | 'concierge_support'
  | 'system_telemetry'
  | 'system_settings';

export const StitchCompliancePortal: React.FC = () => {
  const [activeView, setActiveView] = useState<PortalView>('applicant_dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
            <span className="text-[#FFC174] font-bold">Stitch Template Sync: ACTIVE</span>
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
              Stitch Portal Templates (14 Screens)
            </h2>

            {[
              { id: 'applicant_dashboard', label: '1. Applicant Dashboard', icon: BarChart3 },
              { id: 'audit_console_1', label: '2. Compliance Audit Console 1', icon: ShieldCheck },
              { id: 'audit_console_2', label: '3. Compliance Audit Console 2', icon: ShieldCheck },
              { id: 'admin_governance', label: '4. Admin Governance Console', icon: KeyRound },
              { id: 'document_vault', label: '5. Document Vault & Forensic', icon: FolderLock },
              { id: 'executive_dashboard', label: '6. Executive Dashboard', icon: Activity },
              { id: 'financial_sources', label: '7. Financial Sources (APIs)', icon: Building2 },
              { id: 'concierge_support', label: '8. Concierge Support', icon: HelpCircle },
              { id: 'system_telemetry', label: '9. System Telemetry', icon: Sliders },
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
        <div className="col-span-12 lg:col-span-9">
          {/* APPLICANT DASHBOARD VIEW */}
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

          {/* COMPLIANCE AUDIT CONSOLE 1 */}
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

          {/* ADMIN GOVERNANCE CONSOLE */}
          {activeView === 'admin_governance' && (
            <div className={`p-8 rounded-3xl border space-y-6 ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <KeyRound className="w-6 h-6 text-[#FFC174]" />
                <h2 className="text-xl font-bold text-white">Admin Governance & System Parameters</h2>
              </div>
              <div className="p-5 rounded-2xl bg-[#181B25] border border-[#31353F] space-y-3 font-mono text-xs">
                <span className="text-slate-400 block font-sans">Default FX Volatility Safety Buffer</span>
                <span className="text-2xl font-bold text-[#FFC174]">10.00%</span>
                <p className="text-slate-500">Enforced across all Go PoF Matrix calculations.</p>
              </div>
            </div>
          )}

          {/* DOCUMENT VAULT */}
          {activeView === 'document_vault' && (
            <div className={`p-8 rounded-3xl border space-y-6 ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <FolderLock className="w-6 h-6 text-[#FFC174]" />
                <h2 className="text-xl font-bold text-white">Document Vault & Forensic RSA Inspection</h2>
              </div>
              <div className="p-5 rounded-2xl bg-[#181B25] border border-[#31353F] font-mono text-xs space-y-2">
                <p className="text-[#00E676]">✓ GTBank Digital RSA Signature: VALID</p>
                <p className="text-[#00E676]">✓ PDF Font Editing Layers: NONE (ORIGINAL)</p>
              </div>
            </div>
          )}

          {/* EXECUTIVE DASHBOARD / TELEMETRY */}
          {(activeView === 'executive_dashboard' || activeView === 'financial_sources' || activeView === 'concierge_support' || activeView === 'system_telemetry') && (
            <div className={`p-8 rounded-3xl border space-y-6 ${isDark ? 'bg-[#0F131C] border-[#31353F]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-[#FFC174]" />
                <h2 className="text-xl font-bold text-white">Executive Telemetry & Financial Ingestion Feeds</h2>
              </div>
              <p className="text-xs text-slate-400">Live feeds from Open Banking (Mono/Okra), Zenith SMS Agent, and HashiCorp Vault.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
