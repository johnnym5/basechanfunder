import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { MasterAppPortal } from './components/MasterAppPortal';
import { Loader2 } from 'lucide-react';

const AppInner: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#F5B651] animate-spin" />
          <p className="text-xs font-mono text-slate-400">Authenticating…</p>
        </div>
      </div>
    );
  }

  return currentUser ? <MasterAppPortal /> : <AuthPage />;
};

export const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
