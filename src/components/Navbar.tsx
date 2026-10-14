import React from 'react';
import {
  Wifi,
  Smartphone,
  Bell,
  Volume2,
  VolumeX,
  Activity,
  Layers,
  FileText,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { NetworkInterfaceId, InterfaceConfig, NetworkAlert } from '../types/network';
import { formatSpeed } from '../utils/formatters';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/browserNotification';
import { SignalBars } from './SignalBars';
import { BatteryIndicator } from './BatteryIndicator';
import { BatteryTelemetry } from '../utils/battery';

interface NavbarProps {
  activeTab: 'dashboard' | 'reports' | 'apps' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'reports' | 'apps' | 'settings') => void;
  interfaces: InterfaceConfig[];
  activeInterface: NetworkInterfaceId;
  setActiveInterface: (id: NetworkInterfaceId) => void;
  currentDownSpeed: number;
  currentUpSpeed: number;
  alerts: NetworkAlert[];
  isAudioMuted: boolean;
  setIsAudioMuted: (muted: boolean) => void;
  onOpenAlerts: () => void;
  battery: BatteryTelemetry;
  onSetEfficiencyMode?: (mode: 'performance' | 'balanced' | 'eco') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  interfaces,
  activeInterface,
  setActiveInterface,
  currentDownSpeed,
  currentUpSpeed,
  alerts,
  isAudioMuted,
  setIsAudioMuted,
  onOpenAlerts,
  battery,
  onSetEfficiencyMode,
}) => {
  const unreadAlertsCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.read).length;

  const handleRequestDesktopNotifs = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      alert('Desktop notifications enabled! You will receive system alerts when data caps are exceeded.');
    }
  };

  const currentIfaceConfig = interfaces.find((i) => i.id === activeInterface);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  NetPulse
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Wi-Fi &amp; Cellular Data Telemetry
              </p>
            </div>
          </div>

          {/* Quick Interface Switcher & Live Rate */}
          <div className="hidden md:flex items-center gap-3 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 pl-2 font-medium">Interface:</span>
            <div className="flex items-center gap-1">
              {interfaces.map((iface) => {
                const isActive = activeInterface === iface.id;
                return (
                  <button
                    key={iface.id}
                    onClick={() => setActiveInterface(iface.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? iface.id === 'wifi'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : iface.id === 'sim1'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {iface.id === 'wifi' ? (
                      <Wifi className="w-3.5 h-3.5" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5" />
                    )}
                    <span>{iface.id === 'wifi' ? 'Wi-Fi' : iface.id === 'sim1' ? 'SIM 1' : 'SIM 2'}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Active Signal dBm */}
            {currentIfaceConfig && (
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-xs">
                <SignalBars
                  type={activeInterface}
                  dBm={currentIfaceConfig.signalDbm}
                  size="sm"
                  showDbmText={true}
                  showQualityLabel={false}
                />
              </div>
            )}

            <div className="h-4 w-px bg-slate-800 mx-0.5" />

            {/* Live Throughput Pill */}
            <div className="flex items-center gap-2 pr-2 text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-0.5">
                <span className="text-[10px]">↓</span> {formatSpeed(currentDownSpeed)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 flex items-center gap-0.5">
                <span className="text-[10px]">↑</span> {formatSpeed(currentUpSpeed)}
              </span>
            </div>
          </div>

          {/* Action Tools & Notifications */}
          <div className="flex items-center gap-2">
            {/* Battery Consumption Daemon Impact */}
            <BatteryIndicator
              battery={battery}
              onSetEfficiencyMode={onSetEfficiencyMode}
              variant="header"
            />

            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              title={isAudioMuted ? 'Unmute alert chimes' : 'Mute alert chimes'}
              className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                isAudioMuted
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/40'
              }`}
            >
              {isAudioMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Desktop Notification Prompt */}
            {isNotificationSupported() && getNotificationPermission() !== 'granted' && (
              <button
                onClick={handleRequestDesktopNotifs}
                title="Enable OS Desktop Notifications for cap alerts"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 text-cyan-400" />
                <span>Desktop Alerts</span>
              </button>
            )}

            {/* Alert Bell Button */}
            <button
              onClick={onOpenAlerts}
              className={`relative p-2 rounded-lg border transition-all ${
                criticalCount > 0
                  ? 'bg-rose-950/60 border-rose-600/80 text-rose-300 animate-pulse'
                  : unreadAlertsCount > 0
                  ? 'bg-amber-950/40 border-amber-600/60 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Usage Alerts & Notifications"
            >
              {criticalCount > 0 ? (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold rounded-full bg-rose-600 text-white flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 text-xs font-medium no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Monitor &amp; Caps</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'reports'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Monthly Reports &amp; Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('apps')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'apps'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>App Breakdown &amp; Saver</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cap &amp; Plan Configuration</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
