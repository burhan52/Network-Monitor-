import React from 'react';
import { Wifi, Smartphone, AlertCircle, CheckCircle2, TrendingUp, Calendar, Zap } from 'lucide-react';
import { InterfaceConfig, NetworkInterfaceId } from '../types/network';
import { formatBytes, mbToBytes } from '../utils/formatters';
import { SignalBars } from './SignalBars';

interface InterfaceCardProps {
  config: InterfaceConfig;
  isActive: boolean;
  onSelect: () => void;
  cycleUsage: { download: number; upload: number; total: number };
  onEdit: () => void;
  onSimulateSurge: (mb: number) => void;
}

export const InterfaceCard: React.FC<InterfaceCardProps> = ({
  config,
  isActive,
  onSelect,
  cycleUsage,
  onEdit,
  onSimulateSurge,
}) => {
  const capBytes = mbToBytes(config.monthlyCapMB);
  const ratio = config.isUnlimited ? 0 : Math.min(100, (cycleUsage.total / capBytes) * 100);
  const rawRatio = config.isUnlimited ? 0 : (cycleUsage.total / capBytes) * 100;
  const isExceeded = !config.isUnlimited && rawRatio >= 100;
  const isWarning = !config.isUnlimited && rawRatio >= config.warningThresholdPercent && !isExceeded;

  // Calculate billing cycle days remaining (October 13, 2026 is today)
  const today = new Date(2026, 9, 13);
  const currentDay = today.getDate();
  const daysInMonth = 31;
  let daysRemaining = 0;
  if (currentDay >= config.billingCycleStartDay) {
    daysRemaining = daysInMonth - currentDay + config.billingCycleStartDay;
  } else {
    daysRemaining = config.billingCycleStartDay - currentDay;
  }

  // Run-rate projection:
  const daysPassed = Math.max(1, 31 - daysRemaining);
  const dailyAverageBytes = cycleUsage.total / daysPassed;
  const projectedTotalBytes = dailyAverageBytes * 31;
  const projectedExceed = !config.isUnlimited && projectedTotalBytes > capBytes;

  // Potential overage fee
  const overageGB = isExceeded
    ? Math.max(0, (cycleUsage.total - capBytes) / (1024 * 1024 * 1024))
    : 0;
  const estOverageCost = overageGB * config.overageCostPerGB;

  // Color scheme
  let progressColor = 'bg-cyan-500';
  let badgeBorder = 'border-cyan-500/30';
  let badgeText = 'text-cyan-400';

  if (isExceeded) {
    progressColor = 'bg-rose-500';
    badgeBorder = 'border-rose-500/40';
    badgeText = 'text-rose-400';
  } else if (isWarning) {
    progressColor = 'bg-amber-500';
    badgeBorder = 'border-amber-500/40';
    badgeText = 'text-amber-400';
  } else if (config.id === 'sim1') {
    progressColor = 'bg-emerald-500';
    badgeBorder = 'border-emerald-500/30';
    badgeText = 'text-emerald-400';
  } else if (config.id === 'sim2') {
    progressColor = 'bg-amber-500';
    badgeBorder = 'border-amber-500/30';
    badgeText = 'text-amber-400';
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isActive
          ? 'bg-slate-900 border-slate-700 shadow-xl shadow-cyan-950/20 ring-1 ring-cyan-500/30'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      {/* Top Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                config.id === 'wifi'
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-850'
                  : config.id === 'sim1'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-850'
                  : 'bg-amber-950/80 text-amber-400 border border-amber-850'
              }`}
            >
              {config.id === 'wifi' ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <Smartphone className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm">{config.name}</h3>
                {isActive && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-slate-400 font-mono">{config.carrierOrSSID}</span>
                <span className="text-slate-600">·</span>
                <SignalBars
                  type={config.id}
                  dBm={config.signalDbm}
                  showDbmText={true}
                  showQualityLabel={true}
                  size="sm"
                />
              </div>
              {config.frequencyOrBand && (
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {config.frequencyOrBand}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isActive && (
              <button
                onClick={onSelect}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Use Interface
              </button>
            )}
            <button
              onClick={onEdit}
              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              title="Edit Caps & Billing"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Cap Meter & Status */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-white">
                {formatBytes(cycleUsage.total, 2)}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                {config.isUnlimited ? '/ Unlimited' : `/ ${formatBytes(capBytes, 0)} cap`}
              </span>
            </div>

            <span
              className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${badgeBorder} ${badgeText} bg-slate-950/60`}
            >
              {config.isUnlimited
                ? 'Unlimited'
                : isExceeded
                ? `${rawRatio.toFixed(1)}% EXCEEDED`
                : `${rawRatio.toFixed(1)}% Used`}
            </span>
          </div>

          {/* Progress bar */}
          {!config.isUnlimited ? (
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min(100, ratio)}%` }}
              />
            </div>
          ) : (
            <div className="h-2 w-full bg-cyan-950/40 rounded-full overflow-hidden border border-cyan-900/40">
              <div className="h-full bg-gradient-to-r from-cyan-600 to-emerald-500 w-full animate-pulse" />
            </div>
          )}

          {/* Exceeded Warning Box */}
          {isExceeded && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">
                  Data limit exceeded by {formatBytes(cycleUsage.total - capBytes)}!
                </p>
                <p className="text-[11px] text-rose-300/90 mt-0.5">
                  Est. overage charges: {config.currency}
                  {estOverageCost.toFixed(2)} ({config.currency}
                  {config.overageCostPerGB}/GB)
                </p>
              </div>
            </div>
          )}

          {isWarning && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-start gap-2 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                Warning threshold reached (&gt;{config.warningThresholdPercent}%).{' '}
                {formatBytes(capBytes - cycleUsage.total)} remaining.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Submetrics */}
      <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800/80 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Download</span>
            <span className="text-emerald-400 font-medium">
              ↓ {formatBytes(cycleUsage.download, 1)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Upload</span>
            <span className="text-cyan-400 font-medium">
              ↑ {formatBytes(cycleUsage.upload, 1)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 block uppercase font-sans flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Cycle Reset
            </span>
            <span className="text-slate-300 font-medium">{daysRemaining} days left</span>
          </div>
        </div>

        {/* Projection Pill */}
        {!config.isUnlimited && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Run-rate projection:{' '}
                <strong className={projectedExceed ? 'text-rose-400' : 'text-slate-200'}>
                  {formatBytes(projectedTotalBytes, 1)}
                </strong>
              </span>
            </div>

            {/* Quick Test Surge button */}
            <button
              onClick={() => onSimulateSurge(500)}
              title="Test +500MB spike on this interface to verify alerts"
              className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>+500MB Spike</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
