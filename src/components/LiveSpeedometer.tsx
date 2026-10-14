import React, { useMemo } from 'react';
import {
  Download,
  Upload,
  Zap,
  Activity,
  Flame,
  Radio,
  Clock,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { SpeedSample, TrafficPreset, NetworkInterfaceId, BrowserNetworkInfo } from '../types/network';
import { formatSpeed, formatBytes } from '../utils/formatters';
import { SignalBars } from './SignalBars';
import { evaluateWifiSignal, evaluateCellularSignal, getSignalColorClass } from '../utils/signal';

interface LiveSpeedometerProps {
  speedSamples: SpeedSample[];
  activeInterface: NetworkInterfaceId;
  activeInterfaceName: string;
  trafficPreset: TrafficPreset;
  setTrafficPreset: (preset: TrafficPreset) => void;
  isDataSaverActive: boolean;
  setIsDataSaverActive: (active: boolean) => void;
  onSimulateSurge: (mb: number) => void;
  browserNetwork: BrowserNetworkInfo;
  activeDbm: number;
  activeBand?: string;
  onUpdateSignalDbm: (dBm: number) => void;
}

export const LiveSpeedometer: React.FC<LiveSpeedometerProps> = ({
  speedSamples,
  activeInterface,
  activeInterfaceName,
  trafficPreset,
  setTrafficPreset,
  isDataSaverActive,
  setIsDataSaverActive,
  onSimulateSurge,
  browserNetwork,
  activeDbm,
  activeBand = '',
  onUpdateSignalDbm,
}) => {
  const currentSample = speedSamples[speedSamples.length - 1] || {
    downloadBytesPerSec: 0,
    uploadBytesPerSec: 0,
  };

  // Peak speeds in the current buffer
  const peakDown = useMemo(() => {
    return Math.max(...speedSamples.map((s) => s.downloadBytesPerSec), 1024 * 1024);
  }, [speedSamples]);

  const peakUp = useMemo(() => {
    return Math.max(...speedSamples.map((s) => s.uploadBytesPerSec), 512 * 1024);
  }, [speedSamples]);

  // Generate SVG path points for the oscilloscope chart
  const chartHeight = 110;
  const chartWidth = 500;

  const maxVal = Math.max(peakDown, 1024 * 1024);

  const downPoints = useMemo(() => {
    if (speedSamples.length < 2) return '';
    const step = chartWidth / (speedSamples.length - 1);
    return speedSamples
      .map((s, i) => {
        const x = i * step;
        const normalized = Math.min(1, s.downloadBytesPerSec / maxVal);
        const y = chartHeight - normalized * (chartHeight - 14) - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [speedSamples, maxVal, chartWidth, chartHeight]);

  const upPoints = useMemo(() => {
    if (speedSamples.length < 2) return '';
    const step = chartWidth / (speedSamples.length - 1);
    return speedSamples
      .map((s, i) => {
        const x = i * step;
        const normalized = Math.min(1, s.uploadBytesPerSec / maxVal);
        const y = chartHeight - normalized * (chartHeight - 14) - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [speedSamples, maxVal, chartWidth, chartHeight]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
        {/* Left: Speed readout widgets */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 min-w-[280px]">
          {/* Download Rate */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/90 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Download Speed
              </span>
              <span className="text-[10px] font-mono text-emerald-500/80 uppercase">Inbound</span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-1">
              {formatSpeed(currentSample.downloadBytesPerSec)}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[11px] text-slate-500 font-mono">
              <span>Peak: {formatSpeed(peakDown)}</span>
              <span className="text-emerald-400">99.8% QOS</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/20">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, (currentSample.downloadBytesPerSec / maxVal) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Upload Rate */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/90 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Upload Speed
              </span>
              <span className="text-[10px] font-mono text-cyan-500/80 uppercase">Outbound</span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-1">
              {formatSpeed(currentSample.uploadBytesPerSec)}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[11px] text-slate-500 font-mono">
              <span>Peak: {formatSpeed(peakUp)}</span>
              <span className="text-cyan-400">Low Jitter</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500/20">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, (currentSample.uploadBytesPerSec / maxVal) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Center: Live Waveform Oscilloscope */}
        <div className="flex-1 bg-slate-950/90 rounded-xl p-3 border border-slate-800 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-semibold text-slate-200">Real-Time Bandwidth Stream</span>
              <span className="text-[11px] text-slate-500 font-mono">
                ({activeInterfaceName})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Down
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                Up
              </span>
            </div>
          </div>

          <div className="w-full overflow-hidden h-[110px] relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              {/* Subtle Grid Lines */}
              <line x1="0" y1="28" x2={chartWidth} y2="28" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="56" x2={chartWidth} y2="56" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="84" x2={chartWidth} y2="84" stroke="#1e293b" strokeDasharray="3 3" />

              {/* Download Polygon Fill & Line */}
              {downPoints && (
                <>
                  <polygon
                    points={`0,${chartHeight} ${downPoints} ${chartWidth},${chartHeight}`}
                    fill="url(#downGradient)"
                    opacity="0.25"
                  />
                  <polyline
                    points={downPoints}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Upload Polygon Fill & Line */}
              {upPoints && (
                <>
                  <polygon
                    points={`0,${chartHeight} ${upPoints} ${chartWidth},${chartHeight}`}
                    fill="url(#upGradient)"
                    opacity="0.2"
                  />
                  <polyline
                    points={upPoints}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              <defs>
                <linearGradient id="downGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="upGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Traffic Profile Generator & Spike Testing Controls */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Preset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Simulated Activity:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: 'idle', label: 'Idle (~40 KB/s)' },
                { id: 'light', label: 'Web Browsing (~800 KB/s)' },
                { id: 'streaming_4k', label: '4K Streaming (~20 MB/s)' },
                { id: 'cloud_sync', label: 'Cloud Sync (~14 MB/s)' },
                { id: 'torrent_surge', label: 'Surge Burst (~50 MB/s)' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setTrafficPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  trafficPreset === p.id
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Surge Test triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onSimulateSurge(500)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-200 shadow-sm transition-colors"
            title="Inject 500MB spike to test threshold notifications"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>+500 MB Spike</span>
          </button>

          <button
            onClick={() => onSimulateSurge(2000)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 shadow-sm transition-colors"
            title="Inject 2.0GB surge to trigger Cap Exceeded alert"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>+2.0 GB Breach Spike</span>
          </button>

          {/* Data Saver Mode Toggle */}
          <button
            onClick={() => setIsDataSaverActive(!isDataSaverActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              isDataSaverActive
                ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            {isDataSaverActive ? (
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Data Saver: {isDataSaverActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* RF Signal Strength & Radio Telemetry Section */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-white">
                    {activeInterface === 'wifi' ? 'Wi-Fi RSSI Signal Strength' : 'Cellular RSRP Signal Strength'}
                  </span>
                  <SignalBars
                    type={activeInterface}
                    dBm={activeDbm}
                    showDbmText={true}
                    showQualityLabel={true}
                    size="md"
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                  <span>Band: {activeBand || (activeInterface === 'wifi' ? '5.0 GHz (Ch 44)' : '5G NR n77')}</span>
                  <span>·</span>
                  <span className="text-slate-300">
                    {activeInterface === 'wifi'
                      ? evaluateWifiSignal(activeDbm).secondaryMetric
                      : evaluateCellularSignal(activeDbm).secondaryMetric}
                  </span>
                </div>
              </div>
            </div>

            {/* Signal Environment Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium mr-1">Simulate Signal:</span>
              <button
                onClick={() => onUpdateSignalDbm(-45)}
                className={`px-2 py-0.8 rounded text-[11px] font-mono transition-colors ${
                  activeDbm >= -50
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Near router / cell tower (-45 dBm)"
              >
                -45 dBm (Strong)
              </button>
              <button
                onClick={() => onUpdateSignalDbm(-65)}
                className={`px-2 py-0.8 rounded text-[11px] font-mono transition-colors ${
                  activeDbm < -50 && activeDbm >= -75
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Typical room distance (-65 dBm)"
              >
                -65 dBm (Good)
              </button>
              <button
                onClick={() => onUpdateSignalDbm(-85)}
                className={`px-2 py-0.8 rounded text-[11px] font-mono transition-colors ${
                  activeDbm < -75 && activeDbm >= -95
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Behind walls / obstacles (-85 dBm)"
              >
                -85 dBm (Fair)
              </button>
              <button
                onClick={() => onUpdateSignalDbm(-105)}
                className={`px-2 py-0.8 rounded text-[11px] font-mono transition-colors ${
                  activeDbm < -95
                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title="Edge of cell coverage / weak fringe (-105 dBm)"
              >
                -105 dBm (Weak)
              </button>
            </div>
          </div>

          {/* Graduated dBm Scale Bar */}
          <div className="space-y-1.5">
            <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              {/* Color gradient across scale: red -> amber -> cyan -> emerald */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-500 via-cyan-500 to-emerald-500 opacity-80"
              />
              {/* Pointer indicator */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md transform -translate-x-1 transition-all duration-300"
                style={{
                  left: `${Math.min(
                    100,
                    Math.max(0, ((activeDbm - (-115)) / ((-30) - (-115))) * 100)
                  )}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
              <span>-115 dBm (Poor)</span>
              <span>-90 dBm (Fair)</span>
              <span>-70 dBm (Good)</span>
              <span>-50 dBm (Excellent)</span>
              <span>-30 dBm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Browser Hardware Connection Diagnostics if present */}
      {browserNetwork.supported && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-4 text-[11px] text-slate-400 font-mono">
          <span className="text-slate-500 font-sans">Host Hardware Diagnostics:</span>
          <span>Network: {browserNetwork.effectiveType?.toUpperCase()}</span>
          <span>·</span>
          <span>Downlink: {browserNetwork.downlink} Mbps</span>
          <span>·</span>
          <span>RTT: {browserNetwork.rtt} ms</span>
          {browserNetwork.saveData && (
            <>
              <span>·</span>
              <span className="text-emerald-400">OS Save-Data Header Active</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
