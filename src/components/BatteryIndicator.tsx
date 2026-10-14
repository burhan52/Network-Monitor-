import React, { useState } from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  Zap,
  Cpu,
  Thermometer,
  ShieldCheck,
  ChevronDown,
  Info,
  X,
} from 'lucide-react';
import { BatteryTelemetry, calculateBatteryImpactPercent } from '../utils/battery';

interface BatteryIndicatorProps {
  battery: BatteryTelemetry;
  onSetEfficiencyMode?: (mode: 'performance' | 'balanced' | 'eco') => void;
  variant?: 'header' | 'notification-bar' | 'compact' | 'detailed';
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  battery,
  onSetEfficiencyMode,
  variant = 'header',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const impactPercent = calculateBatteryImpactPercent(
    battery.accumulatedDaemonMah,
    battery.batteryCapacityMah
  );

  // Dynamic color based on battery level
  const batteryColor =
    battery.level > 40
      ? 'text-emerald-400'
      : battery.level > 20
      ? 'text-amber-400'
      : 'text-rose-400';

  if (variant === 'compact') {
    return (
      <div
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-300"
        title={`Daemon Impact: ${battery.accumulatedDaemonMah.toFixed(
          2
        )} mAh (${impactPercent}) · Draw: ${battery.currentDrawMa} mA`}
      >
        {battery.charging ? (
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        ) : (
          <Battery className={`w-3.5 h-3.5 ${batteryColor}`} />
        )}
        <span>{battery.level}%</span>
        <span className="text-slate-500">·</span>
        <span className="text-cyan-400 font-semibold">
          {battery.accumulatedDaemonMah.toFixed(1)} mAh
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      {/* Trigger Button / Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-mono cursor-pointer ${
          variant === 'notification-bar'
            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
            : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 text-slate-200 shadow-xs'
        }`}
        title="View Daemon Battery Consumption & Power Diagnostics"
      >
        <div className="flex items-center gap-1">
          {battery.charging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Battery className={`w-3.5 h-3.5 ${batteryColor}`} />
          )}
          <span className="font-semibold text-white">{battery.level}%</span>
        </div>

        <span className="text-slate-600">·</span>

        {/* Daemon Impact Readout */}
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-amber-300 font-semibold">
            {battery.accumulatedDaemonMah.toFixed(1)} mAh
          </span>
          <span className="text-slate-400 text-[10px] hidden sm:inline font-sans">
            ({impactPercent})
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
      </button>

      {/* Popover Card for detailed battery impact */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-slate-200 text-xs animate-fade-in font-sans">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs">Daemon Battery Impact</h4>
                <p className="text-[10px] text-slate-400">Network monitoring power telemetry</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 my-3">
            {/* Total Cumulative mAh */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Accumulated Drain</span>
              <span className="text-base font-bold font-mono text-amber-400">
                {battery.accumulatedDaemonMah.toFixed(2)} mAh
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {impactPercent} of {battery.batteryCapacityMah} mAh
              </span>
            </div>

            {/* Live Current Draw mA */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Instantaneous Draw</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {battery.currentDrawMa} mA
              </span>
              <span className="text-[10px] text-slate-500 block">Radio + CPU Wake Lock</span>
            </div>

            {/* Thermal Temperature */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-cyan-400" /> Device Temp
              </span>
              <span className="text-sm font-bold font-mono text-white">
                {battery.temperatureC.toFixed(1)}°C
              </span>
              <span className="text-[10px] text-slate-500 block">Thermal Nominal</span>
            </div>

            {/* Host State */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Power State
              </span>
              <span className="text-sm font-bold text-white">
                {battery.charging ? 'Charging ⚡' : 'Discharging'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block">
                Level: {battery.level}%
              </span>
            </div>
          </div>

          {/* Efficiency Mode Switcher */}
          {onSetEfficiencyMode && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-300">
                  Daemon Polling Mode:
                </span>
                <span className="text-[10px] uppercase font-mono text-cyan-400">
                  {battery.powerEfficiencyMode}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-medium">
                {(
                  [
                    { id: 'eco', label: 'Eco (1.2 mA)' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'performance', label: 'High Hz' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSetEfficiencyMode(m.id)}
                    className={`py-1 rounded-lg transition-colors ${
                      battery.powerEfficiencyMode === m.id
                        ? 'bg-slate-800 text-cyan-300 font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
            Calculated via real-time radio resource model (modem RRC wake state, active packet
            transfers, and background daemon polling).
          </div>
        </div>
      )}
    </div>
  );
};
