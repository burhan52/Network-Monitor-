import React from 'react';
import { AlertTriangle, AlertOctagon, ArrowRight, ShieldCheck, Wifi } from 'lucide-react';
import { InterfaceConfig, NetworkInterfaceId } from '../types/network';
import { formatBytes, mbToBytes } from '../utils/formatters';

interface ExceededCapBannerProps {
  interfaces: InterfaceConfig[];
  getCycleUsage: (ifaceId: NetworkInterfaceId) => { total: number };
  activeInterface: NetworkInterfaceId;
  setActiveInterface: (ifaceId: NetworkInterfaceId) => void;
  isDataSaverActive: boolean;
  setIsDataSaverActive: (active: boolean) => void;
  onOpenSettings: () => void;
}

export const ExceededCapBanner: React.FC<ExceededCapBannerProps> = ({
  interfaces,
  getCycleUsage,
  activeInterface,
  setActiveInterface,
  isDataSaverActive,
  setIsDataSaverActive,
  onOpenSettings,
}) => {
  // Find any interface that has exceeded cap
  const exceededList = interfaces
    .filter((i) => !i.isUnlimited)
    .map((i) => {
      const usage = getCycleUsage(i.id);
      const capBytes = mbToBytes(i.monthlyCapMB);
      const ratio = (usage.total / capBytes) * 100;
      return {
        iface: i,
        usageBytes: usage.total,
        capBytes,
        ratio,
        overageBytes: Math.max(0, usage.total - capBytes),
      };
    })
    .filter((item) => item.ratio >= item.iface.warningThresholdPercent);

  if (exceededList.length === 0) return null;

  // Prioritize 100%+ first
  const critical = exceededList.find((item) => item.ratio >= 100);
  const primaryItem = critical || exceededList[0];
  const isCritical = primaryItem.ratio >= 100;

  return (
    <div
      className={`border-b transition-all ${
        isCritical
          ? 'bg-rose-950/70 border-rose-800 text-rose-100'
          : 'bg-amber-950/60 border-amber-800 text-amber-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isCritical ? 'bg-rose-900/60 text-rose-400' : 'bg-amber-900/60 text-amber-400'
              }`}
            >
              {isCritical ? (
                <AlertOctagon className="w-5 h-5 animate-bounce" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {isCritical ? 'Data Cap Exceeded' : 'Data Cap Warning'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 border border-current">
                  {primaryItem.iface.name} ({primaryItem.ratio.toFixed(1)}%)
                </span>
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {isCritical ? (
                  <>
                    Used {formatBytes(primaryItem.usageBytes)} of {formatBytes(primaryItem.capBytes)}.
                    Excess of {formatBytes(primaryItem.overageBytes)} will be billed at{' '}
                    <span className="font-semibold underline">
                      {primaryItem.iface.currency}
                      {primaryItem.iface.overageCostPerGB}/GB
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Consumed {formatBytes(primaryItem.usageBytes)} of {formatBytes(primaryItem.capBytes)}{' '}
                    limit ({primaryItem.ratio.toFixed(1)}%). Consider switching to Wi-Fi.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {activeInterface !== 'wifi' && (
              <button
                onClick={() => setActiveInterface('wifi')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Switch to Wi-Fi</span>
              </button>
            )}

            <button
              onClick={() => setIsDataSaverActive(!isDataSaverActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isDataSaverActive
                  ? 'bg-emerald-800/80 border-emerald-600 text-white'
                  : 'bg-black/30 hover:bg-black/50 border-white/20 text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isDataSaverActive ? 'Data Saver Active' : 'Enable Data Saver'}</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/30 hover:bg-black/50 border border-white/20 text-white transition-colors"
            >
              <span>Manage Cap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
