import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthPage } from './pages/AuthPage';
import { MasterAppPortal } from './components/MasterAppPortal';
import { NotFoundPage } from './pages/NotFoundPage';
import { LandingPage } from './pages/LandingPage';
import { AuthActionPage } from './pages/AuthActionPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Toaster } from 'sonner';
import { DashboardSkeleton } from './components/ui/LoadingStates';

const AppInner: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <ErrorBoundary>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={currentUser ? <MasterAppPortal /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!currentUser ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/auth/action" element={<AuthActionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <AppInner />
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  </AuthProvider>
);

export default App;
