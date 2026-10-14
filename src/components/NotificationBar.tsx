import React, { useState } from 'react';
import {
  Download,
  Upload,
  Wifi,
  Smartphone,
  Radio,
  ChevronDown,
  ChevronUp,
  Bell,
  Activity,
  Layers,
  Shield,
  Zap,
  Maximize2,
  Minimize2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { InterfaceConfig, NetworkInterfaceId, DailyUsageRecord } from '../types/network';
import { formatSpeed, formatBytes } from '../utils/formatters';
import { SignalBars } from './SignalBars';
import { evaluateWifiSignal, evaluateCellularSignal } from '../utils/signal';
import {
  postNetworkStatusNotification,
  requestNotificationPermission,
  getNotificationPermission,
} from '../utils/browserNotification';
import { BatteryIndicator } from './BatteryIndicator';
import { BatteryTelemetry, calculateBatteryImpactPercent } from '../utils/battery';

interface NotificationBarProps {
  currentDownSpeed: number;
  currentUpSpeed: number;
  interfaces: InterfaceConfig[];
  activeInterface: NetworkInterfaceId;
  setActiveInterface: (id: NetworkInterfaceId) => void;
  todayRecord?: DailyUsageRecord;
  isDataSaverActive: boolean;
  setIsDataSaverActive: (active: boolean) => void;
  onSimulateSurge: (mb: number) => void;
  battery: BatteryTelemetry;
  onSetEfficiencyMode?: (mode: 'performance' | 'balanced' | 'eco') => void;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  currentDownSpeed,
  currentUpSpeed,
  interfaces,
  activeInterface,
  setActiveInterface,
  todayRecord,
  isDataSaverActive,
  setIsDataSaverActive,
  onSimulateSurge,
  battery,
  onSetEfficiencyMode,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isShadeOpen, setIsShadeOpen] = useState<boolean>(false);
  const [notifSentFeedback, setNotifSentFeedback] = useState<boolean>(false);

  const wifiConfig = interfaces.find((i) => i.id === 'wifi') || interfaces[0];
  const sim1Config = interfaces.find((i) => i.id === 'sim1') || interfaces[1];
  const sim2Config = interfaces.find((i) => i.id === 'sim2') || interfaces[2];

  // Today's total calculations
  const wifiToday = (todayRecord?.wifiDownBytes || 0) + (todayRecord?.wifiUpBytes || 0);
  const sim1Today = (todayRecord?.sim1DownBytes || 0) + (todayRecord?.sim1UpBytes || 0);
  const sim2Today = (todayRecord?.sim2DownBytes || 0) + (todayRecord?.sim2UpBytes || 0);
  const totalToday = wifiToday + sim1Today + sim2Today;

  const handlePushDesktopNotif = async () => {
    if (getNotificationPermission() !== 'granted') {
      await requestNotificationPermission();
    }
    postNetworkStatusNotification(
      formatSpeed(currentDownSpeed),
      formatSpeed(currentUpSpeed),
      wifiConfig.signalDbm,
      sim1Config.signalDbm,
      sim2Config?.signalDbm,
      activeInterface
    );
    setNotifSentFeedback(true);
    setTimeout(() => setNotifSentFeedback(false), 2000);
  };

  if (isMinimized) {
    return (
      <div className="bg-slate-950/90 border-b border-slate-800 text-xs py-1.5 px-4 flex items-center justify-between z-30 relative backdrop-blur-md">
        <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px] overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Download className="w-3 h-3" /> {formatSpeed(currentDownSpeed)}
          </span>
          <span className="flex items-center gap-1 text-cyan-400 font-semibold">
            <Upload className="w-3 h-3" /> {formatSpeed(currentUpSpeed)}
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-cyan-300">
            <Wifi className="w-3 h-3" /> Wi-Fi: {wifiConfig.signalDbm} dBm
          </span>
          <span className="flex items-center gap-1 text-emerald-300">
            <Smartphone className="w-3 h-3" /> SIM 1: {sim1Config.signalDbm} dBm
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <Smartphone className="w-3 h-3" /> SIM 2: {sim2Config.signalDbm} dBm
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-amber-300 font-semibold" title={`Daemon Battery Impact: ${battery.accumulatedDaemonMah.toFixed(2)} mAh`}>
            <Zap className="w-3 h-3 text-amber-400" /> {battery.accumulatedDaemonMah.toFixed(1)} mAh ({battery.level}%)
          </span>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
          title="Expand Notification Bar"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Live Telemetry Notification Bar"
      className="bg-slate-950/95 border-b border-slate-800/90 text-slate-200 z-30 relative backdrop-blur-md shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Speed meters & Today usage */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Speed readout badge */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono shadow-xs">
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                <Download className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{formatSpeed(currentDownSpeed)}</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1 text-cyan-400 font-bold text-xs">
                <Upload className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{formatSpeed(currentUpSpeed)}</span>
              </div>
            </div>

            {/* Today's Data Accumulator */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-850">
              <span className="text-slate-400 font-sans text-[11px]">Today:</span>
              <span className="font-bold text-white">{formatBytes(totalToday)}</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 text-[11px]">W: {formatBytes(wifiToday, 1)}</span>
              <span className="text-emerald-400 text-[11px]">S1: {formatBytes(sim1Today, 1)}</span>
              <span className="text-amber-400 text-[11px]">S2: {formatBytes(sim2Today, 1)}</span>
            </div>
          </div>

          {/* Center / Right: Live Wi-Fi & SIM Signals in dBm */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Wi-Fi Signal Pill */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-xs cursor-pointer ${
                activeInterface === 'wifi'
                  ? 'bg-cyan-950/70 border-cyan-700/60 text-cyan-200 ring-1 ring-cyan-500/20'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              onClick={() => setActiveInterface('wifi')}
              title="Wi-Fi Signal Strength (RSSI). Click to activate Wi-Fi interface."
            >
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-[11px] hidden md:inline">Wi-Fi</span>
              </div>
              <SignalBars
                type="wifi"
                dBm={wifiConfig.signalDbm}
                showDbmText={true}
                showQualityLabel={false}
                size="sm"
              />
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-black/40 text-cyan-400">
                {evaluateWifiSignal(wifiConfig.signalDbm).quality}
              </span>
            </div>

            {/* SIM 1 Signal Pill */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-xs cursor-pointer ${
                activeInterface === 'sim1'
                  ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200 ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              onClick={() => setActiveInterface('sim1')}
              title="SIM 1 Signal Strength (RSRP). Click to activate SIM 1."
            >
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-[11px] hidden md:inline">SIM 1</span>
              </div>
              <SignalBars
                type="sim1"
                dBm={sim1Config.signalDbm}
                showDbmText={true}
                showQualityLabel={false}
                size="sm"
              />
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-black/40 text-emerald-400">
                5G · {evaluateCellularSignal(sim1Config.signalDbm).quality}
              </span>
            </div>

            {/* SIM 2 Signal Pill */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-xs cursor-pointer ${
                activeInterface === 'sim2'
                  ? 'bg-amber-950/70 border-amber-700/60 text-amber-200 ring-1 ring-amber-500/20'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              onClick={() => setActiveInterface('sim2')}
              title="SIM 2 Signal Strength (RSRP). Click to activate SIM 2."
            >
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-[11px] hidden md:inline">SIM 2</span>
              </div>
              <SignalBars
                type="sim2"
                dBm={sim2Config.signalDbm}
                showDbmText={true}
                showQualityLabel={false}
                size="sm"
              />
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-black/40 text-amber-400">
                LTE · {evaluateCellularSignal(sim2Config.signalDbm, '', true).quality}
              </span>
            </div>

            {/* Battery Daemon Consumption Pill */}
            <BatteryIndicator
              battery={battery}
              onSetEfficiencyMode={onSetEfficiencyMode}
              variant="notification-bar"
            />

            {/* Quick Actions in Notification Bar */}
            <div className="flex items-center gap-1.5 ml-1">
              {/* Push to Native Desktop Notification */}
              <button
                onClick={handlePushDesktopNotif}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                title="Post live speed & signals to OS Notification Drawer"
              >
                {notifSentFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Sent</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] hidden sm:inline">Push Ticker</span>
                  </>
                )}
              </button>

              {/* Open OS Notification Shade Drawer Widget */}
              <button
                onClick={() => setIsShadeOpen(!isShadeOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isShadeOpen
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
                title="Open persistent OS Notification Shade widget"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] hidden md:inline">Status Shade</span>
              </button>

              {/* Minimize bar */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Minimize Notification Bar to Slim Ticker"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile OS Notification Shade Dropdown Tile (Interactive Drawer Widget) */}
      {isShadeOpen && (
        <div className="border-t border-slate-800 bg-slate-900/98 p-4 shadow-2xl animate-fade-in">
          <div className="max-w-4xl mx-auto">
            {/* Header simulating OS Notification Tile */}
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-semibold text-slate-200">
                  Android / iOS Notification Shade Telemetry
                </span>
                <span>·</span>
                <span>Ongoing Service</span>
              </div>
              <button
                onClick={() => setIsShadeOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Shade
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Live Speedometer In-Shade */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span>Network Throughput</span>
                  <span className="font-mono text-emerald-400 uppercase">Live</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div>
                    <span className="text-xs text-emerald-400 block font-mono">↓ Download</span>
                    <span className="text-lg font-bold font-mono text-white">
                      {formatSpeed(currentDownSpeed)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-cyan-400 block font-mono">↑ Upload</span>
                    <span className="text-lg font-bold font-mono text-white">
                      {formatSpeed(currentUpSpeed)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Wi-Fi Radio Telemetry In-Shade */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-cyan-400" /> Wi-Fi RSSI Signal
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {evaluateWifiSignal(wifiConfig.signalDbm).quality}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-bold font-mono text-cyan-300">
                    {wifiConfig.signalDbm} dBm
                  </span>
                  <SignalBars
                    type="wifi"
                    dBm={wifiConfig.signalDbm}
                    showDbmText={false}
                    size="md"
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-2 truncate">
                  {wifiConfig.carrierOrSSID} · {wifiConfig.frequencyOrBand}
                </div>
              </div>

              {/* Card 3: Cellular SIM Radio Telemetry In-Shade */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-400" /> SIM 1 &amp; SIM 2 RSRP
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {evaluateCellularSignal(sim1Config.signalDbm).quality}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">SIM 1</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {sim1Config.signalDbm} dBm
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">SIM 2</span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      {sim2Config.signalDbm} dBm
                    </span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-2 truncate">
                  {sim1Config.frequencyOrBand}
                </div>
              </div>

              {/* Card 4: Daemon Battery Impact Telemetry In-Shade */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Daemon Battery Drain
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {calculateBatteryImpactPercent(battery.accumulatedDaemonMah, battery.batteryCapacityMah)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Accumulated</span>
                    <span className="text-lg font-bold font-mono text-amber-300">
                      {battery.accumulatedDaemonMah.toFixed(2)} mAh
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Draw Rate</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {battery.currentDrawMa} mA
                    </span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-2 flex items-center justify-between">
                  <span>Battery {battery.level}% ({battery.charging ? 'Charging ⚡' : 'Discharging'})</span>
                  <span>{battery.temperatureC.toFixed(1)}°C</span>
                </div>
              </div>
            </div>

            {/* In-Shade Action Buttons */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-[11px] text-slate-400">
                Quick Actions in Notification Tile:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInterface(activeInterface === 'wifi' ? 'sim1' : 'wifi')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Toggle Interface ({activeInterface === 'wifi' ? 'to SIM 1' : 'to Wi-Fi'})
                </button>
                <button
                  onClick={() => setIsDataSaverActive(!isDataSaverActive)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Data Saver: {isDataSaverActive ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => onSimulateSurge(500)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors"
                >
                  Test +500MB Spike
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
