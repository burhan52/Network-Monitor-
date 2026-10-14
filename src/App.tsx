/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNetworkMonitor } from './hooks/useNetworkMonitor';
import { Navbar } from './components/Navbar';
import { ExceededCapBanner } from './components/ExceededCapBanner';
import { DashboardView } from './components/DashboardView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { AppBreakdownView } from './components/AppBreakdownView';
import { SettingsView } from './components/SettingsView';
import { AlertsDrawer } from './components/AlertsDrawer';
import { NotificationBar } from './components/NotificationBar';
import { Activity, ShieldCheck, Wifi, Smartphone, Radio } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'apps' | 'settings'>(
    'dashboard'
  );
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);

  const {
    interfaces,
    activeInterface,
    setActiveInterface,
    updateInterface,
    dailyRecords,
    apps,
    alerts,
    speedSamples,
    trafficPreset,
    setTrafficPreset,
    isDataSaverActive,
    setIsDataSaverActive,
    isAudioMuted,
    setIsAudioMuted,
    dailyWarningMB,
    setDailyWarningMB,
    browserNetwork,
    batteryTelemetry,
    setPowerEfficiencyMode,
    getCycleUsage,
    addAlert,
    dismissAlert,
    markAllAlertsRead,
    clearAllAlerts,
    simulateDataSurge,
    toggleAppRestriction,
    updateSignalDbm,
    resetToDefaults,
  } = useNetworkMonitor();

  const currentSample = speedSamples[speedSamples.length - 1] || {
    downloadBytesPerSec: 0,
    uploadBytesPerSec: 0,
  };

  const todayRecord = dailyRecords.find((r) => r.date === '2026-10-13');

  // Handler for manual alert trigger test from drawer
  const handleTriggerTestAlert = (type: 'cap_exceeded' | 'cap_warning' | 'spike_surge') => {
    if (type === 'cap_exceeded') {
      const target = interfaces.find((i) => i.id === activeInterface) || interfaces[0];
      addAlert({
        interfaceId: activeInterface,
        type: 'cap_exceeded',
        title: `CRITICAL: ${target.name} Data Cap Exceeded!`,
        message: `Plan limit of ${target.monthlyCapMB / 1024} GB exceeded (104.2% used). Subsequent data incurs ${target.currency}${target.overageCostPerGB}/GB overage.`,
        severity: 'critical',
        actionLabel: 'Throttle Data',
        exceededPercent: 104.2,
      });
    } else if (type === 'cap_warning') {
      const target = interfaces.find((i) => i.id === activeInterface) || interfaces[0];
      addAlert({
        interfaceId: activeInterface,
        type: 'cap_warning',
        title: `Warning: ${target.name} at ${target.warningThresholdPercent}% of Cap`,
        message: `Approaching monthly cap. Consider switching high bandwidth apps to Wi-Fi.`,
        severity: 'warning',
        exceededPercent: target.warningThresholdPercent,
      });
    } else {
      addAlert({
        interfaceId: activeInterface,
        type: 'spike_surge',
        title: 'High Download Surge Detected',
        message: 'Sudden bandwidth transfer surge of 45.8 MB/s detected.',
        severity: 'info',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        interfaces={interfaces}
        activeInterface={activeInterface}
        setActiveInterface={setActiveInterface}
        currentDownSpeed={currentSample.downloadBytesPerSec}
        currentUpSpeed={currentSample.uploadBytesPerSec}
        alerts={alerts}
        isAudioMuted={isAudioMuted}
        setIsAudioMuted={setIsAudioMuted}
        onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
        battery={batteryTelemetry}
        onSetEfficiencyMode={setPowerEfficiencyMode}
      />

      {/* Persistent System Telemetry Notification Bar */}
      <NotificationBar
        currentDownSpeed={currentSample.downloadBytesPerSec}
        currentUpSpeed={currentSample.uploadBytesPerSec}
        interfaces={interfaces}
        activeInterface={activeInterface}
        setActiveInterface={setActiveInterface}
        todayRecord={todayRecord}
        isDataSaverActive={isDataSaverActive}
        setIsDataSaverActive={setIsDataSaverActive}
        onSimulateSurge={simulateDataSurge}
        battery={batteryTelemetry}
        onSetEfficiencyMode={setPowerEfficiencyMode}
      />

      {/* Exceeded Cap Alert Banner (if limit exceeded or near warning threshold) */}
      <ExceededCapBanner
        interfaces={interfaces}
        getCycleUsage={getCycleUsage}
        activeInterface={activeInterface}
        setActiveInterface={setActiveInterface}
        isDataSaverActive={isDataSaverActive}
        setIsDataSaverActive={setIsDataSaverActive}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            interfaces={interfaces}
            activeInterface={activeInterface}
            setActiveInterface={setActiveInterface}
            getCycleUsage={getCycleUsage}
            dailyRecords={dailyRecords}
            speedSamples={speedSamples}
            trafficPreset={trafficPreset}
            setTrafficPreset={setTrafficPreset}
            isDataSaverActive={isDataSaverActive}
            setIsDataSaverActive={setIsDataSaverActive}
            onSimulateSurge={simulateDataSurge}
            browserNetwork={browserNetwork}
            apps={apps}
            alerts={alerts}
            onNavigateTab={setActiveTab}
            onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
            onUpdateSignalDbm={updateSignalDbm}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            dailyRecords={dailyRecords}
            interfaces={interfaces}
            apps={apps}
          />
        )}

        {activeTab === 'apps' && (
          <AppBreakdownView
            apps={apps}
            onToggleRestriction={toggleAppRestriction}
            activeInterface={activeInterface}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            interfaces={interfaces}
            onUpdateInterface={updateInterface}
            dailyWarningMB={dailyWarningMB}
            setDailyWarningMB={setDailyWarningMB}
            isAudioMuted={isAudioMuted}
            setIsAudioMuted={setIsAudioMuted}
            onResetDefaults={resetToDefaults}
          />
        )}
      </main>

      {/* Slide-over Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        onDismissAlert={dismissAlert}
        onMarkAllRead={markAllAlertsRead}
        onClearAll={clearAllAlerts}
        onTriggerTestAlert={handleTriggerTestAlert}
        isAudioMuted={isAudioMuted}
        onToggleAudioMute={() => setIsAudioMuted(!isAudioMuted)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsAlertsDrawerOpen(false);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-400">NetPulse Telemetry Daemon Active</span>
            <span>·</span>
            <span>Local Real-Time Monitoring</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span>Active: {activeInterface.toUpperCase()}</span>
            <span>·</span>
            <span>Saver: {isDataSaverActive ? 'Active' : 'Disabled'}</span>
            <span>·</span>
            <span>Audio: {isAudioMuted ? 'Muted' : 'Unmuted'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
