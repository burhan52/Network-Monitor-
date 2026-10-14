import React, { useState } from 'react';
import {
  Sliders,
  Wifi,
  Smartphone,
  Bell,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  Download,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { InterfaceConfig, NetworkInterfaceId } from '../types/network';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/browserNotification';
import { SignalBars } from './SignalBars';

interface SettingsViewProps {
  interfaces: InterfaceConfig[];
  onUpdateInterface: (config: InterfaceConfig) => void;
  dailyWarningMB: number;
  setDailyWarningMB: (mb: number) => void;
  isAudioMuted: boolean;
  setIsAudioMuted: (muted: boolean) => void;
  onResetDefaults: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  interfaces,
  onUpdateInterface,
  dailyWarningMB,
  setDailyWarningMB,
  isAudioMuted,
  setIsAudioMuted,
  onResetDefaults,
}) => {
  // Local edit states
  const [formInterfaces, setFormInterfaces] = useState<InterfaceConfig[]>(interfaces);
  const [dailyBudget, setDailyBudget] = useState<number>(dailyWarningMB);
  const [savedNotification, setSavedNotification] = useState<boolean>(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );

  const handleFieldChange = (
    ifaceId: NetworkInterfaceId,
    field: keyof InterfaceConfig,
    value: unknown
  ) => {
    setFormInterfaces((prev) =>
      prev.map((item) => (item.id === ifaceId ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveAll = () => {
    formInterfaces.forEach((iface) => onUpdateInterface(iface));
    setDailyWarningMB(dailyBudget);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setDesktopPermission(getNotificationPermission());
    if (granted) {
      alert('Desktop notifications successfully enabled.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Data Caps &amp; Plan Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure monthly data caps, billing cycle rollover dates, warning limits, and overage rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedNotification && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-fade-in">
              <Check className="w-4 h-4" />
              Settings Saved!
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Interface Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {formInterfaces.map((iface) => {
          const isWifi = iface.id === 'wifi';
          const isSim1 = iface.id === 'sim1';

          return (
            <div
              key={iface.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Title */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isWifi
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : isSim1
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {isWifi ? <Wifi className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{iface.name}</h3>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Interface ID: {iface.id}
                    </span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Display Name</label>
                    <input
                      type="text"
                      value={iface.name}
                      onChange={(e) => handleFieldChange(iface.id, 'name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      {isWifi ? 'SSID Network Identifier' : 'Carrier / APN'}
                    </label>
                    <input
                      type="text"
                      value={iface.carrierOrSSID}
                      onChange={(e) => handleFieldChange(iface.id, 'carrierOrSSID', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                  </div>

                  {/* Radio Frequency Band / Channel */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      {isWifi ? 'Wi-Fi Channel & Frequency' : 'Cellular Frequency Band'}
                    </label>
                    <input
                      type="text"
                      value={iface.frequencyOrBand}
                      onChange={(e) => handleFieldChange(iface.id, 'frequencyOrBand', e.target.value)}
                      placeholder={isWifi ? '5.0 GHz (Ch 44 · 80 MHz)' : '5G NR n77 (3.7 GHz)'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                  </div>

                  {/* Baseline RF Signal Strength (dBm) */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-300 font-medium">
                        {isWifi ? 'Wi-Fi RSSI Signal Strength' : 'Cellular RSRP Signal Strength'}
                      </label>
                      <SignalBars
                        type={iface.id}
                        dBm={iface.signalDbm}
                        showDbmText={true}
                        showQualityLabel={true}
                        size="sm"
                      />
                    </div>
                    <input
                      type="range"
                      min={isWifi ? -90 : -115}
                      max={isWifi ? -30 : -65}
                      step="1"
                      value={iface.signalDbm}
                      onChange={(e) =>
                        handleFieldChange(iface.id, 'signalDbm', Number(e.target.value))
                      }
                      className="w-full accent-cyan-500 bg-slate-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                      <span>{isWifi ? '-90 dBm (Weak)' : '-115 dBm (Weak)'}</span>
                      <span>{isWifi ? '-30 dBm (Max)' : '-65 dBm (Max)'}</span>
                    </div>
                  </div>

                  {/* Monthly Cap in GB */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-medium">Monthly Data Cap</label>
                      {isWifi && (
                        <label className="flex items-center gap-1.5 text-[11px] text-cyan-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={iface.isUnlimited}
                            onChange={(e) =>
                              handleFieldChange(iface.id, 'isUnlimited', e.target.checked)
                            }
                            className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                          />
                          <span>Unlimited Plan</span>
                        </label>
                      )}
                    </div>

                    {!iface.isUnlimited ? (
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={Math.round(iface.monthlyCapMB / 1024)}
                          onChange={(e) =>
                            handleFieldChange(
                              iface.id,
                              'monthlyCapMB',
                              Math.max(1, Number(e.target.value)) * 1024
                            )
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-10 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                          GB / mo
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center text-xs">
                        No threshold enforcement active
                      </div>
                    )}
                  </div>

                  {/* Warning Threshold % */}
                  {!iface.isUnlimited && (
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <label className="font-medium">Early Warning Alert Threshold</label>
                        <span className="font-mono text-amber-400">
                          {iface.warningThresholdPercent}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={iface.warningThresholdPercent}
                        onChange={(e) =>
                          handleFieldChange(
                            iface.id,
                            'warningThresholdPercent',
                            Number(e.target.value)
                          )
                        }
                        className="w-full accent-cyan-500 bg-slate-950 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500">
                        Alert triggers when{' '}
                        {(
                          (iface.monthlyCapMB * (iface.warningThresholdPercent / 100)) /
                          1024
                        ).toFixed(1)}{' '}
                        GB is reached.
                      </span>
                    </div>
                  )}

                  {/* Billing Cycle Start Day */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      Billing Cycle Reset Day
                    </label>
                    <select
                      value={iface.billingCycleStartDay}
                      onChange={(e) =>
                        handleFieldChange(iface.id, 'billingCycleStartDay', Number(e.target.value))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}th of every month
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Overage Cost */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Plan Cost</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-500">$</span>
                        <input
                          type="number"
                          value={iface.planCost}
                          onChange={(e) =>
                            handleFieldChange(iface.id, 'planCost', Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-6 pr-2 py-1.5 text-slate-200 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Overage / GB</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-500">$</span>
                        <input
                          type="number"
                          value={iface.overageCostPerGB}
                          onChange={(e) =>
                            handleFieldChange(iface.id, 'overageCostPerGB', Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-6 pr-2 py-1.5 text-slate-200 font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Alerts & Budget Policies */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-cyan-400" />
          Real-Time Alert &amp; Audio Policies
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Control how alerts sound and appear when data caps or rapid spikes occur.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Daily Budget Warning */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <label className="block text-slate-300 font-medium mb-1">
              Daily Usage Budget Alert
            </label>
            <p className="text-slate-500 text-[11px] mb-2">
              Receive an alert if daily consumption exceeds this value.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <span className="text-slate-400 font-mono shrink-0">MB / day</span>
            </div>
          </div>

          {/* Audio Chimes */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Synthesized Hardware Chime
              </label>
              <p className="text-slate-500 text-[11px]">
                Plays two-tone chime when caps or surges trigger.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-slate-400">Audio Alerts:</span>
              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  !isAudioMuted
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                {!isAudioMuted ? 'Enabled' : 'Muted'}
              </button>
            </div>
          </div>

          {/* Desktop Push Notifications */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                OS Desktop Notifications
              </label>
              <p className="text-slate-500 text-[11px]">
                Sends native notifications even when browser tab is in background.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-slate-400 font-mono text-[11px]">
                Status: {desktopPermission}
              </span>
              {desktopPermission !== 'granted' && (
                <button
                  onClick={handleRequestNotif}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reset & Wipe Tools */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Need to revert testing data or sample records?</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Reset all network caps, history, and alerts to default?')) {
                onResetDefaults();
                alert('Configuration reset to defaults.');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Telemetry to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
