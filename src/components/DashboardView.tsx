import React, { useMemo, useState } from 'react';
import {
  Wifi,
  Smartphone,
  Zap,
  Flame,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  FileText,
  AlertOctagon,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import {
  InterfaceConfig,
  NetworkInterfaceId,
  SpeedSample,
  TrafficPreset,
  AppUsageItem,
  BrowserNetworkInfo,
  NetworkAlert,
  DailyUsageRecord,
} from '../types/network';
import { InterfaceCard } from './InterfaceCard';
import { LiveSpeedometer } from './LiveSpeedometer';
import { WifiTopologyMap } from './WifiTopologyMap';
import { formatBytes, formatSpeed, formatTimeAgo } from '../utils/formatters';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  interfaces: InterfaceConfig[];
  activeInterface: NetworkInterfaceId;
  setActiveInterface: (id: NetworkInterfaceId) => void;
  getCycleUsage: (id: NetworkInterfaceId) => { download: number; upload: number; total: number };
  dailyRecords: DailyUsageRecord[];
  speedSamples: SpeedSample[];
  trafficPreset: TrafficPreset;
  setTrafficPreset: (preset: TrafficPreset) => void;
  isDataSaverActive: boolean;
  setIsDataSaverActive: (active: boolean) => void;
  onSimulateSurge: (mb: number, iface?: NetworkInterfaceId) => void;
  browserNetwork: BrowserNetworkInfo;
  apps: AppUsageItem[];
  alerts: NetworkAlert[];
  onNavigateTab: (tab: 'dashboard' | 'reports' | 'apps' | 'settings') => void;
  onOpenAlerts: () => void;
  onUpdateSignalDbm: (ifaceId: NetworkInterfaceId, dBm: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  interfaces,
  activeInterface,
  setActiveInterface,
  getCycleUsage,
  dailyRecords,
  speedSamples,
  trafficPreset,
  setTrafficPreset,
  isDataSaverActive,
  setIsDataSaverActive,
  onSimulateSurge,
  browserNetwork,
  apps,
  alerts,
  onNavigateTab,
  onOpenAlerts,
  onUpdateSignalDbm,
}) => {
  const activeConfig = interfaces.find((i) => i.id === activeInterface) || interfaces[0];

  // Visibility toggle for individual interface lines in Recharts
  const [visibleLines, setVisibleLines] = useState<{ wifi: boolean; sim1: boolean; sim2: boolean }>({
    wifi: true,
    sim1: true,
    sim2: true,
  });

  // Last 7 days data usage trends per interface for Recharts
  const last7DaysData = useMemo(() => {
    const records = (dailyRecords || []).slice(-7);
    return records.map((r) => {
      const wifiGB = parseFloat(((r.wifiDownBytes + r.wifiUpBytes) / (1024 ** 3)).toFixed(2));
      const sim1GB = parseFloat(((r.sim1DownBytes + r.sim1UpBytes) / (1024 ** 3)).toFixed(2));
      const sim2GB = parseFloat(((r.sim2DownBytes + r.sim2UpBytes) / (1024 ** 3)).toFixed(2));
      const totalGB = parseFloat((wifiGB + sim1GB + sim2GB).toFixed(2));

      const parts = r.date.split('-');
      let label = r.date;
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      }

      return {
        date: r.date,
        dayLabel: label,
        'Wi-Fi': wifiGB,
        'SIM 1': sim1GB,
        'SIM 2': sim2GB,
        Total: totalGB,
      };
    });
  }, [dailyRecords]);

  // Aggregate summary totals over the last 7 days
  const sevenDayTotals = useMemo(() => {
    let wifiSum = 0;
    let sim1Sum = 0;
    let sim2Sum = 0;
    last7DaysData.forEach((d) => {
      wifiSum += d['Wi-Fi'];
      sim1Sum += d['SIM 1'];
      sim2Sum += d['SIM 2'];
    });
    const grandSum = wifiSum + sim1Sum + sim2Sum;
    const avgDaily = grandSum / Math.max(1, last7DaysData.length);
    return {
      wifi: wifiSum.toFixed(2),
      sim1: sim1Sum.toFixed(2),
      sim2: sim2Sum.toFixed(2),
      total: grandSum.toFixed(2),
      dailyAvg: avgDaily.toFixed(2),
    };
  }, [last7DaysData]);

  // Top 5 apps by total consumption
  const topApps = [...apps]
    .sort(
      (a, b) =>
        b.wifiBytes + b.sim1Bytes + b.sim2Bytes - (a.wifiBytes + a.sim1Bytes + a.sim2Bytes)
    )
    .slice(0, 5);

  const unreadAlerts = alerts.filter((a) => !a.read).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 3 Interface Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Network Interfaces &amp; Monthly Caps
            </h2>
            <p className="text-xs text-slate-400">
              Live consumption against monthly billing cycle limits.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Adjust Caps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {interfaces.map((iface) => (
            <InterfaceCard
              key={iface.id}
              config={iface}
              isActive={activeInterface === iface.id}
              onSelect={() => setActiveInterface(iface.id)}
              cycleUsage={getCycleUsage(iface.id)}
              onEdit={() => onNavigateTab('settings')}
              onSimulateSurge={(mb) => onSimulateSurge(mb, iface.id)}
            />
          ))}
        </div>
      </div>

      {/* Real-Time Live Speedometer & Stream Oscilloscope */}
      <LiveSpeedometer
        speedSamples={speedSamples}
        activeInterface={activeInterface}
        activeInterfaceName={activeConfig.name}
        trafficPreset={trafficPreset}
        setTrafficPreset={setTrafficPreset}
        isDataSaverActive={isDataSaverActive}
        setIsDataSaverActive={setIsDataSaverActive}
        onSimulateSurge={onSimulateSurge}
        browserNetwork={browserNetwork}
        activeDbm={activeConfig.signalDbm}
        activeBand={activeConfig.frequencyOrBand}
        onUpdateSignalDbm={(dBm) => onUpdateSignalDbm(activeInterface, dBm)}
      />

      {/* Recharts Line Chart: Last 7 Days Data Usage Trends per Interface */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-white">
                Last 7 Days Usage Trends per Interface
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                Recharts
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily GB bandwidth consumption trends comparing Wi-Fi, SIM 1, and SIM 2.
            </p>
          </div>

          {/* 7-Day Stat Pills & Line Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Wi-Fi Line */}
            <button
              onClick={() => setVisibleLines((p) => ({ ...p, wifi: !p.wifi }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium border transition-colors ${
                visibleLines.wifi
                  ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
              }`}
              title="Click to toggle Wi-Fi trend line"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Wi-Fi: {sevenDayTotals.wifi} GB</span>
            </button>

            {/* Toggle SIM 1 Line */}
            <button
              onClick={() => setVisibleLines((p) => ({ ...p, sim1: !p.sim1 }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium border transition-colors ${
                visibleLines.sim1
                  ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
              }`}
              title="Click to toggle SIM 1 trend line"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SIM 1: {sevenDayTotals.sim1} GB</span>
            </button>

            {/* Toggle SIM 2 Line */}
            <button
              onClick={() => setVisibleLines((p) => ({ ...p, sim2: !p.sim2 }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium border transition-colors ${
                visibleLines.sim2
                  ? 'bg-amber-950/60 border-amber-700/80 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
              }`}
              title="Click to toggle SIM 2 trend line"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>SIM 2: {sevenDayTotals.sim2} GB</span>
            </button>

            {/* 7-Day Total */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="text-slate-500">7D Total:</span>
              <span className="font-bold text-white">{sevenDayTotals.total} GB</span>
            </div>
          </div>
        </div>

        {/* Recharts Responsive Container */}
        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last7DaysData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis
                dataKey="dayLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                unit=" GB"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dayTotal = payload.reduce(
                      (acc, item) => acc + (typeof item.value === 'number' ? item.value : 0),
                      0
                    );
                    return (
                      <div className="bg-slate-950/95 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[170px]">
                        <div className="text-white font-semibold font-sans mb-1.5 pb-1 border-b border-slate-800 flex items-center justify-between">
                          <span>{label}</span>
                          <span className="text-[10px] text-cyan-400">Last 7 Days</span>
                        </div>
                        <div className="space-y-1">
                          {payload.map((entry) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between gap-3"
                              style={{ color: entry.color }}
                            >
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{entry.name}:</span>
                              </span>
                              <span className="font-bold font-mono">
                                {(entry.value as number).toFixed(2)} GB
                              </span>
                            </div>
                          ))}
                          <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between font-bold text-white">
                            <span>Day Total:</span>
                            <span>{dayTotal.toFixed(2)} GB</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              {visibleLines.wifi && (
                <Line
                  type="monotone"
                  dataKey="Wi-Fi"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#06b6d4', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
              {visibleLines.sim1 && (
                <Line
                  type="monotone"
                  dataKey="SIM 1"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
              {visibleLines.sim2 && (
                <Line
                  type="monotone"
                  dataKey="SIM 2"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 7-Day Context Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-2">
            <span>Daily Average:</span>
            <strong className="text-white">{sevenDayTotals.dailyAvg} GB / day</strong>
          </span>
          <span className="text-[11px] text-slate-500 font-sans">
            Click legend pills above to filter individual interface lines
          </span>
        </div>
      </div>

      {/* Active Network Topology & Connected Devices Map */}
      <WifiTopologyMap
        wifiConfig={interfaces.find((i) => i.id === 'wifi') || interfaces[0]}
        activeInterface={activeInterface}
        setActiveInterface={setActiveInterface}
        currentDownSpeed={speedSamples[speedSamples.length - 1]?.downloadBytesPerSec || 0}
        currentUpSpeed={speedSamples[speedSamples.length - 1]?.uploadBytesPerSec || 0}
      />

      {/* Two Column Layout: Top Active Apps + Recent Alerts Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Data Consuming Apps Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Top Bandwidth Applications
              </h3>
              <p className="text-xs text-slate-400">Heavy data consumers in this billing cycle.</p>
            </div>
            <button
              onClick={() => onNavigateTab('apps')}
              className="text-xs text-cyan-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topApps.map((app) => {
              const cellular = app.sim1Bytes + app.sim2Bytes;
              const total = app.wifiBytes + cellular;
              const isMoving = app.currentSpeedBytes > 1024 * 10;

              return (
                <div
                  key={app.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:bg-slate-950 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                      {app.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white">{app.name}</span>
                        {isMoving && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {formatSpeed(app.currentSpeedBytes)}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{app.category}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-slate-200">{formatBytes(total)}</div>
                    <div className="text-[10px] text-emerald-400">
                      Cellular: {formatBytes(cellular)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Alerts Feed Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  Real-Time Alert Feed
                </h3>
                <p className="text-xs text-slate-400">Recent threshold events &amp; surge alerts.</p>
              </div>
              <button
                onClick={onOpenAlerts}
                className="text-xs text-cyan-400 hover:underline font-medium flex items-center gap-1"
              >
                <span>Alert Center ({alerts.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => {
                const isCrit = alert.severity === 'critical';
                const isWarn = alert.severity === 'warning';

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border text-xs ${
                      isCrit
                        ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                        : isWarn
                        ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{alert.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">{alert.message}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Want to test notification audio &amp; banner?</span>
            <button
              onClick={() => onSimulateSurge(500)}
              className="text-cyan-400 hover:underline font-medium flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Trigger +500MB Spike</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
