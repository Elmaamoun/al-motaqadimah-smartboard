import React from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { SetupScreen } from './components/screens/SetupScreen';
import { AppProvider, useApp } from './context/AppContext';
import './index.css';

const AppContent: React.FC = () => {
  const { activeSession } = useApp();
  return activeSession ? <MainLayout /> : <SetupScreen />;
};

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen w-screen bg-gray-100 overflow-y-auto font-cairo" dir="rtl">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;
