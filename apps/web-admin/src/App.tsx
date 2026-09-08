import React from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Toaster richColors position="top-right" />
      <AdminDashboard />
    </ThemeProvider>
  );
};

export default App;
