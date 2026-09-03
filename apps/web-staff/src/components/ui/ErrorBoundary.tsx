import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCcw, Home, Copy, Check } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    copied: false,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false, showDetails: false };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    try {
      // 1. Check if Error Audit Log is enabled in global config
      const configSnap = await getDoc(doc(db, 'system_config', 'global'));
      const isLoggingEnabled = configSnap.exists() ? configSnap.data().errorAuditLog !== false : true;

      if (isLoggingEnabled) {
        // 2. Log the error to forensic_audit collection
        await addDoc(collection(db, 'forensic_audit'), {
          type: 'RUNTIME_ERROR',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          createdAt: serverTimestamp(),
          severity: 'CRITICAL'
        });
      }
    } catch (logErr) {
      console.warn('Forensic logging failed:', logErr);
    }
  }

  private copyError = () => {
    if (this.state.error) {
      const fullError = `Error: ${this.state.error.message}\n\nStack Trace:\n${this.state.error.stack}`;
      navigator.clipboard.writeText(fullError);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-xl w-full bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl space-y-8 text-center overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Something went wrong</h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed font-mono italic">
                There was an error while loading the page. Your data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="space-y-4">
                <div className="relative group/error p-4 bg-slate-950 border border-white/5 rounded-2xl text-[10px] font-mono text-rose-400/80 text-left overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Error Preview</span>
                    <button
                      onClick={this.copyError}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest ${
                        this.state.copied ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {this.state.copied ? (
                        <><Check className="w-3 h-3" /> Copied Full Stack</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy Full Stack</>
                      )}
                    </button>
                  </div>
                  <p className="line-clamp-3 mb-2">{this.state.error.message}</p>

                  <button
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                    className="text-[8px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400"
                  >
                    {this.state.showDetails ? 'Hide Stack Trace' : 'View Full Stack Trace'}
                  </button>

                  {this.state.showDetails && (
                    <div className="mt-4 custom-scrollbar overflow-auto max-h-60 whitespace-pre text-slate-500 border-t border-white/5 pt-4">
                      {this.state.error.stack}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Try again</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Go back home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
