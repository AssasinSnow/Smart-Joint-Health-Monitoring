import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { PredictiveMaintenancePage } from './pages/PredictiveMaintenancePage';
import { AlertsPage } from './pages/AlertsPage';
import { DeviceSettingsPage } from './pages/DeviceSettingsPage';
import { MaintenanceRecordsPage } from './pages/MaintenanceRecordsPage';
import { ProjectInfoPage } from './pages/ProjectInfoPage';
import { useJointStore } from './store/useJointStore';

export const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { initStore, isDarkMode } = useJointStore();

  useEffect(() => {
    // Set initial dark mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Initialize Zustand store and start telemetry ingestion
    initStore();
  }, [initStore, isDarkMode]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-copper-500 selection:text-white">
        <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full smooth-scroll">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/live" element={<LiveMonitoringPage />} />
              <Route path="/predictive" element={<PredictiveMaintenancePage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/settings" element={<DeviceSettingsPage />} />
              <Route path="/records" element={<MaintenanceRecordsPage />} />
              <Route path="/info" element={<ProjectInfoPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Thumb-friendly Mobile Bottom Navigation */}
        <MobileBottomNav onOpenMenu={() => setIsSidebarOpen(true)} />
      </div>
    </BrowserRouter>
  );
};

export default App;
