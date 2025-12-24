import React from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { SetupScreen } from './components/screens/SetupScreen';
import { AppProvider, useApp } from './context/AppContext';
import './index.css';

const AppContent: React.FC = () => {
  const { activeSession, isFullscreenMode } = useApp();
  return (
    <div
      className={`h-full w-full bg-gray-100 overflow-y-auto font-cairo transition-all duration-300 ${isFullscreenMode ? 'fullscreen-mode' : ''}`}
      dir="rtl"
    >
      {activeSession ? <MainLayout /> : <SetupScreen />}
    </div>
  );
};

import { mountScaler } from './utils/appScale';

function App() {
  React.useEffect(() => {
    return mountScaler();
  }, []);

  return (
    <AppProvider>
      <div className="app-scale-wrapper">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;
