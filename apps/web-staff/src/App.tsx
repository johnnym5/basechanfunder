import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthPage } from './pages/AuthPage';
import { MasterAppPortal } from './components/MasterAppPortal';
import { NotFoundPage } from './pages/NotFoundPage';
import { LandingPage } from './pages/LandingPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const AppInner: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LandingPage isInitializing={true} />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={currentUser ? <MasterAppPortal /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!currentUser ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <Router>
        <AppInner />
      </Router>
    </ThemeProvider>
  </AuthProvider>
);

export default App;
