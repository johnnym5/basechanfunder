import React from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { Toaster } from 'sonner';

export const App: React.FC = () => {
  return (
    <>
      <Toaster richColors position="top-right" />
      <AdminDashboard />
    </>
  );
};

export default App;
